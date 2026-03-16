import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";

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
import Client from "./DetailForm.tsx/Client";
import Button from "../ui/Button";
import Status from "./DetailForm.tsx/Status";

type Props = {
  open: boolean;
  onClose: () => void;
  appointment: AgendaAppointment | null;
};

export type ClientOption = {
  id: string;
  fullName: string;
  phone?: string | null;
  email?: string | null;
};

type DetailView = "summary" | "edit" | "status";


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

  const [view, setView] = useState<DetailView>("summary");

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
      setView("summary");
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
    setView("summary");
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
    !isFormDisabled;

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
        view !== "status" && (

          <FooterDetail 
          canSubmit={canSubmit}
          showDepositInput={showDepositInput}
          hasValidDepositAmount={hasValidDepositAmount}
          isBusy={isBusy}
          handleSubmit={handleSubmit}
          updateMutation={updateMutation}
          onClose={onClose}
          />
        )
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

        {appointment && !isCompleted && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
            <p className="text-sm text-slate-600">
              Elegí qué querés hacer con este turno.
            </p>
            <div className="flex gap-2 justify-between mt-3">
              <Button
                onClick={() => {
                  setView("status");
                  setShowDepositInput(false);
                  setDepositTouched(false);
                }}
                variant={`flex-1 transition-all
                  ${
                    view === "status"
                      ? "bg-teal-600 text-white border-teal-600 hover:bg-teal-700"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  }
                  border`}
              >
                Cambiar Estado
              </Button>

              <Button
                onClick={() => {
                  setView("edit");
                  setShowDepositInput(false);
                  setDepositTouched(false);
                }}
                variant={`flex-1 transition-all
                  ${
                    view === "edit"
                      ? "bg-teal-600 text-white border-teal-600 hover:bg-teal-700"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  }
                  border`}
              >
                Modificar Turno
              </Button>
            </div>
          </div>
        )}


          {view === "status" && !isCompleted && !isCanceled && (
            <>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
                <p className="text-sm text-slate-600">
                  Seleccioná el nuevo estado del turno desde las acciones inferiores.
                </p>
              </div>
              <Status 
                handleChangeStatus={handleChangeStatus}
                isCanceled={isCanceled}
                statusMutation={statusMutation}
                isCompleted={isCompleted}
                currentStatus={currentStatus}
                effectiveStatus={effectiveStatus}
                appointment={appointment}
                showDepositInput={showDepositInput}
                hasValidDepositAmount={hasValidDepositAmount}
                isBusy={isBusy}
              />

            </>
          )}
        {view === "status" && showDepositInput && !isCompleted && !isCanceled && (
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

        {view === "edit" && (
          <>

          <Client
            handleSelectClient={handleSelectClient}
            clientBoxRef={clientBoxRef}
            clientSearch={clientSearch}
            isFormDisabled={isFormDisabled}
            setClientSearch={setClientSearch}
            setClientId={setClientId}
            setClientComboboxOpen={setClientComboboxOpen}
            handleClearClient={handleClearClient}
            clientComboboxOpen={clientComboboxOpen}
            clientsLoading={clientsLoading}
            clients={clients}
            clientId={clientId}
            selectedClient={selectedClient}
          />

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
          </>
        )}

        
      </div>
    </Modal>
  );
}