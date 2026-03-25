# WhatsApp Notifications — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Agregar notificaciones por WhatsApp a cada negocio usando Meta Cloud API con token manual, incluyendo confirmación de turno, recordatorio configurable, cancelación, modificación y aviso al dueño por turnos online.

**Architecture:** Cada negocio configura su propio `waPhoneNumberId` y `waAccessToken` de Meta en Configuración. Un servicio `whatsapp.service.ts` stateless envía templates. Los triggers se enganchan en los servicios existentes. Un cron cada 15 minutos despacha recordatorios.

**Tech Stack:** node-cron, Meta Cloud API (fetch nativo), Prisma, Zod, React + TailwindCSS

---

## Mapa de archivos

| Archivo | Acción | Qué hace |
|---------|--------|----------|
| `backend/prisma/schema.prisma` | Modificar | Nuevos campos en Business, Appointment, User |
| `backend/src/services/whatsapp.service.ts` | Crear | Envío de templates via Meta Cloud API |
| `backend/src/validators/index.ts` | Modificar | Zod schemas para nuevos campos |
| `backend/src/services/business.service.ts` | Modificar | Manejo de nuevos campos WA |
| `backend/src/services/appointments.service.ts` | Modificar | Triggers: confirmado, cancelado, modificado |
| `backend/src/services/public.service.ts` | Modificar | Triggers: confirmado online, nuevo turno al dueño |
| `backend/src/jobs/reminder.job.ts` | Crear | Cron job de recordatorios |
| `backend/src/server.ts` | Modificar | Inicializar cron al arrancar |
| `backend/prisma/seed.ts` | Modificar | Agregar phone al user admin |
| `frontend/src/types/entities.ts` | Modificar | Tipos Business y User con campos WA |
| `frontend/src/pages/BusinessSettingsPage.tsx` | Modificar | Sección WhatsApp + campo phone del dueño |

---

## Task 1: Prisma schema — nuevos campos

**Files:**
- Modify: `backend/prisma/schema.prisma`

- [ ] **Step 1: Agregar campos a Business**

En `schema.prisma`, dentro del model `Business`, después de `mpAccessToken`:

```prisma
waPhoneNumberId  String?
waAccessToken    String?
waReminderHours  Int?
```

- [ ] **Step 2: Agregar campo a Appointment**

En `schema.prisma`, dentro del model `Appointment`, después de `notes`:

```prisma
reminderSentAt   DateTime?
```

- [ ] **Step 3: Agregar campo a User**

En `schema.prisma`, dentro del model `User`, después de `emailVerified`:

```prisma
phone            String?
```

- [ ] **Step 4: Correr migración**

```bash
cd backend
npx prisma migrate dev --name add_whatsapp_fields
```

Expected: migración aplicada sin errores, `prisma generate` corre automáticamente.

- [ ] **Step 5: Verificar tipos generados**

```bash
cd backend
npx tsc --noEmit
```

Expected: sin errores de TypeScript.

- [ ] **Step 6: Commit**

```bash
git add backend/prisma/schema.prisma backend/prisma/migrations
git commit -m "feat: add whatsapp and phone fields to schema"
```

---

## Task 2: WhatsApp service

**Files:**
- Create: `backend/src/services/whatsapp.service.ts`

- [ ] **Step 1: Crear el archivo**

```typescript
// backend/src/services/whatsapp.service.ts

const META_API_URL = "https://graph.facebook.com/v19.0";

export async function sendTemplate(params: {
  accessToken: string;
  phoneNumberId: string;
  to: string;
  templateName: string;
  variables: string[];
}): Promise<void> {
  const { accessToken, phoneNumberId, to, templateName, variables } = params;

  if (!accessToken || !phoneNumberId || !to) return;

  // Normalizar número: eliminar espacios, guiones, paréntesis
  const normalizedTo = to.replace(/[\s\-().+]/g, "");
  if (!normalizedTo || normalizedTo.length < 8) return;

  const body = {
    messaging_product: "whatsapp",
    to: normalizedTo,
    type: "template",
    template: {
      name: templateName,
      language: { code: "es_AR" },
      components: [
        {
          type: "body",
          parameters: variables.map((v) => ({ type: "text", text: v })),
        },
      ],
    },
  };

  try {
    const res = await fetch(`${META_API_URL}/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error(`[whatsapp] Error sending template "${templateName}":`, err);
    }
  } catch (err) {
    console.error(`[whatsapp] Network error sending template "${templateName}":`, err);
  }
}

export function formatWaDate(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat("es-AR", {
    timeZone: timezone,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export function formatWaTime(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat("es-AR", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}
```

- [ ] **Step 2: Verificar tipos**

```bash
cd backend && npx tsc --noEmit
```

Expected: sin errores.

- [ ] **Step 3: Commit**

```bash
git add backend/src/services/whatsapp.service.ts
git commit -m "feat: add whatsapp service for Meta Cloud API"
```

---

## Task 3: Validators + business service

**Files:**
- Modify: `backend/src/validators/index.ts`
- Modify: `backend/src/services/business.service.ts`

- [ ] **Step 1: Agregar campos WA a updateBusinessBody**

En `backend/src/validators/index.ts`, reemplazar el bloque `updateBusinessBody`:

```typescript
export const updateBusinessBody = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  slug: z.string().trim().min(1).max(60).optional(),
  timezone: z.string().trim().max(60).optional(),
  mpAccessToken: z.string().trim().max(200).optional().nullable(),
  waPhoneNumberId: z.string().trim().max(50).optional().nullable(),
  waAccessToken: z.string().trim().max(500).optional().nullable(),
  waReminderHours: z.number().int().min(1).max(168).optional().nullable(),
});
```

- [ ] **Step 2: Agregar campo phone a updateUserBody**

En `backend/src/validators/index.ts`, agregar después de `changePasswordBody`:

```typescript
export const updateUserBody = z.object({
  phone: z.string().trim().max(30).optional().nullable(),
});
```

- [ ] **Step 3: Actualizar business.service.ts**

Reemplazar el contenido de `backend/src/services/business.service.ts`:

```typescript
import { prisma } from "../db/prisma";
import { normalizeSlug } from "./auth.service";

export const businessService = {
  async getBusiness(businessId: string) {
    const business = await prisma.business.findUniqueOrThrow({
      where: { id: businessId },
    });
    return business;
  },

  async updateBusiness(
    businessId: string,
    data: {
      name?: string;
      slug?: string;
      timezone?: string;
      mpAccessToken?: string | null;
      waPhoneNumberId?: string | null;
      waAccessToken?: string | null;
      waReminderHours?: number | null;
    }
  ) {
    const update: typeof data = {};

    if (data.name !== undefined) {
      const trimmed = data.name.trim();
      if (!trimmed) throw Object.assign(new Error("El nombre no puede estar vacío"), { status: 400 });
      update.name = trimmed;
    }

    if (data.slug !== undefined) {
      const normalized = normalizeSlug(data.slug);
      if (!normalized) throw Object.assign(new Error("El slug no es válido"), { status: 400 });

      const existing = await prisma.business.findFirst({
        where: { slug: normalized, NOT: { id: businessId } },
      });
      if (existing) throw Object.assign(new Error("Ese slug ya está en uso"), { status: 409 });

      update.slug = normalized;
    }

    if (data.timezone !== undefined) update.timezone = data.timezone;
    if (data.mpAccessToken !== undefined) update.mpAccessToken = data.mpAccessToken ?? null;
    if (data.waPhoneNumberId !== undefined) update.waPhoneNumberId = data.waPhoneNumberId ?? null;
    if (data.waAccessToken !== undefined) update.waAccessToken = data.waAccessToken ?? null;
    if (data.waReminderHours !== undefined) update.waReminderHours = data.waReminderHours ?? null;

    return prisma.business.update({ where: { id: businessId }, data: update });
  },
};
```

- [ ] **Step 4: Agregar endpoint PATCH /user en auth routes**

En `backend/src/routes/auth.routes.ts`, agregar al final del router:

```typescript
import { updateUserHandler } from "../controllers/auth.controller";
import { updateUserBody } from "../validators";

// Al final, antes de export default router:
router.patch("/me", validate(updateUserBody), updateUserHandler);
```

- [ ] **Step 5: Agregar updateUserHandler en auth controller**

En `backend/src/controllers/auth.controller.ts`, agregar:

```typescript
export async function updateUserHandler(req: Request, res: Response) {
  try {
    const { id: userId } = req.user!;
    const { phone } = req.body;

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { phone: phone ?? null },
      select: { id: true, username: true, email: true, role: true, phone: true, emailVerified: true },
    });

    return res.json({ user: updated });
  } catch (err: any) {
    return res.status(err?.status ?? 500).json({ error: err?.message ?? "Server error" });
  }
}
```

Agregar también el import de `prisma` si no está:
```typescript
import { prisma } from "../db/prisma";
```

- [ ] **Step 6: Verificar tipos**

```bash
cd backend && npx tsc --noEmit
```

Expected: sin errores.

- [ ] **Step 7: Commit**

```bash
git add backend/src/validators/index.ts backend/src/services/business.service.ts backend/src/routes/auth.routes.ts backend/src/controllers/auth.controller.ts
git commit -m "feat: add WA config fields to business and phone to user"
```

---

## Task 4: Notification triggers en appointments.service.ts

**Files:**
- Modify: `backend/src/services/appointments.service.ts`

- [ ] **Step 1: Agregar import del WA service al top del archivo**

```typescript
import { sendTemplate, formatWaDate, formatWaTime } from "./whatsapp.service";
```

- [ ] **Step 2: Agregar helper getBusinessWaConfig al archivo**

Después de la función `checkUnavailabilityBlock`, agregar:

```typescript
async function getBusinessWaConfig(businessId: string) {
  return prisma.business.findUnique({
    where: { id: businessId },
    select: { waPhoneNumberId: true, waAccessToken: true, name: true, timezone: true },
  });
}
```

- [ ] **Step 3: Agregar notificación en create()**

Al final de `create()`, antes del `return { appointment, warning }`, agregar:

```typescript
// Notificación WA: turno confirmado
getBusinessWaConfig(businessId).then((biz) => {
  if (!biz?.waAccessToken || !biz?.waPhoneNumberId || !client.phone) return;
  sendTemplate({
    accessToken: biz.waAccessToken,
    phoneNumberId: biz.waPhoneNumberId,
    to: client.phone,
    templateName: "turno_confirmado",
    variables: [
      client.fullName,
      service.name,
      professional.name,
      formatWaDate(appointment.startAt, biz.timezone),
      formatWaTime(appointment.startAt, biz.timezone),
      biz.name,
    ],
  });
}).catch(() => {});
```

- [ ] **Step 4: Agregar notificación en changeStatus() para CANCELED**

En `changeStatus()`, localizar la rama final `return prisma.appointment.update({ where: { id: appointmentId }, data: { status } })` (la rama catch-all). Reemplazarla por:

```typescript
const updated = await prisma.appointment.update({ where: { id: appointmentId }, data: { status } });

if (status === "CANCELED") {
  // Notificación WA: turno cancelado
  Promise.all([
    prisma.client.findUnique({ where: { id: appointment.clientId } }),
    prisma.service.findUnique({ where: { id: appointment.serviceId }, select: { name: true } }),
    prisma.professional.findUnique({ where: { id: appointment.professionalId }, select: { name: true } }),
    getBusinessWaConfig(businessId),
  ]).then(([client, service, professional, biz]) => {
    if (!biz?.waAccessToken || !biz?.waPhoneNumberId || !client?.phone) return;
    sendTemplate({
      accessToken: biz.waAccessToken,
      phoneNumberId: biz.waPhoneNumberId,
      to: client.phone,
      templateName: "turno_cancelado",
      variables: [
        client.fullName,
        service?.name ?? "",
        professional?.name ?? "",
        formatWaDate(appointment.startAt, biz.timezone),
        formatWaTime(appointment.startAt, biz.timezone),
      ],
    });
  }).catch(() => {});
}

return updated;
```

- [ ] **Step 5: Agregar notificación en update()**

Al final de `update()`, antes del `return { appointment: { ...updated, isPendingResolution... } }`, agregar:

```typescript
// Notificación WA: turno modificado
getBusinessWaConfig(businessId).then((biz) => {
  if (!biz?.waAccessToken || !biz?.waPhoneNumberId || !updated.client?.phone) return;
  sendTemplate({
    accessToken: biz.waAccessToken,
    phoneNumberId: biz.waPhoneNumberId,
    to: updated.client.phone,
    templateName: "turno_modificado",
    variables: [
      updated.client.fullName,
      updated.service.name,
      updated.professional?.name ?? "",
      formatWaDate(updated.startAt, biz.timezone),
      formatWaTime(updated.startAt, biz.timezone),
      biz.name,
    ],
  });
}).catch(() => {});
```

- [ ] **Step 6: Verificar tipos**

```bash
cd backend && npx tsc --noEmit
```

Expected: sin errores.

- [ ] **Step 7: Commit**

```bash
git add backend/src/services/appointments.service.ts
git commit -m "feat: add WA notification triggers to appointment service"
```

---

## Task 5: Notification triggers en public.service.ts

**Files:**
- Modify: `backend/src/services/public.service.ts`

- [ ] **Step 1: Agregar import del WA service**

```typescript
import { sendTemplate, formatWaDate, formatWaTime } from "./whatsapp.service";
```

- [ ] **Step 2: Extender getBusinessBySlug para incluir campos WA**

Reemplazar la función `getBusinessBySlug`:

```typescript
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
    },
  });
  if (!business) throw notFound("Business not found");
  return business;
}
```

- [ ] **Step 3: Agregar notificación en createPublicAppointment() (rama sin depósito)**

Al final de `createPublicAppointment()`, reemplazar `return { appointment }` por:

```typescript
// Notificación WA: turno confirmado (sin depósito)
if (business.waAccessToken && business.waPhoneNumberId && client.phone) {
  sendTemplate({
    accessToken: business.waAccessToken,
    phoneNumberId: business.waPhoneNumberId,
    to: client.phone,
    templateName: "turno_confirmado",
    variables: [
      client.fullName,
      service.name,
      // El appointment.professional no está cargado aquí; buscar nombre
      appointment.professionalId, // se sobreescribe abajo
      formatWaDate(new Date(startAt), business.timezone),
      formatWaTime(new Date(startAt), business.timezone),
      business.name,
    ],
  }).catch(() => {});
}

return { appointment };
```

Espera — el nombre del profesional no está disponible directamente. Cargarlo antes del return:

```typescript
const professionalName = await prisma.professional
  .findUnique({ where: { id: professionalId }, select: { name: true } })
  .then((p) => p?.name ?? "");

// Notificación WA: turno confirmado (sin depósito)
if (business.waAccessToken && business.waPhoneNumberId && client.phone) {
  sendTemplate({
    accessToken: business.waAccessToken,
    phoneNumberId: business.waPhoneNumberId,
    to: client.phone,
    templateName: "turno_confirmado",
    variables: [
      client.fullName,
      service.name,
      professionalName,
      formatWaDate(new Date(startAt), business.timezone),
      formatWaTime(new Date(startAt), business.timezone),
      business.name,
    ],
  }).catch(() => {});
}

return { appointment };
```

- [ ] **Step 4: Agregar notificaciones en confirmPublicPayment()**

Al final de `confirmPublicPayment()`, antes del `return { ok: true, appointmentId: appointment.id }`, agregar:

```typescript
// Notificaciones WA post-pago
if (business.waAccessToken && business.waPhoneNumberId) {
  const [client, service, professional, owner] = await Promise.all([
    prisma.client.findUnique({ where: { id: pending.clientId } }),
    prisma.service.findUnique({ where: { id: pending.serviceId }, select: { name: true } }),
    prisma.professional.findUnique({ where: { id: pending.professionalId }, select: { name: true } }),
    prisma.user.findFirst({ where: { businessId: business.id, role: "OWNER" }, select: { phone: true } }),
  ]);

  const startDate = pending.startAt;
  const dateStr = formatWaDate(startDate, business.timezone);
  const timeStr = formatWaTime(startDate, business.timezone);

  // Al cliente
  if (client?.phone) {
    sendTemplate({
      accessToken: business.waAccessToken,
      phoneNumberId: business.waPhoneNumberId,
      to: client.phone,
      templateName: "turno_confirmado",
      variables: [
        client.fullName,
        service?.name ?? "",
        professional?.name ?? "",
        dateStr,
        timeStr,
        business.name,
      ],
    }).catch(() => {});
  }

  // Al dueño
  if (owner?.phone) {
    sendTemplate({
      accessToken: business.waAccessToken,
      phoneNumberId: business.waPhoneNumberId,
      to: owner.phone,
      templateName: "nuevo_turno_negocio",
      variables: [
        client?.fullName ?? "",
        service?.name ?? "",
        professional?.name ?? "",
        dateStr,
        timeStr,
      ],
    }).catch(() => {});
  }
}
```

También agregar notificación al dueño en la rama sin depósito de `createPublicAppointment()`:

```typescript
// Notificación al dueño: nuevo turno online
prisma.user
  .findFirst({ where: { businessId: business.id, role: "OWNER" }, select: { phone: true } })
  .then((owner) => {
    if (!owner?.phone || !business.waAccessToken || !business.waPhoneNumberId) return;
    sendTemplate({
      accessToken: business.waAccessToken!,
      phoneNumberId: business.waPhoneNumberId!,
      to: owner.phone,
      templateName: "nuevo_turno_negocio",
      variables: [
        client.fullName,
        service.name,
        professionalName,
        formatWaDate(new Date(startAt), business.timezone),
        formatWaTime(new Date(startAt), business.timezone),
      ],
    });
  })
  .catch(() => {});
```

- [ ] **Step 5: Verificar tipos**

```bash
cd backend && npx tsc --noEmit
```

Expected: sin errores.

- [ ] **Step 6: Commit**

```bash
git add backend/src/services/public.service.ts
git commit -m "feat: add WA notification triggers to public service"
```

---

## Task 6: Reminder scheduler

**Files:**
- Create: `backend/src/jobs/reminder.job.ts`
- Modify: `backend/src/server.ts`

- [ ] **Step 1: Instalar node-cron**

```bash
cd backend && npm install node-cron && npm install --save-dev @types/node-cron
```

Expected: `node-cron` en `dependencies`, `@types/node-cron` en `devDependencies`.

- [ ] **Step 2: Crear el directorio jobs**

```bash
mkdir backend/src/jobs
```

- [ ] **Step 3: Crear reminder.job.ts**

```typescript
// backend/src/jobs/reminder.job.ts
import { prisma } from "../db/prisma";
import { sendTemplate, formatWaDate, formatWaTime } from "../services/whatsapp.service";

export async function runReminderJob(): Promise<void> {
  try {
    // Negocios con WA configurado y recordatorio activo
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
  } catch (err) {
    console.error("[reminder-job] Error:", err);
  }
}
```

- [ ] **Step 4: Registrar el cron en server.ts**

Reemplazar el contenido de `backend/src/server.ts`:

```typescript
import app from "./app";
import cron from "node-cron";
import { runReminderJob } from "./jobs/reminder.job";

const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, () => {
  console.log(`✅ Lumina API running on http://localhost:${PORT}`);
});

// Recordatorios: cada 15 minutos
cron.schedule("*/15 * * * *", () => {
  runReminderJob();
});
```

- [ ] **Step 5: Verificar tipos**

```bash
cd backend && npx tsc --noEmit
```

Expected: sin errores.

- [ ] **Step 6: Commit**

```bash
git add backend/src/jobs/reminder.job.ts backend/src/server.ts backend/package.json backend/package-lock.json
git commit -m "feat: add WA reminder cron job every 15 minutes"
```

---

## Task 7: Frontend — tipos y sección WhatsApp en Configuración

**Files:**
- Modify: `frontend/src/types/entities.ts`
- Modify: `frontend/src/pages/BusinessSettingsPage.tsx`

- [ ] **Step 1: Actualizar tipo Business en entities.ts**

En `frontend/src/types/entities.ts`, buscar la definición del tipo `Business` y agregar:

```typescript
waPhoneNumberId?: string | null;
waAccessToken?: string | null;
waReminderHours?: number | null;
```

- [ ] **Step 2: Actualizar tipo User en entities.ts**

Buscar la definición del tipo `User` (o donde se tipea el usuario del contexto de auth) y agregar `phone?: string | null`.

Si no hay un tipo `User` explícito en entities, buscarlo en `useAuth.ts` o `AuthContext` y agregar el campo ahí.

- [ ] **Step 3: Agregar sección WhatsApp en BusinessSettingsPage.tsx**

Agregar los imports necesarios:

```typescript
import { MessageCircle } from "lucide-react";
```

Agregar un componente `WhatsAppSection` al final del archivo, antes del export:

```tsx
const REMINDER_OPTIONS = [
  { value: "", label: "Desactivado" },
  { value: "1", label: "1 hora antes" },
  { value: "2", label: "2 horas antes" },
  { value: "6", label: "6 horas antes" },
  { value: "12", label: "12 horas antes" },
  { value: "24", label: "24 horas antes" },
  { value: "48", label: "48 horas antes" },
];

function WhatsAppSection({
  currentPhoneNumberId,
  currentAccessToken,
  currentReminderHours,
  onSave,
}: {
  currentPhoneNumberId: string | null;
  currentAccessToken: string | null;
  currentReminderHours: number | null;
  onSave: (data: { waPhoneNumberId: string | null; waAccessToken: string | null; waReminderHours: number | null }) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [phoneNumberId, setPhoneNumberId] = useState(currentPhoneNumberId ?? "");
  const [accessToken, setAccessToken] = useState(currentAccessToken ?? "");
  const [reminderHours, setReminderHours] = useState(currentReminderHours ? String(currentReminderHours) : "");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await onSave({
        waPhoneNumberId: phoneNumberId.trim() || null,
        waAccessToken: accessToken.trim() || null,
        waReminderHours: reminderHours ? Number(reminderHours) : null,
      });
      setEditing(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError("No se pudo guardar la configuración.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setPhoneNumberId(currentPhoneNumberId ?? "");
    setAccessToken(currentAccessToken ?? "");
    setReminderHours(currentReminderHours ? String(currentReminderHours) : "");
    setEditing(false);
    setError(null);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="flex items-center gap-2.5 px-6 py-4 border-b border-slate-100">
        <MessageCircle className="w-4 h-4 text-slate-400" />
        <h2 className="text-sm font-semibold text-slate-700">WhatsApp Business</h2>
        {(currentPhoneNumberId && currentAccessToken) && (
          <span className="ml-auto text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Conectado</span>
        )}
      </div>
      <div className="px-6 py-4 space-y-4">
        <p className="text-xs text-slate-500">
          Conectá tu cuenta de WhatsApp Business para enviar notificaciones automáticas a tus clientes.
        </p>

        {/* Guía de setup */}
        <div className="rounded-lg border border-teal-100 bg-teal-50 px-4 py-3 space-y-2">
          <div className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-teal-600 shrink-0" />
            <p className="text-xs font-medium text-teal-700">¿Cómo obtener las credenciales?</p>
          </div>
          <ol className="text-xs text-teal-700 space-y-1 pl-5 list-decimal">
            <li>Creá una app en <strong>Meta for Developers</strong> del tipo "Business"</li>
            <li>Agregá el producto <strong>WhatsApp</strong> a tu app</li>
            <li>En <strong>WhatsApp → Configuración de la API</strong>, copiá el <strong>Phone Number ID</strong> y el <strong>Token de acceso permanente</strong></li>
            <li>Creá los templates: <code className="bg-teal-100 px-1 rounded">turno_confirmado</code>, <code className="bg-teal-100 px-1 rounded">turno_recordatorio</code>, <code className="bg-teal-100 px-1 rounded">turno_cancelado</code>, <code className="bg-teal-100 px-1 rounded">turno_modificado</code>, <code className="bg-teal-100 px-1 rounded">nuevo_turno_negocio</code></li>
          </ol>
          <a
            href="https://developers.facebook.com/apps"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-teal-700 font-medium hover:text-teal-900 underline underline-offset-2 mt-1"
          >
            <ExternalLink className="w-3 h-3" />
            Ir al panel de Meta for Developers
          </a>
        </div>

        {/* Campos */}
        {editing ? (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Phone Number ID</label>
              <input
                type="text"
                value={phoneNumberId}
                onChange={(e) => setPhoneNumberId(e.target.value)}
                placeholder="123456789012345"
                className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Access Token</label>
              <PasswordInput
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                placeholder="EAAxxxxxx..."
                className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Recordatorio automático</label>
              <CustomSelect
                placeholder="Desactivado"
                value={reminderHours}
                onChange={(v) => setReminderHours(v)}
                options={REMINDER_OPTIONS}
              />
            </div>
            {error && (
              <p className="flex items-center gap-1 text-xs text-red-600">
                <AlertCircle className="w-3.5 h-3.5" />
                {error}
              </p>
            )}
            <div className="flex gap-2 justify-end pt-1">
              <button
                type="button"
                onClick={handleCancel}
                disabled={saving}
                className="px-3 py-1.5 rounded-lg text-sm text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="px-3 py-1.5 rounded-lg text-sm font-medium bg-teal-600 text-white hover:bg-teal-700 transition-colors"
              >
                {saving ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">Phone Number ID</p>
                <p className="text-sm text-slate-800 font-medium">
                  {currentPhoneNumberId ? "••••••••••••" : <span className="text-slate-400 italic">No configurado</span>}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="p-1.5 rounded-md text-slate-300 hover:bg-slate-100 hover:text-slate-500 transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">Recordatorio</p>
              <p className="text-sm text-slate-800">
                {currentReminderHours
                  ? REMINDER_OPTIONS.find((o) => o.value === String(currentReminderHours))?.label ?? `${currentReminderHours}h antes`
                  : <span className="text-slate-400 italic">Desactivado</span>}
              </p>
            </div>
          </div>
        )}

        {success && (
          <p className="flex items-center gap-1.5 text-xs text-emerald-600">
            <Check className="w-3.5 h-3.5 shrink-0" />
            Configuración guardada correctamente
          </p>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Usar WhatsAppSection en el JSX principal**

En el JSX donde se renderizan las secciones (después de `MercadoPagoSection`), agregar:

```tsx
<WhatsAppSection
  currentPhoneNumberId={business.waPhoneNumberId ?? null}
  currentAccessToken={business.waAccessToken ?? null}
  currentReminderHours={business.waReminderHours ?? null}
  onSave={(data) => update(data).then(() => {})}
/>
```

- [ ] **Step 5: Verificar build frontend**

```bash
cd frontend && npm run build
```

Expected: sin errores de TypeScript ni de build.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/types/entities.ts frontend/src/pages/BusinessSettingsPage.tsx
git commit -m "feat: add WhatsApp Business config section to settings page"
```

---

## Task 8: Frontend — campo phone del dueño en Configuración

**Files:**
- Modify: `frontend/src/pages/BusinessSettingsPage.tsx`

- [ ] **Step 1: Agregar sección "Tu número de WhatsApp" al perfil del dueño**

Identificar la sección de datos del usuario en `BusinessSettingsPage.tsx` (o crear una si no existe). Agregar un campo para el teléfono del usuario (`User.phone`).

Si no existe una sección de perfil, agregar este componente al archivo:

```tsx
function OwnerPhoneSection({
  currentPhone,
  onSave,
}: {
  currentPhone: string | null;
  onSave: (phone: string | null) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(currentPhone ?? "");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(draft.trim() || null);
      setEditing(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="flex items-center gap-2.5 px-6 py-4 border-b border-slate-100">
        <UserCircle className="w-4 h-4 text-slate-400" />
        <h2 className="text-sm font-semibold text-slate-700">Tu número de WhatsApp</h2>
      </div>
      <div className="px-6 py-4">
        <p className="text-xs text-slate-500 mb-3">
          Usamos este número para avisarte cuando entra un turno nuevo desde la página de reservas.
        </p>
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            {editing ? (
              <input
                autoFocus
                type="tel"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="+54 11 1234-5678"
                className="w-full max-w-sm rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-teal-500"
              />
            ) : (
              <p className="text-sm font-medium text-slate-800">
                {currentPhone || <span className="text-slate-400 italic">No configurado</span>}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {editing ? (
              <>
                <button type="button" onClick={() => { setDraft(currentPhone ?? ""); setEditing(false); }} disabled={saving} className="p-1.5 rounded-md text-slate-400 hover:bg-slate-100 transition-colors">
                  <X className="w-4 h-4" />
                </button>
                <button type="button" onClick={handleSave} disabled={saving} className="p-1.5 rounded-md text-teal-600 hover:bg-teal-50 transition-colors">
                  {saving ? <div className="w-4 h-4 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" /> : <Check className="w-4 h-4" />}
                </button>
              </>
            ) : (
              <button type="button" onClick={() => setEditing(true)} className="p-1.5 rounded-md text-slate-300 hover:bg-slate-100 hover:text-slate-500 transition-colors">
                <Pencil className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
        {success && (
          <p className="flex items-center gap-1.5 text-xs text-emerald-600 mt-2">
            <Check className="w-3.5 h-3.5 shrink-0" />
            Número guardado correctamente
          </p>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Agregar el endpoint PATCH /auth/me al API service**

En `frontend/src/services/auth.api.ts` (o donde estén las llamadas de auth), agregar:

```typescript
export function updateUser(data: { phone?: string | null }) {
  return apiFetch("/auth/me", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}
```

- [ ] **Step 3: Cargar el usuario en BusinessSettingsPage y usar OwnerPhoneSection**

Obtener el usuario con su `phone` del hook `useAuth()` o haciendo un fetch a `/auth/me`. Renderizar `OwnerPhoneSection` después de `WhatsAppSection`:

```tsx
<OwnerPhoneSection
  currentPhone={user?.phone ?? null}
  onSave={async (phone) => {
    await updateUser({ phone });
    // Refrescar el usuario en el contexto de auth si es necesario
  }}
/>
```

- [ ] **Step 4: Build final**

```bash
cd frontend && npm run build
```

Expected: sin errores.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/BusinessSettingsPage.tsx frontend/src/services/auth.api.ts
git commit -m "feat: add owner phone field for WA notifications"
```

---

## Task 9: Seed y verificación final

**Files:**
- Modify: `backend/prisma/seed.ts`

- [ ] **Step 1: Actualizar el seed con phone para el admin**

En `backend/prisma/seed.ts`, agregar `phone` al user admin:

```typescript
await prisma.user.create({
  data: {
    businessId: business.id,
    username: "admin",
    passwordHash,
    role: "OWNER",
    emailVerified: true,
    phone: "+54 11 3885-3213",
  },
});
```

- [ ] **Step 2: Reset y re-seed**

```bash
cd backend
npx prisma migrate reset --force
npm run seed
```

Expected: migración aplicada y seed ejecutado sin errores.

- [ ] **Step 3: TypeScript check completo**

```bash
cd backend && npx tsc --noEmit
cd ../frontend && npx tsc --noEmit
```

Expected: sin errores en ninguno de los dos.

- [ ] **Step 4: Commit final**

```bash
git add backend/prisma/seed.ts
git commit -m "chore: update seed with owner phone for WA notifications"
```
