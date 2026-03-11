import { format, parseISO } from "date-fns";
import type { AgendaAppointment } from "../../types/agenda";
import MobileAppointmentCard from "./MobileAppointmentCard.tsx";

type Props = {
  date: Date;
  appointments: AgendaAppointment[];
  HOURS: number[];
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
  selectedProfessionalId,
  handleSlotClick,
  handleAppointmentClick,
}: Props) {
  const dayStr = format(date, "yyyy-MM-dd");

  const appointmentsForDay = appointments.filter((appt) => {
    const start = parseISO(appt.startAt);
    const sameDay = format(start, "yyyy-MM-dd") === dayStr;

    if (!sameDay) return false;
    if (selectedProfessionalId === "all") return true;

    return appt.professionalId === selectedProfessionalId;
  });

  return (
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
  );
}