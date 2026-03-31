import { prisma } from "../db/prisma";
import { normalizeSlug } from "./auth.service";

export const businessService = {
  async getBusiness(businessId: string) {
    const business = await prisma.business.findUniqueOrThrow({
      where: { id: businessId },
    });
    return business;
  },

  async updateBusiness(
    businessId: string,
    data: {
      name?: string;
      slug?: string;
      timezone?: string;
      mpAccessToken?: string | null;
      waPhoneNumberId?: string | null;
      waAccessToken?: string | null;
      waReminderHours?: number | null;
      emailNotificationsEnabled?: boolean;
      emailReminderHours?: number | null;
    }
  ) {
    const update: Record<string, unknown> = {};

    if (data.name !== undefined) {
      const trimmed = data.name.trim();
      if (!trimmed) throw Object.assign(new Error("El nombre no puede estar vacío"), { status: 400 });
      update.name = trimmed;
    }

    if (data.slug !== undefined) {
      const normalized = normalizeSlug(data.slug);
      if (!normalized) throw Object.assign(new Error("El slug no es válido"), { status: 400 });

      const existing = await prisma.business.findFirst({
        where: { slug: normalized, NOT: { id: businessId } },
      });
      if (existing) throw Object.assign(new Error("Ese slug ya está en uso"), { status: 409 });

      update.slug = normalized;
    }

    if (data.timezone !== undefined) update.timezone = data.timezone;
    if (data.mpAccessToken !== undefined) update.mpAccessToken = data.mpAccessToken ?? null;
    if (data.waPhoneNumberId !== undefined) update.waPhoneNumberId = data.waPhoneNumberId ?? null;
    if (data.waAccessToken !== undefined) update.waAccessToken = data.waAccessToken ?? null;
    if (data.waReminderHours !== undefined) update.waReminderHours = data.waReminderHours ?? null;
    if (data.emailNotificationsEnabled !== undefined) update.emailNotificationsEnabled = data.emailNotificationsEnabled;
    if (data.emailReminderHours !== undefined) update.emailReminderHours = data.emailReminderHours ?? null;

    return prisma.business.update({ where: { id: businessId }, data: update });
  },
};

export async function getBusinessUnavailabilities(businessId: string) {
  return prisma.businessUnavailability.findMany({
    where: { businessId },
    orderBy: { date: "asc" },
  });
}

export async function createBusinessUnavailability(
  businessId: string,
  data: { date: string; reason?: string | null }
) {
  const existing = await prisma.businessUnavailability.findUnique({
    where: { businessId_date: { businessId, date: data.date } },
  });
  if (existing) {
    throw Object.assign(new Error("DATE_ALREADY_CLOSED"), { status: 409 });
  }
  return prisma.businessUnavailability.create({
    data: { businessId, date: data.date, reason: data.reason ?? null },
  });
}

export async function deleteBusinessUnavailability(businessId: string, id: string) {
  const record = await prisma.businessUnavailability.findFirst({
    where: { id, businessId },
  });
  if (!record) {
    throw Object.assign(new Error("Cierre no encontrado"), { status: 404 });
  }
  await prisma.businessUnavailability.delete({ where: { id } });
}
