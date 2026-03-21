import type { Request, Response, NextFunction } from "express";
import {
  getPublicBusinessInfo,
  getPublicServices,
  getPublicProfessionals,
  getPublicAvailability,
  createPublicAppointment,
  confirmPublicPayment,
} from "../services/public.service";

function handleError(err: unknown, res: Response) {
  const e = err as Error & { status?: number };
  res.status(e.status ?? 500).json({ error: e.message ?? "Server error" });
}

export async function getBusinessInfoHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await getPublicBusinessInfo(req.params["slug"] as string);
    res.json(data);
  } catch (err) {
    handleError(err, res);
  }
}

export async function getServicesHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await getPublicServices(req.params["slug"] as string);
    res.json(data);
  } catch (err) {
    handleError(err, res);
  }
}

export async function getProfessionalsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const serviceId = req.query.serviceId as string | undefined;
    const data = await getPublicProfessionals(req.params["slug"] as string, serviceId);
    res.json(data);
  } catch (err) {
    handleError(err, res);
  }
}

export async function getAvailabilityHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const slug = req.params["slug"] as string;
    const professionalId = req.params["professionalId"] as string;
    const { date, serviceId } = req.query as { date: string; serviceId: string };
    if (!date || !serviceId) {
      res.status(400).json({ error: "date and serviceId are required" });
      return;
    }
    const data = await getPublicAvailability(slug, professionalId, date, serviceId);
    res.json(data);
  } catch (err) {
    handleError(err, res);
  }
}

export async function createAppointmentHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { serviceId, professionalId, startAt, clientFullName, clientPhone, clientEmail } =
      req.body;

    if (!serviceId || !professionalId || !startAt || !clientFullName || !clientPhone) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    const result = await createPublicAppointment(req.params["slug"] as string, {
      serviceId,
      professionalId,
      startAt,
      clientFullName,
      clientPhone,
      clientEmail,
    });

    res.status(201).json(result);
  } catch (err) {
    handleError(err, res);
  }
}

export async function confirmPaymentHandler(req: Request, res: Response) {
  try {
    const slug = req.params["slug"] as string;
    const appointmentId = req.params["appointmentId"] as string;
    const { paymentId } = req.body;
    if (!paymentId) return res.status(400).json({ error: "paymentId is required" });
    const result = await confirmPublicPayment(slug, appointmentId, paymentId);
    return res.json(result);
  } catch (err: any) {
    return res.status(err.status ?? 500).json({ error: err.message });
  }
}
