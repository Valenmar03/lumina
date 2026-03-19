import { prisma } from "../db/prisma";

export class ProfessionalScheduleService {
  async getScheduleBlocksForDay(params: {
    businessId: string;
    professionalId: string;
    dayOfWeek: number;
  }) {
    const { businessId, professionalId, dayOfWeek } = params;

    return prisma.professionalSchedule.findMany({
      where: { businessId, professionalId, dayOfWeek },
      orderBy: [{ startTime: "asc" }],
    });
  }

  async getUnavailabilitiesForDay(params: {
    businessId: string;
    professionalIds: string[];
    from: Date;
    to: Date;
  }) {
    const { businessId, professionalIds, from, to } = params;

    const rows = await prisma.professionalUnavailability.findMany({
      where: {
        businessId,
        professionalId: { in: professionalIds },
        startAt: { lt: to },
        endAt: { gt: from },
      },
    });

    const result: Record<string, typeof rows> = {};
    for (const row of rows) {
      if (!result[row.professionalId]) result[row.professionalId] = [];
      result[row.professionalId].push(row);
    }
    return result;
  }

  async getScheduleBlocksForWeek(params: {
    businessId: string;
    professionalId: string;
  }) {
    const { businessId, professionalId } = params;

    const blocks = await prisma.professionalSchedule.findMany({
      where: { businessId, professionalId },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });

    const grouped: Record<number, typeof blocks> = {
      0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [],
    };

    for (const block of blocks) {
      grouped[block.dayOfWeek].push(block);
    }

    return grouped;
  }
}

export const professionalScheduleService = new ProfessionalScheduleService();
