import { format, parseISO } from "date-fns";
import type { AgendaAppointment, DailyUnavailability, Professional } from "../../types/entities";
import MobileAppointmentCard from "../appointment/MobileAppointmentCard.tsx";
import { useAgendaDaily } from "../../hooks/useAgenda.ts";

type Props = {
  date: Date;
  appointments: AgendaAppointment[];
  HOURS: number[];
  professionals: Professional[];
  selectedProfessionalId: string;
  handleSlotClick: (
    date: Date,
    time: string,
    professionalId?: string,
  ) => void;
  handleAppointmentClick: (appointment: AgendaAppointment) => void;
};

export default function MobileDayView({
  date,
  appointments,
  HOURS,
  professionals,
  selectedProfessionalId,
  handleSlotClick,
  handleAppointmentClick,
}: Props) {
  const currentDateYMD = format(date, "yyyy-MM-dd");

  const effectiveProfessionalId =
    selectedProfessionalId === "all" ? undefined : selectedProfessionalId;

  const { data: dailyAgenda, isLoading: dailyLoading } = useAgendaDaily(
    effectiveProfessionalId,
    currentDateYMD,
  );

  const appointmentsForDay = appointments.filter((appt) => {
    const start = parseISO(appt.startAt);
    const sameDay = format(start, "yyyy-MM-dd") === currentDateYMD;

    if (!sameDay) return false;
    if (selectedProfessionalId === "all") return true;

    return appt.professionalId === selectedProfessionalId;
  });

  const dailyScheduleBlocksByProfessional =
    dailyAgenda?.scheduleBlocksByProfessional ?? {};

  const dailyUnavailabilitiesByProfessional =
    dailyAgenda?.unavailabilitiesByProfessional ?? {};

  const professionalsToShow =
    selectedProfessionalId === "all"
      ? professionals
      : professionals.filter((p) => p.id === selectedProfessionalId);

  return (
    <div>
      <div className="border-b border-slate-100 bg-slate-50/70 px-3 py-2">
        {dailyLoading ? (
          <p className="text-[11px] text-slate-400">Cargando horarios...</p>
        ) : (
          <div className="space-y-2">
            {professionalsToShow.map((professional) => {
              const blocks =
                dailyScheduleBlocksByProfessional[professional.id] ?? [];
              const unavailabilities: DailyUnavailability[] =
                dailyUnavailabilitiesByProfessional[professional.id] ?? [];

              return (
                <div
                  key={professional.id}
                  className="flex flex-wrap items-center gap-1.5"
                >
                  <span className="text-[11px] font-medium text-slate-500">
                    {professional.name}:
                  </span>

                  {blocks.length === 0 && unavailabilities.length === 0 ? (
                    <span className="text-[11px] text-slate-400">
                      No trabaja hoy
                    </span>
                  ) : (
                    <>
                      {blocks.map((block) => (
                        <span
                          key={
                            block.id ??
                            `${professional.id}-${block.dayOfWeek}-${block.startTime}-${block.endTime}`
                          }
                          className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] text-slate-600"
                        >
                          {block.startTime} - {block.endTime}
                        </span>
                      ))}
                      {unavailabilities.map((u) => (
                        <span
                          key={u.id}
                          className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] text-red-500"
                          title={u.reason ?? undefined}
                        >
                          {format(parseISO(u.startAt), "HH:mm")} – {format(parseISO(u.endAt), "HH:mm")}
                          {u.reason ? ` · ${u.reason}` : ""}
                        </span>
                      ))}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="divide-y divide-slate-100">
        {HOURS.map((hour) => {
          const hourAppointments = appointmentsForDay
            .filter((appt) => parseISO(appt.startAt).getHours() === hour)
            .sort(
              (a, b) =>
                new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
            );

          return (
            <div key={hour} className="p-3">
              <div className="flex items-start gap-3">
                <div className="w-14 shrink-0 pt-1 text-xs font-medium text-slate-400">
                  {String(hour).padStart(2, "0")}:00
                </div>

                <div className="flex-1 space-y-2">
                  {hourAppointments.length === 0 ? (
                    <button
                      className="w-full rounded-xl border border-dashed border-slate-200 py-3 text-left text-sm text-slate-400 hover:bg-slate-50"
                      onClick={() =>
                        handleSlotClick(
                          date,
                          `${String(hour).padStart(2, "0")}:00`,
                          selectedProfessionalId === "all"
                            ? undefined
                            : selectedProfessionalId,
                        )
                      }
                    >
                      <span className="px-3">Disponible</span>
                    </button>
                  ) : (
                    <>
                      {hourAppointments.map((appt) => (
                        <MobileAppointmentCard
                          key={appt.id}
                          appt={appt}
                          showProfessional={selectedProfessionalId === "all"}
                          onClick={handleAppointmentClick}
                        />
                      ))}

                      <button
                        className="w-full rounded-xl border border-dashed border-slate-200 py-2 text-sm text-slate-400 hover:bg-slate-50"
                        onClick={() =>
                          handleSlotClick(
                            date,
                            `${String(hour).padStart(2, "0")}:00`,
                            selectedProfessionalId === "all"
                              ? undefined
                              : selectedProfessionalId,
                          )
                        }
                      >
                        + Agregar turno
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}