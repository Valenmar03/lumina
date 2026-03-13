import { apiFetch } from "./api";
import type { Service, ServiceWithProfessional, UpdateServicePayload } from "../types/entities";

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
          name: payload.name,
          description: payload.description,
          durationMin: payload.durationMin,
          basePrice: payload.basePrice,
          active: payload.active
        }),
      }
    );
}