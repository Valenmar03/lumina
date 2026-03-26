import { prisma } from "../db/prisma";
import { getDayOfWeek, toHHMM, hhmmToMinutes } from "../utils/time";
import type { AppointmentStatus, PaymentMethod } from "@prisma/client";
import { sendTemplate, formatWaDate, formatWaTime } from "./whatsapp.service";
import {
  sendAppointmentConfirmed,
  sendAppointmentCanceled,
  sendAppointmentModified,
} from "./email.service";

const SOFT_TOLERANCE_MIN = 15 as const;

async function checkUnavailabilityBlock(
  businessId: string,
  professionalId: string,
  startAt: Date,
  endAt: Date,
) {
  const blocked = await prisma.professionalUnavailability.findFirst({
    where: {
      businessId,
      professionalId,
      startAt: { lt: endAt },
      endAt: { gt: startAt },
    },
  });
  if (blocked) throw badRequest("Professional is unavailable at this time");
}

async function getBusinessWaConfig(businessId: string) {
  return prisma.business.findUnique({
    where: { id: businessId },
    select: {
      waPhoneNumberId: true,
      waAccessToken: true,
      emailNotificationsEnabled: true,
      name: true,
      timezone: true,
    },
  });
}

type ScheduleWarning =
  | null
  | { type: "NO_SCHEDULE"; severity: "HARD" }
  | { type: "OUTSIDE_SCHEDULE_START"; severity: "HARD" }
  | { type: "EXCEEDS_SCHEDULE"; minutesOver: number; severity: "SOFT" | "HARD" };

type CreateAppointmentInput = {
  businessId: string;
  professionalId: string;
  clientId: string;
  serviceId: string;
  startAt: string; // ISO
  status?: AppointmentStatus;
};

type UpdateAppointmentInput = {
  businessId: string;
  appointmentId: string;
  professionalId: string;
  clientId: string;
  serviceId: string;
  startAt: string;
};

type GetByRangeParams = {
  businessId: string;
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
  async delete({ businessId, appointmentId }: { businessId: string; appointmentId: string }) {
    const appointment = await prisma.appointment.findFirst({
      where: { id: appointmentId, businessId },
    });
    if (!appointment) throw badRequest("Appointment not found");

    await prisma.appointment.delete({ where: { id: appointmentId } });
  }

  async create(input: CreateAppointmentInput) {
    const { businessId, professionalId, clientId, serviceId, startAt, status: inputStatus } = input;

    const startDate = new Date(startAt);
    if (Number.isNaN(startDate.getTime())) throw badRequest("Invalid startAt");

    const service = await prisma.service.findFirst({
      where: { id: serviceId, businessId, active: true },
    });
    if (!service) throw badRequest("Service not found");

    const endDate = new Date(startDate.getTime() + service.durationMin * 60_000);

    const [professional, client] = await Promise.all([
      prisma.professional.findFirst({ where: { id: professionalId, businessId, active: true } }),
      prisma.client.findFirst({ where: { id: clientId, businessId } }),
    ]);

    if (!professional) throw badRequest("Professional not found");
    if (!client) throw badRequest("Client not found");

    const link = await prisma.professionalService.findUnique({
      where: { professionalId_serviceId: { professionalId, serviceId } },
    });
    if (!link) throw badRequest("This professional does not perform this service");

    const overlapping = await prisma.appointment.findFirst({
      where: {
        businessId,
        professionalId,
        status: { in: ["PENDING_PAYMENT", "RESERVED", "DEPOSIT_PAID"] },
        startAt: { lt: endDate },
        endAt: { gt: startDate },
      },
    });
    if (overlapping) throw badRequest("This time slot is already occupied");
    await checkUnavailabilityBlock(businessId, professionalId, startDate, endDate);

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
      const startBlock = blocks.find(
        (b) => startHHMM >= b.startTime && startHHMM <= b.endTime
      );

      if (!startBlock) {
        warning = { type: "OUTSIDE_SCHEDULE_START", severity: "HARD" };
      } else {
        const over = hhmmToMinutes(endHHMM) - hhmmToMinutes(startBlock.endTime);
        if (over > 0) {
          warning = {
            type: "EXCEEDS_SCHEDULE",
            minutesOver: over,
            severity: over <= SOFT_TOLERANCE_MIN ? "SOFT" : "HARD",
          };
        }
      }
    }

    const appointment = await prisma.appointment.create({
      data: {
        businessId,
        professionalId,
        clientId,
        serviceId,
        startAt: startDate,
        endAt: endDate,
        totalPrice: service.basePrice,
        status: inputStatus ?? "RESERVED",
      },
    });

    // Notificaciones: turno confirmado
    getBusinessWaConfig(businessId).then((biz) => {
      if (!biz) return;
      const dateStr = formatWaDate(appointment.startAt, biz.timezone);
      const timeStr = formatWaTime(appointment.startAt, biz.timezone);

      if (biz.waAccessToken && biz.waPhoneNumberId && client.phone) {
        sendTemplate({
          accessToken: biz.waAccessToken,
          phoneNumberId: biz.waPhoneNumberId,
          to: client.phone,
          templateName: "turno_confirmado",
          variables: [client.fullName, service.name, professional.name, dateStr, timeStr, biz.name],
        });
      }

      if (biz.emailNotificationsEnabled && client.email) {
        sendAppointmentConfirmed(client.email, {
          clientName: client.fullName,
          professionalName: professional.name,
          serviceName: service.name,
          date: dateStr,
          time: timeStr,
          businessName: biz.name,
        });
      }
    }).catch(() => {});

    return { appointment, warning };
  }

  async getByRange(params: GetByRangeParams) {
    const { businessId, professionalId, from, to, status } = params;

    const fromDate = new Date(from);
    const toDate = new Date(to);

    if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
      throw badRequest("Invalid date range");
    }

    const appointments = await prisma.appointment.findMany({
      where: {
        businessId,
        professionalId,
        ...(status ? { status } : {}),
        startAt: { gte: fromDate, lt: toDate },
      },
      include: {
        client: true,
        service: true,
        professional: { select: { id: true, name: true, color: true } },
      },
      orderBy: { startAt: "asc" },
    });

    return appointments.map((appt) => ({
      ...appt,
      isPendingResolution: (appt.status === "RESERVED" || appt.status === "DEPOSIT_PAID") && appt.endAt.getTime() < Date.now(),
    }));
  }

  async changeStatus(params: {
    businessId: string;
    appointmentId: string;
    status: AppointmentStatus;
    depositAmount?: number;
    depositMethod?: PaymentMethod;
    finalPaymentMethod?: PaymentMethod;
  }) {
    const { businessId, appointmentId, status, depositAmount, depositMethod, finalPaymentMethod } = params;

    const appointment = await prisma.appointment.findFirst({
      where: { id: appointmentId, businessId },
    });

    if (!appointment) throw badRequest("Appointment not found");

    if (appointment.status === "COMPLETED" && (status === "RESERVED" || status === "DEPOSIT_PAID")) {
      throw badRequest("Cannot revert a completed appointment");
    }

    if (status === "DEPOSIT_PAID") {
      if (depositAmount == null || Number.isNaN(Number(depositAmount))) {
        throw badRequest("depositAmount is required when status is DEPOSIT_PAID");
      }
      if (!depositMethod) {
        throw badRequest("depositMethod is required when status is DEPOSIT_PAID");
      }

      const parsedDepositAmount = Number(depositAmount);
      if (parsedDepositAmount <= 0) throw badRequest("depositAmount must be greater than 0");
      if (appointment.totalPrice != null && parsedDepositAmount > Number(appointment.totalPrice)) {
        throw badRequest("Deposit amount cannot be greater than appointment price");
      }

      return prisma.appointment.update({
        where: { id: appointmentId },
        data: { status, depositAmount: parsedDepositAmount, depositMethod, depositPaidAt: new Date() },
      });
    }

    if (status === "COMPLETED") {
      if (!finalPaymentMethod) {
        throw badRequest("finalPaymentMethod is required when status is COMPLETED");
      }
      return prisma.appointment.update({
        where: { id: appointmentId },
        data: { status, finalPaymentMethod, finalPaidAt: new Date() },
      });
    }

    if (status === "RESERVED") {
      return prisma.appointment.update({
        where: { id: appointmentId },
        data: {
          status,
          depositAmount: 0,
          depositPaidAt: null,
          depositMethod: null,
          finalPaidAt: null,
          finalPaymentMethod: null,
        },
      });
    }

    const updated = await prisma.appointment.update({ where: { id: appointmentId }, data: { status } });

    if (status === "CANCELED") {
      Promise.all([
        prisma.client.findUnique({ where: { id: appointment.clientId } }),
        prisma.service.findUnique({ where: { id: appointment.serviceId }, select: { name: true } }),
        prisma.professional.findUnique({ where: { id: appointment.professionalId }, select: { name: true } }),
        getBusinessWaConfig(businessId),
      ]).then(([client, service, professional, biz]) => {
        if (!biz || !client) return;
        const dateStr = formatWaDate(appointment.startAt, biz.timezone);
        const timeStr = formatWaTime(appointment.startAt, biz.timezone);

        if (biz.waAccessToken && biz.waPhoneNumberId && client.phone) {
          sendTemplate({
            accessToken: biz.waAccessToken,
            phoneNumberId: biz.waPhoneNumberId,
            to: client.phone,
            templateName: "turno_cancelado",
            variables: [
              client.fullName,
              service?.name ?? "",
              professional?.name ?? "",
              dateStr,
              timeStr,
            ],
          });
        }

        if (biz.emailNotificationsEnabled && client.email) {
          sendAppointmentCanceled(client.email, {
            clientName: client.fullName,
            professionalName: professional?.name ?? "",
            serviceName: service?.name ?? "",
            date: dateStr,
            time: timeStr,
            businessName: biz.name,
          });
        }
      }).catch(() => {});
    }

    return updated;
  }

  async update(input: UpdateAppointmentInput) {
    const { businessId, appointmentId, professionalId, clientId, serviceId, startAt } = input;

    const startDate = new Date(startAt);
    if (Number.isNaN(startDate.getTime())) throw badRequest("Invalid startAt");

    const appointment = await prisma.appointment.findFirst({
      where: { id: appointmentId, businessId },
    });

    if (!appointment) throw badRequest("Appointment not found");

    if (appointment.status !== "RESERVED" && appointment.status !== "DEPOSIT_PAID") {
      throw badRequest("Only RESERVED or DEPOSIT_PAID appointments can be updated");
    }

    const [service, professional, client] = await Promise.all([
      prisma.service.findFirst({ where: { id: serviceId, businessId, active: true } }),
      prisma.professional.findFirst({ where: { id: professionalId, businessId, active: true } }),
      prisma.client.findFirst({ where: { id: clientId, businessId } }),
    ]);

    if (!service) throw badRequest("Service not found");
    if (!professional) throw badRequest("Professional not found");
    if (!client) throw badRequest("Client not found");

    const professionalServiceLink = await prisma.professionalService.findUnique({
      where: { professionalId_serviceId: { professionalId, serviceId } },
    });
    if (!professionalServiceLink) throw badRequest("This professional does not perform this service");

    const endDate = new Date(startDate.getTime() + service.durationMin * 60_000);

    const overlapping = await prisma.appointment.findFirst({
      where: {
        businessId,
        professionalId,
        status: { in: ["PENDING_PAYMENT", "RESERVED", "DEPOSIT_PAID"] },
        id: { not: appointmentId },
        startAt: { lt: endDate },
        endAt: { gt: startDate },
      },
    });
    if (overlapping) throw badRequest("This time slot is already occupied");
    await checkUnavailabilityBlock(businessId, professionalId, startDate, endDate);

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
      const startBlock = blocks.find(
        (b) => startHHMM >= b.startTime && startHHMM <= b.endTime
      );
      if (!startBlock) {
        warning = { type: "OUTSIDE_SCHEDULE_START", severity: "HARD" };
      } else {
        const over = hhmmToMinutes(endHHMM) - hhmmToMinutes(startBlock.endTime);
        if (over > 0) {
          warning = {
            type: "EXCEEDS_SCHEDULE",
            minutesOver: over,
            severity: over <= SOFT_TOLERANCE_MIN ? "SOFT" : "HARD",
          };
        }
      }
    }

    const updated = await prisma.appointment.update({
      where: { id: appointmentId },
      data: { professionalId, clientId, serviceId, startAt: startDate, endAt: endDate, totalPrice: service.basePrice },
      include: {
        client: true,
        service: true,
        professional: { select: { id: true, name: true, color: true } },
      },
    });

    // Notificaciones: turno modificado
    getBusinessWaConfig(businessId).then((biz) => {
      if (!biz) return;
      const dateStr = formatWaDate(updated.startAt, biz.timezone);
      const timeStr = formatWaTime(updated.startAt, biz.timezone);

      if (biz.waAccessToken && biz.waPhoneNumberId && updated.client?.phone) {
        sendTemplate({
          accessToken: biz.waAccessToken,
          phoneNumberId: biz.waPhoneNumberId,
          to: updated.client.phone,
          templateName: "turno_modificado",
          variables: [
            updated.client.fullName,
            updated.service.name,
            updated.professional?.name ?? "",
            dateStr,
            timeStr,
            biz.name,
          ],
        });
      }

      if (biz.emailNotificationsEnabled && updated.client?.email) {
        sendAppointmentModified(updated.client.email, {
          clientName: updated.client.fullName,
          professionalName: updated.professional?.name ?? "",
          serviceName: updated.service.name,
          date: dateStr,
          time: timeStr,
          businessName: biz.name,
        });
      }
    }).catch(() => {});

    return {
      appointment: {
        ...updated,
        isPendingResolution: (updated.status === "RESERVED" || updated.status === "DEPOSIT_PAID") && updated.endAt.getTime() < Date.now(),
      },
      warning,
    };
  }

  async reschedule(params: { businessId: string; appointmentId: string; startAt: string }) {
    const { businessId, appointmentId, startAt } = params;

    const newStart = new Date(startAt);
    if (Number.isNaN(newStart.getTime())) throw badRequest("Invalid startAt");

    const appointment = await prisma.appointment.findFirst({
      where: { id: appointmentId, businessId },
      include: { service: true },
    });

    if (!appointment) throw badRequest("Appointment not found");

    if (appointment.status !== "RESERVED") {
      throw badRequest("Only RESERVED appointments can be rescheduled");
    }

    const durationMs = appointment.service.durationMin * 60_000;
    const newEnd = new Date(newStart.getTime() + durationMs);

    const overlapping = await prisma.appointment.findFirst({
      where: {
        businessId,
        professionalId: appointment.professionalId,
        status: { in: ["PENDING_PAYMENT", "RESERVED", "DEPOSIT_PAID"] },
        id: { not: appointmentId },
        startAt: { lt: newEnd },
        endAt: { gt: newStart },
      },
    });
    if (overlapping) throw badRequest("This time slot is already occupied");
    await checkUnavailabilityBlock(businessId, appointment.professionalId, newStart, newEnd);

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
      const startBlock = blocks.find(
        (b) => startHHMM >= b.startTime && startHHMM <= b.endTime
      );
      if (!startBlock) {
        warning = { type: "OUTSIDE_SCHEDULE_START", severity: "HARD" };
      } else {
        const over = hhmmToMinutes(endHHMM) - hhmmToMinutes(startBlock.endTime);
        if (over > 0) {
          warning = {
            type: "EXCEEDS_SCHEDULE",
            minutesOver: over,
            severity: over <= SOFT_TOLERANCE_MIN ? "SOFT" : "HARD",
          };
        }
      }
    }

    const updated = await prisma.appointment.update({
      where: { id: appointmentId },
      data: { startAt: newStart, endAt: newEnd },
    });

    return { appointment: updated, warning };
  }
}

export const appointmentService = new AppointmentService();
