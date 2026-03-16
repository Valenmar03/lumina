# Lumina - Domain Rules (V1)

## Objetivo
Lumina es un SaaS para gestión de estéticas.  
Este documento define las reglas de negocio de la versión 1.

---

# Multi-tenant

- Todo pertenece a un Business.
- Ninguna entidad puede cruzar businessId.
- Siempre validar que Professional, Client y Service pertenezcan al mismo Business.

---

# Professional

- Un profesional puede realizar múltiples servicios.
- Un servicio puede ser realizado por múltiples profesionales.
- La relación se define en ProfessionalService.

---

# Service

- Cada turno tiene exactamente 1 servicio.
- El servicio define:
  - durationMin (duración total del turno)
  - basePrice (precio por defecto)

---

# Appointment (Turnos)

## Creación

Para crear un turno se requiere:
- professionalId
- clientId
- serviceId
- startAt

El sistema:
- Calcula endAt = startAt + durationMin
- priceFinal = basePrice
- status = RESERVED

---

## Reglas de validación

### 1. Profesional habilitado
Debe existir ProfessionalService (professionalId + serviceId).

### 2. No solapamiento (V1)
Un profesional NO puede tener turnos que se superpongan.

Se considera solapamiento si:
existing.startAt < newEndAt AND existing.endAt > newStartAt

Solo bloquean turnos con status RESERVED y DEPOSIT_PAID.

### 3. Horario flexible
Si el turno excede el horario configurado en ProfessionalSchedule:
- Se permite crear el turno.
- Se genera advertencia.
- No se bloquea.

### 4. Estados permitidos

- RESERVED (default)
- CANCELED
- NO_SHOW
- COMPLETED
- DEPOSIT_PAID

No se permite volver a RESERVED y DEPOSIT_PAID desde COMPLETED.

---

# ProfessionalSchedule

- Define disponibilidad semanal por día (0-6).
- Puede haber múltiples bloques por día.
- Si no hay horarios configurados, el sistema permite crear turnos.

---

# V2 Backlog

- Capacidad concurrente por profesional.
- Capacidad de camillas/estaciones por Business.
- activeWorkMin en Service.
- Validación por ocupación real en vez de solapamiento simple.