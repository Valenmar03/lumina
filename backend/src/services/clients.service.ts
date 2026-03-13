import { prisma } from "../db/prisma";

const BUSINESS_ID = "8c0fe826-dacb-48bf-924a-c6eaa9e1fe76";

export type CreateClientInput = {
  fullName: string;
  phone: string;
  email?: string | null;
  notes?: string | null;
};

export type UpdateClientInput = {
  fullName?: string;
  phone?: string;
  email?: string | null;
  notes?: string | null;
};

class ClientService {
  async listClients(params?: { search?: string }) {
    const search = params?.search?.trim();

    return prisma.client.findMany({
      where: {
        businessId: BUSINESS_ID,
        ...(search
          ? {
              OR: [
                {
                  fullName: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
                {
                  phone: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
                {
                  email: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
              ],
            }
          : {}),
      },
      orderBy: [
        { fullName: "asc" },
        { createdAt: "desc" },
      ],
    });
  }

  async getClientById(id: string) {
    const client = await prisma.client.findFirst({
      where: {
        id,
        businessId: BUSINESS_ID,
      },
    });

    if (!client) {
      const error: any = new Error("Client not found");
      error.status = 404;
      throw error;
    }

    return client;
  }

  async createClient(data: CreateClientInput) {
    const fullName = data.fullName?.trim();
    const phone = data.phone?.trim();
    const email = data.email?.trim() || null;
    const notes = data.notes?.trim() || null;

    if (!fullName) {
      const error: any = new Error("fullName is required");
      error.status = 400;
      throw error;
    }

    if (!phone) {
      const error: any = new Error("phone is required");
      error.status = 400;
      throw error;
    }

    const existing = await prisma.client.findFirst({
      where: {
        businessId: BUSINESS_ID,
        phone,
      },
    });

    if (existing) {
      const error: any = new Error("A client with that phone already exists");
      error.status = 409;
      throw error;
    }

    return prisma.client.create({
      data: {
        businessId: BUSINESS_ID,
        fullName,
        phone,
        email,
        notes,
      },
    });
  }

  async updateClient(id: string, data: UpdateClientInput) {
    await this.getClientById(id);

    const updateData: any = {};

    if (data.fullName !== undefined) {
      const fullName = data.fullName.trim();

      if (!fullName) {
        const error: any = new Error("fullName cannot be empty");
        error.status = 400;
        throw error;
      }

      updateData.fullName = fullName;
    }

    if (data.phone !== undefined) {
      const phone = data.phone.trim();

      if (!phone) {
        const error: any = new Error("phone cannot be empty");
        error.status = 400;
        throw error;
      }

      const existing = await prisma.client.findFirst({
        where: {
          businessId: BUSINESS_ID,
          phone,
          NOT: { id },
        },
      });

      if (existing) {
        const error: any = new Error("A client with that phone already exists");
        error.status = 409;
        throw error;
      }

      updateData.phone = phone;
    }

    if (data.email !== undefined) {
      updateData.email = data.email?.trim() || null;
    }

    if (data.notes !== undefined) {
      updateData.notes = data.notes?.trim() || null;
    }

    return prisma.client.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteClient(id: string) {
    await this.getClientById(id);

    return prisma.client.delete({
      where: { id },
    });
  }
}

export const clientService = new ClientService();