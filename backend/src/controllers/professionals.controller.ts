import { Request, Response } from "express";
import { professionalService } from "../services/professionals.service";

export async function getProfessionalsHandler(req: Request, res: Response) {
  try {
    const { businessId } = req.user!;
    const professionals = await professionalService.listProfessionals({ businessId });
    return res.json({ professionals });
  } catch (err: any) {
    return res.status(err?.status ?? 500).json({ error: err?.message ?? "Server error" });
  }
}

export async function createProfessionalHandler(req: Request, res: Response) {
  try {
    const { businessId } = req.user!;
    const { name, color, active } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Missing name" });
    }

    const professional = await professionalService.createProfessional({
      businessId,
      name,
      color,
      active,
    });

    return res.json({ professional });
  } catch (err: any) {
    return res.status(err?.status ?? 500).json({ error: err?.message ?? "Server error" });
  }
}

export async function updateProfessionalHandler(req: Request, res: Response) {
  try {
    const { businessId } = req.user!;
    const { id } = req.params;
    const { name, color, active } = req.body;

    const professional = await professionalService.updateProfessional({
      businessId,
      professionalId: String(id),
      name,
      color,
      active,
    });

    return res.json({ professional });
  } catch (err: any) {
    return res.status(err?.status ?? 500).json({ error: err?.message ?? "Server error" });
  }
}

export async function getProfessionalSchedulesHandler(req: Request, res: Response) {
  try {
    const { businessId } = req.user!;
    const { id } = req.params;

    const schedules = await professionalService.getSchedules({
      businessId,
      professionalId: String(id),
    });

    return res.json({ schedules });
  } catch (err: any) {
    return res.status(err?.status ?? 500).json({ error: err?.message ?? "Server error" });
  }
}

export async function replaceProfessionalScheduleForDayHandler(req: Request, res: Response) {
  try {
    const { businessId } = req.user!;
    const { id, dayOfWeek } = req.params;
    const { blocks } = req.body;

    if (!Array.isArray(blocks)) {
      return res.status(400).json({ error: "blocks must be an array" });
    }

    const schedules = await professionalService.replaceScheduleForDay({
      businessId,
      professionalId: String(id),
      dayOfWeek: Number(dayOfWeek),
      blocks,
    });

    return res.json({ schedules });
  } catch (err: any) {
    return res.status(err?.status ?? 500).json({ error: err?.message ?? "Server error" });
  }
}

export async function getProfessionalServicesHandler(req: Request, res: Response) {
  try {
    const { businessId } = req.user!;
    const { id } = req.params;

    const services = await professionalService.getProfessionalServices({
      businessId,
      professionalId: String(id),
    });

    return res.json({ services });
  } catch (err: any) {
    return res.status(err?.status ?? 500).json({ error: err?.message ?? "Server error" });
  }
}

export async function replaceProfessionalServicesHandler(req: Request, res: Response) {
  try {
    const { businessId } = req.user!;
    const { id } = req.params;
    const { serviceIds } = req.body;

    if (!Array.isArray(serviceIds)) {
      return res.status(400).json({ error: "serviceIds must be an array" });
    }

    const services = await professionalService.replaceProfessionalServices({
      businessId,
      professionalId: String(id),
      serviceIds,
    });

    return res.json({ services });
  } catch (err: any) {
    return res.status(err?.status ?? 500).json({ error: err?.message ?? "Server error" });
  }
}

export async function createProfessionalAccountHandler(req: Request, res: Response) {
  try {
    const { businessId, role } = req.user!;
    if (role !== "OWNER") {
      return res.status(403).json({ error: "Only owners can create professional accounts" });
    }

    const professionalId = String(req.params.id);
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "username and password are required" });
    }

    const professional = await professionalService.createProfessionalAccount({
      businessId,
      professionalId,
      username,
      password,
    });

    return res.status(201).json({ professional });
  } catch (err: any) {
    return res.status(err?.statusCode ?? err?.status ?? 500).json({ error: err?.message ?? "Server error" });
  }
}

export async function getProfessionalUnavailabilitiesHandler(req: Request, res: Response) {
  try {
    const { businessId } = req.user!;
    const { id } = req.params;

    const unavailabilities = await professionalService.getUnavailabilities({
      businessId,
      professionalId: String(id),
    });

    return res.json({ unavailabilities });
  } catch (err: any) {
    return res.status(err?.status ?? 500).json({ error: err?.message ?? "Server error" });
  }
}

export async function createProfessionalUnavailabilityHandler(req: Request, res: Response) {
  try {
    const { businessId } = req.user!;
    const { id } = req.params;
    const { startAt, endAt, reason, cancelConflicting } = req.body;

    if (!startAt || !endAt) {
      return res.status(400).json({ error: "startAt and endAt are required" });
    }

    const startDate = new Date(startAt);
    const endDate = new Date(endAt);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({ error: "Invalid date format" });
    }

    const unavailability = await professionalService.createUnavailability({
      businessId,
      professionalId: String(id),
      startAt: startDate,
      endAt: endDate,
      reason,
      cancelConflicting: cancelConflicting === undefined ? undefined : Boolean(cancelConflicting),
    });

    return res.status(201).json({ unavailability });
  } catch (err: any) {
    if (err?.status === 409 && err?.conflicts) {
      return res.status(409).json({ error: "CONFLICTING_APPOINTMENTS", conflicts: err.conflicts });
    }
    return res.status(err?.status ?? 500).json({ error: err?.message ?? "Server error" });
  }
}

export async function deleteProfessionalUnavailabilityHandler(req: Request, res: Response) {
  try {
    const { businessId } = req.user!;
    const { id, unavailabilityId } = req.params;

    await professionalService.deleteUnavailability({
      businessId,
      professionalId: String(id),
      id: String(unavailabilityId),
    });

    return res.status(204).send();
  } catch (err: any) {
    return res.status(err?.status ?? 500).json({ error: err?.message ?? "Server error" });
  }
}

export async function getProfessionalAvailabilityHandler(req: Request, res: Response) {
  try {
    const { businessId } = req.user!;
    const { id } = req.params;
    const { date, serviceId, stepMin } = req.query;

    if (!date || !serviceId) {
      return res.status(400).json({ error: "Missing query params: date, serviceId" });
    }

    const result = await professionalService.getAvailability({
      businessId,
      professionalId: String(id),
      date: String(date),
      serviceId: String(serviceId),
      stepMin: stepMin ? Number(stepMin) : 15,
    });

    return res.json(result);
  } catch (err: any) {
    return res.status(err?.status ?? 500).json({ error: err?.message ?? "Server error" });
  }
}
