import { prisma } from "../db/prisma";
import { ProfessionalService } from "./professionals.service";
import { AppointmentService } from "./appointments.service";
import { createMPPreference, getMPPayment } from "./mercadopago.service";

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
    select: { id: true, name: true, slug: true, mpAccessToken: true },
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
    where: { businessId: business.id, active: true },
    select: {
      id: true,
      name: true,
      durationMin: true,
      basePrice: true,
      requiresDeposit: true,
      depositPercent: true,
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

export async function createPublicAppointment(
  slug: string,
  data: {
    serviceId: string;
    professionalId: string;
    startAt: string;
    clientFullName: string;
    clientPhone: string;
    clientEmail?: string;
  }
) {
  const business = await getBusinessBySlug(slug);
  const { serviceId, professionalId, startAt, clientFullName, clientPhone, clientEmail } = data;

  const startDate = new Date(startAt);
  if (startDate <= new Date()) {
    const err = new Error("No se pueden agendar turnos en el pasado") as Error & { status?: number };
    err.status = 400;
    throw err;
  }

  const service = await prisma.service.findFirst({
    where: { id: serviceId, businessId: business.id },
    select: { id: true, name: true, basePrice: true, requiresDeposit: true, depositPercent: true },
  });

  if (!service) {
    const err = new Error("Servicio no encontrado") as Error & { status?: number };
    err.status = 404;
    throw err;
  }

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

  const { appointment } = await appointmentService.create({
    businessId: business.id,
    professionalId,
    clientId: client.id,
    serviceId,
    startAt,
  });

  if (business.mpAccessToken && service.requiresDeposit && service.depositPercent) {
    const depositAmount = Math.round(Number(service.basePrice) * service.depositPercent / 100);
    const { checkoutUrl } = await createMPPreference({
      accessToken: business.mpAccessToken,
      appointmentId: appointment.id,
      serviceName: service.name,
      depositAmount,
      slug,
    });
    return { appointment, checkoutUrl, depositAmount };
  }

  return { appointment };
}

export async function confirmPublicPayment(slug: string, appointmentId: string, paymentId: string) {
  const business = await getBusinessBySlug(slug);
  if (!business.mpAccessToken) throw Object.assign(new Error("Pagos no configurados"), { status: 400 });
  const payment = await getMPPayment(business.mpAccessToken, paymentId);
  if (payment.status !== "approved") throw Object.assign(new Error("El pago no fue aprobado"), { status: 400 });
  if (payment.external_reference !== appointmentId) throw Object.assign(new Error("Referencia de pago inválida"), { status: 400 });
  await prisma.appointment.update({
    where: { id: appointmentId },
    data: { status: "DEPOSIT_PAID", depositAmount: payment.transaction_amount, depositPaidAt: new Date(), depositMethod: "MERCADOPAGO" },
  });
  return { ok: true };
}
