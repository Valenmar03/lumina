import { useMemo, useState } from "react";
import { format, isAfter, parseISO } from "date-fns";
import {
  CalendarDays,
  DollarSign,
  UserCircle2,
  Users,
} from "lucide-react";

import SectionCard from "../components/dashboard/SectionCard";
import StatCard from "../components/dashboard/StatCard";
import { useClients } from "../hooks/useClients";
import { useProfessionals } from "../hooks/useProfessionals";
import { useAgendaDaily } from "../hooks/useAgenda";
import DashboardSideSkeleton from "../components/dashboard/skeleton/DashboardSideSkeleton";
import DashboardStatSkeleton from "../components/dashboard/skeleton/DashboardStatSkeleton";
import UpcomingAppointmentsSkeleton from "../components/dashboard/skeleton/UpcomingAppointmentSkeleton";
import RevenueBreakdownCard from "../components/dashboard/RevenueBreakDownCard";
import DashboardDateNavigator from "../components/dashboard/DashboardDateNavigator";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getAvatarColor(index: number) {
  const colors = [
    "bg-violet-500",
    "bg-pink-500",
    "bg-blue-500",
    "bg-emerald-500",
    "bg-amber-500",
  ];

  return colors[index % colors.length];
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function DashboardPage() {
  const [selectedDate, setSelectedDate] = useState(() =>
    format(new Date(), "yyyy-MM-dd")
  );

  const { data: clientsData, isLoading: clientsLoading } = useClients();
  const clients = clientsData?.clients ?? [];

  const { data: professionalsData, isLoading: professionalsLoading } =
    useProfessionals();

  const professionals = (professionalsData?.professionals ?? []).filter(
    (p) => p.active
  );

  const { data: dailyAgenda, isLoading: dailyLoading } = useAgendaDaily(
    undefined,
    selectedDate
  );

  const appointments = dailyAgenda?.appointments ?? [];

  console.log(appointments)

  const dashboardData = useMemo(() => {
    const now = new Date();

    const normalizedAppointments = appointments.map((appt) => {
      const startDate = parseISO(appt.startAt);
      const endDate = parseISO(appt.endAt);
      const price = Number(appt.totalPrice ?? 0);

      return {
        ...appt,
        startDate,
        endDate,
        price,
      };
    });

    const completedAppointments = normalizedAppointments.filter(
      (appt) => appt.status === "COMPLETED"
    );

    const pendingAppointments = normalizedAppointments.filter(
      (appt) =>
        appt.status === "RESERVED" || appt.status === "DEPOSIT_PAID"
    );

    const upcomingAppointments = normalizedAppointments
      .filter((appt) => isAfter(appt.startDate, now))
      .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
      .slice(0, 5)
      .map((appt) => ({
        id: appt.id,
        time: `${format(appt.startDate, "HH:mm")} - ${format(appt.endDate, "HH:mm")}`,
        clientName: appt.client?.fullName ?? "Cliente sin nombre",
        serviceName: appt.service?.name ?? "Servicio",
        professionalName: appt.professional?.name ?? "Profesional",
        color: appt.professional?.color ?? "#6CCC83",
      }));

    const revenueToday = completedAppointments.reduce(
      (acc, appt) => acc + appt.price,
      0
    );

    const popularServicesMap = new Map<string, { name: string; count: number }>();

    normalizedAppointments.forEach((appt) => {
      const serviceId = appt.service?.id;
      const serviceName = appt.service?.name ?? "Servicio";

      if (!serviceId) return;

      const current = popularServicesMap.get(serviceId);

      if (current) {
        current.count += 1;
      } else {
        popularServicesMap.set(serviceId, {
          name: serviceName,
          count: 1,
        });
      }
    });

    const popularServices = Array.from(popularServicesMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const teamCountMap = new Map<string, number>();

    normalizedAppointments.forEach((appt) => {
      const professionalId = appt.professional?.id;
      if (!professionalId) return;

      teamCountMap.set(
        professionalId,
        (teamCountMap.get(professionalId) ?? 0) + 1
      );
    });

    const depositToday = normalizedAppointments.reduce(
      (acc, appt) => acc + Number(appt.depositAmount ?? 0),
      0
    );

    const cashToday = completedAppointments.reduce((acc, appt) => {
      const price = Number(appt.totalPrice ?? 0);
      const deposit = Number(appt.depositAmount ?? 0);
      return acc + Math.max(price - deposit, 0);
    }, 0);

    const totalToday = completedAppointments.reduce(
      (acc, appt) => acc + Number(appt.totalPrice ?? 0) - Number(appt.depositAmount),
      0
    );

    const paymentMethodTotals = {
      CASH: 0,
      TRANSFER: 0,
      MERCADOPAGO: 0,
      OTHER: 0,
    };

    completedAppointments.forEach((appt) => {
      const totalPrice = Number(appt.totalPrice ?? 0);
      const deposit = Number(appt.depositAmount ?? 0);
      const remaining = Math.max(totalPrice - deposit, 0);

      if (remaining > 0 && appt.finalPaymentMethod) {
        if (appt.finalPaymentMethod in paymentMethodTotals) {
          paymentMethodTotals[appt.finalPaymentMethod as keyof typeof paymentMethodTotals] += remaining;
        }
      }
    });

    const paymentMethodsToday = [
      { label: "Efectivo", amount: paymentMethodTotals.CASH },
      { label: "Transferencia", amount: paymentMethodTotals.TRANSFER },
      { label: "Mercado Pago", amount: paymentMethodTotals.MERCADOPAGO },
      { label: "Otro", amount: paymentMethodTotals.OTHER },
    ];

    const activeTeam = professionals
      .map((professional) => ({
        id: professional.id,
        name: professional.name,
        color: professional.color,
        countToday: teamCountMap.get(professional.id) ?? 0,
      }))
      .sort((a, b) => b.countToday - a.countToday);

    return {
      stats: {
        appointmentsToday: normalizedAppointments.length,
        pendingToday: pendingAppointments.length,
        depositToday,
        cashToday,
        totalToday,
        completedToday: completedAppointments.length,
        professionals: professionals.length,
        clients: clients.length,
        revenueToday,
      },
      paymentMethodsToday,
      upcomingAppointments,
      popularServices,
      activeTeam,
    };
  }, [appointments, professionals, clients]);

  const isLoading =
    clientsLoading || professionalsLoading || dailyLoading;

  return (
    <div className="max-w-full space-y-6">
      <DashboardDateNavigator
        value={selectedDate}
        onChange={setSelectedDate}
      />
      {
        isLoading? (
          <DashboardStatSkeleton />
        ) : (
          <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Cobro de turnos hoy"
              value={isLoading ? "..." : formatCurrency(dashboardData.stats.revenueToday)}
              subtitle={
                isLoading
                  ? "Cargando..."
                  : `${dashboardData.stats.completedToday} completados`
              }
              icon={<DollarSign className="h-5 w-5" />}
              iconBg="bg-blue-50"
              iconColor="text-blue-600"
            />

            <RevenueBreakdownCard
              isLoading={isLoading}
              deposit={dashboardData.stats.depositToday}
              cash={dashboardData.stats.cashToday}
            />

            <StatCard
              title="Turnos hoy"
              value={dashboardData.stats.appointmentsToday}
              subtitle={
                isLoading
                  ? "Cargando..."
                  : `${dashboardData.stats.pendingToday} pendientes`
              }
              icon={<CalendarDays className="h-5 w-5" />}
              iconBg="bg-teal-50"
              iconColor="text-teal-600"
            />

            <StatCard
              title="Clientes"
              value={isLoading ? "..." : dashboardData.stats.clients}
              subtitle="Registrados"
              icon={<UserCircle2 className="h-5 w-5" />}
              iconBg="bg-amber-50"
              iconColor="text-amber-600"
            />


          </section>
        )
      }

      

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          {isLoading ? (
              <UpcomingAppointmentsSkeleton />
            ) : (
            <SectionCard
              title="Próximos turnos de hoy"
              actionLabel="Ver agenda"
            >
              {isLoading ? (
                <div className="flex min-h-47.5 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/70">
                  <p className="text-sm text-slate-400">Cargando turnos...</p>
                </div>
              ) : dashboardData.upcomingAppointments.length === 0 ? (
                <div className="flex min-h-47.5 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/70">
                  <p className="text-sm text-slate-400">
                    No hay turnos próximos para hoy
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {dashboardData.upcomingAppointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className={`flex items-center justify-between rounded-md border-l-4  px-4 py-3`}
                      style={{ borderLeftColor: appointment.color }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-teal-50 px-3 py-2 text-sm font-semibold text-teal-700">
                          {appointment.time}
                        </div>

                        <div>
                          <p className="font-medium text-slate-900">
                            {appointment.clientName}
                          </p>
                          <p className="text-sm text-slate-500">
                            {appointment.serviceName} · {appointment.professionalName}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          )}
          
        </div>

        {isLoading ? (
          <DashboardSideSkeleton />
          ) : (
            <div className="space-y-4">
              <SectionCard title="Cierre de Caja">
                {dashboardData.popularServices.length === 0 ? (
                  <div className="py-3 text-sm text-slate-400">
                    No hay turnos hoy
                  </div>
                ) : (
                  <div className="space-y-4">
                    {dashboardData.paymentMethodsToday.map((method) => (
                      <div
                        key={method.label}
                        className="flex items-center justify-between gap-3"
                      >
                        <p className="text-sm font-medium text-slate-700">
                          {method.label}
                        </p>

                        <span className="font-semibold text-slate-700">
                          {formatCurrency(method.amount)}
                        </span>
                      </div>
                    ))}
                    <div
                        className="flex items-center justify-between gap-3 border-t border-slate-300 pt-2"
                      >
                        <p className="text-sm font-medium text-slate-700">
                          Total
                        </p>

                        <span className="font-semibold text-slate-700">
                          {formatCurrency(dashboardData.stats.totalToday)}
                        </span>
                      </div>
                  </div>
                )}
              </SectionCard>

              <SectionCard title="Equipo activo">
                {isLoading ? (
                  <div className="py-3 text-sm text-slate-400">Cargando equipo...</div>
                ) : dashboardData.activeTeam.length === 0 ? (
                  <div className="py-3 text-sm text-slate-400">
                    No hay profesionales activos
                  </div>
                ) : (
                  <div className="space-y-4">
                    {dashboardData.activeTeam.map((person, index) => (
                      <div
                        key={person.id}
                        className="flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white ${getAvatarColor(
                              index
                            )}`}
                          >
                            {getInitials(person.name)}
                          </div>

                          <p className="text-sm font-medium text-slate-700">
                            {person.name}
                          </p>
                        </div>

                        <span className="text-sm text-slate-400">
                          {person.countToday} hoy
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </SectionCard>
            </div>
          )
        }
  
        
      </section>
    </div>
  );
}