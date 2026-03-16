import { format, isSameDay, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import TimeLabel from "./TimeLabel";
import AppointmentCard from "../appointment/AppointmentCard";
import type { AgendaAppointment, Professional } from "../../types/entities";
import type { AgendaView } from "../../pages/AgendaPage";

type WeekViewProps = {
  weekDays: Date[];
  HOURS: number[];
  appointments: AgendaAppointment[];
  selectedProfessionalId: string;
  selectedProfessional?: Professional | null;
  handleSlotClick: (date: Date, time: string, professionalId?: string) => void
  handleAppointmentClick: (appt: AgendaAppointment) => void;
  getAppointmentTopAndHeight: (appt: AgendaAppointment) => { top: number; height: number };
  setCurrentDate: React.Dispatch<React.SetStateAction<Date>>;
  setView: React.Dispatch<React.SetStateAction<AgendaView>>;
};

function getOverlappingAppointmentsLayout(appointments: any[]) {
  const sorted = [...appointments].sort(
    (a, b) =>
      new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
  );

  const columns: any[][] = [];
  const positioned: Array<any & { column: number; totalColumns: number }> = [];

  for (const appt of sorted) {
    const start = new Date(appt.startAt);

    let placedColumn = -1;

    for (let colIndex = 0; colIndex < columns.length; colIndex++) {
      const column = columns[colIndex];
      const lastApptInColumn = column[column.length - 1];

      const lastEnd = new Date(lastApptInColumn.endAt);

      // si no se superpone con el último de esa columna, entra ahí
      if (start >= lastEnd) {
        column.push(appt);
        placedColumn = colIndex;
        break;
      }
    }

    if (placedColumn === -1) {
      columns.push([appt]);
      placedColumn = columns.length - 1;
    }

    positioned.push({
      ...appt,
      column: placedColumn,
      totalColumns: 1, // lo seteamos después
    });
  }

  const totalColumns = columns.length;

  return positioned.map((appt) => ({
    ...appt,
    totalColumns,
  }));
}

export default function WeekView({
  weekDays,
  HOURS,
  appointments,
  selectedProfessionalId,
  selectedProfessional,
  handleSlotClick,
  handleAppointmentClick,
  getAppointmentTopAndHeight,
  setCurrentDate,
  setView,
}: WeekViewProps) {
  return (
    <div className="overflow-x-auto">
      <div className="min-w-225">
        <div className="grid grid-cols-8 border-b border-slate-200 sticky top-0 bg-white z-10">
          <div className="p-2 text-xs text-slate-400 border-r border-slate-100" />
          {weekDays.map((day) => (
            <div
              key={day.toISOString()}
              className={`p-3 text-center border-r border-slate-100 last:border-r-0 cursor-pointer hover:bg-slate-50 ${
                isSameDay(day, new Date()) ? "bg-teal-50" : ""
              }`}
              onClick={() => {
                setCurrentDate(day);
                setView("day");
              }}
            >
              <p className="text-xs text-slate-400">
                {format(day, "EEE", { locale: es })}
              </p>
              <p
                className={`text-lg font-semibold ${
                  isSameDay(day, new Date())
                    ? "text-teal-600"
                    : "text-slate-700"
                }`}
              >
                {format(day, "d")}
              </p>
            </div>
          ))}
        </div>

        {HOURS.map((hour) => (
          <div
            key={hour}
            className="grid grid-cols-8 border-b border-slate-50"
          >
            <TimeLabel hour={hour} className="h-16" />

            {weekDays.map((day) => {
              const dayStr = format(day, "yyyy-MM-dd");

              const hourAppointments = appointments.filter((appt) => {
                const start = parseISO(appt.startAt);
                return (
                  format(start, "yyyy-MM-dd") === dayStr &&
                  start.getHours() === hour
                );
              });

              return (
                <div
                  key={`${dayStr}-${hour}`}
                  className="h-14 border-r border-slate-50 last:border-r-0 relative cursor-pointer hover:bg-teal-50/20"
                  onClick={() =>
                    handleSlotClick(
                      day,
                      `${String(hour).padStart(2, "0")}:00`,
                      selectedProfessionalId === "all"
                        ? undefined
                        : selectedProfessionalId,
                    )
                  }
                >
                  {getOverlappingAppointmentsLayout(hourAppointments).map((appt) => {
                    const { top, height } = getAppointmentTopAndHeight(appt);
                    const color =
                        appt.professional?.color ||
                        selectedProfessional?.color ||
                        "#0D9488";

                    const gap = 2;
                    const width = `calc((100% - ${(appt.totalColumns - 1) * gap}px) / ${appt.totalColumns})`;
                    const left = `calc(${appt.column} * (${width} + ${gap}px))`;

                    return (
                        <AppointmentCard
                            key={appt.id}
                            appt={appt}
                            color={color}
                            top={top}
                            height={height}
                            compact
                            showProfessionalName={selectedProfessionalId === "all"}
                            onClick={handleAppointmentClick}
                            style={{
                                left,
                                width,
                                right: "auto",
                            }}
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