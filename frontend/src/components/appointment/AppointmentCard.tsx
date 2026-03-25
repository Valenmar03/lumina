import { format, parseISO } from "date-fns";
import type { CSSProperties } from "react";
import {
  AppointmentStatus,
  appointmentStatusLabels,
  type AgendaAppointment,
} from "../../types/entities";

type AppointmentCardProps = {
  appt: AgendaAppointment;
  color: string;
  top: number;
  height: number;
  compact?: boolean;
  showProfessionalName?: boolean;
  onClick: (appt: AgendaAppointment) => void;
  style?: CSSProperties;
};

type AppointmentCardUiStatus = AppointmentStatus | "PENDING_RESOLUTION";

type StatusUi = {
  dot: string;
  badge: string;
  label: string;
  cardClass: string;
  titleClass: string;
  metaClass: string;
};

const defaultStatusUi: StatusUi = {
  dot: "bg-slate-400",
  badge: "bg-slate-100 text-slate-600 border-slate-200",
  label: "Sin estado",
  cardClass: "",
  titleClass: "text-slate-800",
  metaClass: "text-slate-500",
};

const statusUiMap: Record<AppointmentCardUiStatus, StatusUi> = {
  [AppointmentStatus.PENDING_PAYMENT]: {
    dot: "bg-amber-500",
    badge: "bg-amber-100 text-amber-700 border-amber-200",
    label: appointmentStatusLabels[AppointmentStatus.PENDING_PAYMENT],
    cardClass: "opacity-75",
    titleClass: "text-slate-800",
    metaClass: "text-slate-500",
  },
  [AppointmentStatus.RESERVED]: {
    dot: "bg-cyan-500",
    badge: "bg-cyan-100 text-cyan-700 border-cyan-200",
    label: appointmentStatusLabels[AppointmentStatus.RESERVED],
    cardClass: "",
    titleClass: "text-slate-800",
    metaClass: "text-slate-500",
  },
  [AppointmentStatus.DEPOSIT_PAID]: {
    dot: "bg-teal-500",
    badge: "bg-teal-100 text-teal-700 border-teal-200",
    label: appointmentStatusLabels[AppointmentStatus.DEPOSIT_PAID],
    cardClass: "",
    titleClass: "text-slate-800",
    metaClass: "text-slate-500",
  },
  [AppointmentStatus.COMPLETED]: {
    dot: "bg-emerald-500",
    badge: "bg-emerald-100 text-emerald-700 border-emerald-200",
    label: appointmentStatusLabels[AppointmentStatus.COMPLETED],
    cardClass: "",
    titleClass: "text-slate-800",
    metaClass: "text-slate-500",
  },
  [AppointmentStatus.NO_SHOW]: {
    dot: "bg-amber-500",
    badge: "bg-amber-100 text-amber-700 border-amber-200",
    label: appointmentStatusLabels[AppointmentStatus.NO_SHOW],
    cardClass: "",
    titleClass: "text-slate-800",
    metaClass: "text-slate-500",
  },
  [AppointmentStatus.CANCELED]: {
    dot: "bg-red-500",
    badge: "bg-red-100 text-red-700 border-red-200",
    label: appointmentStatusLabels[AppointmentStatus.CANCELED],
    cardClass: "opacity-60",
    titleClass: "text-slate-500 line-through",
    metaClass: "text-slate-400",
  },
  PENDING_RESOLUTION: {
    dot: "bg-violet-500",
    badge: "bg-violet-100 text-violet-700 border-violet-200",
    label: appointmentStatusLabels.PENDING_RESOLUTION,
    cardClass: "",
    titleClass: "text-slate-800",
    metaClass: "text-slate-500",
  },
};

export function getStatusUi(status?: AppointmentCardUiStatus): StatusUi {
  if (!status) return defaultStatusUi;
  return statusUiMap[status] ?? defaultStatusUi;
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

  const effectiveStatus: AppointmentCardUiStatus | undefined = appt.isPendingResolution
  ? "PENDING_RESOLUTION"
  : (appt.status as AppointmentStatus | undefined);

  const statusUi = getStatusUi(effectiveStatus);

  if (compact) {
    return (
      <div
        role="button"
        tabIndex={0}
        aria-label={`${appt.client.fullName} — ${appt.service.name} ${format(parseISO(appt.startAt), "HH:mm")}`}
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
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            e.stopPropagation();
            onClick(appt);
          }
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

  const isShort = height <= 44;

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`${appt.client.fullName} — ${appt.service.name} ${format(parseISO(appt.startAt), "HH:mm")}–${format(parseISO(appt.endAt), "HH:mm")}, ${statusUi.label}`}
      className={`absolute left-1 right-1 z-10 overflow-hidden rounded-md border-l-[3px] text-xs cursor-pointer transition-all hover:shadow-md ${statusUi.cardClass}`}
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
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          e.stopPropagation();
          onClick(appt);
        }
      }}
    >
      {isShort ? (
        <div className="flex h-full items-center gap-1.5 px-2">
          <span
            className={`h-2 w-2 shrink-0 rounded-full ${statusUi.dot}`}
            aria-hidden="true"
          />
          <p className={`truncate font-medium leading-none flex-1 ${statusUi.titleClass}`}>
            {appt.client.fullName}
          </p>
          <span className={`shrink-0 text-[10px] ${statusUi.metaClass}`}>
            {format(parseISO(appt.startAt), "HH:mm")}–{format(parseISO(appt.endAt), "HH:mm")}
          </span>
          <span className="shrink-0 text-[10px] text-slate-300">·</span>
          <span
            className={`shrink-0 rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${statusUi.badge}`}
          >
            {statusUi.label}
          </span>
        </div>
      ) : (
        <div className="px-2 py-1.5">
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

            <span
              className={`shrink-0 rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${statusUi.badge}`}
            >
              {statusUi.label}
            </span>
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
      )}
    </div>
  );
}