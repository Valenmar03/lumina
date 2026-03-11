import { parseISO } from "date-fns";
import TimeLabel from "./TimeLabel";
import AppointmentCard from "./AppointmentCard";
import type { AgendaAppointment, Professional, ScheduleBlock } from "../../types/agenda";

type DayViewProps = {
  selectedProfessionalId: string;
  selectedProfessional?: Professional | null;
  professionals: Professional[];
  dailyScheduleBlocksByProfessional: Record<string, ScheduleBlock[]>;
  dayAppointments: AgendaAppointment[];
  HOURS: number[];
  currentDate: Date;
  handleSlotClick: (
    date: Date,
    time: string,
    professionalId?: string,
  ) => void;
  handleAppointmentClick: (appt: AgendaAppointment) => void;
  getAppointmentTopAndHeight: (appt: AgendaAppointment) => { top: number; height: number };
};

export default function DayView({
  selectedProfessionalId,
  selectedProfessional,
  professionals,
  dailyScheduleBlocksByProfessional,
  dayAppointments,
  HOURS,
  currentDate,
  handleSlotClick,
  handleAppointmentClick,
  getAppointmentTopAndHeight,
}: DayViewProps) {
  if (selectedProfessionalId === "all") {
    return (
      <div className="overflow-x-auto">
        <div
          className="grid min-w-250"
          style={{
            gridTemplateColumns: `60px repeat(${professionals.length}, minmax(220px, 1fr))`,
          }}
        >
          <div className="border-b border-r border-slate-200 bg-white sticky top-0 z-10" />

          {professionals.map((professional) => {
            const blocks =
              dailyScheduleBlocksByProfessional[professional.id] ?? [];

            return (
              <div
                key={professional.id}
                className="border-b border-r border-slate-200 bg-white sticky top-0 z-10 p-3 text-center"
              >
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{
                        background: professional.color || "#0D9488",
                      }}
                    />
                    <span className="text-sm font-medium text-slate-700">
                      {professional.name}
                    </span>
                  </div>

                  <div className="flex flex-wrap justify-center gap-2">
                    {blocks.map((block) => (
                      <span
                        key={block.id}
                        className="inline-flex items-center rounded-full bg-white border border-slate-200 px-3 py-1 text-xs text-slate-600"
                      >
                        {block.startTime} - {block.endTime}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}

          {HOURS.map((hour) => (
            <div key={`row-${hour}`} className="contents">
              <TimeLabel hour={hour} className="h-16 border-b" />

              {professionals.map((professional) => {
                const hourAppointments = dayAppointments.filter((appt) => {
                  const start = parseISO(appt.startAt);
                  return (
                    appt.professionalId === professional.id &&
                    start.getHours() === hour
                  );
                });

                return (
                  <div
                    key={`${professional.id}-${hour}`}
                    className="h-16 relative group cursor-pointer hover:bg-teal-50/20 transition-colors border-b border-r border-slate-50"
                    onClick={() =>
                      handleSlotClick(
                        currentDate,
                        `${String(hour).padStart(2, "0")}:00`,
                        professional.id,
                      )
                    }
                  >
                    {hourAppointments.map((appt) => {
                      const { top, height } =
                        getAppointmentTopAndHeight(appt);
                      const color =
                        appt.professional?.color ||
                        professional.color ||
                        "#0D9488";

                      return (
                        <AppointmentCard
                            key={appt.id}
                            appt={appt}
                            color={color}
                            top={top}
                            height={height}
                            onClick={handleAppointmentClick}
                        />
                      );
                    })}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-175">
        <div className="grid border-b border-slate-200 sticky top-0 bg-white z-10 grid-cols-[60px_1fr]">
          <div className="p-2 text-xs text-slate-400 border-r border-slate-100" />
          <div className="p-3 text-center">
            <div className="flex items-center justify-center gap-2 flex-col">
              <div className="flex items-center gap-2">
                <div
                  className="w-2.5 h-2.5 rounded-full flex"
                  style={{
                    background: selectedProfessional?.color || "#0D9488",
                  }}
                />
                <span className="text-sm font-medium text-slate-700">
                  {selectedProfessional?.name}
                </span>
              </div>
            </div>
          </div>
        </div>

        {HOURS.map((hour) => {
          const hourAppointments = dayAppointments.filter((appt) => {
            const start = parseISO(appt.startAt);
            return start.getHours() === hour;
          });

          return (
            <div
              key={hour}
              className="grid border-b border-slate-50 grid-cols-[60px_1fr]"
            >
              <div className="p-2 text-xs text-slate-400 text-right pr-3 border-r border-slate-100 h-16 flex items-start justify-end pt-1">
                {String(hour).padStart(2, "0")}:00
              </div>

              <div
                className="h-16 relative group cursor-pointer hover:bg-teal-50/20 transition-colors"
                onClick={() =>
                  handleSlotClick(
                    currentDate,
                    `${String(hour).padStart(2, "0")}:00`,
                  )
                }
              >
                {hourAppointments.map((appt) => {
                  const { top, height } = getAppointmentTopAndHeight(appt);
                  const color =
                    selectedProfessional?.color ||
                    appt.professional?.color ||
                    "#0D9488";

                  return (
                    <div
                      key={appt.id}
                      className="absolute left-1 right-1 rounded-md px-2 py-1 text-xs z-10 overflow-hidden border-l-[3px] hover:shadow-md transition-shadow cursor-pointer"
                      style={{
                        top: `${top}px`,
                        height: `${height}px`,
                        borderLeftColor: color,
                        backgroundColor: `${color}18`,
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAppointmentClick(appt);
                      }}
                    >
                      <p className="font-medium text-slate-800 truncate leading-tight">
                        {appt.client.fullName}
                      </p>
                      {height > 32 && (
                        <p className="text-slate-500 truncate leading-tight">
                          {appt.service.name}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}