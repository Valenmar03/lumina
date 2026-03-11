import { format, parseISO } from "date-fns";
import type { AgendaAppointment } from "../../types/agenda";

type Props = {
  appt: AgendaAppointment;
  showProfessional?: boolean;
  onClick: (appointment: AgendaAppointment) => void;
};

export default function MobileAppointmentCard({
  appt,
  showProfessional = false,
  onClick,
}: Props) {
  const color = appt.professional?.color || "#0D9488";
  const start = parseISO(appt.startAt);
  const end = parseISO(appt.endAt);

  return (
    <button
      className="w-full rounded-xl border border-slate-200 bg-white p-3 text-left shadow-sm"
      onClick={() => onClick(appt)}
      style={{
        borderLeftWidth: 4,
        borderLeftColor: color,
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-800">
            {appt.client.fullName}
          </p>

          <p className="truncate text-xs text-slate-500">
            {appt.service.name}
          </p>

          {showProfessional && (
            <p className="truncate text-xs text-slate-500">
              {appt.professional?.name}
            </p>
          )}
        </div>

        <div className="shrink-0 text-right">
          <p className="text-xs font-medium text-slate-600">
            {format(start, "HH:mm")} - {format(end, "HH:mm")}
          </p>
        </div>
      </div>
    </button>
  );
}