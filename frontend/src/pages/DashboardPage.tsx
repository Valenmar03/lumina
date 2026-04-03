import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format, isAfter, parseISO } from "date-fns";
import {
  CalendarDays,
  DollarSign,
  Clock,
  ArrowRight,
} from "lucide-react";

import { useBusiness } from "../hooks/useBusiness";
import SectionCard from "../components/dashboard/SectionCard";
import StatCard from "../components/dashboard/StatCard";
import { useProfessionals } from "../hooks/useProfessionals";
import { useAgendaDaily } from "../hooks/useAgenda";
import { useAuth } from "../hooks/useAuth";
import DashboardSideSkeleton from "../components/dashboard/skeleton/DashboardSideSkeleton";
import DashboardStatSkeleton from "../components/dashboard/skeleton/DashboardStatSkeleton";
import UpcomingAppointmentsSkeleton from "../components/dashboard/skeleton/UpcomingAppointmentSkeleton";
import RevenueBreakdownCard from "../components/dashboard/RevenueBreakDownCard";
import DashboardDateNavigator from "../components/dashboard/DashboardDateNavigator";
import AppointmentDetailModal from "../components/appointment/AppointmentDetailModal";
import type { AgendaAppointment } from "../types/entities";
import { appointmentStatusLabels, appointmentStatusColors } from "../types/entities";

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
  const { user } = useAuth();
  const navigate = useNavigate();
  const isPro = user?.role === "PRO";

  const { data: businessData } = useBusiness();
  useEffect(() => {
    if (businessData && businessData.business.onboardingCompleted === false) {
      navigate("/onboarding", { replace: true });
    }
  }, [businessData, navigate]);

  const [selectedDate, setSelectedDate] = useState(() =>
    format(new Date(), "yyyy-MM-dd")
  );
  const [selectedAppointment, setSelectedAppointment] =
    useState<AgendaAppointment | null>(null);

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
        (appt.status === "RESERVED" || appt.status === "DEPOSIT_PAID") &&
        appt.endDate < now &&
        (!isPro || appt.professional?.id === user?.professionalId)
    );

    const remainingAppointments = normalizedAppointments.filter(
      (appt) =>
        (appt.status === "RESERVED" || appt.status === "DEPOSIT_PAID") &&
        appt.endDate >= now
    );

    const upcomingAppointments = normalizedAppointments
      .filter(
        (appt) =>
          isAfter(appt.startDate, now) &&
          (!isPro || appt.professional?.id === user?.professionalId)
      )
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
        remainingToday: remainingAppointments.length,
        depositToday,
        cashToday,
        totalToday,
        completedToday: completedAppointments.length,
        professionals: professionals.length,
        revenueToday,
      },
      pendingAppointments,
      paymentMethodsToday,
      upcomingAppointments,
      popularServices,
      activeTeam,
    };
  }, [appointments, professionals, isPro, user]);

  const isLoading = professionalsLoading || dailyLoading;

  return (
    <div className="max-w-full space-y-6">
      <DashboardDateNavigator
        value={selectedDate}
        onChange={setSelectedDate}
      />
      {isLoading ? (
        <DashboardStatSkeleton />
      ) : (
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Cobro de turnos hoy"
            value={formatCurrency(dashboardData.stats.revenueToday)}
            subtitle={`${dashboardData.stats.completedToday} completados`}
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
              [
                dashboardData.stats.remainingToday > 0
                  ? `${dashboardData.stats.remainingToday} restantes`
                  : null,
                dashboardData.stats.pendingToday > 0
                  ? `${dashboardData.stats.pendingToday} pend. resolución`
                  : null,
              ]
                .filter(Boolean)
                .join(" · ") || "Sin turnos activos"
            }
            icon={<CalendarDays className="h-5 w-5" />}
            iconBg="bg-teal-50"
            iconColor="text-teal-600"
          />

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
              Equipo activo
            </p>
            {dashboardData.activeTeam.length === 0 ? (
              <p className="text-sm text-slate-400">Sin profesionales hoy</p>
            ) : (
              <div className="space-y-2.5">
                {dashboardData.activeTeam.map((person, index) => (
                  <div key={person.id} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white ${getAvatarColor(index)}`}
                      >
                        {getInitials(person.name)}
                      </div>
                      <p className="text-sm font-medium text-slate-700 truncate">
                        {person.name}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-slate-400">
                      {person.countToday} turnos
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-6 xl:items-start">
        {/* Pendientes — col-span-3 */}
        <div className="xl:col-span-3">
          {isLoading ? (
            <UpcomingAppointmentsSkeleton />
          ) : (
            <div className="rounded-2xl border border-violet-200 bg-violet-50/60 shadow-sm overflow-hidden">
              <div className="flex items-center gap-2.5 border-b border-violet-200 px-5 py-4">
                <Clock className="h-4 w-4 text-violet-600" />
                <h2 className="text-base font-semibold text-violet-900">
                  Pendientes de resolución
                </h2>
                {dashboardData.pendingAppointments.length > 0 && (
                  <span className="ml-auto rounded-full bg-violet-200 px-2.5 py-0.5 text-xs font-semibold text-violet-800">
                    {dashboardData.pendingAppointments.length}
                  </span>
                )}
              </div>

              {dashboardData.pendingAppointments.length === 0 ? (
                <div className="flex items-center justify-center px-5 py-8">
                  <p className="text-sm text-violet-400">
                    No hay turnos pendientes de resolución
                  </p>
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto divide-y divide-violet-100">
                  {dashboardData.pendingAppointments.map((appt) => {
                    const start = parseISO(appt.startAt);
                    const end = parseISO(appt.endAt);
                    const statusLabel = appt.status ? appointmentStatusLabels[appt.status] : "";
                    const statusColor = appt.status ? appointmentStatusColors[appt.status] : "";

                    return (
                      <button
                        key={appt.id}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-violet-100/60 transition-colors cursor-pointer"
                        onClick={() => setSelectedAppointment(appt)}
                      >
                        <div className="shrink-0 rounded-lg bg-white border border-violet-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 tabular-nums">
                          {format(start, "HH:mm")}–{format(end, "HH:mm")}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-slate-900 truncate">
                            {appt.client?.fullName}
                          </p>
                          <p className="text-xs text-slate-500 truncate">
                            {appt.service?.name}
                            {appt.professional?.name ? ` · ${appt.professional.name}` : ""}
                          </p>
                        </div>

                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${statusColor}`}>
                          {statusLabel}
                        </span>

                        <span className="shrink-0 hidden sm:inline text-xs text-violet-600 font-medium flex items-center gap-0.5">
                          Resolver <ArrowRight className="h-3 w-3" />
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Próximos turnos — col-span-2 */}
        <div className="xl:col-span-2">
          {isLoading ? (
            <UpcomingAppointmentsSkeleton />
          ) : (
            <SectionCard title="Próximos turnos de hoy" actionLabel="Ver agenda">
              {dashboardData.upcomingAppointments.length === 0 ? (
                <div className="flex min-h-40 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/70">
                  <p className="text-sm text-slate-400">
                    No hay turnos próximos para hoy
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {dashboardData.upcomingAppointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="flex items-center gap-3 rounded-md border-l-4 px-3 py-2.5"
                      style={{ borderLeftColor: appointment.color }}
                    >
                      <div className="shrink-0 rounded-lg bg-teal-50 px-2.5 py-1.5 text-xs font-semibold text-teal-700 tabular-nums">
                        {appointment.time}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {appointment.clientName}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {appointment.serviceName} · {appointment.professionalName}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          )}
        </div>

        {/* Cierre de Caja — col-span-1 */}
        <div className="xl:col-span-1">
          {isLoading ? (
            <DashboardSideSkeleton />
          ) : (
            <SectionCard title="Cierre de Caja">
              {dashboardData.stats.completedToday === 0 ? (
                <div className="py-3 text-sm text-slate-400">
                  No hay turnos hoy
                </div>
              ) : (
                <div className="space-y-4">
                  {dashboardData.paymentMethodsToday.map((method) => (
                    <div key={method.label} className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-slate-700">{method.label}</p>
                      <span className="font-semibold text-slate-700">
                        {formatCurrency(method.amount)}
                      </span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between gap-3 border-t border-slate-300 pt-2">
                    <p className="text-sm font-medium text-slate-700">Total</p>
                    <span className="font-semibold text-slate-700">
                      {formatCurrency(dashboardData.stats.totalToday)}
                    </span>
                  </div>
                </div>
              )}
            </SectionCard>
          )}
        </div>
      </section>

      <AppointmentDetailModal
        open={!!selectedAppointment}
        appointment={selectedAppointment}
        onClose={() => setSelectedAppointment(null)}
      />
    </div>
  );
}
