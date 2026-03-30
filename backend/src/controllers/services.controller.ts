import { Request, Response } from "express";
import { serviceService } from "../services/services.service";

export async function getServicesHandler(req: Request, res: Response) {
  try {
    const { businessId } = req.user!;
    const { search, activeOnly } = req.query;

    const services = await serviceService.listServices({
      businessId,
      search: search ? String(search) : undefined,
      activeOnly: activeOnly ? String(activeOnly) !== "false" : true,
    });

    return res.json({ services });
  } catch (err: any) {
    return res.status(err?.status ?? 500).json({ error: err?.message ?? "Server error" });
  }
}

export async function getServicesWithProfessionalHandler(req: Request, res: Response) {
  try {
    const { businessId } = req.user!;
    const { search, activeOnly } = req.query;

    const services = await serviceService.listServicesWithProfessional({
      businessId,
      search: search ? String(search) : undefined,
      activeOnly: activeOnly ? String(activeOnly) !== "true" : false,
    });

    return res.json({ services });
  } catch (err: any) {
    return res.status(err?.status ?? 500).json({ error: err?.message ?? "Server error" });
  }
}

export async function getServiceByIdHandler(req: Request, res: Response) {
  try {
    const { businessId } = req.user!;
    const { id } = req.params;

    const service = await serviceService.getServiceById(String(id), businessId);

    return res.json({ service });
  } catch (err: any) {
    return res.status(err?.status ?? 500).json({ error: err?.message ?? "Server error" });
  }
}

export async function createServiceHandler(req: Request, res: Response) {
  try {
    const { businessId } = req.user!;
    const { name, durationMin, basePrice, active, description, requiresDeposit, depositPercent } = req.body;

    const service = await serviceService.createService({
      businessId,
      name,
      durationMin: Number(durationMin),
      basePrice: Number(basePrice),
      description,
      active,
      requiresDeposit,
      depositPercent: depositPercent !== undefined && depositPercent !== null ? Number(depositPercent) : null,
    });

    return res.status(201).json({ service });
  } catch (err: any) {
    return res.status(err?.status ?? 500).json({ error: err?.message ?? "Server error" });
  }
}

export async function updateServiceHandler(req: Request, res: Response) {
  try {
    const { businessId } = req.user!;
    const { id } = req.params;
    const { name, description, durationMin, basePrice, active, requiresDeposit, depositPercent, bookableOnline, allowClientChooseProfessional } = req.body;

    const service = await serviceService.updateService(String(id), businessId, {
      ...(name !== undefined ? { name } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(durationMin !== undefined ? { durationMin: Number(durationMin) } : {}),
      ...(basePrice !== undefined ? { basePrice: Number(basePrice) } : {}),
      ...(active !== undefined
        ? { active: typeof active === "boolean" ? active : String(active) === "true" }
        : {}),
      ...(requiresDeposit !== undefined ? { requiresDeposit: Boolean(requiresDeposit) } : {}),
      ...(depositPercent !== undefined ? { depositPercent: depositPercent !== null ? Number(depositPercent) : null } : {}),
      ...(bookableOnline !== undefined ? { bookableOnline: Boolean(bookableOnline) } : {}),
      ...(allowClientChooseProfessional !== undefined ? { allowClientChooseProfessional: Boolean(allowClientChooseProfessional) } : {}),
    });

    return res.json({ service });
  } catch (err: any) {
    return res.status(err?.status ?? 500).json({ error: err?.message ?? "Server error" });
  }
}

export async function deleteServiceHandler(req: Request, res: Response) {
  try {
    const { businessId } = req.user!;
    const { id } = req.params;

    const service = await serviceService.deleteService(String(id), businessId);

    return res.json({ message: "Service deleted successfully", service });
  } catch (err: any) {
    return res.status(err?.status ?? 500).json({ error: err?.message ?? "Server error" });
  }
}

export async function toggleServiceActiveHandler(req: Request, res: Response) {
  try {
    const { businessId } = req.user!;
    const { id } = req.params;
    const { active } = req.body;

    if (typeof active !== "boolean") {
      return res.status(400).json({ error: "active must be a boolean" });
    }

    const service = await serviceService.toggleServiceActive(String(id), businessId, active);

    return res.json({ service });
  } catch (err: any) {
    return res.status(err?.status ?? 500).json({ error: err?.message ?? "Server error" });
  }
}
