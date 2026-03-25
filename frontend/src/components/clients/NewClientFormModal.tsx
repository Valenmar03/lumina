import { useEffect, useState } from "react";
import { FileText, Mail, User2 } from "lucide-react";

import Modal from "../ui/Modal";
import Button from "../ui/Button";
import PhoneInput from "../ui/PhoneInput";
import { useCreateClient } from "../../hooks/useClients";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function NewClientFormModal({ open, onClose }: Props) {
  const createClientMutation = useCreateClient();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");

  const [fullNameError, setFullNameError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    setFullName("");
    setPhone("");
    setEmail("");
    setNotes("");
    setFullNameError(null);
    setPhoneError(null);
  }, [open]);

  const isSaving = createClientMutation.isPending;

  const handleSave = async () => {
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
      await createClientMutation.mutateAsync({
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

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nuevo cliente"
      description="Creá un nuevo cliente para tu negocio."
      size="lg"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Guardando..." : "Crear cliente"}
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 font-semibold text-lg shrink-0">
            {fullName
              .split(" ")
              .filter(Boolean)
              .slice(0, 2)
              .map((p) => p[0]?.toUpperCase())
              .join("") || "+"}
          </div>

          <div className="min-w-0 flex-1">
            <div className="text-lg font-semibold text-slate-900">
              Nuevo cliente
            </div>
            <div className="text-sm text-slate-500">
              Completá los datos básicos.
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
    </Modal>
  );
}