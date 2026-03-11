import { Request, Response } from "express";
import { professionalService } from "../services/professionals.service";

export async function getProfessionalsHandler(req: Request, res: Response) {
  try {
    const professionals = await professionalService.listProfessionals();
    return res.json({ professionals });
  } catch (err: any) {
    return res.status(err?.status ?? 500).json({
      error: err?.message ?? "Server error",
    });
  }
}

export async function createProfessionalHandler(req: Request, res: Response) {
  try {
    const { name, color } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Missing name" });
    }

    const professional = await professionalService.createProfessional({
      name,
      color,
    });

    return res.json({ professional });
  } catch (err: any) {
    return res.status(err?.status ?? 500).json({
      error: err?.message ?? "Server error",
    });
  }
}

export async function updateProfessionalHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { name, color } = req.body;

    const professional = await professionalService.updateProfessional({
      professionalId: String(id),
      name,
      color,
    });

    return res.json({ professional });
  } catch (err: any) {
    return res.status(err?.status ?? 500).json({
      error: err?.message ?? "Server error",
    });
  }
}

export async function getProfessionalSchedulesHandler(
  req: Request,
  res: Response
) {
  try {
    const { id } = req.params;

    const schedules = await professionalService.getSchedules({
      professionalId: String(id),
    });

    return res.json({ schedules });
  } catch (err: any) {
    return res.status(err?.status ?? 500).json({
      error: err?.message ?? "Server error",
    });
  }
}

export async function replaceProfessionalScheduleForDayHandler(
  req: Request,
  res: Response
) {
  try {
    const { id, dayOfWeek } = req.params;
    const { blocks } = req.body;

    if (!Array.isArray(blocks)) {
      return res.status(400).json({ error: "blocks must be an array" });
    }

    const schedules = await professionalService.replaceScheduleForDay({
      professionalId: String(id),
      dayOfWeek: Number(dayOfWeek),
      blocks,
    });

    return res.json({ schedules });
  } catch (err: any) {
    return res.status(err?.status ?? 500).json({
      error: err?.message ?? "Server error",
    });
  }
}

export async function getProfessionalServicesHandler(
  req: Request,
  res: Response
) {
  try {
    const { id } = req.params;

    const services = await professionalService.getProfessionalServices({
      professionalId: String(id),
    });

    return res.json({ services });
  } catch (err: any) {
    return res.status(err?.status ?? 500).json({
      error: err?.message ?? "Server error",
    });
  }
}

export async function replaceProfessionalServicesHandler(
  req: Request,
  res: Response
) {
  try {
    const { id } = req.params;
    const { serviceIds } = req.body;

    if (!Array.isArray(serviceIds)) {
      return res.status(400).json({ error: "serviceIds must be an array" });
    }

    const services = await professionalService.replaceProfessionalServices({
      professionalId: String(id),
      serviceIds,
    });

    return res.json({ services });
  } catch (err: any) {
    return res.status(err?.status ?? 500).json({
      error: err?.message ?? "Server error",
    });
  }
}

export async function getProfessionalAvailabilityHandler(
  req: Request,
  res: Response
) {
  try {
    const { id } = req.params;
    const { date, serviceId, stepMin } = req.query;

    if (!date || !serviceId) {
      return res.status(400).json({
        error: "Missing query params: date, serviceId",
      });
    }

    const result = await professionalService.getAvailability({
      professionalId: String(id),
      date: String(date),
      serviceId: String(serviceId),
      stepMin: stepMin ? Number(stepMin) : 15,
    });

    return res.json(result);
  } catch (err: any) {
    return res.status(err?.status ?? 500).json({
      error: err?.message ?? "Server error",
    });
  }
}