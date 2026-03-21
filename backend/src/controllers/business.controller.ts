import { Request, Response } from "express";
import { businessService } from "../services/business.service";

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
    const { name, slug, timezone, mpAccessToken } = req.body;
    const business = await businessService.updateBusiness(businessId, { name, slug, timezone, mpAccessToken });
    return res.json({ business });
  } catch (err: any) {
    return res.status(err?.status ?? 500).json({ error: err?.message ?? "Server error" });
  }
}
