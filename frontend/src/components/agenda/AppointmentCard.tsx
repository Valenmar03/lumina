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

function getStatusUi(status?: string) {
  switch (status) {
    case "CONFIRMED":
      return {
        dot: "bg-cyan-500",
        badge: "bg-cyan-100 text-cyan-700 border-cyan-200",
        label: "Confirmado",
        cardClass: "",
        titleClass: "text-slate-800",
        metaClass: "text-slate-500",
      };

    case "COMPLETED":
      return {
        dot: "bg-emerald-500",
        badge: "bg-emerald-100 text-emerald-700 border-emerald-200",
        label: "Realizado",
        cardClass: "",
        titleClass: "text-slate-800",
        metaClass: "text-slate-500",
      };

    case "NO_SHOW":
      return {
        dot: "bg-amber-500",
        badge: "bg-amber-100 text-amber-700 border-amber-200",
        label: "No asistió",
        cardClass: "",
        titleClass: "text-slate-800",
        metaClass: "text-slate-500",
      };

    case "CANCELED":
      return {
        dot: "bg-red-500",
        badge: "bg-red-100 text-red-700 border-red-200",
        label: "Cancelado",
        cardClass: "opacity-60",
        titleClass: "text-slate-500 line-through",
        metaClass: "text-slate-400",
      };

    case "PENDING_RESOLUTION":
      return {
        dot: "bg-violet-500",
        badge: "bg-violet-100 text-violet-700 border-violet-200",
        label: "Pendiente",
        cardClass: "",
        titleClass: "text-slate-800",
        metaClass: "text-slate-500",
      };

    default:
      return {
        dot: "bg-slate-400",
        badge: "bg-slate-100 text-slate-600 border-slate-200",
        label: "Sin estado",
        cardClass: "",
        titleClass: "text-slate-800",
        metaClass: "text-slate-500",
      };
  }
}

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
  
  const effectiveStatus = appt.isPendingResolution
    ? "PENDING_RESOLUTION"
    : appt.status;

  const statusUi = getStatusUi(effectiveStatus);

  if (compact) {
    return (
      <div
        className={`absolute overflow-hidden rounded border-l-2 px-1.5 py-1 text-xs leading-tight cursor-pointer transition-shadow hover:shadow-sm ${statusUi.cardClass}`}
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
        <div className="flex items-center gap-1">
          <span
            className={`h-2 w-2 shrink-0 rounded-full ${statusUi.dot}`}
            aria-hidden="true"
          />
          <p className={`truncate font-medium leading-tight ${statusUi.titleClass}`}>
            {appt.client.fullName}
          </p>
        </div>

        {height > 24 && (
          <p className={`truncate leading-tight ${statusUi.metaClass}`}>
            {format(parseISO(appt.startAt), "HH:mm")} -{" "}
            {format(parseISO(appt.endAt), "HH:mm")}
          </p>
        )}

        {showProfessionalName && height > 38 && (
          <p className="truncate text-slate-500">{appt.professional?.name}</p>
        )}
      </div>
    );
  }

  return (
    <div
      className={`absolute left-1 right-1 z-10 overflow-hidden rounded-md border-l-[3px] px-2 py-1.5 text-xs cursor-pointer transition-all hover:shadow-md ${statusUi.cardClass}`}
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
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span
              className={`h-2.5 w-2.5 shrink-0 rounded-full ${statusUi.dot}`}
              aria-hidden="true"
            />
            <p className={`truncate font-medium leading-tight ${statusUi.titleClass}`}>
              {appt.client.fullName}
            </p>
          </div>

          <p className={`truncate leading-tight ${statusUi.metaClass}`}>
            {format(parseISO(appt.startAt), "HH:mm")} -{" "}
            {format(parseISO(appt.endAt), "HH:mm")}
          </p>
        </div>

        {height > 44 && (
          <span
            className={`shrink-0 rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${statusUi.badge}`}
          >
            {statusUi.label}
          </span>
        )}
      </div>

      {height > 52 && (
        <p className="mt-1 truncate leading-tight text-slate-500">
          {appt.service.name}
        </p>
      )}

      {showProfessionalName && height > 68 && (
        <p className="truncate leading-tight text-slate-400">
          {appt.professional?.name}
        </p>
      )}
    </div>
  );
}