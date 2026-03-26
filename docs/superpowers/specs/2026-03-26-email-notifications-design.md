# Spec: Email Notifications for Appointments

**Date:** 2026-03-26
**Status:** Approved

---

## Overview

Add email notifications for appointment events to Caleio. Emails are sent from `noreply@caleio.app` via Resend (already integrated). Each business has a single on/off switch for email notifications. When WhatsApp is added later, toggling it off will disable email automatically.

---

## Data Model

Two new fields on `Business`:

```prisma
emailNotificationsEnabled Boolean @default(true)
emailReminderHours        Int?    @default(24)
```

- `emailNotificationsEnabled` — master switch. If `false`, no appointment emails are sent.
- `emailReminderHours` — hours before appointment to send reminder. Options: 2, 4, 8, 12, 24, 48. If `null`, no reminder is sent.

`Client.email` remains optional. UI shows hint: *"Sin email no se envían notificaciones al cliente"* next to the email field in client forms.

---

## Email Service (`email.service.ts`)

Five new functions added to the existing file. All are fire-and-forget (internal try/catch, never throw):

```typescript
sendAppointmentConfirmed(to: string, data: AppointmentEmailData): Promise<void>
sendAppointmentCanceled(to: string, data: AppointmentEmailData): Promise<void>
sendAppointmentModified(to: string, data: AppointmentEmailData): Promise<void>
sendAppointmentReminder(to: string, data: AppointmentEmailData): Promise<void>
sendNewAppointmentOwner(to: string, data: AppointmentEmailData): Promise<void>
```

Where `AppointmentEmailData`:

```typescript
interface AppointmentEmailData {
  clientName: string;
  professionalName: string;
  serviceName: string;
  date: string;      // formatted: "dd/MM/yyyy"
  time: string;      // formatted: "HH:mm"
  businessName: string;
}
```

Visual style matches existing emails: white background, `font-family: sans-serif`, colors `#1e293b` / `#475569`, max-width 480px, inline styles only.

---

## Triggers

### `appointments.service.ts`
- `create()` → `sendAppointmentConfirmed` to client
- `update()` → `sendAppointmentModified` to client
- `changeStatus(CANCELED)` → `sendAppointmentCanceled` to client

### `public.service.ts`
- `createPublicAppointment()` (no-deposit path) → `sendAppointmentConfirmed` to client + `sendNewAppointmentOwner` to owner
- `confirmPublicPayment()` → `sendAppointmentConfirmed` to client + `sendNewAppointmentOwner` to owner

### Before each send, verify:
1. `business.emailNotificationsEnabled === true`
2. Recipient has a valid email address

Owner email comes from `business.user.email` (already available via Prisma relation).

---

## Reminder Job (`reminder.job.ts`)

Extend existing cron (every 15 min) to also send email reminders:

- Check `emailNotificationsEnabled` and `emailReminderHours` per business
- Same ±15 min window logic as WhatsApp reminders
- Reuse `reminderSentAt` field — if already set (by WhatsApp), skip email to avoid duplicates
- Only send if client has email

---

## Settings UI (`BusinessSettingsPage.tsx`)

New section **"Notificaciones por email"** after the WhatsApp section:

- Toggle switch: *"Enviar notificaciones por email a los clientes"*
- If ON: `CustomSelect` for reminder hours — options: Sin recordatorio, 2h, 4h, 8h, 12h, 24h, 48h antes
- Informational text: *"Los emails se envían desde noreply@caleio.app"*
- Future note (visible but non-functional for now): *"Activar WhatsApp desactivará las notificaciones por email automáticamente"*

---

## Backend Validators

Extend `updateBusinessBody` in `validators/index.ts`:

```typescript
emailNotificationsEnabled: z.boolean().optional()
emailReminderHours: z.number().int().nullable().optional()
```

---

## Out of Scope

- Per-event toggle (e.g., disable cancellation emails but keep confirmations) — post-launch
- WhatsApp ↔ email mutual exclusion logic — when WhatsApp account is added
- Email open/click tracking
- Unsubscribe link
