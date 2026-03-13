import { apiFetch } from "./api";
import type { Client, ClientAppointments, CreateClientPayload, UpdateClientPayload } from "../types/entities";

export function getClients(search?: string) {
  const query = search ? `?search=${encodeURIComponent(search)}` : "";
  return apiFetch<{ clients: Client[] }>(`/clients${query}`);
}

export function searchClients(q: string, limit = 8) {
  return apiFetch<{ clients: Client[] }>(
    `/clients/search?q=${encodeURIComponent(q)}&limit=${limit}`
  );
}

export async function createClient(payload: CreateClientPayload) {
  return apiFetch<{ client: Client }>("/clients", {
    method: "POST",
    body: JSON.stringify({
      fullName: payload.fullName,
      phone: payload.phone,
      email: payload.email,
      notes: payload.notes,
    }),
  });
}

export async function updateClient(payload: UpdateClientPayload) {
  const { clientId } = payload;

  return apiFetch<{ client: Client }>(`/clients/${clientId}`, {
    method: "PATCH",
    body: JSON.stringify({
      ...(payload.fullName !== undefined && { fullName: payload.fullName }),
      ...(payload.phone !== undefined && { phone: payload.phone }),
      ...(payload.email !== undefined && { email: payload.email }),
      ...(payload.notes !== undefined && { notes: payload.notes }),
    }),
  });
}

export async function deleteClient(clientId: string) {
  return apiFetch<void>(`/clients/${clientId}`, {
    method: "DELETE",
  });
}

export function getClientAppointments(clientId: string) {
  return apiFetch<{ appointments: ClientAppointments[] }>(`/clients/${clientId}/appointments`);
}