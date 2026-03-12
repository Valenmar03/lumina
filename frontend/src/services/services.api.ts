import { apiFetch } from "./api";
import type { Service, ServiceWithProfessional } from "../types/entities";

export function getServices() {
  return apiFetch<{ services: Service[] }>("/services");
}

export function getServicesWithProfessional() {
  return apiFetch<{ services: ServiceWithProfessional[] }>("/services/professionals");
}