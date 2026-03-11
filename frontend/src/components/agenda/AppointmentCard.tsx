import type { AgendaAppointment } from "../../types/agenda";
import { format, parseISO } from "date-fns";

type AppointmentCardProps = {
  appt: AgendaAppointment;
  color: string;
  top: number;
  height: number;
  compact?: boolean;
  showProfessionalName?: boolean;
  onClick: (appt: AgendaAppointment) => void;
  style?: React.CSSProperties;
};

export default function AppointmentCard({
  appt,
  color,
  top,
  height,
  compact = false,
  showProfessionalName = false,
  onClick,
  style,
}: AppointmentCardProps) {
  if (compact) {
    return (
      <div
        className="absolute rounded px-1 py-0.5 text-xs leading-tight overflow-hidden border-l-2 cursor-pointer"
        style={{
          top: `${top}px`,
          height: `${height}px`,
          borderLeftColor: color,
          backgroundColor: `${color}18`,
          ...style,
        }}
        onClick={(e) => {
          e.stopPropagation();
          onClick(appt);
        }}
      >
        <p className="font-medium text-slate-800 leading-tight">
            {appt.client.fullName}{" "}
            <span className="text-slate-500">
                - {format(parseISO(appt.startAt), "HH:mm")} - {format(parseISO(appt.endAt), "HH:mm")}
            </span>
        </p>

        {showProfessionalName && (
          <p className="truncate text-slate-500">
            {appt.professional?.name}
          </p>
        )}
      </div>
    );
  }

  return (
    <div
      className="absolute left-1 right-1 rounded-md px-2 py-1 text-xs z-10 overflow-hidden border-l-[3px] hover:shadow-md transition-shadow cursor-pointer"
      style={{
        top: `${top}px`,
        height: `${height}px`,
        borderLeftColor: color,
        backgroundColor: `${color}18`,
        ...style,
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick(appt);
      }}
    >
        <p className="font-medium text-slate-800 truncate leading-tight">
            {appt.client.fullName}{" "}
            <span className="text-slate-500">
                | {format(parseISO(appt.startAt), "HH:mm")} - {format(parseISO(appt.endAt), "HH:mm")}
            </span>
        </p>

      {height > 32 && (
        <p className="text-slate-500 truncate leading-tight">
          {appt.service.name}
        </p>
      )}
    </div>
  );
}