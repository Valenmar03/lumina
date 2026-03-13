import { useEffect, useState } from "react";
import { Clock3, DollarSign, FileText, User2 } from "lucide-react";

import Modal from "../ui/Modal";
import Button from "../ui/Button";
import { useProfessionals } from "../../hooks/useProfessionals";
import { useUpdateService } from "../../hooks/useUpdateService";
import type { ServiceWithProfessional } from "../../types/entities";

type Props = {
  open: boolean;
  onClose: () => void;
  service: ServiceWithProfessional | null;
};

export default function ServiceDetailModal({
  open,
  onClose,
  service,
}: Props) {
  const { data: professionalsData, isLoading: professionalsLoading } = useProfessionals();

  const updateServiceMutation = useUpdateService();

  const professionals = professionalsData?.professionals ?? [];

  const activeAssignedProfessionals = professionals.filter(
        (p) =>
            p.active &&
            service?.professionalServices?.some((ps) => ps.professional.id === p.id)
    );


    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [durationMin, setDurationMin] = useState(30);
    const [active, setActive] = useState(true);
    const [basePrice, setBasePrice] = useState(0);
    const [basePriceError, setBasePriceError] = useState<string | null>(null);
    const [nameError, setNameError] = useState<string | null>(null);
    const [durationError, setDurationError] = useState<string | null>(null);

    useEffect(() => {
        if (!open || !service) return;

        setName(service.name ?? "");
        setDescription(service.description ?? "");
        setDurationMin(service.durationMin ?? 30);
        setBasePrice(service.basePrice ?? 0);
        setActive(Boolean(service.active));
        setNameError(null);
        setDurationError(null);
        setBasePriceError(null);
    }, [open, service]);

  const isSaving =
    updateServiceMutation.isPending;

  const nameInvalid = !name.trim();
  const durationInvalid = !durationMin || Number(durationMin) <= 0;
  const basePriceInvalid = basePrice < 0 || Number.isNaN(basePrice);

  const handleSave = async () => {
    if (!service) return;

    const trimmedName = name.trim();

    if (!trimmedName) {
      setNameError("El nombre del servicio es obligatorio");
      return;
    }

    if (!durationMin || Number(durationMin) <= 0) {
      setDurationError("La duración debe ser mayor a 0");
      return;
    }

    if (basePrice < 0 || Number.isNaN(basePrice)) {
        setBasePriceError("El precio debe ser mayor o igual a 0");
        return;
    }

    setNameError(null);
    setDurationError(null);
    setBasePriceError(null);

    try {
      await updateServiceMutation.mutateAsync({
        serviceId: service.id,
        name: trimmedName,
        description: description.trim(),
        durationMin: Number(durationMin),
        basePrice: Number(basePrice),
        active,
      });

      onClose();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={service ? "Editar servicio" : "Servicio"}
      description="Modificá nombre, descripción, duración, estado y profesionales asignados."
      size="xl"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={
                !service ||
                isSaving ||
                professionalsLoading ||
                nameInvalid ||
                durationInvalid ||
                basePriceInvalid
            }
          >
            {isSaving ? "Guardando..." : "Guardar cambios"}
          </Button>
        </div>
      }
    >
      {!service ? (
        <div className="text-sm text-slate-500">
          No hay servicio seleccionado.
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-teal-600 flex items-center justify-center text-white font-semibold text-xl shrink-0">
              {name?.[0]?.toUpperCase()}
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
                      if (e.target.value.trim()) setNameError(null);
                    }}
                    className={`h-10 w-full rounded-lg border bg-white px-3 text-sm outline-none focus:ring-2 ${
                      nameError
                        ? "border-red-300 focus:ring-red-500"
                        : "border-slate-200 focus:ring-teal-500"
                    }`}
                  />
                  {nameError && (
                    <p className="mt-1 text-xs text-red-600">{nameError}</p>
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
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-4 h-4 text-slate-500" />
              <h4 className="text-sm font-medium text-slate-800">Descripción</h4>
            </div>

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Agregá una descripción para el servicio..."
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div>

                <div className="flex items-center gap-2 mb-3">
                    <Clock3 className="w-4 h-4 text-slate-500" />
                    <h4 className="text-sm font-medium text-slate-800">Duración</h4>
                </div>

                <div className="max-w-xs">
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                        Duración en minutos
                    </label>
                    <input
                        type="number"
                        min={1}
                        step={1}
                        value={durationMin}
                        onChange={(e) => {
                            setDurationMin(Number(e.target.value));
                            if (Number(e.target.value) > 0) setDurationError(null);
                        }}
                        className={`h-10 w-full rounded-lg border bg-white px-3 text-sm outline-none focus:ring-2 ${
                            durationError
                            ? "border-red-300 focus:ring-red-500"
                            : "border-slate-200 focus:ring-teal-500"
                        }`}
                    />

                    {durationError && (
                        <p className="mt-1 text-xs text-red-600">{durationError}</p>
                    )}
                </div>
            </div>
            <div>
                <div className="flex items-center gap-2 mb-3">
                    <DollarSign className="w-4 h-4 text-slate-500" />
                    <h4 className="text-sm font-medium text-slate-800">Precio</h4>
                </div>

                <div className="max-w-xs">
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                        Precio base
                    </label>
                    <input
                        type="number"
                        min={0}
                        step={0.01}
                        value={basePrice}
                        onChange={(e) => {
                            const value = Number(e.target.value);
                            setBasePrice(value);

                            if (!Number.isNaN(value) && value >= 0) {
                            setBasePriceError(null);
                            }
                        }}
                        className={`h-10 w-full rounded-lg border bg-white px-3 text-sm outline-none focus:ring-2 ${
                            basePriceError
                            ? "border-red-300 focus:ring-red-500"
                            : "border-slate-200 focus:ring-teal-500"
                        }`}
                    />
                    {basePriceError && (
                        <p className="mt-1 text-xs text-red-600">{basePriceError}</p>
                    )}
                </div>
            </div>
          </div>

          <div className="rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <User2 className="w-4 h-4 text-slate-500" />
              <h4 className="text-sm font-medium text-slate-800">
                Profesionales asignados
              </h4>
            </div>

            {professionalsLoading ? (
              <p className="text-sm text-slate-500">Cargando profesionales...</p>
            ) : activeAssignedProfessionals.length === 0 ? (
              <p className="text-sm text-slate-500">
                No hay profesionales cargados en el negocio.
              </p>
            ) : (
             <div className="flex -space-x-1.5 mt-1">
                {activeAssignedProfessionals.map((professional: any) => {
                  return (
                    <div
                     key={professional.id}
                     className="w-9 h-9 rounded-full border-2 border-white flex items-center justify-center text-[9px] text-white font-bold"
                     style={{ background: professional.color || "#0D9488" }}
                     title={professional.name}
                  >
                     {professional.name?.[0]}
                  </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}