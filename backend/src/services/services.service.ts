import { prisma } from "../db/prisma";

type ListServicesParams = {
  businessId: string;
  activeOnly?: boolean;
  search?: string;
};

type CreateServiceInput = {
  businessId: string;
  name: string;
  durationMin: number;
  basePrice: number;
  active?: boolean;
  description?: string;
  requiresDeposit?: boolean;
  depositPercent?: number | null;
  bookableOnline?: boolean;
};

type UpdateServiceInput = {
  name?: string;
  durationMin?: number;
  basePrice?: number;
  active?: boolean;
  description?: string;
  requiresDeposit?: boolean;
  depositPercent?: number | null;
  bookableOnline?: boolean;
  allowClientChooseProfessional?: boolean;
};

export class ServiceService {
  async listServices(params: ListServicesParams) {
    const { businessId, activeOnly = true, search } = params;
    const q = search?.trim();

    return prisma.service.findMany({
      where: {
        businessId,
        ...(activeOnly ? { active: true } : {}),
        ...(q ? { name: { contains: q, mode: "insensitive" } } : {}),
      },
      orderBy: { name: "asc" },
    });
  }

  async listServicesWithProfessional(params: {
    businessId: string;
    activeOnly?: boolean;
    search?: string;
  }) {
    const { businessId, activeOnly = false, search } = params;
    const q = search?.trim();

    return prisma.service.findMany({
      where: {
        businessId,
        ...(activeOnly ? { active: true } : {}),
        ...(q ? { name: { contains: q, mode: "insensitive" } } : {}),
      },
      include: {
        professionalServices: {
          where: { professional: { active: true } },
          include: {
            professional: {
              select: { id: true, name: true, active: true, color: true },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    });
  }

  async getServiceById(id: string, businessId: string) {
    const service = await prisma.service.findFirst({
      where: { id, businessId },
    });

    if (!service) {
      const error: any = new Error("Service not found");
      error.status = 404;
      throw error;
    }

    return service;
  }

  async createService(data: CreateServiceInput) {
    const { businessId } = data;
    const name = data.name?.trim();

    if (!name) {
      const error: any = new Error("Name is required");
      error.status = 400;
      throw error;
    }

    if (!Number.isInteger(data.durationMin) || data.durationMin <= 0) {
      const error: any = new Error("durationMin must be a positive integer");
      error.status = 400;
      throw error;
    }

    if (typeof data.basePrice !== "number" || Number.isNaN(data.basePrice) || data.basePrice < 0) {
      const error: any = new Error("basePrice must be a number greater than or equal to 0");
      error.status = 400;
      throw error;
    }

    const existing = await prisma.service.findFirst({
      where: { businessId, name: { equals: name, mode: "insensitive" } },
    });

    if (existing) {
      const error: any = new Error("A service with that name already exists");
      error.status = 409;
      throw error;
    }

    return prisma.service.create({
      data: {
        businessId,
        name,
        durationMin: data.durationMin,
        basePrice: data.basePrice,
        description: data.description ?? "",
        active: data.active ?? true,
        requiresDeposit: data.requiresDeposit ?? false,
        depositPercent: data.depositPercent ?? null,
        bookableOnline: data.bookableOnline ?? true,
      },
    });
  }

  async updateService(id: string, businessId: string, data: UpdateServiceInput) {
    await this.getServiceById(id, businessId);

    const updateData: any = {};

    if (data.name !== undefined) {
      const name = data.name.trim();
      if (!name) {
        const error: any = new Error("Name cannot be empty");
        error.status = 400;
        throw error;
      }

      const existing = await prisma.service.findFirst({
        where: { businessId, name: { equals: name, mode: "insensitive" }, NOT: { id } },
      });

      if (existing) {
        const error: any = new Error("A service with that name already exists");
        error.status = 409;
        throw error;
      }

      updateData.name = name;
    }

    if (data.description !== undefined) {
      updateData.description = data.description?.trim() || null;
    }

    if (data.durationMin !== undefined) {
      if (!Number.isInteger(data.durationMin) || data.durationMin <= 0) {
        const error: any = new Error("durationMin must be a positive integer");
        error.status = 400;
        throw error;
      }
      updateData.durationMin = data.durationMin;
    }

    if (data.basePrice !== undefined) {
      if (typeof data.basePrice !== "number" || Number.isNaN(data.basePrice) || data.basePrice < 0) {
        const error: any = new Error("basePrice must be a number greater than or equal to 0");
        error.status = 400;
        throw error;
      }
      updateData.basePrice = data.basePrice;
    }

    if (data.active !== undefined) {
      updateData.active = data.active;
    }

    if (data.requiresDeposit !== undefined) {
      updateData.requiresDeposit = data.requiresDeposit;
    }

    if (data.depositPercent !== undefined) {
      updateData.depositPercent = data.depositPercent;
    }

    if (data.bookableOnline !== undefined) {
      updateData.bookableOnline = data.bookableOnline;
    }

    if (data.allowClientChooseProfessional !== undefined) {
      updateData.allowClientChooseProfessional = data.allowClientChooseProfessional;
    }

    return prisma.service.update({ where: { id }, data: updateData });
  }

  async deleteService(id: string, businessId: string) {
    await this.getServiceById(id, businessId);
    return prisma.service.update({ where: { id }, data: { active: false } });
  }

  async toggleServiceActive(id: string, businessId: string, active: boolean) {
    await this.getServiceById(id, businessId);
    return prisma.service.update({ where: { id }, data: { active } });
  }
}

export const serviceService = new ServiceService();
