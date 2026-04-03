import { useMemo, useState } from "react";
import { Clock3, Plus, User2, X } from "lucide-react";

import Modal from "../ui/Modal";
import Button from "../ui/Button";
import Checkbox from "../ui/Checkbox";
import { useServices } from "../../hooks/useServices";
import { useCreateProfessional } from "../../hooks/useProfessionals";
import { useUpdateProfessionalServices } from "../../hooks/useProfessionalServices";
import { useProfessionalSchedule } from "../../hooks/useProfessionalSchedule";

type Props = {
  open: boolean;
  onClose: () => void;
};

type EditableDay = {
  enabled: boolean;
  blocks: Array<{
    startTime: string;
    endTime: string;
  }>;
};

const DAY_LABELS: Record<number, string> = {
  0: "Domingo",
  1: "Lunes",
  2: "Martes",
  3: "Miércoles",
  4: "Jueves",
  5: "Viernes",
  6: "Sábado",
};

const COLORS = [
  "#0D9488",
  "#14B8A6",
  "#3B82F6",
  "#6366F1",
  "#8B5CF6",
  "#EC4899",
  "#F59E0B",
  "#EF4444",
  "#10B981",
  "#F43F5E",
];

function buildEmptyScheduleState(): Record<number, EditableDay> {
  return {
    0: { enabled: false, blocks: [{ startTime: "09:00", endTime: "18:00" }] },
    1: { enabled: false, blocks: [{ startTime: "09:00", endTime: "18:00" }] },
    2: { enabled: false, blocks: [{ startTime: "09:00", endTime: "18:00" }] },
    3: { enabled: false, blocks: [{ startTime: "09:00", endTime: "18:00" }] },
    4: { enabled: false, blocks: [{ startTime: "09:00", endTime: "18:00" }] },
    5: { enabled: false, blocks: [{ startTime: "09:00", endTime: "18:00" }] },
    6: { enabled: false, blocks: [{ startTime: "09:00", endTime: "18:00" }] },
  };
}

function toMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function hasOverlappingBlocks(
  blocks: Array<{ startTime: string; endTime: string }>
) {
  const normalized = blocks
    .filter((block) => block.startTime && block.endTime)
    .map((block) => ({
      startTime: block.startTime,
      endTime: block.endTime,
      start: toMinutes(block.startTime),
      end: toMinutes(block.endTime),
    }))
    .sort((a, b) => a.start - b.start);

  for (let i = 0; i < normalized.length; i++) {
    const current = normalized[i];

    if (current.start >= current.end) {
      return true;
    }

    if (i > 0) {
      const previous = normalized[i - 1];
      if (current.start < previous.end) {
        return true;
      }
    }
  }

  return false;
}

export default function NewProfessionalFormModal({
  open,
  onClose,
}: Props) {
  const { data: servicesData, isLoading: servicesLoading } = useServices();

  const createProfessionalMutation = useCreateProfessional();
  const updateProfessionalServicesMutation = useUpdateProfessionalServices();

  const {
    updateScheduleForDayAsync,
    isUpdating: isUpdatingSchedule,
  } = useProfessionalSchedule();

  const businessServices = servicesData?.services ?? [];

  const [name, setName] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [color, setColor] = useState("#0D9488");
  const [active, setActive] = useState(true);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [scheduleByDay, setScheduleByDay] = useState<Record<number, EditableDay>>(
    buildEmptyScheduleState()
  );

  const resetForm = () => {
    setName("");
    setNameError(null);
    setColor("#0D9488");
    setActive(true);
    setSelectedServiceIds([]);
    setScheduleByDay(buildEmptyScheduleState());
  };

  const toggleService = (serviceId: string) => {
    setSelectedServiceIds((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const toggleDay = (day: number) => {
    setScheduleByDay((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        enabled: !prev[day].enabled,
      },
    }));
  };

  const updateBlock = (
    day: number,
    index: number,
    field: "startTime" | "endTime",
    value: string
  ) => {
    setScheduleByDay((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        blocks: prev[day].blocks.map((block, i) =>
          i === index ? { ...block, [field]: value } : block
        ),
      },
    }));
  };

  const addBlock = (day: number) => {
    setScheduleByDay((prev) => {
      const current = prev[day];
      if (current.blocks.length >= 2) return prev;

      return {
        ...prev,
        [day]: {
          ...current,
          blocks: [...current.blocks, { startTime: "14:00", endTime: "18:00" }],
        },
      };
    });
  };

  const removeBlock = (day: number, index: number) => {
    setScheduleByDay((prev) => {
      const currentBlocks = prev[day].blocks.filter((_, i) => i !== index);

      return {
        ...prev,
        [day]: {
          ...prev[day],
          blocks:
            currentBlocks.length > 0
              ? currentBlocks
              : [{ startTime: "09:00", endTime: "18:00" }],
        },
      };
    });
  };

  const scheduleValidation = useMemo(() => {
    const errors: Record<number, string> = {};

    Object.entries(scheduleByDay).forEach(([dayKey, config]) => {
      const day = Number(dayKey);

      if (!config.enabled) return;

      const hasError = hasOverlappingBlocks(config.blocks);

      if (hasError) {
        errors[day] = "Los bloques se superponen o tienen horarios inválidos.";
      }
    });

    return errors;
  }, [scheduleByDay]);

  const hasScheduleErrors = Object.keys(scheduleValidation).length > 0;
  const nameInvalid = !name.trim();

  const isSaving =
    createProfessionalMutation.isPending ||
    updateProfessionalServicesMutation.isPending ||
    isUpdatingSchedule;

  const handleClose = () => {
    if (isSaving) return;
    resetForm();
    onClose();
  };

  const handleSave = async () => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      setNameError("El nombre del profesional es obligatorio");
      return;
    }

    setNameError(null);

    if (hasScheduleErrors) return;

    try {
      const response = await createProfessionalMutation.mutateAsync({
        name: trimmedName,
        color,
        active,
      });

      const professionalId = response?.professional?.id;

      if (!professionalId) {
        throw new Error("No se pudo obtener el id del profesional creado");
      }

      await updateProfessionalServicesMutation.mutateAsync({
        professionalId,
        serviceIds: selectedServiceIds,
      });

      const daysToSave = Object.entries(scheduleByDay).map(([day, config]) => ({
        dayOfWeek: Number(day),
        blocks: config.enabled
          ? config.blocks
              .filter(
                (block) =>
                  block.startTime &&
                  block.endTime &&
                  block.startTime < block.endTime
              )
              .map((block) => ({
                startTime: block.startTime,
                endTime: block.endTime,
              }))
          : [],
      }));

      await Promise.all(
        daysToSave.map((day) =>
          updateScheduleForDayAsync({
            professionalId,
            dayOfWeek: day.dayOfWeek,
            blocks: day.blocks,
          })
        )
      );

      resetForm();
      onClose();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Nuevo profesional"
      description="Completá los datos, servicios y horarios del nuevo profesional."
      size="xl"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={handleClose} disabled={isSaving}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={servicesLoading || isSaving || hasScheduleErrors || nameInvalid}
          >
            {isSaving ? "Creando..." : "Crear profesional"}
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="flex items-start gap-4">
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-semibold text-xl shrink-0"
            style={{ background: color || "#0D9488" }}
          >
            {name?.[0]?.toUpperCase() || "?"}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
              <div className="min-w-0 flex-1">
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Nombre
                </label>
                <input
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);

                    if (e.target.value.trim()) {
                      setNameError(null);
                    }
                  }}
                  placeholder="Ej: Valentina"
                  className={`h-10 w-full rounded-lg border bg-white px-3 text-sm outline-none focus:ring-2 ${
                    nameError
                      ? "border-red-300 focus:ring-red-500"
                      : "border-slate-200 focus:ring-teal-500"
                  }`}
                />
                {nameError && (
                  <p className="text-xs text-red-600 mt-1">{nameError}</p>
                )}
              </div>

              <div className="sm:min-w-40">
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Estado
                </label>
                <button
                  type="button"
                  onClick={() => setActive((prev) => !prev)}
                  className={`h-10 px-3 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-slate-100 text-slate-600 border border-slate-200"
                  }`}
                >
                  {active ? "Activo" : "Inactivo"}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="mb-3">
            <h4 className="text-sm font-medium text-slate-800">Color</h4>
            <p className="text-xs text-slate-500 mt-1">
              Elegí el color identificatorio del profesional.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {COLORS.map((item) => {
              const selected = color === item;

              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => setColor(item)}
                  className={`w-9 h-9 rounded-full transition-all ${
                    selected
                      ? "ring-2 ring-offset-2 ring-slate-400 scale-110"
                      : "hover:scale-105"
                  }`}
                  style={{ backgroundColor: item }}
                />
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-2 mb-3">
            <User2 className="w-4 h-4 text-slate-500" />
            <h4 className="text-sm font-medium text-slate-800">Servicios</h4>
          </div>

          {servicesLoading ? (
            <p className="text-sm text-slate-500">Cargando servicios...</p>
          ) : businessServices.length === 0 ? (
            <p className="text-sm text-slate-500">
              No hay servicios cargados en el negocio.
            </p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-2">
              {businessServices.map((service: any) => {
                const checked = selectedServiceIds.includes(service.id);

                return (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => toggleService(service.id)}
                    className={`rounded-xl border px-3 py-3 text-left transition-colors ${
                      checked
                        ? "border-teal-200 bg-teal-50"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-slate-800">
                          {service.name}
                        </div>
                        <div className="mt-0.5 text-xs text-slate-500">
                          {service.durationMin} min
                        </div>
                      </div>

                      <div
                        className={`mt-0.5 h-4 w-4 rounded border ${
                          checked
                            ? "border-teal-600 bg-teal-600"
                            : "border-slate-300 bg-white"
                        }`}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock3 className="w-4 h-4 text-slate-500" />
            <h4 className="text-sm font-medium text-slate-800">Horarios</h4>
          </div>

          <div className="space-y-3">
            {Object.entries(DAY_LABELS).map(([dayKey, label]) => {
              const day = Number(dayKey);
              const config = scheduleByDay[day];
              const enabled = config?.enabled ?? false;
              const blocks = config?.blocks ?? [];

              return (
                <div
                  key={day}
                  className="rounded-xl border border-slate-200 bg-white p-3"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-center gap-3">
                      <Checkbox checked={enabled} onChange={() => toggleDay(day)} label={label} className="min-w-24" />
                    </div>

                    <div className="flex-1 space-y-2">
                      {!enabled ? (
                        <p className="text-sm text-slate-400">Día no laborable</p>
                      ) : (
                        <>
                          {blocks.map((block, index) => (
                            <div
                              key={`${day}-${index}`}
                              className="flex flex-col sm:flex-row gap-2 sm:items-center"
                            >
                              <input
                                type="time"
                                value={block.startTime}
                                onChange={(e) =>
                                  updateBlock(day, index, "startTime", e.target.value)
                                }
                                className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-teal-500"
                              />

                              <span className="text-sm text-slate-500 text-center">a</span>

                              <input
                                type="time"
                                value={block.endTime}
                                onChange={(e) =>
                                  updateBlock(day, index, "endTime", e.target.value)
                                }
                                className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-teal-500"
                              />

                              {blocks.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeBlock(day, index)}
                                  className="inline-flex items-center justify-center h-10 w-10 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          ))}

                          {blocks.length < 2 && (
                            <button
                              type="button"
                              onClick={() => addBlock(day)}
                              className="inline-flex items-center gap-1.5 text-sm text-teal-700 hover:text-teal-800"
                            >
                              <Plus className="w-4 h-4" />
                              Agregar bloque
                            </button>
                          )}

                          {scheduleValidation[day] && (
                            <p className="text-xs text-red-600 mt-1">
                              {scheduleValidation[day]}
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Modal>
  );
}