import { z } from "zod";

// ─── Shared primitives ────────────────────────────────────────────────────────

const uuid = z.string().uuid("ID inválido");
const isoDatetime = z
  .string()
  .refine((v) => !Number.isNaN(Date.parse(v)), { message: "Fecha inválida" });
const hhmm = z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato HH:MM requerido");

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const registerBody = z.object({
  email: z.string().trim().email("Email inválido").max(254),
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .max(128, "Contraseña demasiado larga"),
  businessName: z.string().trim().min(1, "El nombre es requerido").max(100),
  slug: z.string().trim().min(1, "La URL es requerida").max(60),
  timezone: z.string().trim().max(60).optional(),
});

export const loginBody = z.object({
  slug: z.string().trim().min(1).max(60),
  identifier: z.string().trim().min(1, "Ingresá tu email o usuario").max(254),
  password: z.string().min(1, "La contraseña es requerida").max(128),
});

export const forgotPasswordBody = z.object({
  email: z.string().trim().email("Email inválido").max(254),
});

export const resetPasswordBody = z.object({
  token: z.string().min(1).max(256),
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .max(128),
});

export const verifyEmailBody = z.object({
  token: z.string().min(1).max(256),
});

export const changePasswordBody = z.object({
  currentPassword: z.string().min(1, "La contraseña actual es requerida").max(128),
  newPassword: z
    .string()
    .min(8, "La nueva contraseña debe tener al menos 8 caracteres")
    .max(128),
});

export const slugParams = z.object({
  slug: z.string().trim().min(1).max(60),
});

// ─── Business ─────────────────────────────────────────────────────────────────

export const updateBusinessBody = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  slug: z.string().trim().min(1).max(60).optional(),
  timezone: z.string().trim().max(60).optional(),
  mpAccessToken: z.string().trim().max(200).optional().nullable(),
});

// ─── Services ─────────────────────────────────────────────────────────────────

export const createServiceBody = z.object({
  name: z.string().trim().min(1, "El nombre es requerido").max(100),
  durationMin: z
    .number({ error: "durationMin debe ser un número" })
    .int()
    .min(1)
    .max(480, "La duración máxima es 480 minutos"),
  basePrice: z
    .number({ error: "basePrice debe ser un número" })
    .min(0)
    .max(1_000_000)
    .optional()
    .nullable(),
  description: z.string().trim().max(500).optional().nullable(),
  active: z.boolean().optional(),
  requiresDeposit: z.boolean().optional(),
  depositPercent: z.number().int().min(1).max(100).optional().nullable(),
  bookableOnline: z.boolean().optional(),
});

export const updateServiceBody = createServiceBody.partial();

export const serviceIdParams = z.object({
  id: uuid,
});

export const servicesQuery = z.object({
  search: z.string().trim().max(100).optional(),
  activeOnly: z.string().optional(),
});

export const toggleServiceBody = z.object({
  active: z.boolean({ error: "active debe ser boolean" }),
});

// ─── Clients ──────────────────────────────────────────────────────────────────

export const createClientBody = z.object({
  fullName: z.string().trim().min(1, "El nombre es requerido").max(100),
  phone: z
    .string()
    .trim()
    .min(1, "El teléfono es requerido")
    .max(30)
    .regex(/^[\d\s+\-().]+$/, "Teléfono inválido"),
  email: z.preprocess(v => (v === "" ? undefined : v), z.string().trim().email("Email inválido").max(254).optional().nullable()),
  notes: z.preprocess(v => (v === "" ? undefined : v), z.string().trim().max(1000).optional().nullable()),
});

export const updateClientBody = createClientBody.partial();

export const clientIdParams = z.object({
  id: uuid,
});

export const clientsQuery = z.object({
  search: z.string().trim().max(100).optional(),
});

// ─── Professionals ────────────────────────────────────────────────────────────

export const createProfessionalBody = z.object({
  name: z.string().trim().min(1, "El nombre es requerido").max(100),
  color: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, "Color debe ser un hex válido (#rrggbb)")
    .optional()
    .nullable(),
  active: z.boolean().optional(),
});

export const updateProfessionalBody = createProfessionalBody.partial();

export const professionalIdParams = z.object({
  id: uuid,
});

export const replaceScheduleParams = z.object({
  id: uuid,
  dayOfWeek: z.string().regex(/^[0-6]$/, "dayOfWeek debe ser 0-6"),
});

export const replaceScheduleBody = z.object({
  blocks: z
    .array(
      z.object({
        startTime: hhmm,
        endTime: hhmm,
      })
    )
    .max(10, "Máximo 10 bloques por día"),
});

export const replaceProfessionalServicesBody = z.object({
  serviceIds: z.array(uuid).max(50),
});

export const professionalAvailabilityQuery = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha debe ser YYYY-MM-DD"),
  serviceId: uuid,
  stepMin: z
    .string()
    .optional()
    .refine((v) => v === undefined || (/^\d+$/.test(v) && Number(v) > 0 && Number(v) <= 60), {
      message: "stepMin debe ser 1-60",
    }),
});

export const createProfessionalAccountBody = z.object({
  username: z
    .string()
    .trim()
    .min(3, "El usuario debe tener al menos 3 caracteres")
    .max(50)
    .regex(/^[a-zA-Z0-9_.-]+$/, "Usuario solo puede contener letras, números, _, . y -"),
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .max(128),
});

export const professionalUnavailabilityParams = z.object({
  id: uuid,
  unavailabilityId: uuid,
});

export const createUnavailabilityBody = z.object({
  startAt: isoDatetime,
  endAt: isoDatetime,
  reason: z.string().trim().max(200).optional().nullable(),
  cancelConflicting: z.boolean().optional(),
});

// ─── Appointments ─────────────────────────────────────────────────────────────

const APPOINTMENT_STATUSES = [
  "RESERVED",
  "DEPOSIT_PAID",
  "COMPLETED",
  "CANCELED",
  "NO_SHOW",
] as const;

const DEPOSIT_METHODS = ["CASH", "TRANSFER", "MERCADOPAGO", "OTHER"] as const;
const PAYMENT_METHODS = ["CASH", "TRANSFER", "MERCADOPAGO", "OTHER"] as const;

export const createAppointmentBody = z.object({
  professionalId: uuid,
  clientId: uuid,
  serviceId: uuid,
  startAt: isoDatetime,
});

export const appointmentIdParams = z.object({
  id: uuid,
});

export const updateAppointmentBody = z.object({
  professionalId: uuid,
  clientId: uuid,
  serviceId: uuid,
  startAt: isoDatetime,
});

export const changeAppointmentStatusBody = z.object({
  status: z.enum(APPOINTMENT_STATUSES),
  depositAmount: z.number().min(0).max(1_000_000).optional().nullable(),
  depositMethod: z.enum(DEPOSIT_METHODS).optional().nullable(),
  finalPaymentMethod: z.enum(PAYMENT_METHODS).optional().nullable(),
});

export const rescheduleAppointmentBody = z.object({
  startAt: isoDatetime,
});

export const appointmentsQuery = z.object({
  professionalId: uuid.optional(),
  from: isoDatetime.optional(),
  to: isoDatetime.optional(),
  status: z.enum(APPOINTMENT_STATUSES).optional(),
});

// ─── Agenda ───────────────────────────────────────────────────────────────────

export const agendaDailyQuery = z.object({
  professionalId: uuid.optional(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha debe ser YYYY-MM-DD")
    .optional(),
  status: z.enum(APPOINTMENT_STATUSES).optional(),
});

export const agendaWeeklyQuery = z.object({
  professionalId: uuid.optional(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha debe ser YYYY-MM-DD")
    .optional(),
  status: z.enum(APPOINTMENT_STATUSES).optional(),
  weekStart: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "weekStart debe ser YYYY-MM-DD")
    .optional(),
});

export const agendaMonthlyQuery = z.object({
  professionalId: uuid.optional(),
  month: z
    .string()
    .regex(/^\d{4}-\d{2}$/, "month debe ser YYYY-MM")
    .optional(),
  status: z.enum(APPOINTMENT_STATUSES).optional(),
});

// ─── Analytics ────────────────────────────────────────────────────────────────

export const analyticsQuery = z.object({
  period: z.enum(["day", "week", "month", "year"]).optional(),
});

// ─── Public booking ───────────────────────────────────────────────────────────

export const publicAvailabilityQuery = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha debe ser YYYY-MM-DD"),
  serviceId: uuid,
});

export const publicAvailabilityParams = z.object({
  slug: z.string().trim().min(1).max(60),
  professionalId: uuid,
});

export const publicCreateAppointmentBody = z.object({
  serviceId: uuid,
  professionalId: uuid,
  startAt: isoDatetime,
  clientFullName: z.string().trim().min(1, "El nombre es requerido").max(100),
  clientPhone: z
    .string()
    .trim()
    .min(1, "El teléfono es requerido")
    .max(30)
    .regex(/^[\d\s+\-().]+$/, "Teléfono inválido"),
  clientEmail: z.preprocess(v => (v === "" ? undefined : v), z.string().trim().email("Email inválido").max(254).optional().nullable()),
});

export const confirmPaymentBody = z.object({
  paymentId: z.string().min(1).max(100),
});
