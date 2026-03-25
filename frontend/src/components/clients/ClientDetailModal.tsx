import { useEffect, useState } from "react";
import { FileText, Mail, Trash2, User2 } from "lucide-react";

import Modal from "../ui/Modal";
import Button from "../ui/Button";
import PhoneInput from "../ui/PhoneInput";
import { useDeleteClient, useUpdateClient } from "../../hooks/useClients";
import type { Client } from "../../types/entities";

type Props = {
  open: boolean;
  onClose: () => void;
  client: Client | null;
};

export default function ClientDetailModal({
  open,
  onClose,
  client,
}: Props) {
  const updateClientMutation = useUpdateClient();
  const deleteClientMutation = useDeleteClient();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");

  const [fullNameError, setFullNameError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !client) return;

    setFullName(client.fullName ?? "");
    setPhone(client.phone ?? "");
    setEmail(client.email ?? "");
    setNotes(client.notes ?? "");
    setFullNameError(null);
    setPhoneError(null);
  }, [open, client]);

  const isSaving = updateClientMutation.isPending;
  const isDeleting = deleteClientMutation.isPending;

  const fullNameInvalid = !fullName.trim();
  const phoneInvalid = !phone.trim();

  const handleSave = async () => {
    if (!client) return;

    if (!fullName.trim()) {
      setFullNameError("El nombre es obligatorio");
      return;
    }

    if (!phone.trim()) {
      setPhoneError("El teléfono es obligatorio");
      return;
    }

    setFullNameError(null);
    setPhoneError(null);

    try {
      await updateClientMutation.mutateAsync({
        clientId: client.id,
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        notes: notes.trim(),
      });

      onClose();
    } catch (error) {
      const err = error as { status?: number };
      if (err.status === 409) {
        setPhoneError("Ya existe un cliente con ese número de teléfono");
      } else {
        console.error(error);
      }
    }
  };

  const handleDelete = async () => {
    if (!client) return;

    const confirmed = window.confirm(
      `¿Seguro que querés eliminar a ${client.fullName}?`
    );

    if (!confirmed) return;

    try {
      await deleteClientMutation.mutateAsync(client.id);
      onClose();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={client ? "Editar cliente" : "Cliente"}
      description="Modificá los datos del cliente."
      size="lg"
      footer={
        <div className="flex items-center justify-between gap-2">
          <Button
            variant="secondary"
            onClick={handleDelete}
            disabled={!client || isDeleting || isSaving}
            className="inline-flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            {isDeleting ? "Eliminando..." : "Eliminar"}
          </Button>

          <div className="flex gap-2">
            <Button variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={!client || isSaving || fullNameInvalid || phoneInvalid}
            >
              {isSaving ? "Guardando..." : "Guardar cambios"}
            </Button>
          </div>
        </div>
      }
    >
      {!client ? (
        <div className="text-sm text-slate-500">
          No hay cliente seleccionado.
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 font-semibold text-lg shrink-0">
              {client.fullName
                .split(" ")
                .filter(Boolean)
                .slice(0, 2)
                .map((p) => p[0]?.toUpperCase())
                .join("")}
            </div>

            <div className="min-w-0 flex-1">
              <div className="text-lg font-semibold text-slate-900">
                {client.fullName}
              </div>
              <div className="mt-1 flex flex-wrap gap-3 text-sm text-slate-500">
                <span>{client.visitsCount ?? 0} visitas</span>
                <span>
                  {new Intl.NumberFormat("es-AR", {
                    style: "currency",
                    currency: "ARS",
                    maximumFractionDigits: 0,
                  }).format(client.totalSpent ?? 0)}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-4">
            <div>
              <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-slate-700">
                <User2 className="w-4 h-4 text-slate-500" />
                Nombre completo
              </label>
              <input
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (e.target.value.trim()) setFullNameError(null);
                }}
                className={`h-10 w-full rounded-lg border bg-white px-3 text-sm outline-none focus:ring-2 ${
                  fullNameError
                    ? "border-red-300 focus:ring-red-500"
                    : "border-slate-200 focus:ring-teal-500"
                }`}
              />
              {fullNameError && (
                <p className="mt-1 text-xs text-red-600">{fullNameError}</p>
              )}
            </div>

            <div>
              <PhoneInput
                value={phone}
                onChange={(v) => { setPhone(v); if (v) setPhoneError(null); }}
                required
              />
              {phoneError && (
                <p className="mt-1 text-xs text-red-600">{phoneError}</p>
              )}
            </div>

            <div>
              <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-slate-700">
                <Mail className="w-4 h-4 text-slate-500" />
                Email
              </label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-slate-700">
                <FileText className="w-4 h-4 text-slate-500" />
                Notas
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none resize-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}