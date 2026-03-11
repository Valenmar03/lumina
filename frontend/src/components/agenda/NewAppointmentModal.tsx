import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { Check, ChevronDown, Search, X } from "lucide-react";

import Modal from "../ui/Modal";
import Button from "../ui/Button";
import { useClients } from "../../hooks/useClients";
import { useProfessionals } from "../../hooks/useProfessionals";
import { useProfessionalServices } from "../../hooks/useProfessionals";
import { useAvailability } from "../../hooks/useAvailability";
import { createAppointment } from "../../services/appointments.api";

type Props = {
  open: boolean;
  onClose: () => void;
  professionalId?: string;
  date?: string; // yyyy-MM-dd
  time?: string; // HH:mm
};

export default function NewAppointmentModal({
  open,
  onClose,
  professionalId,
  date,
  time,
}: Props) {
  const queryClient = useQueryClient();

  const [clientSearch, setClientSearch] = useState("");
  const [clientId, setClientId] = useState("");
  const [clientComboboxOpen, setClientComboboxOpen] = useState(false);

  const [selectedProfessionalId, setSelectedProfessionalId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [selectedStartAt, setSelectedStartAt] = useState<string>("");

  const clientBoxRef = useRef<HTMLDivElement | null>(null);

  const { data: clientsData, isLoading: clientsLoading } = useClients(clientSearch);
  const { data: professionalsData, isLoading: professionalsLoading } = useProfessionals();

  const {
    data: professionalServicesData,
    isLoading: professionalServicesLoading,
  } = useProfessionalServices(selectedProfessionalId);

  const { data: availabilityData, isLoading: availabilityLoading } = useAvailability(
    selectedProfessionalId,
    date,
    serviceId
  );

  useEffect(() => {
    if (!open) {
      setClientSearch("");
      setClientId("");
      setClientComboboxOpen(false);
      setSelectedProfessionalId("");
      setServiceId("");
      setSelectedStartAt("");
      return;
    }

    setSelectedProfessionalId(professionalId ?? "");
    setServiceId("");

    if (date && time && professionalId) {
      const localIso = `${date}T${time}:00-03:00`;
      setSelectedStartAt(localIso);
    } else {
      setSelectedStartAt("");
    }
  }, [open, date, time, professionalId]);

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

  useEffect(() => {
    if (!serviceId) return;

    if (!selectedStartAt && slots.length > 0) {
      setSelectedStartAt(slots[0].startAt);
    }
  }, [serviceId, slots, selectedStartAt]);

  const selectedSlotLabel = useMemo(() => {
    if (!selectedStartAt) return "";
    try {
      return format(parseISO(selectedStartAt), "HH:mm");
    } catch {
      return "";
    }
  }, [selectedStartAt]);

  const mutation = useMutation({
    mutationFn: createAppointment,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["agenda"] }),
        queryClient.invalidateQueries({ queryKey: ["availability"] }),
      ]);
      onClose();
    },
  });

  const canSubmit =
    !!selectedProfessionalId &&
    !!clientId &&
    !!serviceId &&
    !!selectedStartAt &&
    !mutation.isPending;

  const handleSubmit = () => {
    if (!canSubmit) return;

    mutation.mutate({
      professionalId: selectedProfessionalId,
      clientId,
      serviceId,
      startAt: selectedStartAt,
    });
  };

  const handleSelectClient = (client: {
    id: string;
    fullName: string;
    phone?: string | null;
    email?: string | null;
  }) => {
    setClientId(client.id);
    setClientSearch(client.fullName);
    setClientComboboxOpen(false);
  };

  const handleClearClient = () => {
    setClientId("");
    setClientSearch("");
    setClientComboboxOpen(false);
  };

  const handleProfessionalChange = (nextProfessionalId: string) => {
    setSelectedProfessionalId(nextProfessionalId);
    setServiceId("");
    setSelectedStartAt("");

    if (!date || !time) return;

    const localIso = `${date}T${time}:00-03:00`;
    setSelectedStartAt(localIso);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nuevo turno"
      description="Seleccioná cliente, profesional, servicio y horario disponible."
      size="lg"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {mutation.isPending ? "Guardando..." : "Crear turno"}
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
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
                  setClientSearch(e.target.value);
                  setClientId("");
                  setClientComboboxOpen(true);
                }}
                onFocus={() => setClientComboboxOpen(true)}
                placeholder="Buscar cliente por nombre, teléfono o email"
                className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-20 text-sm outline-none focus:ring-2 focus:ring-teal-500"
              />

              <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
                {clientSearch && (
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
                  onClick={() => setClientComboboxOpen((prev) => !prev)}
                  className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                  aria-label="Abrir selector de clientes"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>
            </div>

            {clientComboboxOpen && (
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

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Profesional
          </label>
          <select
            value={selectedProfessionalId}
            onChange={(e) => handleProfessionalChange(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="">Seleccionar profesional</option>
            {professionals.map((professional) => (
              <option key={professional.id} value={professional.id}>
                {professional.name}
              </option>
            ))}
          </select>

          {professionalsLoading && (
            <p className="mt-1 text-xs text-slate-500">Cargando profesionales...</p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Servicio
          </label>
          <select
            value={serviceId}
            onChange={(e) => {
              setServiceId(e.target.value);
              setSelectedStartAt("");
            }}
            disabled={!selectedProfessionalId}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-500 bg-white disabled:bg-slate-50 disabled:text-slate-400"
          >
            <option value="">
              {!selectedProfessionalId
                ? "Seleccionar profesional primero"
                : "Seleccionar servicio"}
            </option>

            {professionalServices.map((item) => (
              <option key={item.service.id} value={item.service.id}>
                {item.service.name} · {item.service.durationMin} min
              </option>
            ))}
          </select>

          {professionalServicesLoading && (
            <p className="mt-1 text-xs text-slate-500">Cargando servicios...</p>
          )}

          {!professionalServicesLoading &&
            selectedProfessionalId &&
            professionalServices.length === 0 && (
              <p className="mt-1 text-xs text-slate-500">
                Este profesional no tiene servicios asignados.
              </p>
            )}

          {selectedProfessional && (
            <p className="mt-1 text-xs text-slate-500">
              Profesional seleccionado:{" "}
              <span className="font-medium text-slate-700">
                {selectedProfessional.name}
              </span>
            </p>
          )}
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="block text-sm font-medium text-slate-700">
              Horarios disponibles
            </label>
            {date && <span className="text-xs text-slate-500">Fecha: {date}</span>}
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
          ) : slots.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
              No hay horarios disponibles para ese día.
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {slots.map((slot) => {
                const isSelected = selectedStartAt === slot.startAt;

                return (
                  <button
                    key={slot.startAt}
                    type="button"
                    onClick={() => setSelectedStartAt(slot.startAt)}
                    className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                      isSelected
                        ? "border-teal-600 bg-teal-50 text-teal-700"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
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

        {mutation.isError && (
          <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {(mutation.error as Error)?.message || "No se pudo crear el turno."}
          </div>
        )}
      </div>
    </Modal>
  );
}