import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

const TZ_OFFSET = -3; // Argentina UTC-3

function dt(hour: number, minute = 0, daysFromToday = 0) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromToday);
  d.setUTCHours(hour - TZ_OFFSET, minute, 0, 0);
  return d;
}

// Devuelve true si el día relativo a hoy es domingo (0) o sábado (6) con hora > 14
function isWeekend(daysFromToday: number) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromToday);
  return d.getDay() === 0; // domingo no trabajan
}

async function main() {
  console.log("🌱 Seeding local database...");

  // ─── Business ───────────────────────────────────────────────────────────────
  const business = await prisma.business.create({
    data: {
      name: "Estética Valentina",
      slug: "estetica-valentina",
      timezone: "America/Argentina/Buenos_Aires",
      plan: "STARTER",
      subscriptionStatus: "TRIAL",
    },
  });
  console.log(`✓ Business: ${business.name}`);

  // ─── Admin user ─────────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash("Admin.123", 12);
  await prisma.user.create({
    data: {
      businessId: business.id,
      username: "admin",
      passwordHash,
      role: "OWNER",
      email: "valenmrtnz8@gmail.com",
      emailVerified: true,
      phone: "+54 11 3885-3213",
    },
  });
  console.log("✓ Usuario admin (user: admin / pass: admin123)");

  // ─── Services ───────────────────────────────────────────────────────────────
  const [corte, tintura, mechas, manicura, depilacion, facial, pedicura, keratina] =
    await Promise.all([
      prisma.service.create({ data: { businessId: business.id, name: "Corte de cabello", durationMin: 30, basePrice: 5000, active: true } }),
      prisma.service.create({ data: { businessId: business.id, name: "Tintura", durationMin: 90, basePrice: 18000, active: true } }),
      prisma.service.create({ data: { businessId: business.id, name: "Mechas", durationMin: 120, basePrice: 25000, active: true } }),
      prisma.service.create({ data: { businessId: business.id, name: "Manicura", durationMin: 45, basePrice: 4000, active: true } }),
      prisma.service.create({ data: { businessId: business.id, name: "Depilación facial", durationMin: 30, basePrice: 3500, active: true } }),
      prisma.service.create({ data: { businessId: business.id, name: "Limpieza facial", durationMin: 60, basePrice: 9000, active: true } }),
      prisma.service.create({ data: { businessId: business.id, name: "Pedicura", durationMin: 60, basePrice: 5500, active: true } }),
      prisma.service.create({ data: { businessId: business.id, name: "Keratina", durationMin: 150, basePrice: 32000, active: true } }),
    ]);
  console.log("✓ 8 servicios creados");

  // ─── Professionals ──────────────────────────────────────────────────────────
  const [sofia, lucas, marina] = await Promise.all([
    prisma.professional.create({ data: { businessId: business.id, name: "Sofía", color: "#0D9488", active: true } }),
    prisma.professional.create({ data: { businessId: business.id, name: "Lucas", color: "#7C3AED", active: true } }),
    prisma.professional.create({ data: { businessId: business.id, name: "Marina", color: "#DB2777", active: true } }),
  ]);
  console.log("✓ 3 profesionales creados");

  // ─── Professional ↔ Service links ───────────────────────────────────────────
  await prisma.professionalService.createMany({
    data: [
      { businessId: business.id, professionalId: sofia.id, serviceId: corte.id },
      { businessId: business.id, professionalId: sofia.id, serviceId: tintura.id },
      { businessId: business.id, professionalId: sofia.id, serviceId: mechas.id },
      { businessId: business.id, professionalId: sofia.id, serviceId: depilacion.id },
      { businessId: business.id, professionalId: sofia.id, serviceId: keratina.id },
      { businessId: business.id, professionalId: lucas.id, serviceId: corte.id },
      { businessId: business.id, professionalId: lucas.id, serviceId: tintura.id },
      { businessId: business.id, professionalId: lucas.id, serviceId: keratina.id },
      { businessId: business.id, professionalId: marina.id, serviceId: manicura.id },
      { businessId: business.id, professionalId: marina.id, serviceId: depilacion.id },
      { businessId: business.id, professionalId: marina.id, serviceId: facial.id },
      { businessId: business.id, professionalId: marina.id, serviceId: pedicura.id },
    ],
  });
  console.log("✓ Servicios asignados a profesionales");

  // ─── Schedules ──────────────────────────────────────────────────────────────
  const scheduleRows = [];
  for (const pro of [sofia, lucas, marina]) {
    for (const day of [1, 2, 3, 4, 5]) {
      scheduleRows.push({ businessId: business.id, professionalId: pro.id, dayOfWeek: day, startTime: "09:00", endTime: "18:00" });
    }
    scheduleRows.push({ businessId: business.id, professionalId: pro.id, dayOfWeek: 6, startTime: "09:00", endTime: "14:00" });
  }
  await prisma.professionalSchedule.createMany({ data: scheduleRows });
  console.log("✓ Horarios cargados (Lun–Vie 09–18, Sáb 09–14)");

  // ─── Clients ─────────────────────────────────────────────────────────────────
  const clients = await Promise.all([
    prisma.client.create({ data: { businessId: business.id, fullName: "Lucía Fernández", phone: "+54 11 2233-4455", email: "lucia@mail.com" } }),
    prisma.client.create({ data: { businessId: business.id, fullName: "Camila Torres", phone: "+54 11 3344-5566" } }),
    prisma.client.create({ data: { businessId: business.id, fullName: "Valentina Díaz", phone: "+54 11 4455-6677" } }),
    prisma.client.create({ data: { businessId: business.id, fullName: "Martina Gómez", phone: "+54 11 5566-7788" } }),
    prisma.client.create({ data: { businessId: business.id, fullName: "Ana Rodríguez", phone: "+54 11 6677-8899" } }),
    prisma.client.create({ data: { businessId: business.id, fullName: "Florencia López", phone: "+54 11 7788-9900" } }),
    prisma.client.create({ data: { businessId: business.id, fullName: "Julieta Moreno", phone: "+54 11 8899-0011" } }),
    prisma.client.create({ data: { businessId: business.id, fullName: "Romina Sosa", phone: "+54 11 9900-1122" } }),
    prisma.client.create({ data: { businessId: business.id, fullName: "Gabriela Núñez", phone: "+54 11 0011-2233" } }),
    prisma.client.create({ data: { businessId: business.id, fullName: "Daniela Ruiz", phone: "+54 11 1122-3344" } }),
    prisma.client.create({ data: { businessId: business.id, fullName: "Paula Vega", phone: "+54 11 2233-4456" } }),
    prisma.client.create({ data: { businessId: business.id, fullName: "Sofía Herrera", phone: "+54 11 3344-5567" } }),
  ]);
  console.log(`✓ ${clients.length} clientes creados`);

  // ─── Appointments ────────────────────────────────────────────────────────────
  // Helpers para no repetir tanto
  const biz = business.id;
  type ApptRow = Parameters<typeof prisma.appointment.createMany>["0"]["data"][number];

  const appts: ApptRow[] = [];

  function add(row: ApptRow) {
    appts.push(row);
  }

  // ── Ayer (pasado, mix de estados) ────────────────────────────────────────────
  if (!isWeekend(-1)) {
    // Sofía
    add({ businessId: biz, professionalId: sofia.id, clientId: clients[0].id, serviceId: corte.id, startAt: dt(9, 0, -1), endAt: dt(9, 30, -1), status: "COMPLETED", totalPrice: 5000, finalPaymentMethod: "CASH", finalPaidAt: dt(9, 30, -1) });
    add({ businessId: biz, professionalId: sofia.id, clientId: clients[1].id, serviceId: tintura.id, startAt: dt(10, 0, -1), endAt: dt(11, 30, -1), status: "COMPLETED", totalPrice: 18000, finalPaymentMethod: "TRANSFER", finalPaidAt: dt(11, 30, -1) });
    add({ businessId: biz, professionalId: sofia.id, clientId: clients[2].id, serviceId: corte.id, startAt: dt(12, 0, -1), endAt: dt(12, 30, -1), status: "NO_SHOW", totalPrice: 5000 });
    add({ businessId: biz, professionalId: sofia.id, clientId: clients[3].id, serviceId: depilacion.id, startAt: dt(14, 0, -1), endAt: dt(14, 30, -1), status: "COMPLETED", totalPrice: 3500, finalPaymentMethod: "CASH", finalPaidAt: dt(14, 30, -1) });
    add({ businessId: biz, professionalId: sofia.id, clientId: clients[4].id, serviceId: mechas.id, startAt: dt(15, 0, -1), endAt: dt(17, 0, -1), status: "COMPLETED", totalPrice: 25000, finalPaymentMethod: "MERCADOPAGO", finalPaidAt: dt(17, 0, -1) });
    // Lucas
    add({ businessId: biz, professionalId: lucas.id, clientId: clients[5].id, serviceId: corte.id, startAt: dt(9, 0, -1), endAt: dt(9, 30, -1), status: "COMPLETED", totalPrice: 5000, finalPaymentMethod: "CASH", finalPaidAt: dt(9, 30, -1) });
    add({ businessId: biz, professionalId: lucas.id, clientId: clients[6].id, serviceId: corte.id, startAt: dt(10, 0, -1), endAt: dt(10, 30, -1), status: "COMPLETED", totalPrice: 5000, finalPaymentMethod: "CASH", finalPaidAt: dt(10, 30, -1) });
    add({ businessId: biz, professionalId: lucas.id, clientId: clients[7].id, serviceId: tintura.id, startAt: dt(11, 0, -1), endAt: dt(12, 30, -1), status: "CANCELED", totalPrice: 18000 });
    add({ businessId: biz, professionalId: lucas.id, clientId: clients[8].id, serviceId: corte.id, startAt: dt(14, 0, -1), endAt: dt(14, 30, -1), status: "COMPLETED", totalPrice: 5000, finalPaymentMethod: "TRANSFER", finalPaidAt: dt(14, 30, -1) });
    // Marina
    add({ businessId: biz, professionalId: marina.id, clientId: clients[9].id, serviceId: manicura.id, startAt: dt(9, 0, -1), endAt: dt(9, 45, -1), status: "COMPLETED", totalPrice: 4000, finalPaymentMethod: "CASH", finalPaidAt: dt(9, 45, -1) });
    add({ businessId: biz, professionalId: marina.id, clientId: clients[10].id, serviceId: pedicura.id, startAt: dt(10, 0, -1), endAt: dt(11, 0, -1), status: "COMPLETED", totalPrice: 5500, finalPaymentMethod: "MERCADOPAGO", finalPaidAt: dt(11, 0, -1) });
    add({ businessId: biz, professionalId: marina.id, clientId: clients[11].id, serviceId: facial.id, startAt: dt(11, 30, -1), endAt: dt(12, 30, -1), status: "NO_SHOW", totalPrice: 9000 });
    add({ businessId: biz, professionalId: marina.id, clientId: clients[0].id, serviceId: depilacion.id, startAt: dt(14, 0, -1), endAt: dt(14, 30, -1), status: "COMPLETED", totalPrice: 3500, finalPaymentMethod: "CASH", finalPaidAt: dt(14, 30, -1) });
    add({ businessId: biz, professionalId: marina.id, clientId: clients[1].id, serviceId: manicura.id, startAt: dt(15, 0, -1), endAt: dt(15, 45, -1), status: "COMPLETED", totalPrice: 4000, finalPaymentMethod: "TRANSFER", finalPaidAt: dt(15, 45, -1) });
  }

  // ── Hoy ──────────────────────────────────────────────────────────────────────
  // Sofía — mañana completados, tarde reservados
  add({ businessId: biz, professionalId: sofia.id, clientId: clients[0].id, serviceId: corte.id, startAt: dt(9, 0), endAt: dt(9, 30), status: "COMPLETED", totalPrice: 5000, finalPaymentMethod: "CASH", finalPaidAt: dt(9, 30) });
  add({ businessId: biz, professionalId: sofia.id, clientId: clients[1].id, serviceId: tintura.id, startAt: dt(10, 0), endAt: dt(11, 30), status: "DEPOSIT_PAID", totalPrice: 18000, depositAmount: 5000, depositMethod: "TRANSFER", depositPaidAt: dt(10, 0) });
  add({ businessId: biz, professionalId: sofia.id, clientId: clients[2].id, serviceId: depilacion.id, startAt: dt(12, 0), endAt: dt(12, 30), status: "COMPLETED", totalPrice: 3500, finalPaymentMethod: "CASH", finalPaidAt: dt(12, 30) });
  add({ businessId: biz, professionalId: sofia.id, clientId: clients[3].id, serviceId: corte.id, startAt: dt(14, 0), endAt: dt(14, 30), status: "RESERVED", totalPrice: 5000 });
  add({ businessId: biz, professionalId: sofia.id, clientId: clients[4].id, serviceId: mechas.id, startAt: dt(15, 0), endAt: dt(17, 0), status: "DEPOSIT_PAID", totalPrice: 25000, depositAmount: 8000, depositMethod: "TRANSFER", depositPaidAt: dt(15, 0) });
  // Lucas
  add({ businessId: biz, professionalId: lucas.id, clientId: clients[5].id, serviceId: corte.id, startAt: dt(9, 0), endAt: dt(9, 30), status: "COMPLETED", totalPrice: 5000, finalPaymentMethod: "CASH", finalPaidAt: dt(9, 30) });
  add({ businessId: biz, professionalId: lucas.id, clientId: clients[6].id, serviceId: corte.id, startAt: dt(10, 0), endAt: dt(10, 30), status: "COMPLETED", totalPrice: 5000, finalPaymentMethod: "MERCADOPAGO", finalPaidAt: dt(10, 30) });
  add({ businessId: biz, professionalId: lucas.id, clientId: clients[7].id, serviceId: tintura.id, startAt: dt(11, 0), endAt: dt(12, 30), status: "NO_SHOW", totalPrice: 18000 });
  add({ businessId: biz, professionalId: lucas.id, clientId: clients[8].id, serviceId: corte.id, startAt: dt(14, 0), endAt: dt(14, 30), status: "RESERVED", totalPrice: 5000 });
  add({ businessId: biz, professionalId: lucas.id, clientId: clients[9].id, serviceId: corte.id, startAt: dt(15, 30), endAt: dt(16, 0), status: "RESERVED", totalPrice: 5000 });
  // Marina
  add({ businessId: biz, professionalId: marina.id, clientId: clients[10].id, serviceId: manicura.id, startAt: dt(9, 0), endAt: dt(9, 45), status: "COMPLETED", totalPrice: 4000, finalPaymentMethod: "MERCADOPAGO", finalPaidAt: dt(9, 45) });
  add({ businessId: biz, professionalId: marina.id, clientId: clients[11].id, serviceId: pedicura.id, startAt: dt(10, 0), endAt: dt(11, 0), status: "COMPLETED", totalPrice: 5500, finalPaymentMethod: "CASH", finalPaidAt: dt(11, 0) });
  add({ businessId: biz, professionalId: marina.id, clientId: clients[0].id, serviceId: facial.id, startAt: dt(11, 30), endAt: dt(12, 30), status: "RESERVED", totalPrice: 9000 });
  add({ businessId: biz, professionalId: marina.id, clientId: clients[1].id, serviceId: depilacion.id, startAt: dt(14, 0), endAt: dt(14, 30), status: "DEPOSIT_PAID", totalPrice: 3500, depositAmount: 1500, depositMethod: "CASH", depositPaidAt: dt(14, 0) });
  add({ businessId: biz, professionalId: marina.id, clientId: clients[2].id, serviceId: manicura.id, startAt: dt(15, 0), endAt: dt(15, 45), status: "RESERVED", totalPrice: 4000 });

  // ── Mañana ───────────────────────────────────────────────────────────────────
  if (!isWeekend(1)) {
    // Sofía
    add({ businessId: biz, professionalId: sofia.id, clientId: clients[3].id, serviceId: keratina.id, startAt: dt(9, 0, 1), endAt: dt(11, 30, 1), status: "DEPOSIT_PAID", totalPrice: 32000, depositAmount: 10000, depositMethod: "TRANSFER", depositPaidAt: dt(9, 0, 1) });
    add({ businessId: biz, professionalId: sofia.id, clientId: clients[4].id, serviceId: corte.id, startAt: dt(12, 0, 1), endAt: dt(12, 30, 1), status: "RESERVED", totalPrice: 5000 });
    add({ businessId: biz, professionalId: sofia.id, clientId: clients[5].id, serviceId: tintura.id, startAt: dt(14, 0, 1), endAt: dt(15, 30, 1), status: "RESERVED", totalPrice: 18000 });
    add({ businessId: biz, professionalId: sofia.id, clientId: clients[6].id, serviceId: depilacion.id, startAt: dt(16, 0, 1), endAt: dt(16, 30, 1), status: "RESERVED", totalPrice: 3500 });
    // Lucas
    add({ businessId: biz, professionalId: lucas.id, clientId: clients[7].id, serviceId: corte.id, startAt: dt(9, 0, 1), endAt: dt(9, 30, 1), status: "RESERVED", totalPrice: 5000 });
    add({ businessId: biz, professionalId: lucas.id, clientId: clients[8].id, serviceId: corte.id, startAt: dt(10, 0, 1), endAt: dt(10, 30, 1), status: "RESERVED", totalPrice: 5000 });
    add({ businessId: biz, professionalId: lucas.id, clientId: clients[9].id, serviceId: tintura.id, startAt: dt(11, 0, 1), endAt: dt(12, 30, 1), status: "DEPOSIT_PAID", totalPrice: 18000, depositAmount: 5000, depositMethod: "MERCADOPAGO", depositPaidAt: dt(11, 0, 1) });
    add({ businessId: biz, professionalId: lucas.id, clientId: clients[10].id, serviceId: corte.id, startAt: dt(14, 30, 1), endAt: dt(15, 0, 1), status: "RESERVED", totalPrice: 5000 });
    // Marina
    add({ businessId: biz, professionalId: marina.id, clientId: clients[11].id, serviceId: manicura.id, startAt: dt(9, 0, 1), endAt: dt(9, 45, 1), status: "RESERVED", totalPrice: 4000 });
    add({ businessId: biz, professionalId: marina.id, clientId: clients[0].id, serviceId: pedicura.id, startAt: dt(10, 0, 1), endAt: dt(11, 0, 1), status: "DEPOSIT_PAID", totalPrice: 5500, depositAmount: 2000, depositMethod: "TRANSFER", depositPaidAt: dt(10, 0, 1) });
    add({ businessId: biz, professionalId: marina.id, clientId: clients[1].id, serviceId: facial.id, startAt: dt(11, 30, 1), endAt: dt(12, 30, 1), status: "RESERVED", totalPrice: 9000 });
    add({ businessId: biz, professionalId: marina.id, clientId: clients[2].id, serviceId: depilacion.id, startAt: dt(14, 0, 1), endAt: dt(14, 30, 1), status: "RESERVED", totalPrice: 3500 });
    add({ businessId: biz, professionalId: marina.id, clientId: clients[3].id, serviceId: manicura.id, startAt: dt(15, 0, 1), endAt: dt(15, 45, 1), status: "RESERVED", totalPrice: 4000 });
  }

  // ── Pasado mañana ─────────────────────────────────────────────────────────────
  if (!isWeekend(2)) {
    add({ businessId: biz, professionalId: sofia.id, clientId: clients[4].id, serviceId: mechas.id, startAt: dt(9, 0, 2), endAt: dt(11, 0, 2), status: "DEPOSIT_PAID", totalPrice: 25000, depositAmount: 8000, depositMethod: "TRANSFER", depositPaidAt: dt(9, 0, 2) });
    add({ businessId: biz, professionalId: sofia.id, clientId: clients[5].id, serviceId: corte.id, startAt: dt(11, 30, 2), endAt: dt(12, 0, 2), status: "RESERVED", totalPrice: 5000 });
    add({ businessId: biz, professionalId: sofia.id, clientId: clients[6].id, serviceId: tintura.id, startAt: dt(14, 0, 2), endAt: dt(15, 30, 2), status: "RESERVED", totalPrice: 18000 });
    add({ businessId: biz, professionalId: lucas.id, clientId: clients[7].id, serviceId: corte.id, startAt: dt(9, 0, 2), endAt: dt(9, 30, 2), status: "RESERVED", totalPrice: 5000 });
    add({ businessId: biz, professionalId: lucas.id, clientId: clients[8].id, serviceId: keratina.id, startAt: dt(10, 0, 2), endAt: dt(12, 30, 2), status: "DEPOSIT_PAID", totalPrice: 32000, depositAmount: 10000, depositMethod: "CASH", depositPaidAt: dt(10, 0, 2) });
    add({ businessId: biz, professionalId: marina.id, clientId: clients[9].id, serviceId: manicura.id, startAt: dt(9, 0, 2), endAt: dt(9, 45, 2), status: "RESERVED", totalPrice: 4000 });
    add({ businessId: biz, professionalId: marina.id, clientId: clients[10].id, serviceId: facial.id, startAt: dt(10, 0, 2), endAt: dt(11, 0, 2), status: "RESERVED", totalPrice: 9000 });
    add({ businessId: biz, professionalId: marina.id, clientId: clients[11].id, serviceId: pedicura.id, startAt: dt(14, 0, 2), endAt: dt(15, 0, 2), status: "RESERVED", totalPrice: 5500 });
  }

  // ── En 3 días ─────────────────────────────────────────────────────────────────
  if (!isWeekend(3)) {
    add({ businessId: biz, professionalId: sofia.id, clientId: clients[0].id, serviceId: keratina.id, startAt: dt(9, 0, 3), endAt: dt(11, 30, 3), status: "RESERVED", totalPrice: 32000 });
    add({ businessId: biz, professionalId: sofia.id, clientId: clients[1].id, serviceId: corte.id, startAt: dt(12, 0, 3), endAt: dt(12, 30, 3), status: "RESERVED", totalPrice: 5000 });
    add({ businessId: biz, professionalId: lucas.id, clientId: clients[2].id, serviceId: corte.id, startAt: dt(9, 0, 3), endAt: dt(9, 30, 3), status: "RESERVED", totalPrice: 5000 });
    add({ businessId: biz, professionalId: lucas.id, clientId: clients[3].id, serviceId: tintura.id, startAt: dt(10, 0, 3), endAt: dt(11, 30, 3), status: "DEPOSIT_PAID", totalPrice: 18000, depositAmount: 6000, depositMethod: "TRANSFER", depositPaidAt: dt(10, 0, 3) });
    add({ businessId: biz, professionalId: marina.id, clientId: clients[4].id, serviceId: manicura.id, startAt: dt(9, 0, 3), endAt: dt(9, 45, 3), status: "RESERVED", totalPrice: 4000 });
    add({ businessId: biz, professionalId: marina.id, clientId: clients[5].id, serviceId: depilacion.id, startAt: dt(10, 0, 3), endAt: dt(10, 30, 3), status: "RESERVED", totalPrice: 3500 });
    add({ businessId: biz, professionalId: marina.id, clientId: clients[6].id, serviceId: pedicura.id, startAt: dt(14, 0, 3), endAt: dt(15, 0, 3), status: "RESERVED", totalPrice: 5500 });
  }

  // ── Semana pasada (historial) ─────────────────────────────────────────────────
  for (let d = -7; d <= -2; d++) {
    if (isWeekend(d)) continue;
    // Sofía — 3 o 4 turnos por día
    add({ businessId: biz, professionalId: sofia.id, clientId: clients[d % 12 < 0 ? (d % 12) + 12 : d % 12].id, serviceId: corte.id, startAt: dt(9, 0, d), endAt: dt(9, 30, d), status: "COMPLETED", totalPrice: 5000, finalPaymentMethod: "CASH", finalPaidAt: dt(9, 30, d) });
    add({ businessId: biz, professionalId: sofia.id, clientId: clients[(d + 1) % 12 < 0 ? (d + 1) % 12 + 12 : (d + 1) % 12].id, serviceId: tintura.id, startAt: dt(10, 0, d), endAt: dt(11, 30, d), status: "COMPLETED", totalPrice: 18000, finalPaymentMethod: "TRANSFER", finalPaidAt: dt(11, 30, d) });
    add({ businessId: biz, professionalId: sofia.id, clientId: clients[(d + 2) % 12 < 0 ? (d + 2) % 12 + 12 : (d + 2) % 12].id, serviceId: corte.id, startAt: dt(14, 0, d), endAt: dt(14, 30, d), status: "COMPLETED", totalPrice: 5000, finalPaymentMethod: "MERCADOPAGO", finalPaidAt: dt(14, 30, d) });
    // Lucas — 2 por día
    add({ businessId: biz, professionalId: lucas.id, clientId: clients[(d + 3) % 12 < 0 ? (d + 3) % 12 + 12 : (d + 3) % 12].id, serviceId: corte.id, startAt: dt(9, 0, d), endAt: dt(9, 30, d), status: "COMPLETED", totalPrice: 5000, finalPaymentMethod: "CASH", finalPaidAt: dt(9, 30, d) });
    add({ businessId: biz, professionalId: lucas.id, clientId: clients[(d + 4) % 12 < 0 ? (d + 4) % 12 + 12 : (d + 4) % 12].id, serviceId: corte.id, startAt: dt(11, 0, d), endAt: dt(11, 30, d), status: d % 3 === 0 ? "NO_SHOW" : "COMPLETED", totalPrice: 5000, ...(d % 3 !== 0 ? { finalPaymentMethod: "CASH" as const, finalPaidAt: dt(11, 30, d) } : {}) });
    // Marina — 3 por día
    add({ businessId: biz, professionalId: marina.id, clientId: clients[(d + 5) % 12 < 0 ? (d + 5) % 12 + 12 : (d + 5) % 12].id, serviceId: manicura.id, startAt: dt(9, 0, d), endAt: dt(9, 45, d), status: "COMPLETED", totalPrice: 4000, finalPaymentMethod: "CASH", finalPaidAt: dt(9, 45, d) });
    add({ businessId: biz, professionalId: marina.id, clientId: clients[(d + 6) % 12 < 0 ? (d + 6) % 12 + 12 : (d + 6) % 12].id, serviceId: pedicura.id, startAt: dt(10, 0, d), endAt: dt(11, 0, d), status: "COMPLETED", totalPrice: 5500, finalPaymentMethod: "TRANSFER", finalPaidAt: dt(11, 0, d) });
    add({ businessId: biz, professionalId: marina.id, clientId: clients[(d + 7) % 12 < 0 ? (d + 7) % 12 + 12 : (d + 7) % 12].id, serviceId: facial.id, startAt: dt(14, 0, d), endAt: dt(15, 0, d), status: d % 4 === 0 ? "CANCELED" : "COMPLETED", totalPrice: 9000, ...(d % 4 !== 0 ? { finalPaymentMethod: "MERCADOPAGO" as const, finalPaidAt: dt(15, 0, d) } : {}) });
  }

  await prisma.appointment.createMany({ data: appts });
  console.log(`✓ ${appts.length} turnos creados (semana pasada, ayer, hoy, y próximos 3 días)`);

  console.log("\n✅ Seed completo!");
  console.log("   Login: admin / admin123");
  console.log(`   Business ID: ${business.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
