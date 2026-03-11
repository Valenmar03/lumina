import { apiFetch } from "./api";
import type { Professional, ProfessionalSchedulesResponse, UpdateProfessionalSchedulesPayload } from "../types/entities";
import type { AvailabilityResponse, ProfessionalServicesResponse } from "../types/entities";

export function getProfessionals() {
  return apiFetch<{ professionals: Professional[] }>("/professionals");
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