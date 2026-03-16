import { prisma } from "../db/prisma";
import { getDayOfWeek, toHHMM, hhmmToMinutes } from "../utils/time";
import type { AppointmentStatus } from "@prisma/client";

const SOFT_TOLERANCE_MIN = 15 as const;

type ScheduleWarning =
  | null
  | { type: "NO_SCHEDULE"; severity: "HARD" }
  | { type: "OUTSIDE_SCHEDULE_START"; severity: "HARD" }
  | { type: "EXCEEDS_SCHEDULE"; minutesOver: number; severity: "SOFT" | "HARD" };



const BUSINESS_ID = "976dac1d-a819-4f13-8e60-32f6ab65c60a";

type CreateAppointmentInput = {
  professionalId: string;
  clientId: string;
  serviceId: string;
  startAt: string; // ISO (puede venir con -03:00)
};

type GetByRangeParams = {
  professionalId?: string;
  from: string; // ISO
  to: string;   // ISO
  status?: AppointmentStatus;
};

function badRequest(message: string) {
  const err = new Error(message) as Error & { status?: number };
  err.status = 400;
  return err;
}

export class AppointmentService {
  async create(input: CreateAppointmentInput) {
    const { professionalId, clientId, serviceId, startAt } = input;

    const startDate = new Date(startAt);
    if (Number.isNaN(startDate.getTime())) throw badRequest("Invalid startAt");

    // 1) Service + endAt
    const service = await prisma.service.findFirst({
      where: { id: serviceId, businessId: BUSINESS_ID, active: true },
    });
    if (!service) throw badRequest("Service not found");

    const endDate = new Date(startDate.getTime() + service.durationMin * 60_000);

    // 2) Professional y Client pertenecen al business
    const [professional, client] = await Promise.all([
      prisma.professional.findFirst({
        where: { id: professionalId, businessId: BUSINESS_ID, active: true },
      }),
      prisma.client.findFirst({
        where: { id: clientId, businessId: BUSINESS_ID },
      }),
    ]);

    if (!professional) throw badRequest("Professional not found");
    if (!client) throw badRequest("Client not found");

    // 3) ProfessionalService existe
    const link = await prisma.professionalService.findUnique({
      where: { professionalId_serviceId: { professionalId, serviceId } },
    });
    if (!link) throw badRequest("This professional does not perform this service");

    // 4) No solapamiento (bloquea RESERVED)
    const overlapping = await prisma.appointment.findFirst({
      where: {
        businessId: BUSINESS_ID,
        professionalId,
        status: "RESERVED",
        startAt: { lt: endDate },
        endAt: { gt: startDate },
      },
    });
    if (overlapping) throw badRequest("This time slot is already occupied");

    // 5) Schedule flexible con warning
    const dayOfWeek = getDayOfWeek(startDate);
    const startHHMM = toHHMM(startDate);
    const endHHMM = toHHMM(endDate);

    const blocks = await prisma.professionalSchedule.findMany({
    where: { professionalId, dayOfWeek },
    orderBy: [{ startTime: "asc" }],
    });

    let warning: ScheduleWarning = null;

    if (blocks.length === 0) {
    warning = { type: "NO_SCHEDULE", severity: "HARD" };
    } else {
    // buscamos el bloque donde cae el inicio
    const startBlock = blocks.find(
        (b) => startHHMM >= b.startTime && startHHMM <= b.endTime
    );

    if (!startBlock) {
        // el turno empieza fuera de cualquier bloque
        warning = { type: "OUTSIDE_SCHEDULE_START", severity: "HARD" };
    } else {
        // si empieza dentro, medimos cuánto se pasa del fin de ese bloque
        const over =
        hhmmToMinutes(endHHMM) - hhmmToMinutes(startBlock.endTime);

        if (over > 0) {
        warning = {
            type: "EXCEEDS_SCHEDULE",
            minutesOver: over,
            severity: over <= SOFT_TOLERANCE_MIN ? "SOFT" : "HARD",
        };
        }
    }
    }

    // 6) Crear
    const appointment = await prisma.appointment.create({
      data: {
        businessId: BUSINESS_ID,
        professionalId,
        clientId,
        serviceId,
        startAt: startDate,
        endAt: endDate,
        priceFinal: service.basePrice,
        status: "RESERVED",
      },
    });

    return { appointment, warning };
  }

  async getByRange(params: GetByRangeParams) {
    const { professionalId, from, to, status } = params;

    const fromDate = new Date(from);
    const toDate = new Date(to);

    if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
      throw badRequest("Invalid date range");
    }

    const appointments = await prisma.appointment.findMany({
      where: {
        businessId: BUSINESS_ID,
        professionalId,
        ...(status ? { status } : {}),
        startAt: { gte: fromDate, lt: toDate },
      },
      include: {
        client: true,
        service: true,
        professional: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
      orderBy: { startAt: "asc" },
    });

    return appointments.map((appt) => {
      const isPendingResolution =
        appt.status === "RESERVED" &&
        appt.endAt.getTime() < Date.now();

      return {
        ...appt,
        isPendingResolution,
      };
    });
  }

  async changeStatus(params: {
    appointmentId: string;
    status: "RESERVED" | "CANCELED" | "NO_SHOW" | "COMPLETED" | "DEPOSIT_PAID";
    }) {
    const { appointmentId, status } = params;

    const appointment = await prisma.appointment.findFirst({
        where: {
        id: appointmentId,
        businessId: BUSINESS_ID,
        },
    });

    if (!appointment) {
        throw badRequest("Appointment not found");
    }

    // Regla: no volver a RESERVED desde COMPLETED
    if (appointment.status === "COMPLETED" && (status === "RESERVED" || status === "DEPOSIT_PAID")) {
        throw badRequest("Cannot revert a completed appointment");
    }

    const updated = await prisma.appointment.update({
        where: { id: appointmentId },
        data: { status },
    });

    return updated;
    }

    async reschedule(params: { appointmentId: string; startAt: string }) {
        const { appointmentId, startAt } = params;

        const newStart = new Date(startAt);
        if (Number.isNaN(newStart.getTime())) throw badRequest("Invalid startAt");

        // 1) Buscar appointment (con service)
        const appointment = await prisma.appointment.findFirst({
            where: { id: appointmentId, businessId: BUSINESS_ID },
            include: { service: true },
        });

        if (!appointment) throw badRequest("Appointment not found");

        // 2) Regla de estados
        if (appointment.status !== "RESERVED") {
            throw badRequest("Only RESERVED appointments can be rescheduled");
        }

        // 3) Recalcular endAt según duration del service
        const durationMs = appointment.service.durationMin * 60_000;
        const newEnd = new Date(newStart.getTime() + durationMs);

        // 4) Revalidar solapamiento excluyendo el mismo turno
        const overlapping = await prisma.appointment.findFirst({
            where: {
            businessId: BUSINESS_ID,
            professionalId: appointment.professionalId,
            status: "RESERVED",
            id: { not: appointmentId },
            startAt: { lt: newEnd },
            endAt: { gt: newStart },
            },
        });

        if (overlapping) throw badRequest("This time slot is already occupied");

        // 5) Schedule flexible con warning
        const dayOfWeek = getDayOfWeek(newStart);
        const startHHMM = toHHMM(newStart);
        const endHHMM = toHHMM(newEnd);

        const blocks = await prisma.professionalSchedule.findMany({
            where: { professionalId: appointment.professionalId, dayOfWeek },
            orderBy: [{ startTime: "asc" }],
        });

        let warning: ScheduleWarning = null;

        if (blocks.length === 0) {
        warning = { type: "NO_SCHEDULE", severity: "HARD" };
        } else {
        // buscamos el bloque donde cae el inicio
        const startBlock = blocks.find(
            (b) => startHHMM >= b.startTime && startHHMM <= b.endTime
        );

        if (!startBlock) {
            // el turno empieza fuera de cualquier bloque
            warning = { type: "OUTSIDE_SCHEDULE_START", severity: "HARD" };
        } else {
            // si empieza dentro, medimos cuánto se pasa del fin de ese bloque
            const over =
            hhmmToMinutes(endHHMM) - hhmmToMinutes(startBlock.endTime);

            if (over > 0) {
            warning = {
                type: "EXCEEDS_SCHEDULE",
                minutesOver: over,
                severity: over <= SOFT_TOLERANCE_MIN ? "SOFT" : "HARD",
            };
            }
        }
        }

        // 6) Update
        const updated = await prisma.appointment.update({
            where: { id: appointmentId },
            data: { startAt: newStart, endAt: newEnd },
        });

        return { appointment: updated, warning };
        }
}

export const appointmentService = new AppointmentService();