import { apiFetch } from "./api";
import type { Business } from "../types/entities";

export function getBusiness() {
  return apiFetch<{ business: Business }>("/business");
}

export function updateBusiness(data: { name?: string; slug?: string; timezone?: string; mpAccessToken?: string | null }) {
  return apiFetch<{ business: Business }>("/business", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}
