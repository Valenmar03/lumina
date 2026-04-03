import { apiFetch, apiFetchFormData } from "./api";
import type { Business, BusinessUnavailability } from "../types/entities";
export type { BusinessUnavailability };

export function getBusiness() {
  return apiFetch<{ business: Business }>("/business");
}

export function updateBusiness(data: { name?: string; slug?: string; timezone?: string; mpAccessToken?: string | null; waPhoneNumberId?: string | null; waAccessToken?: string | null; waReminderHours?: number | null; emailNotificationsEnabled?: boolean; emailReminderHours?: number | null; onboardingCompleted?: boolean; address?: string | null; whatsappPhone?: string | null; bookingTheme?: string | null; tagline?: string | null }) {
  return apiFetch<{ business: Business }>("/business", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function uploadBusinessLogo(file: File): Promise<{ logoUrl: string }> {
  const formData = new FormData();
  formData.append("logo", file);
  return apiFetchFormData<{ logoUrl: string }>("/upload/logo", formData);
}

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
