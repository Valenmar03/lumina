import { prisma } from "../db/prisma";

const BUSINESS_ID = "976dac1d-a819-4f13-8e60-32f6ab65c60a";

type ListServicesParams = {
  activeOnly?: boolean;
  search?: string;
};

type CreateServiceInput = {
  name: string;
  durationMin: number;
  basePrice: number;
  active?: boolean;
  description?: string;
};

type UpdateServiceInput = {
  name?: string;
  durationMin?: number;
  basePrice?: number;
  active?: boolean;
  description?: string;
};

export class ServiceService {
  async listServices(params?: ListServicesParams) {
    const activeOnly = params?.activeOnly ?? true;
    const search = params?.search?.trim();

    return prisma.service.findMany({
      where: {
        businessId: BUSINESS_ID,
        ...(activeOnly ? { active: true } : {}),
        ...(search
          ? {
              name: { contains: search, mode: "insensitive" },
            }
          : {}),
      },
      orderBy: { name: "asc" },
    });
  }

  async listServicesWithProfessional(params?: { activeOnly?: boolean; search?: string }) {
    const activeOnly = params?.activeOnly ?? false;
    const search = params?.search?.trim();

    return prisma.service.findMany({
      where: {
        businessId: BUSINESS_ID,
        ...(activeOnly ? { active: true } : {}),
        ...(search
          ? {
              name: { contains: search, mode: "insensitive" },
            }
          : {}),
      },
      include: {
        professionalServices: {
          where: {
            professional: {
              active: true,
            },
          },
          include: {
            professional: {
              select: {
                id: true,
                name: true,
                active: true,
                color: true
              },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    });
  }

  async getServiceById(id: string) {
    const service = await prisma.service.findFirst({
      where: {
        id,
        businessId: BUSINESS_ID,
      },
    });

    if (!service) {
      const error: any = new Error("Service not found");
      error.status = 404;
      throw error;
    }

    return service;
  }

  async createService(data: CreateServiceInput) {
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
      where: {
        businessId: BUSINESS_ID,
        name: { equals: name, mode: "insensitive" },
      },
    });

    if (existing) {
      const error: any = new Error("A service with that name already exists");
      error.status = 409;
      throw error;
    }

    return prisma.service.create({
      data: {
        businessId: BUSINESS_ID,
        name,
        durationMin: data.durationMin,
        basePrice: data.basePrice,
        description: data.description ?? "",
        active: data.active ?? true,
      },
    });
  }

  async updateService(id: string, data: UpdateServiceInput) {
    await this.getServiceById(id);

    const updateData: any = {};

    if (data.name !== undefined) {
      const name = data.name.trim();

      if (!name) {
        const error: any = new Error("Name cannot be empty");
        error.status = 400;
        throw error;
      }

      const existing = await prisma.service.findFirst({
        where: {
          businessId: BUSINESS_ID,
          name: { equals: name, mode: "insensitive" },
          NOT: { id },
        },
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
      if (
        typeof data.basePrice !== "number" ||
        Number.isNaN(data.basePrice) ||
        data.basePrice < 0
      ) {
        const error: any = new Error(
          "basePrice must be a number greater than or equal to 0"
        );
        error.status = 400;
        throw error;
      }

      updateData.basePrice = data.basePrice;
    }

    if (data.active !== undefined) {
      updateData.active = data.active;
    }

    return prisma.service.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteService(id: string) {
    await this.getServiceById(id);

    return prisma.service.update({
      where: { id },
      data: { active: false },
    });
  }

  async toggleServiceActive(id: string, active: boolean) {
    await this.getServiceById(id);

    return prisma.service.update({
      where: { id },
      data: { active },
    });
  }
}

export const serviceService = new ServiceService();