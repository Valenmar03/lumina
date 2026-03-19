import { useEffect, useMemo, useState } from "react";
import { Clock3, Plus, Slash, Trash2, User2, X } from "lucide-react";
import { format, parseISO } from "date-fns";

import Modal from "../ui/Modal";
import Button from "../ui/Button";
import CustomDatePicker from "../ui/CustomDatePicker";
import CustomTimePicker from "../ui/CustomTimePicker";
import { useProfessionalServices, useUpdateProfessionalServices } from "../../hooks/useProfessionalServices";
import { useProfessionalSchedule } from "../../hooks/useProfessionalSchedule";
import { useServices } from "../../hooks/useServices";
import type { Professional, ConflictingAppointment } from "../../types/entities";
import { useUpdateProfessional, useProfessionalUnavailabilities, useCreateUnavailability, useDeleteUnavailability } from "../../hooks/useProfessionals";

type Props = {
  open: boolean;
  onClose: () => void;
  professional: Professional | null;
};

type ScheduleBlock = {
  id?: string;
  businessId?: string;
  professionalId?: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  createdAt?: string;
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

    // bloque inválido por sí mismo
    if (current.start >= current.end) {
      return true;
    }

    // superposición con el siguiente
    if (i > 0) {
      const previous = normalized[i - 1];
      if (current.start < previous.end) {
        return true;
      }
    }
  }

  return false;
}

export default function ProfessionalDetailModal({
  open,
  onClose,
  professional,
}: Props) {
  const professionalId = professional?.id ?? "";

  const { data: professionalServicesData, isLoading: professionalServicesLoading } =
    useProfessionalServices(professional?.id);

  const { data: professionalScheduleData, isLoading: professionalScheduleLoading } =
    useProfessionalSchedule(professional?.id);

  const { data: servicesData, isLoading: servicesLoading } = useServices();

  const { data: unavailabilitiesData } = useProfessionalUnavailabilities(professionalId);
  const createUnavailabilityMutation = useCreateUnavailability(professionalId);
  const deleteUnavailabilityMutation = useDeleteUnavailability(professionalId);

  const unavailabilities = unavailabilitiesData?.unavailabilities ?? [];

  const updateProfessionalMutation = useUpdateProfessional();
  const updateProfessionalServicesMutation = useUpdateProfessionalServices();

  const {
    updateScheduleForDayAsync,
    isUpdating: isUpdatingSchedule,
  } = useProfessionalSchedule(professional?.id);

  const businessServices = servicesData?.services ?? [];
  const assignedServices = professionalServicesData?.services ?? [];

  const assignedServiceIds = useMemo(
    () => assignedServices.map((item: any) => item.serviceId),
    [assignedServices]
  );

  const scheduleBlocks: ScheduleBlock[] = (Object.values(
    professionalScheduleData?.schedules ?? {}
  ).flat() as ScheduleBlock[]);

  const [name, setName] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [color, setColor] = useState("#0D9488");
  const [active, setActive] = useState(true);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [scheduleByDay, setScheduleByDay] = useState<Record<number, EditableDay>>(
    buildEmptyScheduleState()
  );

  const [unavailStart, setUnavailStart] = useState("");
  const [unavailStartTime, setUnavailStartTime] = useState("09:00");
  const [unavailEnd, setUnavailEnd] = useState("");
  const [unavailEndTime, setUnavailEndTime] = useState("18:00");
  const [unavailReason, setUnavailReason] = useState("");
  const [unavailError, setUnavailError] = useState<string | null>(null);
  const [pendingDeleteIds, setPendingDeleteIds] = useState<Set<string>>(new Set());
  const [pendingConflicts, setPendingConflicts] = useState<{
    conflicts: ConflictingAppointment[];
    startAt: string;
    endAt: string;
    reason?: string;
  } | null>(null);

  useEffect(() => {
    if (!open || !professional) return;

    setName(professional.name ?? "");
    setColor(professional.color || "#0D9488");
    setActive(Boolean(professional.active));
    setSelectedServiceIds(assignedServiceIds);
    setPendingDeleteIds(new Set());

    const next = buildEmptyScheduleState();

    const grouped = scheduleBlocks.reduce<Record<number, ScheduleBlock[]>>(
      (acc, block) => {
        if (!acc[block.dayOfWeek]) acc[block.dayOfWeek] = [];
        acc[block.dayOfWeek].push(block);
        return acc;
      },
      {}
    );

    for (const day of Object.keys(next).map(Number)) {
      const dayBlocks = (grouped[day] ?? [])
        .sort((a, b) => a.startTime.localeCompare(b.startTime))
        .slice(0, 2)
        .map((block) => ({
          startTime: block.startTime,
          endTime: block.endTime,
        }));

      if (dayBlocks.length > 0) {
        next[day] = {
          enabled: true,
          blocks: dayBlocks,
        };
      }
    }

    setScheduleByDay(next);
  }, [open, professional, assignedServiceIds, professional?.color, professional?.name, professional?.active, professional?.id, professionalScheduleData]);

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

  const isLoading =
    professionalServicesLoading || professionalScheduleLoading || servicesLoading;

  const scheduleValidation = useMemo(() => {
    const errors: Record<number, string> = {};

    Object.entries(scheduleByDay).forEach(([dayKey, config]) => {
      const day = Number(dayKey);

      if (!config.enabled) return;

      const hasError = hasOverlappingBlocks(config.blocks);

      if (hasError) {
        errors[day] =
          "Los bloques se superponen o tienen horarios inválidos.";
      }
    });

    return errors;
  }, [scheduleByDay]);

  const hasScheduleErrors = Object.keys(scheduleValidation).length > 0;

  const isSaving =
    updateProfessionalMutation.isPending ||
    updateProfessionalServicesMutation.isPending ||
    deleteUnavailabilityMutation.isPending ||
    isUpdatingSchedule;

  const handleSave = async () => {
    if (!professional) return;

    const trimmedName = name.trim();

    if (!trimmedName) {
      setNameError("El nombre del profesional es obligatorio");
      return;
    }

    setNameError(null);

    if (hasScheduleErrors) return;

    try {
      await updateProfessionalMutation.mutateAsync({
        professionalId: professional.id,
        name: trimmedName,
        color,
        active,
      });

      await updateProfessionalServicesMutation.mutateAsync({
        professionalId: professional.id,
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
            professionalId: professional.id,
            dayOfWeek: day.dayOfWeek,
            blocks: day.blocks,
          })
        )
      );

      for (const id of pendingDeleteIds) {
        await deleteUnavailabilityMutation.mutateAsync(id);
      }
      setPendingDeleteIds(new Set());

      onClose();
    } catch (error) {
      console.error(error);
    }
  };

  const nameInvalid = !name.trim();

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={professional ? `Editar profesional` : "Profesional"}
      description="Modificá estado, color, servicios y horarios del profesional."
      size="xl"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={
              !professional ||
              isLoading ||
              isSaving ||
              hasScheduleErrors ||
              nameInvalid
            }
          >
            {isSaving ? "Guardando..." : "Guardar cambios"}
          </Button>
        </div>
      }
    >
      {!professional ? (
        <div className="text-sm text-slate-500">
          No hay profesional seleccionado.
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-semibold text-xl shrink-0"
              style={{ background: color || "#0D9488" }}
            >
              {name?.[0]?.toUpperCase()}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
                <div className="min-w-0">
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
                    className={`h-10 w-full rounded-lg border bg-white px-3 text-sm outline-none focus:ring-2 ${
                      nameError
                        ? "border-red-300 focus:ring-red-500"
                        : "border-slate-200 focus:ring-teal-500"
                    }`}
                  />
                  {nameError && (
                    <p className="text-xs text-red-600 mt-1">
                      {nameError}
                    </p>
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
                        <input
                          type="checkbox"
                          checked={enabled}
                          onChange={() => toggleDay(day)}
                          className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                        />
                        <span className="text-sm font-medium text-slate-800 min-w-24">
                          {label}
                        </span>
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

        {/* Bloqueos de horario */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Slash className="w-4 h-4 text-slate-500" />
            <h4 className="text-sm font-medium text-slate-800">Bloqueos de horario</h4>
          </div>

          <div className="space-y-2 mb-4">
            {unavailabilities.length === 0 ? (
              <p className="text-sm text-slate-400">Sin bloqueos de horario</p>
            ) : (
              unavailabilities.map((u) => {
                const markedForDelete = pendingDeleteIds.has(u.id);
                return (
                  <div
                    key={u.id}
                    className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2 transition-colors ${
                      markedForDelete
                        ? "border-red-200 bg-red-50"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    <div>
                      <p className={`text-sm font-medium ${markedForDelete ? "text-red-600 line-through" : "text-slate-700"}`}>
                        {format(parseISO(u.startAt), "dd/MM/yyyy HH:mm")}
                        {" – "}
                        {format(parseISO(u.endAt), "dd/MM/yyyy HH:mm")}
                      </p>
                      {u.reason && (
                        <p className={`text-xs ${markedForDelete ? "text-red-400" : "text-slate-400"}`}>{u.reason}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setPendingDeleteIds((prev) => {
                          const next = new Set(prev);
                          if (next.has(u.id)) next.delete(u.id);
                          else next.add(u.id);
                          return next;
                        })
                      }
                      className={`transition-colors ${
                        markedForDelete ? "text-red-500" : "text-slate-400 hover:text-red-500"
                      }`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <CustomDatePicker
                label="Desde"
                value={unavailStart}
                onChange={(v) => { setUnavailStart(v); setUnavailError(null); }}
              />
              <CustomTimePicker
                label="Hora inicio"
                value={unavailStartTime}
                onChange={setUnavailStartTime}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <CustomDatePicker
                label="Hasta"
                value={unavailEnd}
                onChange={(v) => { setUnavailEnd(v); setUnavailError(null); }}
              />
              <CustomTimePicker
                label="Hora fin"
                value={unavailEndTime}
                onChange={setUnavailEndTime}
              />
            </div>
            <input
              type="text"
              placeholder="Motivo (opcional)"
              value={unavailReason}
              onChange={(e) => setUnavailReason(e.target.value)}
              className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-teal-500"
            />
            {unavailError && (
              <p className="text-xs text-red-600">{unavailError}</p>
            )}
            <button
              type="button"
              disabled={createUnavailabilityMutation.isPending}
              onClick={() => {
                if (!unavailStart) {
                  setUnavailError("Completá la fecha de inicio");
                  return;
                }
                if (!unavailEnd) {
                  setUnavailError("Completá la fecha de fin");
                  return;
                }
                const start = new Date(`${unavailStart}T${unavailStartTime}:00`);
                const end = new Date(`${unavailEnd}T${unavailEndTime}:00`);
                if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
                  setUnavailError("Fecha u hora inválida");
                  return;
                }
                if (start >= end) {
                  setUnavailError("El inicio debe ser anterior al fin");
                  return;
                }
                const startAt = start.toISOString();
                const endAt = end.toISOString();
                const reason = unavailReason.trim() || undefined;
                createUnavailabilityMutation.mutate(
                  { startAt, endAt, reason },
                  {
                    onSuccess: () => {
                      setUnavailStart("");
                      setUnavailStartTime("09:00");
                      setUnavailEnd("");
                      setUnavailEndTime("18:00");
                      setUnavailReason("");
                      setUnavailError(null);
                    },
                    onError: (err: unknown) => {
                      const apiErr = err as { status?: number; body?: { conflicts?: ConflictingAppointment[] } };
                      if (apiErr?.status === 409 && apiErr?.body?.conflicts?.length) {
                        setPendingConflicts({ conflicts: apiErr.body.conflicts, startAt, endAt, reason });
                      } else {
                        setUnavailError("No se pudo crear el bloqueo");
                      }
                    },
                  }
                );
              }}
              className="h-10 w-full rounded-lg border border-teal-200 bg-teal-50 text-sm font-medium text-teal-700 hover:bg-teal-100 disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              {createUnavailabilityMutation.isPending ? "Guardando..." : "Agregar bloqueo"}
            </button>
          </div>
        </div>
        </div>
      )}

      {/* Dialog de conflictos */}
      {pendingConflicts && (
        <div className="fixed inset-0 z-300 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setPendingConflicts(null)} />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
            <h3 className="text-base font-semibold text-slate-900 mb-1">
              Turnos en el período bloqueado
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              Hay {pendingConflicts.conflicts.length} turno{pendingConflicts.conflicts.length > 1 ? "s" : ""} activo{pendingConflicts.conflicts.length > 1 ? "s" : ""} en ese rango. ¿Qué querés hacer con ellos?
            </p>

            <div className="space-y-2 mb-5 max-h-48 overflow-y-auto">
              {pendingConflicts.conflicts.map((appt) => (
                <div key={appt.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                  <div>
                    <p className="text-sm font-medium text-slate-700">{appt.client.fullName}</p>
                    <p className="text-xs text-slate-400">{appt.service.name} · {format(new Date(appt.startAt), "dd/MM HH:mm")} – {format(new Date(appt.endAt), "HH:mm")}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                disabled={createUnavailabilityMutation.isPending}
                onClick={() => {
                  createUnavailabilityMutation.mutate(
                    { ...pendingConflicts, cancelConflicting: true },
                    {
                      onSuccess: () => {
                        setPendingConflicts(null);
                        setUnavailStart(""); setUnavailStartTime("09:00");
                        setUnavailEnd(""); setUnavailEndTime("18:00");
                        setUnavailReason(""); setUnavailError(null);
                      },
                    }
                  );
                }}
                className="w-full rounded-xl bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50 transition-colors"
              >
                Cancelar los {pendingConflicts.conflicts.length} turno{pendingConflicts.conflicts.length > 1 ? "s" : ""} y crear bloqueo
              </button>
              <button
                type="button"
                disabled={createUnavailabilityMutation.isPending}
                onClick={() => {
                  createUnavailabilityMutation.mutate(
                    { ...pendingConflicts, cancelConflicting: false },
                    {
                      onSuccess: () => {
                        setPendingConflicts(null);
                        setUnavailStart(""); setUnavailStartTime("09:00");
                        setUnavailEnd(""); setUnavailEndTime("18:00");
                        setUnavailReason(""); setUnavailError(null);
                      },
                    }
                  );
                }}
                className="w-full rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-200 disabled:opacity-50 transition-colors"
              >
                Crear bloqueo sin tocar los turnos
              </button>
              <button
                type="button"
                onClick={() => setPendingConflicts(null)}
                className="w-full rounded-xl px-4 py-2 text-sm text-slate-400 hover:text-slate-600 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}