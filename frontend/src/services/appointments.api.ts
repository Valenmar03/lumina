import type { AppointmentStatus, PaymentMethod } from "../types/entities";
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

  console.log(id, body)

  return apiFetch(`/appointments/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function changeAppointmentStatus(data: {
  id: string;
  status: AppointmentStatus;
  depositAmount?: number;
  depositMethod?: PaymentMethod;
  finalPaymentMethod?: PaymentMethod;
}) {
  const {
    id,
    status,
    depositAmount,
    depositMethod,
    finalPaymentMethod,
  } = data;

  return apiFetch(`/appointments/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({
      status,
      depositAmount,
      depositMethod,
      finalPaymentMethod,
    }),
  });
}