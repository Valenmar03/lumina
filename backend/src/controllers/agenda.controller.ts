import { Request, Response } from "express";
import { appointmentService } from "../services/appointments.service";
import {
  dayRange,
  weekRange,
  monthRange,
  isYMD,
  isYM,
  dayOfWeekFromYMD,
} from "../utils/ranges";
import { professionalScheduleService } from "../services/professionalSchedule.service";
import { professionalService } from "../services/professionals.service";

export async function agendaDailyHandler(req: Request, res: Response) {
  try {
    const { businessId } = req.user!;
    const { professionalId, date, status } = req.query;

    if (!date) {
      return res.status(400).json({ error: "Missing query params: date" });
    }

    const ymd = String(date);
    if (!isYMD(ymd)) {
      return res.status(400).json({ error: "date must be YYYY-MM-DD" });
    }

    const range = dayRange(ymd);
    const dayOfWeek = dayOfWeekFromYMD(ymd);
    const profId = professionalId ? String(professionalId) : undefined;

    const appointmentsPromise = appointmentService.getByRange({
      businessId,
      professionalId: profId,
      from: range.from,
      to: range.to,
      status: status ? (String(status) as any) : undefined,
    });

    const fromDate = new Date(range.from);
    const toDate = new Date(range.to);

    if (profId) {
      const [appointments, scheduleBlocks, unavailMap] = await Promise.all([
        appointmentsPromise,
        professionalScheduleService.getScheduleBlocksForDay({
          businessId,
          professionalId: profId,
          dayOfWeek,
        }),
        professionalScheduleService.getUnavailabilitiesForDay({
          businessId,
          professionalIds: [profId],
          from: fromDate,
          to: toDate,
        }),
      ]);

      return res.json({
        kind: "daily",
        date: ymd,
        professionalId: profId,
        range,
        scheduleBlocksByProfessional: { [profId]: scheduleBlocks },
        unavailabilitiesByProfessional: unavailMap,
        appointments,
      });
    }

    const professionals = await professionalService.listProfessionals({ businessId });
    const professionalIds = professionals.map((p) => p.id);

    const [scheduleEntries, unavailMap, appointments] = await Promise.all([
      Promise.all(
        professionals.map(async (professional) => {
          const blocks = await professionalScheduleService.getScheduleBlocksForDay({
            businessId,
            professionalId: professional.id,
            dayOfWeek,
          });
          return [professional.id, blocks] as const;
        })
      ),
      professionalScheduleService.getUnavailabilitiesForDay({
        businessId,
        professionalIds,
        from: fromDate,
        to: toDate,
      }),
      appointmentsPromise,
    ]);

    const scheduleBlocksByProfessional = Object.fromEntries(scheduleEntries);

    return res.json({
      kind: "daily",
      date: ymd,
      range,
      scheduleBlocksByProfessional,
      unavailabilitiesByProfessional: unavailMap,
      appointments,
    });
  } catch (err: any) {
    return res.status(err?.status ?? 500).json({ error: err?.message ?? "Server error" });
  }
}

export async function agendaWeeklyHandler(req: Request, res: Response) {
  try {
    const { businessId } = req.user!;
    const { professionalId, date, status, weekStart } = req.query;

    if (!date) {
      return res.status(400).json({ error: "Missing query params: date" });
    }

    const ymd = String(date);
    if (!isYMD(ymd)) {
      return res.status(400).json({ error: "date must be YYYY-MM-DD" });
    }

    const ws = String(weekStart || "monday") as "monday" | "sunday";
    const range = weekRange(ymd, ws);
    const profId = professionalId ? String(professionalId) : undefined;

    const appointments = await appointmentService.getByRange({
      businessId,
      professionalId: profId,
      from: range.from,
      to: range.to,
      status: status ? (String(status) as any) : undefined,
    });

    if (profId) {
      const scheduleBlocksByDay = await professionalScheduleService.getScheduleBlocksForWeek({
        businessId,
        professionalId: profId,
      });

      return res.json({
        kind: "weekly",
        date: ymd,
        weekStart: ws,
        professionalId: profId,
        range,
        scheduleBlocksByDay,
        appointments,
      });
    }

    return res.json({ kind: "weekly", date: ymd, weekStart: ws, range, appointments });
  } catch (err: any) {
    return res.status(err?.status ?? 500).json({ error: err?.message ?? "Server error" });
  }
}

export async function agendaMonthlyHandler(req: Request, res: Response) {
  try {
    const { businessId } = req.user!;
    const { professionalId, month, status } = req.query;

    if (!professionalId || !month) {
      return res.status(400).json({ error: "Missing query params: professionalId, month" });
    }

    const ym = String(month);
    if (!isYM(ym)) {
      return res.status(400).json({ error: "month must be YYYY-MM" });
    }

    const range = monthRange(ym);

    const appointments = await appointmentService.getByRange({
      businessId,
      professionalId: String(professionalId),
      from: range.from,
      to: range.to,
      status: status ? (String(status) as any) : undefined,
    });

    return res.json({
      kind: "monthly",
      month: ym,
      professionalId: String(professionalId),
      range,
      appointments,
    });
  } catch (err: any) {
    return res.status(err?.status ?? 500).json({ error: err?.message ?? "Server error" });
  }
}
