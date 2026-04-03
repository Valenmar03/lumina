import { Request, Response } from "express";
import { businessService, getBusinessUnavailabilities, createBusinessUnavailability, deleteBusinessUnavailability } from "../services/business.service";

export async function getBusinessHandler(req: Request, res: Response) {
  try {
    const { businessId } = req.user!;
    const business = await businessService.getBusiness(businessId);
    return res.json({ business });
  } catch (err: any) {
    return res.status(err?.status ?? 500).json({ error: err?.message ?? "Server error" });
  }
}

export async function updateBusinessHandler(req: Request, res: Response) {
  try {
    const { businessId, role } = req.user!;
    if (role !== "OWNER") {
      return res.status(403).json({ error: "Solo el owner puede modificar el negocio" });
    }
    const { name, slug, timezone, mpAccessToken, waPhoneNumberId, waAccessToken, waReminderHours, emailNotificationsEnabled, emailReminderHours, onboardingCompleted } = req.body;
    const business = await businessService.updateBusiness(businessId, { name, slug, timezone, mpAccessToken, waPhoneNumberId, waAccessToken, waReminderHours, emailNotificationsEnabled, emailReminderHours, onboardingCompleted });
    return res.json({ business });
  } catch (err: any) {
    return res.status(err?.status ?? 500).json({ error: err?.message ?? "Server error" });
  }
}

export async function getBusinessUnavailabilitiesHandler(req: Request, res: Response) {
  try {
    const { businessId } = req.user!;
    const unavailabilities = await getBusinessUnavailabilities(businessId);
    return res.json({ unavailabilities });
  } catch (err: any) {
    return res.status(err?.status ?? 500).json({ error: err?.message ?? "Server error" });
  }
}

export async function createBusinessUnavailabilityHandler(req: Request, res: Response) {
  try {
    const { businessId, role } = req.user!;
    if (role !== "OWNER") {
      return res.status(403).json({ error: "Solo el owner puede modificar el negocio" });
    }
    const { date, reason } = req.body;
    const unavailability = await createBusinessUnavailability(businessId, { date, reason });
    return res.status(201).json({ unavailability });
  } catch (err: any) {
    return res.status(err?.status ?? 500).json({ error: err?.message ?? "Server error" });
  }
}

export async function deleteBusinessUnavailabilityHandler(req: Request, res: Response) {
  try {
    const { businessId, role } = req.user!;
    if (role !== "OWNER") {
      return res.status(403).json({ error: "Solo el owner puede modificar el negocio" });
    }
    const unavailabilityId = req.params.unavailabilityId as string;
    await deleteBusinessUnavailability(businessId, unavailabilityId);
    return res.status(204).send();
  } catch (err: any) {
    return res.status(err?.status ?? 500).json({ error: err?.message ?? "Server error" });
  }
}
