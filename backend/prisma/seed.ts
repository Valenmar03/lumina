import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

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
  const passwordHash = await bcrypt.hash("admin123", 12);
  await prisma.user.create({
    data: {
      businessId: business.id,
      username: "admin",
      passwordHash,
      role: "OWNER",
    },
  });
  console.log("✓ Usuario admin (user: admin / pass: admin123)");

  // ─── Services ───────────────────────────────────────────────────────────────
  const [corte, tintura, mechas, manicura, depilacion, facial] =
    await Promise.all([
      prisma.service.create({
        data: {
          businessId: business.id,
          name: "Corte de cabello",
          durationMin: 30,
          basePrice: 5000,
          active: true,
        },
      }),
      prisma.service.create({
        data: {
          businessId: business.id,
          name: "Tintura",
          durationMin: 90,
          basePrice: 18000,
          active: true,
        },
      }),
      prisma.service.create({
        data: {
          businessId: business.id,
          name: "Mechas",
          durationMin: 120,
          basePrice: 25000,
          active: true,
        },
      }),
      prisma.service.create({
        data: {
          businessId: business.id,
          name: "Manicura",
          durationMin: 45,
          basePrice: 4000,
          active: true,
        },
      }),
      prisma.service.create({
        data: {
          businessId: business.id,
          name: "Depilación facial",
          durationMin: 30,
          basePrice: 3500,
          active: true,
        },
      }),
      prisma.service.create({
        data: {
          businessId: business.id,
          name: "Limpieza facial",
          durationMin: 60,
          basePrice: 9000,
          active: true,
        },
      }),
    ]);
  console.log("✓ 6 servicios creados");

  // ─── Professionals ──────────────────────────────────────────────────────────
  const [sofia, lucas, marina] = await Promise.all([
    prisma.professional.create({
      data: {
        businessId: business.id,
        name: "Sofía",
        color: "#0D9488",
        active: true,
      },
    }),
    prisma.professional.create({
      data: {
        businessId: business.id,
        name: "Lucas",
        color: "#7C3AED",
        active: true,
      },
    }),
    prisma.professional.create({
      data: {
        businessId: business.id,
        name: "Marina",
        color: "#DB2777",
        active: true,
      },
    }),
  ]);
  console.log("✓ 3 profesionales creados");

  // ─── Professional ↔ Service links ───────────────────────────────────────────
  // Sofía: corte, tintura, mechas, depilacion
  // Lucas: corte
  // Marina: manicura, depilacion, facial
  await prisma.professionalService.createMany({
    data: [
      { businessId: business.id, professionalId: sofia.id, serviceId: corte.id },
      { businessId: business.id, professionalId: sofia.id, serviceId: tintura.id },
      { businessId: business.id, professionalId: sofia.id, serviceId: mechas.id },
      { businessId: business.id, professionalId: sofia.id, serviceId: depilacion.id },
      { businessId: business.id, professionalId: lucas.id, serviceId: corte.id },
      { businessId: business.id, professionalId: marina.id, serviceId: manicura.id },
      { businessId: business.id, professionalId: marina.id, serviceId: depilacion.id },
      { businessId: business.id, professionalId: marina.id, serviceId: facial.id },
    ],
  });
  console.log("✓ Servicios asignados a profesionales");

  // ─── Schedules (Lun–Vie 09:00–18:00, Sáb 09:00–14:00) ─────────────────────
  // dayOfWeek: 0=Dom, 1=Lun, 2=Mar, 3=Mié, 4=Jue, 5=Vie, 6=Sáb
  const weekdays = [1, 2, 3, 4, 5];
  const scheduleRows = [];

  for (const pro of [sofia, lucas, marina]) {
    for (const day of weekdays) {
      scheduleRows.push({
        businessId: business.id,
        professionalId: pro.id,
        dayOfWeek: day,
        startTime: "09:00",
        endTime: "18:00",
      });
    }
    // Sábados
    scheduleRows.push({
      businessId: business.id,
      professionalId: pro.id,
      dayOfWeek: 6,
      startTime: "09:00",
      endTime: "14:00",
    });
  }

  await prisma.professionalSchedule.createMany({ data: scheduleRows });
  console.log("✓ Horarios cargados (Lun–Vie 09–18, Sáb 09–14)");

  // ─── Clients ─────────────────────────────────────────────────────────────────
  const clients = await Promise.all([
    prisma.client.create({ data: { businessId: business.id, fullName: "Lucía Fernández", phone: "1122334455" } }),
    prisma.client.create({ data: { businessId: business.id, fullName: "Camila Torres", phone: "1133445566" } }),
    prisma.client.create({ data: { businessId: business.id, fullName: "Valentina Díaz", phone: "1144556677" } }),
    prisma.client.create({ data: { businessId: business.id, fullName: "Martina Gómez", phone: "1155667788" } }),
    prisma.client.create({ data: { businessId: business.id, fullName: "Ana Rodríguez", phone: "1166778899" } }),
    prisma.client.create({ data: { businessId: business.id, fullName: "Florencia López", phone: "1177889900" } }),
  ]);
  console.log("✓ 6 clientes creados");

  // ─── Appointments (hoy y mañana) ─────────────────────────────────────────────
  const TZ_OFFSET = -3; // Argentina UTC-3
  function dt(hour: number, minute = 0, daysFromToday = 0) {
    const d = new Date();
    d.setDate(d.getDate() + daysFromToday);
    d.setUTCHours(hour - TZ_OFFSET, minute, 0, 0);
    return d;
  }

  await prisma.appointment.createMany({
    data: [
      // Hoy — Sofía
      {
        businessId: business.id,
        professionalId: sofia.id,
        clientId: clients[0].id,
        serviceId: corte.id,
        startAt: dt(9, 0),
        endAt: dt(9, 30),
        status: "COMPLETED",
        totalPrice: 5000,
        finalPaymentMethod: "CASH",
        finalPaidAt: dt(9, 30),
      },
      {
        businessId: business.id,
        professionalId: sofia.id,
        clientId: clients[1].id,
        serviceId: tintura.id,
        startAt: dt(10, 0),
        endAt: dt(11, 30),
        status: "DEPOSIT_PAID",
        totalPrice: 18000,
        depositAmount: 5000,
        depositMethod: "TRANSFER",
        depositPaidAt: dt(10, 0),
      },
      {
        businessId: business.id,
        professionalId: sofia.id,
        clientId: clients[2].id,
        serviceId: corte.id,
        startAt: dt(14, 0),
        endAt: dt(14, 30),
        status: "RESERVED",
        totalPrice: 5000,
      },
      // Hoy — Lucas
      {
        businessId: business.id,
        professionalId: lucas.id,
        clientId: clients[3].id,
        serviceId: corte.id,
        startAt: dt(9, 0),
        endAt: dt(9, 30),
        status: "RESERVED",
        totalPrice: 5000,
      },
      {
        businessId: business.id,
        professionalId: lucas.id,
        clientId: clients[4].id,
        serviceId: corte.id,
        startAt: dt(11, 0),
        endAt: dt(11, 30),
        status: "NO_SHOW",
        totalPrice: 5000,
      },
      // Hoy — Marina
      {
        businessId: business.id,
        professionalId: marina.id,
        clientId: clients[5].id,
        serviceId: manicura.id,
        startAt: dt(9, 0),
        endAt: dt(9, 45),
        status: "COMPLETED",
        totalPrice: 4000,
        finalPaymentMethod: "MERCADOPAGO",
        finalPaidAt: dt(9, 45),
      },
      {
        businessId: business.id,
        professionalId: marina.id,
        clientId: clients[0].id,
        serviceId: facial.id,
        startAt: dt(11, 0),
        endAt: dt(12, 0),
        status: "RESERVED",
        totalPrice: 9000,
      },
      // Mañana — Sofía
      {
        businessId: business.id,
        professionalId: sofia.id,
        clientId: clients[1].id,
        serviceId: mechas.id,
        startAt: dt(10, 0, 1),
        endAt: dt(12, 0, 1),
        status: "DEPOSIT_PAID",
        totalPrice: 25000,
        depositAmount: 8000,
        depositMethod: "TRANSFER",
        depositPaidAt: dt(10, 0, 1),
      },
      {
        businessId: business.id,
        professionalId: sofia.id,
        clientId: clients[2].id,
        serviceId: corte.id,
        startAt: dt(15, 0, 1),
        endAt: dt(15, 30, 1),
        status: "RESERVED",
        totalPrice: 5000,
      },
    ],
  });
  console.log("✓ Turnos de hoy y mañana creados");

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
