# WhatsApp Notifications — Design Spec
**Date:** 2026-03-25
**Branch:** feature/mp-setup-guide (se puede separar en feature/whatsapp-notifications)
**Status:** Approved

---

## Contexto

Agregar notificaciones por WhatsApp a la app de turnos. Cada negocio conecta su propia cuenta de WhatsApp Business (Meta Cloud API), con token manual en una primera etapa. OAuth se implementará después del lanzamiento.

---

## Eventos que disparan notificaciones

| Evento | Destinatario | Template |
|--------|-------------|----------|
| Turno creado (admin o online) | Cliente | `turno_confirmado` |
| Turno cancelado | Cliente | `turno_cancelado` |
| Turno modificado/reprogramado | Cliente | `turno_modificado` |
| Recordatorio automático (X horas antes) | Cliente | `turno_recordatorio` |
| Nuevo turno online | Dueño del negocio | `nuevo_turno_negocio` |

**Nota:** El dueño solo recibe notificación para turnos online (`/reservar`). Los que crea él mismo desde la agenda no notifican al dueño.

---

## Arquitectura

Tres componentes independientes:

### 1. WhatsApp Service (`whatsapp.service.ts`)
Módulo stateless que sabe enviar mensajes via Meta Cloud API. No conoce lógica de turnos.

```typescript
sendTemplate(params: {
  accessToken: string;
  phoneNumberId: string;
  to: string;
  templateName: string;
  variables: string[];
}): Promise<void>
```

- Si falta `accessToken` o `phoneNumberId` → retorna silenciosamente (sin error)
- Si falta el teléfono del destinatario → retorna silenciosamente
- Errores de red/API → loguea el error, no lanza excepción (las notificaciones no deben romper el flujo de turnos)
- Endpoint: `POST https://graph.facebook.com/v19.0/{phoneNumberId}/messages`

### 2. Notification Triggers
Hooks en servicios existentes que llaman al WhatsApp Service:

- `appointments.service.ts` → `create()` → `turno_confirmado` al cliente
- `appointments.service.ts` → `changeStatus(CANCELED)` → `turno_cancelado` al cliente
- `appointments.service.ts` → `update()` → `turno_modificado` al cliente
- `public.service.ts` → `createPublicAppointment()` → `turno_confirmado` al cliente
- `public.service.ts` → `confirmPublicPayment()` → `turno_confirmado` al cliente + `nuevo_turno_negocio` al dueño

### 3. Reminder Scheduler
Cron job con `node-cron` corriendo cada 15 minutos dentro del proceso del backend.

**Lógica:**
1. Busca negocios con `waReminderHours` y `waAccessToken` configurados
2. Para cada negocio, busca turnos donde:
   - `status` IN (`RESERVED`, `DEPOSIT_PAID`)
   - `reminderSentAt` IS NULL
   - `startAt` entre `now + waReminderHours - 15min` y `now + waReminderHours + 15min`
3. Envía `turno_recordatorio` al cliente
4. Actualiza `reminderSentAt = now`

La ventana de ±15 minutos compensa la granularidad del cron. El campo `reminderSentAt` persiste en DB, evitando duplicados ante reinicios del backend.

---

## Modelo de datos

### Cambios en `Business`
```prisma
waPhoneNumberId  String?  // ID del número en Meta (ej: "123456789012345")
waAccessToken    String?  // Token permanente de Meta Cloud API (empieza con EAAxxxxxx)
waReminderHours  Int?     // Horas antes del turno para el recordatorio (null = desactivado)
```

### Cambios en `Appointment`
```prisma
reminderSentAt   DateTime?  // Null = recordatorio pendiente; fecha = ya enviado
```

### Cambios en `User`
```prisma
phone  String?  // Número del dueño para recibir notificaciones de nuevos turnos
```

---

## Templates de WhatsApp

Cada negocio debe crear estos 5 templates en su cuenta de Meta Business Manager con exactamente estos nombres. Variables entre `{{n}}`.

### `turno_confirmado`
```
Hola {{1}}, tu turno de {{2}} con {{3}} está confirmado para el {{4}} a las {{5}}. ¡Te esperamos en {{6}}!
```
Variables: nombre cliente, servicio, profesional, fecha (dd/MM/yyyy), hora (HH:mm), nombre negocio

### `turno_recordatorio`
```
Hola {{1}}, te recordamos que tenés turno de {{2}} con {{3}} el {{4}} a las {{5}} en {{6}}. ¡Te esperamos!
```
Variables: nombre cliente, servicio, profesional, fecha, hora, nombre negocio

### `turno_cancelado`
```
Hola {{1}}, tu turno de {{2}} con {{3}} del {{4}} a las {{5}} fue cancelado. Contactanos para reprogramar.
```
Variables: nombre cliente, servicio, profesional, fecha, hora

### `turno_modificado`
```
Hola {{1}}, tu turno fue reprogramado. Nuevo horario: {{2}} con {{3}} el {{4}} a las {{5}} en {{6}}.
```
Variables: nombre cliente, servicio, profesional, fecha, hora, nombre negocio

### `nuevo_turno_negocio`
```
Nuevo turno: {{1}} reservó {{2}} con {{3}} para el {{4}} a las {{5}}.
```
Variables: nombre cliente, servicio, profesional, fecha, hora

---

## Frontend — BusinessSettingsPage

Nueva sección "WhatsApp Business" con:

- **Phone Number ID** — input texto, placeholder `123456789012345`
- **Access Token** — `PasswordInput`, placeholder `EAAxxxxxx...`
- **Recordatorio** — `CustomSelect` con opciones: Desactivado / 1h / 2h / 6h / 12h / 24h / 48h
- **Guía de setup** — pasos numerados + link a `developers.facebook.com`
- **Número del dueño** (`User.phone`) — va en sección de perfil de usuario, no aquí

---

## Validaciones en backend

```typescript
// Nuevos campos en updateBusinessBody (Zod)
waPhoneNumberId: z.string().trim().max(50).optional().nullable(),
waAccessToken:   z.string().trim().max(500).optional().nullable(),
waReminderHours: z.number().int().min(1).max(168).optional().nullable(),

// Nuevo campo en updateUserBody (Zod)
phone: z.string().trim().max(30).optional().nullable(),
```

---

## Lo que NO se implementa ahora (post-lanzamiento)

- OAuth de Meta (cada negocio conecta con un click)
- Historial de notificaciones enviadas
- Reintentos automáticos ante fallos de envío
- Notificaciones por email como fallback
- Webhooks de Meta para confirmación de entrega

---

## Dependencias a instalar

- `node-cron` + `@types/node-cron` en el backend

No se requieren otras dependencias. Meta Cloud API se consume via fetch nativo.
