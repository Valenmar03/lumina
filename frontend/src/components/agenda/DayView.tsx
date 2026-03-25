import { format, parseISO } from "date-fns";
import TimeLabel from "./TimeLabel";
import AppointmentCard from "../appointment/AppointmentCard";
import type {
  AgendaAppointment,
  AppointmentStatus,
  DailyUnavailability,
  Professional,
  ScheduleBlock,
} from "../../types/entities";

type DayViewProps = {
  selectedProfessionalId: string;
  selectedProfessional?: Professional | null;
  professionals: Professional[];
  dailyScheduleBlocksByProfessional: Record<string, ScheduleBlock[]>;
  dailyUnavailabilitiesByProfessional: Record<string, DailyUnavailability[]>;
  dayAppointments: AgendaAppointment[];
  HOURS: number[];
  currentDate: Date;
  handleSlotClick: (
    date: Date,
    time: string,
    professionalId?: string,
  ) => void;
  handleAppointmentClick: (appt: AgendaAppointment) => void;
  getAppointmentTopAndHeight: (appt: AgendaAppointment) => {
    top: number;
    height: number;
  };
};

export const STATUS_PRIORITY: Record<AppointmentStatus, number> = {
  PENDING_PAYMENT: 6,
  RESERVED: 5,
  DEPOSIT_PAID: 4,
  COMPLETED: 3,
  NO_SHOW: 2,
  CANCELED: 1,
};

function doAppointmentsOverlap(a: AgendaAppointment, b: AgendaAppointment): boolean {
  const aStart = parseISO(a.startAt).getTime();
  const aEnd = parseISO(a.endAt).getTime();
  const bStart = parseISO(b.startAt).getTime();
  const bEnd = parseISO(b.endAt).getTime();
  return aStart < bEnd && bStart < aEnd;
}

// Classifies ALL appointments for a professional into primary (card) vs secondary (bubble).
// Works across hour boundaries — detects cross-hour overlaps correctly.
function classifyAppointments(appointments: AgendaAppointment[]): {
  primaryIds: Set<string>;
  secondaryIds: Set<string>;
} {
  const primaryIds = new Set<string>();
  const secondaryIds = new Set<string>();

  if (appointments.length === 0) return { primaryIds, secondaryIds };

  // Sort highest priority first, then earliest start
  const sorted = [...appointments].sort((a, b) => {
    const ap = STATUS_PRIORITY[a.status as AppointmentStatus] ?? 0;
    const bp = STATUS_PRIORITY[b.status as AppointmentStatus] ?? 0;
    const diff = bp - ap;
    if (diff !== 0) return diff;
    return parseISO(a.startAt).getTime() - parseISO(b.startAt).getTime();
  });

  for (const appt of sorted) {
    const conflictsWithPrimary = sorted
      .filter((p) => primaryIds.has(p.id))
      .some((p) => doAppointmentsOverlap(appt, p));

    if (conflictsWithPrimary) {
      secondaryIds.add(appt.id);
    } else {
      primaryIds.add(appt.id);
    }
  }

  return { primaryIds, secondaryIds };
}


function getSecondaryBadge(appt: AgendaAppointment) {
  switch (appt.status) {
    case "CANCELED":
      return {
        label: "C",
        className:
          "bg-red-100 text-red-600 border border-red-200 hover:bg-red-200",
        titlePrefix: "Cancelado",
      };

    case "NO_SHOW":
      return {
        label: "N",
        className:
          "bg-amber-100 text-amber-700 border border-amber-200 hover:bg-amber-200",
        titlePrefix: "No asistió",
      };

    case "COMPLETED":
      return {
        label: "✓",
        className:
          "bg-emerald-100 text-emerald-700 border border-emerald-200 hover:bg-emerald-200",
        titlePrefix: "Completado",
      };

    case "DEPOSIT_PAID":
      return {
        label: "$",
        className:
          "bg-teal-100 text-teal-700 border border-teal-200 hover:bg-teal-200",
        titlePrefix: "Señado",
      };

    case "RESERVED":
      return {
        label: "•",
        className:
          "bg-cyan-100 text-cyan-700 border border-cyan-200 hover:bg-cyan-200",
        titlePrefix: "Reservado",
      };

    default:
      return {
        label: "•",
        className:
          "bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200",
        titlePrefix: "Turno",
      };
  }
}

function renderSecondaryBubbles(
  secondaryAppointments: AgendaAppointment[],
  getAppointmentTopAndHeight: (appt: AgendaAppointment) => {
    top: number;
    height: number;
  },
  handleAppointmentClick: (appt: AgendaAppointment) => void,
) {
  return secondaryAppointments.map((appt, index) => {
    const { top } = getAppointmentTopAndHeight(appt);
    const badge = getSecondaryBadge(appt);

    return (
      <button
        key={appt.id}
        type="button"
        className={`absolute right-1 z-20 rounded-full text-[10px] font-semibold w-5 h-5 flex items-center justify-center transition-colors ${badge.className}`}
        style={{
          top: `${Math.min(top + index * 18, 42)}px`,
        }}
        title={`${badge.titlePrefix} · ${appt.client.fullName} · ${appt.service.name}`}
        aria-label={`${badge.titlePrefix}: ${appt.client.fullName} — ${appt.service.name}`}
        onClick={(e) => {
          e.stopPropagation();
          handleAppointmentClick(appt);
        }}
      >
        {badge.label}
      </button>
    );
  });
}

function renderScheduleOrBlock(
  blocks: ScheduleBlock[],
  unavailabilities: DailyUnavailability[],
) {
  if (blocks.length === 0 && unavailabilities.length === 0) {
    return <p className="text-xs text-slate-400">No tiene horarios hoy</p>;
  }

  return (
    <>
      {blocks.map((block) => (
        <span
          key={block.id}
          className="inline-flex items-center rounded-full bg-white border border-slate-200 px-3 py-1 text-xs text-slate-600"
        >
          {block.startTime} - {block.endTime}
        </span>
      ))}
      {unavailabilities.map((u) => (
        <span
          key={u.id}
          className="inline-flex items-center rounded-full bg-red-50 border border-red-200 px-3 py-1 text-xs text-red-500"
          title={u.reason ?? undefined}
        >
          {format(parseISO(u.startAt), "HH:mm")} – {format(parseISO(u.endAt), "HH:mm")}
          {u.reason ? ` · ${u.reason}` : ""}
        </span>
      ))}
    </>
  );
}

export default function DayView({
  selectedProfessionalId,
  selectedProfessional,
  professionals,
  dailyScheduleBlocksByProfessional,
  dailyUnavailabilitiesByProfessional,
  dayAppointments,
  HOURS,
  currentDate,
  handleSlotClick,
  handleAppointmentClick,
  getAppointmentTopAndHeight,
}: DayViewProps) {
  // Precompute global classification (primary vs secondary/bubble) per professional.
  // This handles cross-hour overlaps correctly, unlike per-hour grouping.
  const classificationByPro: Record<string, ReturnType<typeof classifyAppointments>> = {};
  for (const pro of professionals) {
    const proAppts = dayAppointments.filter((a) => a.professionalId === pro.id);
    classificationByPro[pro.id] = classifyAppointments(proAppts);
  }

  // For single-professional view (selectedProfessionalId !== "all")
  const singleProClassification =
    selectedProfessionalId !== "all"
      ? classificationByPro[selectedProfessionalId] ?? classifyAppointments(
          dayAppointments.filter((a) => a.professionalId === selectedProfessionalId),
        )
      : { primaryIds: new Set<string>(), secondaryIds: new Set<string>() };

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
            const unavailabilities =
              dailyUnavailabilitiesByProfessional[professional.id] ?? [];

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
                    {renderScheduleOrBlock(blocks, unavailabilities)}
                  </div>
                </div>
              </div>
            );
          })}

          {HOURS.map((hour) => (
            <div key={`row-${hour}`} className="contents">
              <TimeLabel hour={hour} className="h-16 border-b" />

              {professionals.map((professional) => {
                const { primaryIds, secondaryIds } = classificationByPro[professional.id] ?? { primaryIds: new Set(), secondaryIds: new Set() };

                const proAppts = dayAppointments.filter(
                  (appt) => appt.professionalId === professional.id && parseISO(appt.startAt).getHours() === hour,
                );
                const primaryAppts = proAppts.filter((a) => primaryIds.has(a.id));
                const secondaryAppts = proAppts.filter((a) => secondaryIds.has(a.id));

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
                    {primaryAppts.map((appt) => (
                      <AppointmentCard
                        key={appt.id}
                        appt={appt}
                        color={professional.color || "#0D9488"}
                        top={getAppointmentTopAndHeight(appt).top}
                        height={getAppointmentTopAndHeight(appt).height}
                        onClick={handleAppointmentClick}
                      />
                    ))}

                    {renderSecondaryBubbles(
                      secondaryAppts,
                      getAppointmentTopAndHeight,
                      handleAppointmentClick,
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  }

  const blocks =
    selectedProfessionalId !== "all"
      ? dailyScheduleBlocksByProfessional[selectedProfessionalId] ?? []
      : [];
  const unavailabilities =
    selectedProfessionalId !== "all"
      ? dailyUnavailabilitiesByProfessional[selectedProfessionalId] ?? []
      : [];

  return (
    <div className="overflow-x-auto">
      <div className="min-w-175">
        <div className="grid border-b border-slate-200 sticky top-0 bg-white z-10 grid-cols-[60px_1fr]">
          <div className="p-2 text-xs text-slate-400 border-r border-slate-100" />
          <div className="p-3 text-center">
            <div className="flex flex-col items-center gap-2">
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

              <div className="flex flex-wrap justify-center gap-2">
                {renderScheduleOrBlock(blocks, unavailabilities)}
              </div>
            </div>
          </div>
        </div>

        {HOURS.map((hour) => {
          const { primaryIds, secondaryIds } = singleProClassification;

          const proAppts = dayAppointments.filter(
            (appt) =>
              appt.professionalId === selectedProfessionalId &&
              parseISO(appt.startAt).getHours() === hour,
          );
          const primaryAppts = proAppts.filter((a) => primaryIds.has(a.id));
          const secondaryAppts = proAppts.filter((a) => secondaryIds.has(a.id));

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
                {primaryAppts.map((appt) => (
                  <AppointmentCard
                    key={appt.id}
                    appt={appt}
                    color={appt.professional?.color || "#0D9488"}
                    top={getAppointmentTopAndHeight(appt).top}
                    height={getAppointmentTopAndHeight(appt).height}
                    onClick={handleAppointmentClick}
                  />
                ))}

                {renderSecondaryBubbles(
                  secondaryAppts,
                  getAppointmentTopAndHeight,
                  handleAppointmentClick,
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}