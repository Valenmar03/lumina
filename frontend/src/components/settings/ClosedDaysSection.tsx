import { useState } from "react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarOff, Trash2, Plus, AlertCircle } from "lucide-react";
import {
  useBusinessUnavailabilities,
  useCreateBusinessUnavailability,
  useDeleteBusinessUnavailability,
} from "../../hooks/useBusinessUnavailabilities";

export default function ClosedDaysSection() {
  const { data, isLoading } = useBusinessUnavailabilities();
  const createMutation = useCreateBusinessUnavailability();
  const deleteMutation = useDeleteBusinessUnavailability();

  const [date, setDate] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const unavailabilities = data?.unavailabilities ?? [];

  async function handleAdd() {
    if (!date) return;
    setError(null);
    try {
      await createMutation.mutateAsync({ date, reason: reason.trim() || null });
      setDate("");
      setReason("");
    } catch (err: any) {
      if ((err as any)?.body?.error === "DATE_ALREADY_CLOSED") {
        setError("Ya existe un cierre para esa fecha.");
      } else {
        setError(err?.message ?? "Error al guardar");
      }
    }
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="flex items-center gap-2.5 px-6 py-4 border-b border-slate-100">
        <CalendarOff className="w-4 h-4 text-slate-400" />
        <h2 className="text-sm font-semibold text-slate-700">Días cerrados</h2>
      </div>

      <div className="px-6 py-4 space-y-4">
        {/* Add form */}
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            min={format(new Date(), "yyyy-MM-dd")}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-teal-500"
          />
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Motivo (opcional)"
            maxLength={200}
            className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-teal-500"
          />
          <button
            onClick={handleAdd}
            disabled={!date || createMutation.isPending}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-slate-800 text-white text-sm font-medium hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <Plus className="w-3.5 h-3.5" />
            {createMutation.isPending ? "Guardando..." : "Agregar"}
          </button>
        </div>

        {error && (
          <p className="flex items-center gap-1.5 text-xs text-red-600">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            {error}
          </p>
        )}

        {/* List */}
        {isLoading ? (
          <p className="text-sm text-slate-400">Cargando...</p>
        ) : unavailabilities.length === 0 ? (
          <p className="text-sm text-slate-400">No hay días cerrados configurados.</p>
        ) : (
          <ul className="space-y-2">
            {unavailabilities.map((u) => (
              <li
                key={u.id}
                className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-4 py-2.5"
              >
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    {format(parseISO(u.date), "EEEE d 'de' MMMM, yyyy", { locale: es })}
                  </p>
                  {u.reason && (
                    <p className="text-xs text-slate-400 mt-0.5">{u.reason}</p>
                  )}
                </div>
                <button
                  onClick={() => deleteMutation.mutate(u.id)}
                  disabled={deleteMutation.isPending}
                  className="text-slate-400 hover:text-red-500 transition-colors disabled:opacity-40"
                  title="Eliminar"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
