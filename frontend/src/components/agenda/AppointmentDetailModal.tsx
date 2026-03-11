import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Search,
  Trash2,
  UserX2,
  X,
} from "lucide-react";

import CustomSelect from "../ui/CustomSelect";
import CustomDatePicker from "../ui/CustomDatePicker";
import Modal from "../ui/Modal";
import Button from "../ui/Button";

import { useClients } from "../../hooks/useClients";
import { useProfessionals } from "../../hooks/useProfessionals";
import { useProfessionalServices } from "../../hooks/useProfessionalServices";
import { useAvailability } from "../../hooks/useAvailability";

import type { AgendaAppointment } from "../../types/agenda";
import {
  updateAppointment,
  changeAppointmentStatus,
  type AppointmentStatus,
} from "../../services/appointments.api";

type Props = {
  open: boolean;
  onClose: () => void;
  appointment: AgendaAppointment | null;
};

function getStatusLabel(status?: AppointmentStatus | string) {
  switch (status) {
    case "CONFIRMED":
      return "Confirmado";
    case "CANCELED":
      return "Cancelado";
    case "NO_SHOW":
      return "No asistió";
    case "COMPLETED":
      return "Realizado";
    case "PENDING_RESOLUTION":
        return "Pendiente";
    default:
      return "Sin estado";
  }
}

function getStatusBadgeClasses(status?: AppointmentStatus | string) {
  switch (status) {
    case "CONFIRMED":
      return "border-cyan-200 bg-cyan-50 text-cyan-700";
    case "CANCELED":
      return "border-red-200 bg-red-50 text-red-700";
    case "NO_SHOW":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "COMPLETED":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "PENDING_RESOLUTION":
        return "border-violet-200 bg-violet-50 text-violet-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

function getStatusIcon(status?: AppointmentStatus | string) {
  switch (status) {
    case "CONFIRMED":
      return <Clock3 className="h-3.5 w-3.5" />;
    case "CANCELED":
      return <Trash2 className="h-3.5 w-3.5" />;
    case "NO_SHOW":
      return <UserX2 className="h-3.5 w-3.5" />;
    case "COMPLETED":
      return <CheckCircle2 className="h-3.5 w-3.5" />;
    case "PENDING_RESOLUTION":
        return <AlertCircle className="h-3.5 w-3.5" />;
    default:
      return <AlertCircle className="h-3.5 w-3.5" />;
  }
}

export default function AppointmentDetailModal({
  open,
  onClose,
  appointment,
}: Props) {
  const queryClient = useQueryClient();

  const [clientSearch, setClientSearch] = useState("");
  const [clientId, setClientId] = useState("");
  const [clientComboboxOpen, setClientComboboxOpen] = useState(false);

  const [selectedProfessionalId, setSelectedProfessionalId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [selectedStartAt, setSelectedStartAt] = useState("");
  const [selectedDate, setSelectedDate] = useState("");

  const clientBoxRef = useRef<HTMLDivElement | null>(null);

    const effectiveStatus = appointment?.isPendingResolution
    ? "PENDING_RESOLUTION"
    : appointment?.status;

    const currentStatus = appointment?.status as AppointmentStatus | undefined;
    const isCanceled = currentStatus === "CANCELED";
    const isCompleted = currentStatus === "COMPLETED";
    const isLocked = isCanceled || isCompleted;

  const { data: clientsData, isLoading: clientsLoading } = useClients(clientSearch);
  const { data: professionalsData, isLoading: professionalsLoading } = useProfessionals();

  const {
    data: professionalServicesData,
    isLoading: professionalServicesLoading,
  } = useProfessionalServices(selectedProfessionalId);

  const { data: availabilityData, isLoading: availabilityLoading } = useAvailability(
    selectedProfessionalId,
    selectedDate,
    serviceId
  );

  useEffect(() => {
    if (!open || !appointment) {
      setClientSearch("");
      setClientId("");
      setClientComboboxOpen(false);
      setSelectedProfessionalId("");
      setServiceId("");
      setSelectedStartAt("");
      setSelectedDate("");
      return;
    }

    setClientId(appointment.client.id);
    setClientSearch(appointment.client.fullName);
    setSelectedProfessionalId(appointment.professional?.id ?? "");
    setServiceId(appointment.service.id);
    setSelectedStartAt(appointment.startAt);
    setSelectedDate(format(parseISO(appointment.startAt), "yyyy-MM-dd"));
  }, [open, appointment]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!clientBoxRef.current) return;
      if (!clientBoxRef.current.contains(event.target as Node)) {
        setClientComboboxOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const clients = clientsData?.clients ?? [];
  const professionals = (professionalsData?.professionals ?? []).filter((p) => p.active);
  const professionalServices = professionalServicesData?.services ?? [];
  const slots = availabilityData?.slots ?? [];

  const selectedClient = useMemo(
    () => clients.find((client) => client.id === clientId),
    [clients, clientId]
  );

  const selectedProfessional = useMemo(
    () => professionals.find((professional) => professional.id === selectedProfessionalId),
    [professionals, selectedProfessionalId]
  );

  useEffect(() => {
    if (!serviceId) return;

    const serviceStillExists = professionalServices.some(
      (item) => item.service.id === serviceId
    );

    if (!serviceStillExists) {
      setServiceId("");
      setSelectedStartAt("");
    }
  }, [serviceId, professionalServices]);

  const mergedSlots = useMemo(() => {
    if (!selectedStartAt) return slots;

    const alreadyExists = slots.some((slot) => slot.startAt === selectedStartAt);
    if (alreadyExists) return slots;

    let label = "";
    try {
      label = format(parseISO(selectedStartAt), "HH:mm");
    } catch {
      label = selectedStartAt;
    }

    return [{ startAt: selectedStartAt, label }, ...slots];
  }, [slots, selectedStartAt]);

  const selectedSlotLabel = useMemo(() => {
    if (!selectedStartAt) return "";
    try {
      return format(parseISO(selectedStartAt), "HH:mm");
    } catch {
      return "";
    }
  }, [selectedStartAt]);

  const updateMutation = useMutation({
    mutationFn: updateAppointment,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["agenda"] }),
        queryClient.invalidateQueries({ queryKey: ["availability"] }),
      ]);
      onClose();
    },
  });

  const statusMutation = useMutation({
    mutationFn: changeAppointmentStatus,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["agenda"] }),
        queryClient.invalidateQueries({ queryKey: ["availability"] }),
      ]);
      onClose();
    },
  });

  const isBusy = updateMutation.isPending || statusMutation.isPending;
  const isFormDisabled = isBusy || isLocked;

  const canSubmit =
    !!appointment?.id &&
    !!selectedProfessionalId &&
    !!clientId &&
    !!serviceId &&
    !!selectedStartAt &&
    !isFormDisabled;

  const handleSubmit = () => {
    if (!appointment?.id || !canSubmit) return;

    updateMutation.mutate({
      id: appointment.id,
      professionalId: selectedProfessionalId,
      clientId,
      serviceId,
      startAt: selectedStartAt,
    });
  };

  const handleChangeStatus = (status: AppointmentStatus) => {
    if (!appointment?.id || isBusy) return;

    const needsConfirm = status === "CANCELED";
    if (needsConfirm) {
      const confirmed = window.confirm("¿Seguro que querés cancelar este turno?");
      if (!confirmed) return;
    }

    statusMutation.mutate({
      id: appointment.id,
      status,
    });
  };

  const handleSelectClient = (client: {
    id: string;
    fullName: string;
    phone?: string | null;
    email?: string | null;
  }) => {
    if (isFormDisabled) return;
    setClientId(client.id);
    setClientSearch(client.fullName);
    setClientComboboxOpen(false);
  };

  const handleClearClient = () => {
    if (isFormDisabled) return;
    setClientId("");
    setClientSearch("");
    setClientComboboxOpen(false);
  };

  const handleProfessionalChange = (nextProfessionalId: string) => {
    setSelectedProfessionalId(nextProfessionalId);
    setServiceId("");
    setSelectedStartAt("");
  };

  const handleDateChange = (nextDate: string) => {
    setSelectedDate(nextDate);
    setSelectedStartAt("");
  };

  const professionalOptions = useMemo(
    () =>
      professionals.map((professional) => ({
        value: professional.id,
        label: professional.name,
      })),
    [professionals]
  );

  const serviceOptions = useMemo(
    () =>
      professionalServices.map((item) => ({
        value: item.service.id,
        label: item.service.name,
        description: `${item.service.durationMin} min`,
      })),
    [professionalServices]
  );

    const currentStatusLabel = getStatusLabel(effectiveStatus);
    const currentStatusBadgeClasses = getStatusBadgeClasses(effectiveStatus);
    const currentStatusIcon = getStatusIcon(effectiveStatus);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Detalle del turno"
      description="Visualizá, editá y gestioná el estado del turno."
      size="lg"
      footer={
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {!isCanceled && (
              <Button
                variant="border border-red-200 bg-red-100 text-red-600 hover:bg-red-200"
                onClick={() => handleChangeStatus("CANCELED")}
                disabled={!appointment?.id || isBusy}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {statusMutation.isPending ? "Procesando..." : "Cancelar"}
              </Button>
            )}

            {currentStatus !== "NO_SHOW" && !isCompleted && !isCanceled && (
              <Button
                variant="border border-amber-200 bg-amber-100 text-amber-700 hover:bg-amber-200"
                onClick={() => handleChangeStatus("NO_SHOW")}
                disabled={!appointment?.id || isBusy}
              >
                <UserX2 className="mr-2 h-4 w-4" />
                No asistió
              </Button>
            )}

            {!isCompleted && !isCanceled && (
              <Button
                variant="border border-emerald-200 bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                onClick={() => handleChangeStatus("COMPLETED")}
                disabled={!appointment?.id || isBusy}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Realizado
              </Button>
            )}

            {effectiveStatus !== "CONFIRMED" && !isCompleted && !isCanceled && (
              <Button
                variant="border border-cyan-200 bg-cyan-100 text-cyan-700 hover:bg-cyan-200"
                onClick={() => handleChangeStatus("CONFIRMED")}
                disabled={!appointment?.id || isBusy}
              >
                <Check className="mr-2 h-4 w-4" />
                Confirmar
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="secondary" onClick={onClose} disabled={isBusy}>
              Cerrar
            </Button>
            <Button onClick={handleSubmit} disabled={!canSubmit}>
              {updateMutation.isPending ? "Guardando..." : "Guardar cambios"}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        {appointment && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-medium text-slate-800">
                  Resumen del turno
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {appointment.client.fullName} · {appointment.service.name} ·{" "}
                  {format(parseISO(appointment.startAt), "dd/MM/yyyy HH:mm")}
                </p>
              </div>

              <span
                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${currentStatusBadgeClasses}`}
              >
                {currentStatusIcon}
                {currentStatusLabel}
              </span>
            </div>

            {isCanceled && (
              <p className="mt-3 text-xs text-red-600">
                Este turno está cancelado. No se puede editar.
              </p>
            )}

            {isCompleted && (
              <p className="mt-3 text-xs text-emerald-700">
                Este turno está completado. No se puede editar.
              </p>
            )}
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Cliente
          </label>

          <div ref={clientBoxRef} className="relative">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                value={clientSearch}
                onChange={(e) => {
                  if (isFormDisabled) return;
                  setClientSearch(e.target.value);
                  setClientId("");
                  setClientComboboxOpen(true);
                }}
                onFocus={() => {
                  if (!isFormDisabled) setClientComboboxOpen(true);
                }}
                placeholder="Buscar cliente por nombre, teléfono o email"
                disabled={isFormDisabled}
                className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-20 text-sm outline-none focus:ring-2 focus:ring-teal-500 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
              />

              <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
                {clientSearch && !isFormDisabled && (
                  <button
                    type="button"
                    onClick={handleClearClient}
                    className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                    aria-label="Limpiar cliente"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    if (!isFormDisabled) {
                      setClientComboboxOpen((prev) => !prev);
                    }
                  }}
                  disabled={isFormDisabled}
                  className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Abrir selector de clientes"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>
            </div>

            {clientComboboxOpen && !isFormDisabled && (
              <div className="absolute z-30 mt-2 max-h-72 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                <div className="max-h-72 overflow-y-auto py-1">
                  {clientsLoading ? (
                    <div className="px-3 py-3 text-sm text-slate-500">
                      Cargando clientes...
                    </div>
                  ) : clients.length === 0 ? (
                    <div className="px-3 py-3 text-sm text-slate-500">
                      No se encontraron clientes.
                    </div>
                  ) : (
                    clients.map((client) => {
                      const isSelected = client.id === clientId;

                      return (
                        <button
                          key={client.id}
                          type="button"
                          onClick={() => handleSelectClient(client)}
                          className="flex w-full items-start justify-between gap-3 px-3 py-2 text-left transition-colors hover:bg-slate-50"
                        >
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium text-slate-800">
                              {client.fullName}
                            </div>

                            {(client.phone || client.email) && (
                              <div className="mt-0.5 text-xs text-slate-500">
                                {[client.phone, client.email].filter(Boolean).join(" · ")}
                              </div>
                            )}
                          </div>

                          {isSelected && (
                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {selectedClient && (
            <p className="mt-1 text-xs text-slate-500">
              Cliente seleccionado:{" "}
              <span className="font-medium text-slate-700">
                {selectedClient.fullName}
              </span>
            </p>
          )}
        </div>

        <CustomSelect
          label="Profesional"
          placeholder="Seleccionar profesional"
          value={selectedProfessionalId}
          onChange={handleProfessionalChange}
          options={professionalOptions}
          loading={professionalsLoading}
          loadingText="Cargando profesionales..."
          emptyText="No hay profesionales disponibles."
          disabled={isFormDisabled}
        />

        <CustomSelect
          label="Servicio"
          placeholder={
            !selectedProfessionalId
              ? "Seleccionar profesional primero"
              : "Seleccionar servicio"
          }
          value={serviceId}
          onChange={(nextServiceId) => {
            setServiceId(nextServiceId);
            setSelectedStartAt("");
          }}
          options={serviceOptions}
          disabled={!selectedProfessionalId || isFormDisabled}
          loading={professionalServicesLoading}
          loadingText="Cargando servicios..."
          emptyText="Este profesional no tiene servicios asignados."
          helperText={
            selectedProfessional
              ? `Profesional seleccionado: ${selectedProfessional.name}`
              : undefined
          }
        />

        <CustomDatePicker
          label="Fecha"
          value={selectedDate}
          onChange={handleDateChange}
          color="teal"
          disabled={isFormDisabled}
        />

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="block text-sm font-medium text-slate-700">
              Horarios disponibles
            </label>
            {selectedDate && (
              <span className="text-xs text-slate-500">Fecha: {selectedDate}</span>
            )}
          </div>

          {!selectedProfessionalId ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
              Elegí un profesional para continuar.
            </div>
          ) : !serviceId ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
              Elegí un servicio para ver disponibilidad.
            </div>
          ) : availabilityLoading ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
              Buscando horarios disponibles...
            </div>
          ) : mergedSlots.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
              No hay horarios disponibles para ese día.
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {mergedSlots.map((slot) => {
                const isSelected = selectedStartAt === slot.startAt;

                return (
                  <button
                    key={slot.startAt}
                    type="button"
                    onClick={() => setSelectedStartAt(slot.startAt)}
                    disabled={isFormDisabled}
                    className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                      isSelected
                        ? "border-teal-600 bg-teal-50 text-teal-700"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    } ${isFormDisabled ? "cursor-not-allowed opacity-60" : ""}`}
                  >
                    {slot.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {selectedSlotLabel && (
          <div className="rounded-xl border border-teal-100 bg-teal-50 px-4 py-3">
            <p className="text-sm text-teal-800">
              Horario seleccionado:{" "}
              <span className="font-semibold">{selectedSlotLabel}</span>
            </p>
          </div>
        )}

        {(updateMutation.isError || statusMutation.isError) && (
          <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {(updateMutation.error as Error)?.message ||
              (statusMutation.error as Error)?.message ||
              "No se pudo actualizar el turno."}
          </div>
        )}
      </div>
    </Modal>
  );
}