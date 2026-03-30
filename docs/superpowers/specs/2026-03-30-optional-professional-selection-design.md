# Spec: Selección opcional de profesional en reservas online

**Fecha:** 2026-03-30
**Estado:** Aprobado

---

## Contexto

Algunos negocios (ej: centros de estética) no trabajan con profesional específico — el cliente solo elige el servicio y el horario. Otros negocios (ej: barberías) sí necesitan que el cliente elija su profesional.

La solución es un toggle por servicio que controla si el paso de selección de profesional aparece o no en el flujo de reserva pública.

---

## Alcance

Este cambio aplica **solo al link de reserva del cliente** (`/reservar/:slug`). En el panel admin, el owner siempre elige profesional al crear un turno.

---

## 1. Schema

Nuevo campo en el modelo `Service`:

```prisma
allowClientChooseProfessional  Boolean  @default(true)
```

- `true` → flujo actual: el cliente ve y elige el profesional (paso 2)
- `false` → el paso de profesional se omite; el backend asigna uno disponible al azar

---

## 2. Backend

### 2a. Migración Prisma

Nueva migración que agrega `allowClientChooseProfessional Boolean DEFAULT true` a `Service`.

### 2b. Nuevo endpoint: disponibilidad agregada

```
GET /booking/:slug/availability?serviceId=&date=
```

Comportamiento:
1. Obtiene todos los profesionales activos que ofrecen el `serviceId`
2. Llama a `getAvailability` para cada uno en paralelo
3. Devuelve la unión de slots sin duplicados (deduplicado por `startAt`)
4. El slot **no incluye** `professionalId` — la asignación ocurre al crear el turno

Respuesta: `{ slots: { startAt: string, endAt: string, label: string }[] }`

### 2c. `getPublicServices`

Agregar `allowClientChooseProfessional` a los campos seleccionados en la query.

### 2d. `createPublicAppointment` — profesional opcional

El campo `professionalId` en el body pasa a ser opcional.

- Si `professionalId` presente → flujo actual
- Si `professionalId` ausente:
  1. Obtiene todos los profesionales activos para el `serviceId`
  2. Filtra los que estén disponibles en `startAt`–`endAt` (sin solapamientos ni bloqueos)
  3. Si ninguno disponible → HTTP 409 `"No hay profesionales disponibles en ese horario"`
  4. Elige uno al azar de los disponibles
  5. Crea el turno normalmente con ese profesional
  6. La respuesta incluye el turno con `professionalId` y `professionalName` asignados

### 2e. Servicios (create/update)

Los endpoints de creación y edición de servicios aceptan y persisten `allowClientChooseProfessional`.

---

## 3. Frontend — BookingPage

### 3a. Tipo `Service`

```typescript
type Service = {
  id: string;
  name: string;
  durationMin: number;
  basePrice: number;
  requiresDeposit: boolean;
  depositPercent: number | null;
  allowClientChooseProfessional: boolean;  // nuevo
};
```

### 3b. Flujo de pasos

| `allowClientChooseProfessional` | Pasos visibles |
|---|---|
| `true` (defecto) | service → professional → datetime → client → confirm |
| `false` | service → datetime → client → confirm |

### 3c. StepBar

La barra de pasos recibe el servicio seleccionado (o un flag) y ajusta dinámicamente los pasos visibles a 4 o 5. Los números y la barra de progreso se adaptan correctamente.

### 3d. Navegación (`goBack`)

El mapa de pasos anteriores se calcula dinámicamente en función de si se muestra el paso "professional":

- Con profesional: `datetime → professional`, `professional → service`
- Sin profesional: `datetime → service`

### 3e. Carga de disponibilidad

Cuando el servicio tiene `allowClientChooseProfessional = false`:
- No se necesita `selectedProfessional` para ir al paso datetime
- La disponibilidad se obtiene de `/booking/:slug/availability?serviceId=&date=` (nuevo endpoint)
- `selectedProfessional` permanece `null` hasta que la API devuelva el turno creado

Cuando `allowClientChooseProfessional = true`:
- Comportamiento actual sin cambios

### 3f. Creación del turno

- Si `allowClientChooseProfessional = false`: el body del POST no incluye `professionalId`
- La respuesta incluye el appointment con el profesional asignado → se guarda en `selectedProfessional` para mostrar en pantalla "done"

### 3g. Pantalla "done"

Sin cambios visuales. Sigue mostrando el profesional asignado (obtenido de la respuesta de la API).

Agregar debajo del resumen del turno:

> "Para cancelar o modificar tu turno, comunicate directamente con el negocio."

En estilo `text-xs text-slate-400`.

---

## 4. Frontend — Formularios de servicio

En `ServiceDetailModal` y `NewServiceFormModal`, agregar toggle:

**Label:** "El cliente puede elegir profesional"
**Default:** activado (`true`)
**Posición:** sección de configuración del servicio (junto a `bookableOnline`)

---

## 5. Email — Nota de cancelación

En `sendAppointmentConfirmed`, agregar dentro de `appointmentDetailsTable` o debajo de él:

```
Para cancelar o modificar tu turno, comunicate directamente con el negocio.
```

Estilo: `color: #64748b; font-size: 13px; margin-top: 16px;`

---

## Casos borde

| Caso | Comportamiento |
|---|---|
| Servicio sin profesionales activos asignados | El nuevo endpoint devuelve `slots: []`; el cliente no puede reservar |
| Todos los profesionales ocupados en el slot elegido | HTTP 409 en creación; el cliente ve mensaje de error y puede elegir otro horario |
| Race condition (dos clientes eligen mismo slot) | El segundo recibe 409 (overlap check existente) |
| Owner agrega turno desde admin | Siempre elige profesional; este cambio no aplica |

---

## Archivos afectados

| Archivo | Cambio |
|---|---|
| `backend/prisma/schema.prisma` | Campo nuevo en `Service` |
| `backend/prisma/migrations/...` | Migración nueva |
| `backend/src/services/public.service.ts` | Endpoint agregado + lógica auto-asignación |
| `backend/src/routes/public.routes.ts` | Ruta nueva `/availability` |
| `backend/src/controllers/public.controller.ts` | Handler nuevo |
| `backend/src/services/appointments.service.ts` | Posible helper para verificar disponibilidad de profesional en slot |
| `backend/src/services/email.service.ts` | Nota de cancelación en `sendAppointmentConfirmed` |
| `frontend/src/pages/BookingPage.tsx` | Flujo dinámico, StepBar, goBack, fetch, done screen |
| `frontend/src/components/services/ServiceDetailModal.tsx` | Toggle nuevo |
| `frontend/src/components/services/NewServiceFormModal.tsx` | Toggle nuevo |
| `frontend/src/services/services.api.ts` | Campo en create/update |
| `frontend/src/types/entities.ts` | Campo en tipo `Service` |
