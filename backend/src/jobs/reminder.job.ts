import { prisma } from "../db/prisma";
import { sendTemplate, formatWaDate, formatWaTime } from "../services/whatsapp.service";
import { sendAppointmentReminder } from "../services/email.service";

export async function runReminderJob(): Promise<void> {
  try {
    const businesses = await prisma.business.findMany({
      where: {
        waReminderHours: { not: null },
        waAccessToken: { not: null },
        waPhoneNumberId: { not: null },
      },
      select: {
        id: true,
        name: true,
        timezone: true,
        waPhoneNumberId: true,
        waAccessToken: true,
        waReminderHours: true,
      },
    });

    for (const biz of businesses) {
      const hoursAhead = biz.waReminderHours!;
      const now = new Date();
      const windowCenter = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);
      const windowStart = new Date(windowCenter.getTime() - 15 * 60 * 1000);
      const windowEnd = new Date(windowCenter.getTime() + 15 * 60 * 1000);

      const appointments = await prisma.appointment.findMany({
        where: {
          businessId: biz.id,
          status: { in: ["RESERVED", "DEPOSIT_PAID"] },
          reminderSentAt: null,
          startAt: { gte: windowStart, lte: windowEnd },
        },
        include: {
          client: { select: { fullName: true, phone: true } },
          service: { select: { name: true } },
          professional: { select: { name: true } },
        },
      });

      for (const appt of appointments) {
        if (!appt.client.phone) continue;

        await sendTemplate({
          accessToken: biz.waAccessToken!,
          phoneNumberId: biz.waPhoneNumberId!,
          to: appt.client.phone,
          templateName: "turno_recordatorio",
          variables: [
            appt.client.fullName,
            appt.service.name,
            appt.professional?.name ?? "",
            formatWaDate(appt.startAt, biz.timezone),
            formatWaTime(appt.startAt, biz.timezone),
            biz.name,
          ],
        });

        await prisma.appointment.update({
          where: { id: appt.id },
          data: { reminderSentAt: new Date() },
        });
      }
    }

    // ── Email reminders ──────────────────────────────────────────────────────
    const emailBusinesses = await prisma.business.findMany({
      where: {
        emailNotificationsEnabled: true,
        emailReminderHours: { not: null },
      },
      select: {
        id: true,
        name: true,
        timezone: true,
        emailReminderHours: true,
      },
    });

    for (const biz of emailBusinesses) {
      const hoursAhead = biz.emailReminderHours!;
      const now = new Date();
      const windowCenter = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);
      const windowStart = new Date(windowCenter.getTime() - 15 * 60 * 1000);
      const windowEnd = new Date(windowCenter.getTime() + 15 * 60 * 1000);

      const appointments = await prisma.appointment.findMany({
        where: {
          businessId: biz.id,
          status: { in: ["RESERVED", "DEPOSIT_PAID"] },
          reminderSentAt: null,
          startAt: { gte: windowStart, lte: windowEnd },
        },
        include: {
          client: { select: { fullName: true, email: true } },
          service: { select: { name: true } },
          professional: { select: { name: true } },
        },
      });

      for (const appt of appointments) {
        if (!appt.client.email) continue;

        await sendAppointmentReminder(appt.client.email, {
          clientName: appt.client.fullName,
          professionalName: appt.professional?.name ?? "",
          serviceName: appt.service.name,
          date: formatWaDate(appt.startAt, biz.timezone),
          time: formatWaTime(appt.startAt, biz.timezone),
          businessName: biz.name,
        });

        await prisma.appointment.update({
          where: { id: appt.id },
          data: { reminderSentAt: new Date() },
        });
      }
    }
  } catch (err) {
    console.error("[reminder-job] Error:", err);
  }
}
