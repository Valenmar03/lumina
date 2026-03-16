import type { AppointmentStatus } from "../types/entities";
import { apiFetch } from "./api";

export function createAppointment(data: {
  professionalId: string;
  clientId: string;
  serviceId: string;
  startAt: string;
}) {
  return apiFetch("/appointments", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateAppointment(data: {
  id: string;
  professionalId: string;
  clientId: string;
  serviceId: string;
  startAt: string;
}) {
  const { id, ...body } = data;

  return apiFetch(`/appointments/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export function changeAppointmentStatus(data: {
  id: string;
  status: AppointmentStatus;
  depositAmount?: number;
}) {
  const { id, status, depositAmount } = data;

  return apiFetch(`/appointments/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status, depositAmount }),
  });
}