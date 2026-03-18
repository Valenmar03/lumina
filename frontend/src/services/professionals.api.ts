import { apiFetch } from "./api";
import type { CreateProfessionalPayload, CreateProfessionalResponse, Professional, ProfessionalSchedulesResponse, UpdateProfessionalSchedulesPayload, ProfessionalUnavailability } from "../types/entities";
import type { AvailabilityResponse, ProfessionalServicesResponse } from "../types/entities";

export function getProfessionals() {
  return apiFetch<{ professionals: Professional[] }>("/professionals");
}

export async function createProfessional(payload: CreateProfessionalPayload) {
  return apiFetch<CreateProfessionalResponse>("/professionals", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  
}

export function getProfessionalAvailability(params: {
  professionalId: string;
  date: string;
  serviceId: string;
  stepMin?: number;
}) {
  const query = new URLSearchParams({
    date: params.date,
    serviceId: params.serviceId,
    ...(params.stepMin ? { stepMin: String(params.stepMin) } : {}),
  });

  return apiFetch<AvailabilityResponse>(
    `/professionals/${params.professionalId}/availability?${query.toString()}`
  );
}

export function getProfessionalServices(params: { professionalId: string }) {
  return apiFetch<ProfessionalServicesResponse>(
    `/professionals/${params.professionalId}/services`
  );
}

export function getProfessionalSchedules(params: { professionalId: string }) {
  return apiFetch<ProfessionalSchedulesResponse>(
    `/professionals/${params.professionalId}/schedules`
  );
}

export function updateProfessional(params: {
  professionalId: string;
  name?: string;
  color?: string;
  active?: boolean;
}) {
  return apiFetch<{ professional: Professional }>(
    `/professionals/${params.professionalId}`,
    {
      method: "PATCH",
      body: JSON.stringify({
        name: params.name,
        color: params.color,
        active: params.active,
      }),
    }
  );
}

export function updateProfessionalSchedules(
  professionalId: string,
  body: UpdateProfessionalSchedulesPayload
) {
  return apiFetch<ProfessionalSchedulesResponse>(
    `/professionals/${professionalId}/schedules`,
    {
      method: "PUT",
      body: JSON.stringify(body),
    }
  );
}

export function updateProfessionalScheduleForDay(params: {
  professionalId: string;
  dayOfWeek: number;
  blocks: { startTime: string; endTime: string }[];
}) {
  return apiFetch(
    `/professionals/${params.professionalId}/schedules/${params.dayOfWeek}`,
    {
      method: "PUT",
      body: JSON.stringify({
        blocks: params.blocks,
      }),
    }
  );
}

export function updateProfessionalServices(params: {
  professionalId: string;
  serviceIds: string[];
}) {
  return apiFetch<ProfessionalServicesResponse>(
    `/professionals/${params.professionalId}/services`,
    {
      method: "PUT",
      body: JSON.stringify({
        serviceIds: params.serviceIds,
      }),
    }
  );
}

export function createProfessionalAccount(professionalId: string, username: string, password: string) {
  return apiFetch<{ professional: Professional }>(`/professionals/${professionalId}/account`, {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export function getProfessionalUnavailabilities(params: { professionalId: string }) {
  return apiFetch<{ unavailabilities: ProfessionalUnavailability[] }>(
    `/professionals/${params.professionalId}/unavailabilities`
  );
}

export function createProfessionalUnavailability(params: {
  professionalId: string;
  startAt: string;
  endAt: string;
  reason?: string;
  cancelConflicting?: boolean;
}) {
  return apiFetch<{ unavailability: ProfessionalUnavailability }>(
    `/professionals/${params.professionalId}/unavailabilities`,
    {
      method: "POST",
      body: JSON.stringify({
        startAt: params.startAt,
        endAt: params.endAt,
        reason: params.reason,
        cancelConflicting: params.cancelConflicting,
      }),
    }
  );
}

export function deleteProfessionalUnavailability(params: {
  professionalId: string;
  id: string;
}) {
  return apiFetch(
    `/professionals/${params.professionalId}/unavailabilities/${params.id}`,
    { method: "DELETE" }
  );
}