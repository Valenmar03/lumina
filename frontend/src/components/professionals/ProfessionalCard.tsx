import { Clock3 } from "lucide-react";
import { useProfessionalSchedule } from "../../hooks/useprofessionalSchedule";
import { useProfessionalServices } from "../../hooks/useProfessionalServices";
import type { Professional } from "../../types/entities";

type Props = {
  professional: Professional;
};

type ScheduleBlock = {
  id: string;
  businessId: string;
  professionalId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  createdAt: string;
};

const DAY_LABELS: Record<number, string> = {
  0: "Dom",
  1: "Lun",
  2: "Mar",
  3: "Mié",
  4: "Jue",
  5: "Vie",
  6: "Sáb",
};

export default function ProfessionalCard({ professional }: Props) {
  const {
    data: professionalServices,
    isLoading: loadingProfessionalServices,
  } = useProfessionalServices(professional.id);

  const services = professionalServices?.services ?? [];
  const serviceNames = services
    .map((s: any) => s.service?.name)
    .filter(Boolean);

  const visibleServices = serviceNames.slice(0, 3);
  const extraServices = serviceNames.length - visibleServices.length;
  const servicesCount = services.length;

  const {
    data: professionalSchedule,
    isLoading: loadingProfessionalSchedule,
  } = useProfessionalSchedule(professional.id);

  const scheduleBlocks: ScheduleBlock[] = Object.values(
    professionalSchedule?.schedules ?? {}
  ).flat();

  const groupedByDay = scheduleBlocks.reduce<Record<number, ScheduleBlock[]>>(
    (acc, block) => {
      if (!acc[block.dayOfWeek]) acc[block.dayOfWeek] = [];
      acc[block.dayOfWeek].push(block);
      return acc;
    },
    {}
  );

  const sortedDays = Object.keys(groupedByDay)
    .map(Number)
    .sort((a, b) => a - b);

  const scheduleSummary = sortedDays.map((day) => {
    const blocks = groupedByDay[day].sort((a, b) =>
      a.startTime.localeCompare(b.startTime)
    );

    const ranges = blocks.map((block) => `${block.startTime}-${block.endTime}`);

    return `${DAY_LABELS[day]} · ${ranges.join(", ")}`;
  });

  const visibleScheduleSummary = scheduleSummary.slice(0, 2);
  const extraDays = scheduleSummary.length - visibleScheduleSummary.length;

  return (
    <div className="group bg-white rounded-xl border border-slate-200 p-5 hover:border-slate-300 hover:shadow-md transition-all cursor-pointer flex flex-col h-full">
      <div className="flex items-start gap-3.5">
        <div
          className="w-11 h-11 rounded-lg flex items-center justify-center text-white font-semibold text-lg shrink-0"
          style={{ background: professional.color || "#0D9488" }}
        >
          {professional.name?.[0]?.toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-800 truncate">
              {professional.name}
            </h3>

            <span
              className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                professional.active
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {professional.active ? "Activo" : "Inactivo"}
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5 mt-2 min-h-5">
            {loadingProfessionalServices && (
              <span className="text-xs text-slate-400">
                Cargando servicios...
              </span>
            )}

            {!loadingProfessionalServices && servicesCount === 0 && (
              <span className="text-xs text-slate-400">Sin servicios</span>
            )}

            {!loadingProfessionalServices &&
              visibleServices.map((name: string) => (
                <span
                  key={`${professional.id}-${name}`}
                  className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium"
                >
                  {name}
                </span>
              ))}

            {!loadingProfessionalServices && extraServices > 0 && (
              <span className="text-[11px] text-slate-400 font-medium">
                +{extraServices} más
              </span>
            )}
          </div>

          <div className="my-2 flex items-start gap-1.5 text-xs text-slate-500 min-h-4">
            <Clock3 className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-px" />

            {loadingProfessionalSchedule ? (
              <span>Cargando horarios...</span>
            ) : scheduleSummary.length === 0 ? (
              <span>Sin horarios</span>
            ) : (
              <div className="min-w-0">
                {visibleScheduleSummary.map((line, index) => (
                  <div key={`${professional.id}-schedule-${index}`} className="truncate">
                    {line}
                  </div>
                ))}

                {extraDays > 0 && (
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    +{extraDays} día{extraDays > 1 ? "s" : ""} más
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between">
        <div className="flex gap-4 text-xs text-slate-500">
          <span>
            <span className="font-semibold text-slate-700">0</span> hoy
          </span>

          <span>
            <span className="font-semibold text-slate-700">11</span> total
          </span>
        </div>

        <span className="text-xs text-slate-400 font-medium">
          {loadingProfessionalServices ? "..." : `${servicesCount} servicios`}
        </span>
      </div>
    </div>
  );
}