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
    data: { name?: string; slug?: string; timezone?: string; mpAccessToken?: string | null }
  ) {
    const update: { name?: string; slug?: string; timezone?: string; mpAccessToken?: string | null } = {};

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

    if (data.timezone !== undefined) {
      update.timezone = data.timezone;
    }

    if (data.mpAccessToken !== undefined) {
      update.mpAccessToken = data.mpAccessToken ?? null;
    }

    return prisma.business.update({ where: { id: businessId }, data: update });
  },
};
