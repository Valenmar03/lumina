import type { CreateServicePayload, Service, ServiceWithProfessional, UpdateServicePayload } from "../types/entities";
import { apiFetch } from "./api";

export function getServices() {
  return apiFetch<{ services: Service[] }>("/services");
}

export function getServicesWithProfessional() {
  return apiFetch<{ services: ServiceWithProfessional[] }>("/services/professionals");
}

export async function updateService(payload: UpdateServicePayload) {
  const { serviceId } = payload;

  return apiFetch<{ service: ServiceWithProfessional }>(
    `/services/${serviceId}`,
    {
      method: "PATCH",
      body: JSON.stringify({
        ...(payload.name !== undefined && { name: payload.name }),
        ...(payload.description !== undefined && { description: payload.description }),
        ...(payload.durationMin !== undefined && { durationMin: payload.durationMin }),
        ...(payload.basePrice !== undefined && { basePrice: payload.basePrice }),
        ...(payload.active !== undefined && { active: payload.active }),
      })
    }
  );
}

export async function createService(payload: CreateServicePayload
) {
  return apiFetch<{ service: ServiceWithProfessional }>(
    `/services`,
    {
      method: "POST",
      body: JSON.stringify({
        name: payload.name,
        description: payload.description,
        durationMin: payload.durationMin,
        basePrice: payload.basePrice,
        active: payload.active ?? true
      }),
    }
  );
}