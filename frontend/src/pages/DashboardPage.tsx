import { useMemo } from "react";
import { format, isAfter, parseISO } from "date-fns";
import { es } from "date-fns/locale";
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
import { useNavigate } from "react-router-dom";
import DashboardSideSkeleton from "../components/dashboard/skeleton/DashboardSideSkeleton";
import DashboardStatSkeleton from "../components/dashboard/skeleton/DashboardStatSkeleton";
import UpcomingAppointmentsSkeleton from "../components/dashboard/skeleton/UpcomingAppointmentSkeleton";

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
  const currentDate = new Date();
  const currentDateYMD = format(currentDate, "yyyy-MM-dd");

  const { data: clientsData, isLoading: clientsLoading } = useClients();
  const clients = clientsData?.clients ?? [];

  const { data: professionalsData, isLoading: professionalsLoading } =
    useProfessionals();

  const professionals = (professionalsData?.professionals ?? []).filter(
    (p) => p.active
  );

  const { data: dailyAgenda, isLoading: dailyLoading } = useAgendaDaily(
    undefined,
    currentDateYMD
  );

  const navigate = useNavigate();

  const appointments = dailyAgenda?.appointments ?? [];


  const dashboardData = useMemo(() => {
    const now = new Date();

    const normalizedAppointments = appointments.map((appt) => {
      const startDate = parseISO(appt.startAt);
      const endDate = parseISO(appt.endAt);
      const price = Number(appt.priceFinal ?? 0);

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
        revenueToday,
        completedToday: completedAppointments.length,
        professionals: professionals.length,
        clients: clients.length,
      },
      upcomingAppointments,
      popularServices,
      activeTeam,
    };
  }, [appointments, professionals, clients]);

  const isLoading =
    clientsLoading || professionalsLoading || dailyLoading;

  return (
    <div className="max-w-full space-y-6">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Dashboard
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">
            {format(currentDate, "EEEE d 'de' MMMM, yyyy", { locale: es })}
          </p>
        </div>
      </div>
      {
        isLoading? (
          <DashboardStatSkeleton />
        ) : (
          <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
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
              title="Ingresos hoy"
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

            <StatCard
              title="Profesionales"
              value={isLoading ? "..." : dashboardData.stats.professionals}
              subtitle="Equipo activo"
              icon={<Users className="h-5 w-5" />}
              iconBg="bg-violet-50"
              iconColor="text-violet-600"
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
              onActionClick={() => {
                () => navigate("/agenda")
              }}
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
                      className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3"
                    >
                      <div className="flex items-start gap-3">
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
              <SectionCard title="Servicios populares">
                {dashboardData.popularServices.length === 0 ? (
                  <div className="py-3 text-sm text-slate-400">
                    No hay servicios con turnos hoy
                  </div>
                ) : (
                  <div className="space-y-4">
                    {dashboardData.popularServices.map((service) => (
                      <div
                        key={service.name}
                        className="flex items-center justify-between gap-3"
                      >
                        <p className="text-sm font-medium text-slate-700">
                          {service.name}
                        </p>

                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
                          {service.count} turnos
                        </span>
                      </div>
                    ))}
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