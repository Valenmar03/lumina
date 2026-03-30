import { prisma } from "../db/prisma";
import { ProfessionalService } from "./professionals.service";
import { AppointmentService } from "./appointments.service";
import { createMPPreference, getMPPayment } from "./mercadopago.service";
import { sendTemplate, formatWaDate, formatWaTime } from "./whatsapp.service";
import { sendAppointmentConfirmed, sendNewAppointmentOwner } from "./email.service";

function notFound(message: string) {
  const err = new Error(message) as Error & { status?: number };
  err.status = 404;
  return err;
}

const professionalService = new ProfessionalService();
const appointmentService = new AppointmentService();

async function getBusinessBySlug(slug: string) {
  const business = await prisma.business.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      timezone: true,
      mpAccessToken: true,
      waPhoneNumberId: true,
      waAccessToken: true,
      emailNotificationsEnabled: true,
    },
  });
  if (!business) throw notFound("Business not found");
  return business;
}

export async function getPublicBusinessInfo(slug: string) {
  return getBusinessBySlug(slug);
}

export async function getPublicServices(slug: string) {
  const business = await getBusinessBySlug(slug);
  return prisma.service.findMany({
    where: { businessId: business.id, active: true, bookableOnline: true },
    select: {
      id: true,
      name: true,
      durationMin: true,
      basePrice: true,
      requiresDeposit: true,
      depositPercent: true,
      allowClientChooseProfessional: true,
    },
    orderBy: { name: "asc" },
  });
}

export async function getPublicProfessionals(slug: string, serviceId?: string) {
  const business = await getBusinessBySlug(slug);

  if (serviceId) {
    const links = await prisma.professionalService.findMany({
      where: {
        serviceId,
        professional: { businessId: business.id, active: true },
      },
      include: {
        professional: { select: { id: true, name: true, color: true } },
      },
    });
    return links.map((l) => l.professional);
  }

  return prisma.professional.findMany({
    where: { businessId: business.id, active: true },
    select: { id: true, name: true, color: true },
    orderBy: { name: "asc" },
  });
}

export async function getPublicAvailability(
  slug: string,
  professionalId: string,
  date: string,
  serviceId: string
) {
  const business = await getBusinessBySlug(slug);
  const result = await professionalService.getAvailability({
    businessId: business.id,
    professionalId,
    date,
    serviceId,
  });
  const now = new Date();
  result.slots = result.slots.filter((s) => new Date(s.startAt) > now);
  return result;
}

export async function getPublicAggregatedAvailability(
  slug: string,
  date: string,
  serviceId: string
) {
  const business = await getBusinessBySlug(slug);

  const links = await prisma.professionalService.findMany({
    where: {
      serviceId,
      professional: { businessId: business.id, active: true },
    },
    select: { professionalId: true },
  });

  if (links.length === 0) return { slots: [] };

  const results = await Promise.allSettled(
    links.map(({ professionalId }) =>
      professionalService.getAvailability({
        businessId: business.id,
        professionalId,
        date,
        serviceId,
      })
    )
  );

  const slotMap = new Map<string, { startAt: string; endAt: string; label: string }>();
  for (const result of results) {
    if (result.status === "fulfilled") {
      for (const slot of result.value.slots) {
        if (!slotMap.has(slot.startAt)) {
          slotMap.set(slot.startAt, slot);
        }
      }
    }
  }

  const now = new Date();
  const slots = Array.from(slotMap.values())
    .filter((s) => new Date(s.startAt) > now)
    .sort((a, b) => a.startAt.localeCompare(b.startAt));

  return { slots };
}

export async function createPublicAppointment(
  slug: string,
  data: {
    serviceId: string;
    professionalId?: string;
    startAt: string;
    clientFullName: string;
    clientPhone: string;
    clientEmail?: string;
  }
) {
  const business = await getBusinessBySlug(slug);
  const { serviceId, startAt, clientFullName, clientPhone, clientEmail } = data;

  const startDate = new Date(startAt);
  if (startDate <= new Date()) {
    const err = new Error("No se pueden agendar turnos en el pasado") as Error & { status?: number };
    err.status = 400;
    throw err;
  }

  const service = await prisma.service.findFirst({
    where: { id: serviceId, businessId: business.id },
    select: { id: true, name: true, basePrice: true, requiresDeposit: true, depositPercent: true, durationMin: true },
  });

  if (!service) {
    const err = new Error("Servicio no encontrado") as Error & { status?: number };
    err.status = 404;
    throw err;
  }

  // ── Resolve professionalId (auto-assign if not provided) ──────────────────
  let professionalId = data.professionalId;

  if (!professionalId) {
    const endAt = new Date(startDate.getTime() + service.durationMin * 60_000);

    const links = await prisma.professionalService.findMany({
      where: {
        serviceId,
        professional: { businessId: business.id, active: true },
      },
      select: { professionalId: true },
    });

    const allProfessionalIds = links.map((l) => l.professionalId);

    if (allProfessionalIds.length === 0) {
      const err = new Error("No hay profesionales disponibles para este servicio") as Error & { status?: number };
      err.status = 409;
      throw err;
    }

    const pendingPaymentCutoff = new Date(Date.now() - 30 * 60 * 1000);

    const [busyFromAppointments, busyFromUnavailabilities, busyFromPending] = await Promise.all([
      prisma.appointment.findMany({
        where: {
          professionalId: { in: allProfessionalIds },
          status: { notIn: ["CANCELED"] },
          startAt: { lt: endAt },
          endAt: { gt: startDate },
        },
        select: { professionalId: true },
      }),
      prisma.professionalUnavailability.findMany({
        where: {
          professionalId: { in: allProfessionalIds },
          startAt: { lt: endAt },
          endAt: { gt: startDate },
        },
        select: { professionalId: true },
      }),
      prisma.pendingBooking.findMany({
        where: {
          professionalId: { in: allProfessionalIds },
          createdAt: { gte: pendingPaymentCutoff },
          startAt: { lt: endAt },
        },
        select: { professionalId: true },
      }),
    ]);

    const busyIds = new Set([
      ...busyFromAppointments.map((a) => a.professionalId),
      ...busyFromUnavailabilities.map((u) => u.professionalId),
      ...busyFromPending.map((p) => p.professionalId),
    ]);

    const availableIds = allProfessionalIds.filter((id) => !busyIds.has(id));

    if (availableIds.length === 0) {
      const err = new Error("No hay profesionales disponibles en ese horario") as Error & { status?: number };
      err.status = 409;
      throw err;
    }

    professionalId = availableIds[Math.floor(Math.random() * availableIds.length)];
  }

  // ── Client upsert ─────────────────────────────────────────────────────────
  let client = await prisma.client.findFirst({
    where: { businessId: business.id, phone: clientPhone },
  });

  if (!client) {
    client = await prisma.client.create({
      data: {
        businessId: business.id,
        fullName: clientFullName,
        phone: clientPhone,
        email: clientEmail ?? null,
      },
    });
  } else {
    client = await prisma.client.update({
      where: { id: client.id },
      data: {
        fullName: clientFullName,
        email: clientEmail ?? client.email,
      },
    });
  }

  const needsDeposit = !!(business.mpAccessToken && service.requiresDeposit && service.depositPercent);

  if (needsDeposit) {
    const depositAmount = Math.round(Number(service.basePrice) * service.depositPercent! / 100);

    const availability = await professionalService.getAvailability({
      businessId: business.id,
      professionalId,
      date: startAt.slice(0, 10),
      serviceId,
    });
    const slotAvailable = availability.slots.some((s) => s.startAt === startAt || s.startAt.startsWith(startAt));
    if (!slotAvailable) {
      const err = new Error("El horario seleccionado ya no está disponible") as Error & { status?: number };
      err.status = 409;
      throw err;
    }

    const pending = await prisma.pendingBooking.create({
      data: {
        businessId: business.id,
        professionalId,
        clientId: client.id,
        serviceId,
        startAt: new Date(startAt),
        depositAmount,
      },
    });

    const { checkoutUrl } = await createMPPreference({
      accessToken: business.mpAccessToken!,
      appointmentId: pending.id,
      serviceName: service.name,
      depositAmount,
      slug,
    });

    return { pendingBookingId: pending.id, checkoutUrl, depositAmount };
  }

  const { appointment } = await appointmentService.create({
    businessId: business.id,
    professionalId,
    clientId: client.id,
    serviceId,
    startAt,
  });

  const assignedProfessional = await prisma.professional
    .findUnique({ where: { id: professionalId }, select: { id: true, name: true, color: true } });

  const professionalName = assignedProfessional?.name ?? "";
  const dateStr = formatWaDate(new Date(startAt), business.timezone);
  const timeStr = formatWaTime(new Date(startAt), business.timezone);

  // WA al cliente
  if (business.waAccessToken && business.waPhoneNumberId && client.phone) {
    sendTemplate({
      accessToken: business.waAccessToken,
      phoneNumberId: business.waPhoneNumberId,
      to: client.phone,
      templateName: "turno_confirmado",
      variables: [client.fullName, service.name, professionalName, dateStr, timeStr, business.name],
    }).catch(() => {});
  }

  // WA + email al dueño
  prisma.user
    .findFirst({ where: { businessId: business.id, role: "OWNER" }, select: { phone: true, email: true } })
    .then((owner) => {
      if (!owner) return;
      if (owner.phone && business.waAccessToken && business.waPhoneNumberId) {
        sendTemplate({
          accessToken: business.waAccessToken,
          phoneNumberId: business.waPhoneNumberId,
          to: owner.phone,
          templateName: "nuevo_turno_negocio",
          variables: [client!.fullName, service.name, professionalName, dateStr, timeStr],
        });
      }
      if (owner.email && business.emailNotificationsEnabled) {
        sendNewAppointmentOwner(owner.email, {
          clientName: client!.fullName,
          professionalName,
          serviceName: service.name,
          date: dateStr,
          time: timeStr,
          businessName: business.name,
        });
      }
    })
    .catch(() => {});

  // Email al cliente
  if (business.emailNotificationsEnabled && client.email) {
    sendAppointmentConfirmed(client.email, {
      clientName: client.fullName,
      professionalName,
      serviceName: service.name,
      date: dateStr,
      time: timeStr,
      businessName: business.name,
    });
  }

  return { appointment, assignedProfessional };
}

export async function confirmPublicPayment(slug: string, pendingBookingId: string, paymentId: string) {
  const business = await getBusinessBySlug(slug);
  if (!business.mpAccessToken) throw Object.assign(new Error("Pagos no configurados"), { status: 400 });

  const payment = await getMPPayment(business.mpAccessToken, paymentId);
  if (payment.status !== "approved") throw Object.assign(new Error("El pago no fue aprobado"), { status: 400 });
  if (payment.external_reference !== pendingBookingId) throw Object.assign(new Error("Referencia de pago inválida"), { status: 400 });

  const pending = await prisma.pendingBooking.findFirst({
    where: { id: pendingBookingId, businessId: business.id },
  });
  if (!pending) throw Object.assign(new Error("Reserva pendiente no encontrada"), { status: 404 });

  // Create the real appointment now that payment is confirmed
  const { appointment } = await appointmentService.create({
    businessId: business.id,
    professionalId: pending.professionalId,
    clientId: pending.clientId,
    serviceId: pending.serviceId,
    startAt: pending.startAt.toISOString(),
    status: "DEPOSIT_PAID",
  });

  // Store deposit info
  await prisma.appointment.update({
    where: { id: appointment.id },
    data: {
      depositAmount: payment.transaction_amount,
      depositPaidAt: new Date(),
      depositMethod: "MERCADOPAGO",
    },
  });

  // Clean up pending booking
  await prisma.pendingBooking.delete({ where: { id: pendingBookingId } });

  // Notificaciones post-pago
  const [client, service, professional, owner] = await Promise.all([
    prisma.client.findUnique({ where: { id: pending.clientId } }),
    prisma.service.findUnique({ where: { id: pending.serviceId }, select: { name: true } }),
    prisma.professional.findUnique({ where: { id: pending.professionalId }, select: { name: true } }),
    prisma.user.findFirst({ where: { businessId: business.id, role: "OWNER" }, select: { phone: true, email: true } }),
  ]);

  const dateStr = formatWaDate(pending.startAt, business.timezone);
  const timeStr = formatWaTime(pending.startAt, business.timezone);
  const professionalName = professional?.name ?? "";
  const serviceName = service?.name ?? "";

  if (business.waAccessToken && business.waPhoneNumberId) {
    if (client?.phone) {
      sendTemplate({
        accessToken: business.waAccessToken,
        phoneNumberId: business.waPhoneNumberId,
        to: client.phone,
        templateName: "turno_confirmado",
        variables: [client?.fullName ?? "", serviceName, professionalName, dateStr, timeStr, business.name],
      }).catch(() => {});
    }
    if (owner?.phone) {
      sendTemplate({
        accessToken: business.waAccessToken,
        phoneNumberId: business.waPhoneNumberId,
        to: owner.phone,
        templateName: "nuevo_turno_negocio",
        variables: [client?.fullName ?? "", serviceName, professionalName, dateStr, timeStr],
      }).catch(() => {});
    }
  }

  if (business.emailNotificationsEnabled) {
    if (client?.email) {
      sendAppointmentConfirmed(client.email, {
        clientName: client.fullName,
        professionalName,
        serviceName,
        date: dateStr,
        time: timeStr,
        businessName: business.name,
      });
    }
    if (owner?.email) {
      sendNewAppointmentOwner(owner.email, {
        clientName: client?.fullName ?? "",
        professionalName,
        serviceName,
        date: dateStr,
        time: timeStr,
        businessName: business.name,
      });
    }
  }

  return { ok: true, appointmentId: appointment.id };
}
