import { DateTime } from "luxon";
import { prisma } from "../db/prisma";

function badRequest(message: string) {
  const err = new Error(message) as Error & { status?: number };
  err.status = 400;
  return err;
}

function validateScheduleBlocks(blocks: { startTime: string; endTime: string }[]) {
  for (const block of blocks) {
    if (!isValidHHMM(block.startTime) || !isValidHHMM(block.endTime)) {
      const err = new Error("Invalid time format (HH:MM required)") as any;
      err.status = 400;
      throw err;
    }
    const start = hhmmToMinutes(block.startTime);
    const end = hhmmToMinutes(block.endTime);
    if (start >= end) {
      const err = new Error("startTime must be before endTime") as any;
      err.status = 400;
      throw err;
    }
  }

  const sorted = [...blocks].sort(
    (a, b) => hhmmToMinutes(a.startTime) - hhmmToMinutes(b.startTime)
  );

  for (let i = 1; i < sorted.length; i++) {
    const prevEnd = hhmmToMinutes(sorted[i - 1].endTime);
    const currentStart = hhmmToMinutes(sorted[i].startTime);
    if (currentStart < prevEnd) {
      const err = new Error("Schedule blocks cannot overlap") as any;
      err.status = 400;
      throw err;
    }
  }
}

function hhmmToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function isValidHHMM(value: string) {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);
}

export class ProfessionalService {
  async listProfessionals(params: { businessId: string }) {
    const { businessId } = params;
    return prisma.professional.findMany({
      where: { businessId },
      orderBy: { name: "asc" },
    });
  }

  async createProfessional(params: {
    businessId: string;
    name: string;
    color?: string;
    active?: boolean;
  }) {
    const { businessId, name, color, active } = params;
    return prisma.professional.create({
      data: { businessId, name, color, active: active ?? true },
    });
  }

  async updateProfessional(params: {
    businessId: string;
    professionalId: string;
    name?: string;
    color?: string;
    active?: boolean;
  }) {
    const { businessId, professionalId, name, color, active } = params;

    const professional = await prisma.professional.findFirst({
      where: { id: professionalId, businessId },
    });

    if (!professional) throw badRequest("Professional not found");

    return prisma.professional.update({
      where: { id: professionalId },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(color !== undefined ? { color } : {}),
        ...(active !== undefined ? { active } : {}),
      },
    });
  }

  async getSchedules(params: { businessId: string; professionalId: string }) {
    const { businessId, professionalId } = params;
    return prisma.professionalSchedule.findMany({
      where: { businessId, professionalId },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });
  }

  async replaceScheduleForDay(params: {
    businessId: string;
    professionalId: string;
    dayOfWeek: number;
    blocks: { startTime: string; endTime: string }[];
  }) {
    const { businessId, professionalId, dayOfWeek, blocks } = params;

    validateScheduleBlocks(blocks);

    await prisma.professionalSchedule.deleteMany({
      where: { businessId, professionalId, dayOfWeek },
    });

    if (blocks.length === 0) return [];

    await prisma.professionalSchedule.createMany({
      data: blocks.map((b) => ({
        businessId,
        professionalId,
        dayOfWeek,
        startTime: b.startTime,
        endTime: b.endTime,
      })),
    });

    return prisma.professionalSchedule.findMany({
      where: { businessId, professionalId, dayOfWeek },
      orderBy: [{ startTime: "asc" }],
    });
  }

  async getProfessionalServices(params: { businessId: string; professionalId: string }) {
    const { businessId, professionalId } = params;
    return prisma.professionalService.findMany({
      where: { businessId, professionalId },
      include: { service: true },
      orderBy: { service: { name: "asc" } },
    });
  }

  async replaceProfessionalServices(params: {
    businessId: string;
    professionalId: string;
    serviceIds: string[];
  }) {
    const { businessId, professionalId, serviceIds } = params;

    const professional = await prisma.professional.findFirst({
      where: { id: professionalId, businessId },
    });

    if (!professional) throw badRequest("Professional not found");

    if (serviceIds.length > 0) {
      const validServices = await prisma.service.findMany({
        where: { businessId, id: { in: serviceIds } },
        select: { id: true },
      });

      const validIds = new Set(validServices.map((s) => s.id));
      const invalidIds = serviceIds.filter((id) => !validIds.has(id));
      if (invalidIds.length > 0) {
        throw badRequest("Some services do not belong to this business");
      }
    }

    await prisma.professionalService.deleteMany({
      where: { businessId, professionalId },
    });

    if (serviceIds.length > 0) {
      await prisma.professionalService.createMany({
        data: serviceIds.map((serviceId) => ({ businessId, professionalId, serviceId })),
      });
    }

    return prisma.professionalService.findMany({
      where: { businessId, professionalId },
      include: { service: true },
      orderBy: { createdAt: "asc" },
    });
  }

  async getAvailability(params: {
    businessId: string;
    professionalId: string;
    date: string;
    serviceId: string;
    stepMin?: number;
  }) {
    const { businessId, professionalId, date, serviceId, stepMin = 15 } = params;
    const TZ = "America/Argentina/Buenos_Aires";

    const professional = await prisma.professional.findFirst({
      where: { id: professionalId, businessId, active: true },
    });
    if (!professional) throw badRequest("Professional not found");

    const service = await prisma.service.findFirst({
      where: { id: serviceId, businessId, active: true },
    });
    if (!service) throw badRequest("Service not found");

    const link = await prisma.professionalService.findUnique({
      where: { professionalId_serviceId: { professionalId, serviceId } },
    });
    if (!link) throw badRequest("This professional does not perform this service");

    const day = DateTime.fromISO(date, { zone: TZ });
    if (!day.isValid) throw badRequest("Invalid date");

    const dayOfWeek = day.weekday % 7;

    const schedules = await prisma.professionalSchedule.findMany({
      where: { businessId, professionalId, dayOfWeek },
      orderBy: [{ startTime: "asc" }],
    });

    if (schedules.length === 0) {
      return { date, professionalId, serviceId, stepMin, slots: [] };
    }

    const from = day.startOf("day");
    const to = from.plus({ days: 1 });

    const appointments = await prisma.appointment.findMany({
      where: {
        businessId,
        professionalId,
        status: { in: ["RESERVED", "DEPOSIT_PAID"] },
        startAt: { gte: from.toJSDate(), lt: to.toJSDate() },
      },
      orderBy: { startAt: "asc" },
    });

    const durationMin = service.durationMin;
    const slots: { startAt: string; endAt: string; label: string }[] = [];

    for (const block of schedules) {
      const [startHour, startMinute] = block.startTime.split(":").map(Number);
      const [endHour, endMinute] = block.endTime.split(":").map(Number);

      let cursor = day.set({ hour: startHour, minute: startMinute, second: 0, millisecond: 0 });
      const blockEnd = day.set({ hour: endHour, minute: endMinute, second: 0, millisecond: 0 });

      while (cursor.plus({ minutes: durationMin }) <= blockEnd) {
        const slotStart = cursor;
        const slotEnd = cursor.plus({ minutes: durationMin });

        const overlaps = appointments.some((appt) => {
          const apptStart = DateTime.fromJSDate(appt.startAt, { zone: TZ });
          const apptEnd = DateTime.fromJSDate(appt.endAt, { zone: TZ });
          return apptStart < slotEnd && apptEnd > slotStart;
        });

        if (!overlaps) {
          slots.push({
            startAt: slotStart.toISO()!,
            endAt: slotEnd.toISO()!,
            label: slotStart.toFormat("HH:mm"),
          });
        }

        cursor = cursor.plus({ minutes: stepMin });
      }
    }

    return { date, professionalId, serviceId, stepMin, slots };
  }

  async createProfessionalAccount(params: {
    businessId: string;
    professionalId: string;
    username: string;
    password: string;
  }) {
    const { businessId, professionalId, username, password } = params;

    const professional = await prisma.professional.findFirst({
      where: { id: professionalId, businessId },
    });
    if (!professional) {
      throw Object.assign(new Error("Professional not found"), { statusCode: 404 });
    }
    if (professional.userId) {
      throw Object.assign(new Error("Professional already has an account"), { statusCode: 409 });
    }

    const existingUsername = await prisma.user.findFirst({
      where: { businessId, username },
    });
    if (existingUsername) {
      throw Object.assign(new Error("Username already taken in this business"), { statusCode: 409 });
    }

    const bcrypt = await import("bcrypt");
    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: { businessId, username, passwordHash, role: "PRO" },
    });

    return prisma.professional.update({
      where: { id: professionalId },
      data: { userId: user.id },
      include: { user: { select: { id: true, username: true, role: true } } },
    });
  }
}

export const professionalService = new ProfessionalService();
