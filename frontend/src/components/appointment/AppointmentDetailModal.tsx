import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import {
  Check,
  ChevronDown,
  Search,
  X,
} from "lucide-react";

import CustomSelect from "../ui/CustomSelect";
import CustomDatePicker from "../ui/CustomDatePicker";
import Modal from "../ui/Modal";

import { useClients } from "../../hooks/useClients";
import { useProfessionals } from "../../hooks/useProfessionals";
import { useProfessionalServices } from "../../hooks/useProfessionalServices";
import { useAvailability } from "../../hooks/useAvailability";

import { AppointmentStatus, type AgendaAppointment, type AppointmentUiStatus, type AppointmentStatus as EntityAppointmentStatus } from "../../types/entities";
import {
  updateAppointment,
  changeAppointmentStatus,
} from "../../services/appointments.api";
import FooterDetail from "./FooterDetail";
import SummaryDetail from "./SummaryDetail";

type Props = {
  open: boolean;
  onClose: () => void;
  appointment: AgendaAppointment | null;
};

type ClientOption = {
  id: string;
  fullName: string;
  phone?: string | null;
  email?: string | null;
};

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

  const [depositAmount, setDepositAmount] = useState("");
  const [showDepositInput, setShowDepositInput] = useState(false);  
  const [depositTouched, setDepositTouched] = useState(false);

  const clientBoxRef = useRef<HTMLDivElement | null>(null);

  const currentStatus = appointment?.status as
    | AppointmentStatus
    | EntityAppointmentStatus
    | undefined;

  const effectiveStatus: AppointmentUiStatus | undefined =
    appointment?.isPendingResolution
      ? "PENDING_RESOLUTION"
      : (currentStatus as AppointmentStatus | undefined);

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
      setDepositAmount("");
      setShowDepositInput(false);
      setDepositTouched(false);
      return;
    }

    setClientId(appointment.client.id);
    setClientSearch(appointment.client.fullName);
    setSelectedProfessionalId(appointment.professional?.id ?? "");
    setServiceId(appointment.service.id);
    setSelectedStartAt(appointment.startAt);
    setSelectedDate(format(parseISO(appointment.startAt), "yyyy-MM-dd"));
    setDepositAmount(
      appointment.depositAmount != null ? String(appointment.depositAmount) : ""
    );
    setShowDepositInput(false);
    setDepositTouched(false);
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

  const parsedDepositAmount = Number(depositAmount);
  const servicePrice = Number(appointment?.priceFinal ?? 0);

  const hasDepositValue =
    depositAmount.trim() !== "" && !Number.isNaN(parsedDepositAmount);

  const isDepositGreaterThanService =
    hasDepositValue && servicePrice > 0 && parsedDepositAmount > servicePrice;

  const hasValidDepositAmount =
    hasDepositValue &&
    parsedDepositAmount > 0 &&
    !isDepositGreaterThanService;

  const shouldShowDepositError =
    showDepositInput && depositTouched && !hasValidDepositAmount;

  const canSubmit =
    !!appointment?.id &&
    !!selectedProfessionalId &&
    !!clientId &&
    !!serviceId &&
    !!selectedStartAt &&
    !isFormDisabled &&
    (!showDepositInput || hasValidDepositAmount);

  const handleSelectClient = (client: ClientOption) => {
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

  const handleSubmit = () => {
        if (!appointment?.id || !canSubmit) return;
  
        if (showDepositInput && !hasValidDepositAmount) {
           setDepositTouched(true);
           return;
        }
  
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
  
        if (status === "DEPOSIT_PAID") {
           if (!showDepositInput) {
              setShowDepositInput(true);
              setDepositTouched(false);
              return;
           }
  
           setDepositTouched(true);
  
           if (!hasValidDepositAmount) {
              if (isDepositGreaterThanService) {
                 window.alert(
                    "La seña no puede ser mayor al valor del servicio.",
                 );
                 return;
              }
  
              window.alert("Ingresá un monto de seña válido mayor a 0.");
              return;
           }
  
           statusMutation.mutate({
              id: appointment.id,
              status,
              depositAmount: parsedDepositAmount,
           });
  
           return;
        }
  
        const needsConfirm = status === "CANCELED";
        if (needsConfirm) {
           const confirmed = window.confirm(
              "¿Seguro que querés cancelar este turno?",
           );
           if (!confirmed) return;
        }
  
        statusMutation.mutate({
           id: appointment.id,
           status,
        });
     };


  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Detalle del turno"
      description="Visualizá, editá y gestioná el estado del turno."
      size="lg"
      footer={
        <FooterDetail 
          canSubmit={canSubmit}
          appointment={appointment}
          showDepositInput={showDepositInput}
          hasValidDepositAmount={hasValidDepositAmount}
          handleChangeStatus={handleChangeStatus}
          isCanceled={isCanceled}
          statusMutation={statusMutation}
          isBusy={isBusy}
          isCompleted={isCompleted}
          handleSubmit={handleSubmit}
          updateMutation={updateMutation}
          currentStatus={currentStatus}
          effectiveStatus={effectiveStatus}
          onClose={onClose}
        />
      }
    >
      <div className="space-y-5">
        {appointment && (
          <SummaryDetail
            appointment={appointment}
            effectiveStatus={effectiveStatus}
            isCanceled={isCanceled}
            isCompleted={isCompleted}
          />
        )}

        {showDepositInput && !isCompleted && !isCanceled && (
          <div className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-4">
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Monto de seña
            </label>

            <input
              type="number"
              min="0"
              step="0.01"
              value={depositAmount}
              onChange={(e) => {
                setDepositAmount(e.target.value);
                setDepositTouched(true);
              }}
              onBlur={() => setDepositTouched(true)}
              placeholder="Ej: 5000"
              disabled={isBusy}
              className={`w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-500 ${
                shouldShowDepositError ? "border-red-300" : "border-slate-200"
              }`}
            />
            <div className="mt-2 space-y-1">
              <p className="text-xs text-slate-500">
                Ingresá cuánto abonó el cliente para marcar el turno como señado.
                {servicePrice > 0 && (
                  <>
                    {" "}El valor del servicio es{" "}
                    <span className="font-medium text-slate-700">
                      ${servicePrice.toLocaleString("es-AR")}
                    </span>.
                  </>
                )}
              </p>

              {shouldShowDepositError && (
                <p className="text-xs text-red-600">
                  {isDepositGreaterThanService
                    ? "La seña no puede ser mayor al valor del servicio."
                    : "Tenés que ingresar una seña válida mayor a 0."}
                </p>
              )}
            </div>
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