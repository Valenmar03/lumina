import { apiFetch } from "./api";
import type { Business } from "../types/entities";

export function getBusiness() {
  return apiFetch<{ business: Business }>("/business");
}

export function updateBusiness(data: { name?: string; slug?: string; timezone?: string; mpAccessToken?: string | null; waPhoneNumberId?: string | null; waAccessToken?: string | null; waReminderHours?: number | null; emailNotificationsEnabled?: boolean; emailReminderHours?: number | null }) {
  return apiFetch<{ business: Business }>("/business", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export type BusinessUnavailability = {
  id: string;
  businessId: string;
  date: string; // yyyy-MM-dd
  reason: string | null;
  createdAt: string;
};

export function getBusinessUnavailabilities() {
  return apiFetch<{ unavailabilities: BusinessUnavailability[] }>("/business/unavailabilities");
}

export function createBusinessUnavailability(data: { date: string; reason?: string | null }) {
  return apiFetch<{ unavailability: BusinessUnavailability }>("/business/unavailabilities", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function deleteBusinessUnavailability(id: string) {
  return apiFetch<void>(`/business/unavailabilities/${id}`, { method: "DELETE" });
}
