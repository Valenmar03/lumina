import { useEffect, useState } from "react";
import { addDays, format, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";

import type { AgendaAppointment, Professional } from "../../types/agenda";
import type { AgendaView } from "../../pages/AgendaPage";
import MobileDayView from "./MobileDayView.tsx";
import MobileWeekView from "./MobileWeekView.tsx";

type Props = {
  view: AgendaView;
  setView: (view: AgendaView) => void;
  currentDate: Date;
  setCurrentDate: React.Dispatch<React.SetStateAction<Date>>;
  weekDays: Date[];
  appointments: AgendaAppointment[];
  HOURS: number[];
  selectedProfessionalId: string;
  selectedProfessional: Professional | null;
  professionals: Professional[];
  handleSlotClick: (
    date: Date,
    time: string,
    professionalId?: string,
  ) => void;
  handleAppointmentClick: (appointment: AgendaAppointment) => void;
};

export default function MobileAgenda({
  view,
  setView,
  currentDate,
  setCurrentDate,
  weekDays,
  appointments,
  HOURS,
  selectedProfessionalId,
  selectedProfessional,
  handleSlotClick,
  handleAppointmentClick,
}: Props) {
  const [selectedWeekDay, setSelectedWeekDay] = useState(currentDate);

  useEffect(() => {
    setSelectedWeekDay(currentDate);
  }, [currentDate]);

  const navigate = (direction: -1 | 1) => {
    const step = view === "week" ? 7 : 1;
    setCurrentDate((prev) => addDays(prev, direction * step));
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden">
      <div className="sticky top-0 z-20 bg-white border-b border-slate-200">
        <div className="p-3 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={() => navigate(-1)}
              className="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="min-w-0 text-center">
              <p className="text-base font-semibold text-slate-900 capitalize">
                {format(currentDate, "EEEE d 'de' MMM", { locale: es })}
              </p>
              <p className="text-xs text-slate-500">
                {selectedProfessionalId === "all"
                  ? "Todos los profesionales"
                  : selectedProfessional?.name}
              </p>
            </div>

            <button
              onClick={() => navigate(1)}
              className="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentDate(new Date())}
              className="h-9 px-3 text-xs rounded-lg border border-slate-200 bg-white"
            >
              Hoy
            </button>

            <div className="flex gap-1 bg-slate-100 rounded-lg p-0.5 flex-1">
              {(["day", "week"] as AgendaView[]).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    view === v
                      ? "bg-white shadow-sm text-slate-800"
                      : "text-slate-500"
                  }`}
                >
                  {v === "day" ? "Día" : "Semana"}
                </button>
              ))}
            </div>

            <button
              onClick={() => handleSlotClick(currentDate, "09:00")}
              className="h-9 w-9 inline-flex items-center justify-center rounded-lg bg-teal-600 text-white"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {view === "week" && (
            <div className="px-2 pb-3">
                <div className="grid grid-cols-7 gap-1.5">
                {weekDays.map((day) => {
                    const active = isSameDay(day, selectedWeekDay);
                    const today = isSameDay(day, new Date());

                    return (
                    <button
                        key={day.toISOString()}
                        onClick={() => {
                        setSelectedWeekDay(day);
                        setCurrentDate(day);
                        }}
                        className={`min-w-0 rounded-xl border py-2 text-center transition-colors ${
                        active
                            ? "border-teal-500 bg-teal-50"
                            : "border-slate-200 bg-white"
                        }`}
                    >
                        <p className="text-[10px] text-slate-500 capitalize truncate">
                        {format(day, "EEE", { locale: es })}
                        </p>

                        <p
                        className={`text-sm font-semibold ${
                            active || today ? "text-teal-600" : "text-slate-800"
                        }`}
                        >
                        {format(day, "d")}
                        </p>
                    </button>
                    );
                })}
                </div>
            </div>
        )}
      </div>

      {view === "day" ? (
        <MobileDayView
          date={currentDate}
          appointments={appointments}
          HOURS={HOURS}
          selectedProfessionalId={selectedProfessionalId}
          handleSlotClick={handleSlotClick}
          handleAppointmentClick={handleAppointmentClick}
        />
      ) : (
        <MobileWeekView
          selectedDay={selectedWeekDay}
          appointments={appointments}
          HOURS={HOURS}
          selectedProfessionalId={selectedProfessionalId}
          handleSlotClick={handleSlotClick}
          handleAppointmentClick={handleAppointmentClick}
        />
      )}
    </div>
  );
}