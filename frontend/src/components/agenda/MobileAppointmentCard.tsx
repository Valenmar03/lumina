import { format, parseISO } from "date-fns";
import type { AgendaAppointment } from "../../types/agenda";

type Props = {
  appt: AgendaAppointment;
  showProfessional?: boolean;
  onClick: (appointment: AgendaAppointment) => void;
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

export default function MobileAppointmentCard({
  appt,
  showProfessional = false,
  onClick,
}: Props) {
  const color = appt.professional?.color || "#0D9488";
  const start = parseISO(appt.startAt);
  const end = parseISO(appt.endAt);
  const effectiveStatus = appt.isPendingResolution
    ? "PENDING_RESOLUTION"
    : appt.status;

  const statusUi = getStatusUi(effectiveStatus);

  return (
    <button
      type="button"
      className={`w-full rounded-xl border border-slate-200 bg-white p-3 text-left shadow-sm transition-shadow hover:shadow-md ${statusUi.cardClass}`}
      onClick={() => onClick(appt)}
      style={{
        borderLeftWidth: 4,
        borderLeftColor: color,
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span
              className={`h-2.5 w-2.5 shrink-0 rounded-full ${statusUi.dot}`}
              aria-hidden="true"
            />
            <p className={`truncate text-sm font-semibold ${statusUi.titleClass}`}>
              {appt.client.fullName}
            </p>
          </div>

          <p className={`mt-0.5 truncate text-xs ${statusUi.metaClass}`}>
            {format(start, "HH:mm")} - {format(end, "HH:mm")}
          </p>

          <p className="mt-1 truncate text-xs text-slate-500">
            {appt.service.name}
          </p>

          {showProfessional && (
            <p className="mt-0.5 truncate text-xs text-slate-400">
              {appt.professional?.name}
            </p>
          )}
        </div>

        {effectiveStatus !== "CONFIRMED" && (
          <span
            className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium ${statusUi.badge}`}
          >
            {statusUi.label}
          </span>
        )}
      </div>
    </button>
  );
}