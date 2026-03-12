import { Request, Response } from "express";
import { serviceService } from "../services/services.service";

export async function getServicesHandler(req: Request, res: Response) {
  try {
    const { search, activeOnly } = req.query;

    const services = await serviceService.listServices({
      search: search ? String(search) : undefined,
      activeOnly: activeOnly ? String(activeOnly) !== "false" : true,
    });

    return res.json({ services });
  } catch (err: any) {
    return res.status(err?.status ?? 500).json({
      error: err?.message ?? "Server error",
    });
  }
}

export async function getServiceByIdHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const service = await serviceService.getServiceById(String(id));

    return res.json({ service });
  } catch (err: any) {
    return res.status(err?.status ?? 500).json({
      error: err?.message ?? "Server error",
    });
  }
}

export async function createServiceHandler(req: Request, res: Response) {
  try {
    const { name, durationMin, basePrice, active } = req.body;

    const service = await serviceService.createService({
      name,
      durationMin: Number(durationMin),
      basePrice: Number(basePrice),
      active,
    });

    return res.status(201).json({ service });
  } catch (err: any) {
    return res.status(err?.status ?? 500).json({
      error: err?.message ?? "Server error",
    });
  }
}

export async function updateServiceHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { name, durationMin, basePrice, active } = req.body;

    const service = await serviceService.updateService(String(id), {
      ...(name !== undefined ? { name } : {}),
      ...(durationMin !== undefined ? { durationMin: Number(durationMin) } : {}),
      ...(basePrice !== undefined ? { basePrice: Number(basePrice) } : {}),
      ...(active !== undefined
        ? { active: typeof active === "boolean" ? active : String(active) === "true" }
        : {}),
      });

    return res.json({ service });
  } catch (err: any) {
    return res.status(err?.status ?? 500).json({
      error: err?.message ?? "Server error",
    });
  }
}

export async function deleteServiceHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const service = await serviceService.deleteService(String(id));

    return res.json({
      message: "Service deleted successfully",
      service,
    });
  } catch (err: any) {
    return res.status(err?.status ?? 500).json({
      error: err?.message ?? "Server error",
    });
  }
}

export async function toggleServiceActiveHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { active } = req.body;

    if (typeof active !== "boolean") {
      return res.status(400).json({
        error: "active must be a boolean",
      });
    }

    const service = await serviceService.toggleServiceActive(String(id), active);

    return res.json({ service });
  } catch (err: any) {
    return res.status(err?.status ?? 500).json({
      error: err?.message ?? "Server error",
    });
  }
}