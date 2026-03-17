import { useEffect, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Building2,
  Link2,
  Globe,
  BadgeCheck,
  Users,
  Scissors,
  UserCircle,
  Pencil,
  Check,
  X,
  AlertCircle,
} from "lucide-react";
import { useBusiness, useUpdateBusiness } from "../hooks/useBusiness";
import { useProfessionals } from "../hooks/useProfessionals";
import { useServices } from "../hooks/useServices";
import { useClients } from "../hooks/useClients";

const PLAN_LABELS: Record<string, string> = {
  STARTER: "Starter",
  PRO: "Pro",
};

const SUBSCRIPTION_LABELS: Record<string, string> = {
  TRIAL: "Período de prueba",
  ACTIVE: "Activo",
  PAST_DUE: "Pago vencido",
  CANCELED: "Cancelado",
};

const SUBSCRIPTION_COLORS: Record<string, string> = {
  TRIAL: "bg-amber-50 text-amber-700",
  ACTIVE: "bg-emerald-50 text-emerald-700",
  PAST_DUE: "bg-red-50 text-red-700",
  CANCELED: "bg-slate-100 text-slate-600",
};

function normalizeSlug(raw: string) {
  return raw
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function EditableField({
  label,
  value,
  onSave,
  hint,
  preview,
  normalize,
}: {
  label: string;
  value: string;
  onSave: (val: string) => Promise<void>;
  hint?: string;
  preview?: (val: string) => string;
  normalize?: (val: string) => string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  const handleSave = async () => {
    const final = normalize ? normalize(draft) : draft.trim();
    if (!final || final === value) {
      setEditing(false);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave(final);
      setEditing(false);
    } catch (err: any) {
      setError(err?.message ?? "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setDraft(value);
    setEditing(false);
    setError(null);
  };

  const displayDraft = normalize ? normalizeSlug(draft) : draft;

  return (
    <div className="py-4 flex items-start justify-between gap-4">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">
          {label}
        </p>
        {editing ? (
          <div className="space-y-1.5">
            <input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
                if (e.key === "Escape") handleCancel();
              }}
              className="w-full max-w-sm rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-teal-500"
            />
            {preview && displayDraft && (
              <p className="text-xs text-slate-400">
                URL de login:{" "}
                <span className="font-mono text-slate-600">
                  caleio.app/login/{displayDraft}
                </span>
              </p>
            )}
            {hint && !preview && (
              <p className="text-xs text-slate-400">{hint}</p>
            )}
            {error && (
              <p className="flex items-center gap-1 text-xs text-red-600">
                <AlertCircle className="w-3.5 h-3.5" />
                {error}
              </p>
            )}
          </div>
        ) : (
          <div>
            <p className="text-sm font-medium text-slate-800">{value}</p>
            {preview && (
              <p className="mt-0.5 text-xs text-slate-400 font-mono">
                caleio.app/login/{value}
              </p>
            )}
            {hint && !preview && (
              <p className="mt-0.5 text-xs text-slate-400">{hint}</p>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 pt-5 shrink-0">
        {editing ? (
          <>
            <button
              onClick={handleCancel}
              disabled={saving}
              className="p-1.5 rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="p-1.5 rounded-md text-teal-600 hover:bg-teal-50 transition-colors"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
            </button>
          </>
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="p-1.5 rounded-md text-slate-300 hover:bg-slate-100 hover:text-slate-500 transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

export default function BusinessSettingsPage() {
  const currentDate = new Date();
  const { data: businessData, isLoading } = useBusiness();
  const { mutateAsync: update } = useUpdateBusiness();

  const { data: professionalsData } = useProfessionals();
  const { data: servicesData } = useServices();
  const { data: clientsData } = useClients("");

  const business = businessData?.business;
  const activeProfessionals = (professionalsData?.professionals ?? []).filter(
    (p) => p.active
  ).length;
  const activeServices = (servicesData?.services ?? []).filter(
    (s) => s.active
  ).length;
  const totalClients = clientsData?.clients?.length ?? 0;

  return (
    <div className="max-w-full mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Administración
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {format(currentDate, "EEEE d 'de' MMMM, yyyy", { locale: es })}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-sm text-slate-500">
          Cargando información del negocio...
        </div>
      ) : !business ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-sm text-slate-500">
          No se pudo cargar la información del negocio.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column — editable info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Información general */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="flex items-center gap-2.5 px-6 py-4 border-b border-slate-100">
                <Building2 className="w-4 h-4 text-slate-400" />
                <h2 className="text-sm font-semibold text-slate-700">
                  Información del negocio
                </h2>
              </div>
              <div className="px-6 divide-y divide-slate-100">
                <EditableField
                  label="Nombre"
                  value={business.name}
                  onSave={(name) => update({ name }).then(() => {})}
                />
                <EditableField
                  label="Slug (URL de acceso)"
                  value={business.slug}
                  onSave={(slug) => update({ slug }).then(() => {})}
                  preview={(v) => v}
                  normalize={normalizeSlug}
                />
                <div className="py-4">
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">
                    Zona horaria
                  </p>
                  <p className="text-sm font-medium text-slate-800">
                    {business.timezone}
                  </p>
                </div>
                <div className="py-4">
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">
                    Negocio creado
                  </p>
                  <p className="text-sm font-medium text-slate-800">
                    {format(new Date(business.createdAt), "d 'de' MMMM, yyyy", {
                      locale: es,
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Plan y suscripción */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="flex items-center gap-2.5 px-6 py-4 border-b border-slate-100">
                <BadgeCheck className="w-4 h-4 text-slate-400" />
                <h2 className="text-sm font-semibold text-slate-700">
                  Plan y suscripción
                </h2>
              </div>
              <div className="px-6 divide-y divide-slate-100">
                <div className="py-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">
                      Plan actual
                    </p>
                    <p className="text-sm font-medium text-slate-800">
                      {PLAN_LABELS[business.plan] ?? business.plan}
                    </p>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-teal-50 text-teal-700">
                    {PLAN_LABELS[business.plan] ?? business.plan}
                  </span>
                </div>
                <div className="py-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">
                      Estado
                    </p>
                    <p className="text-sm font-medium text-slate-800">
                      {SUBSCRIPTION_LABELS[business.subscriptionStatus] ??
                        business.subscriptionStatus}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      SUBSCRIPTION_COLORS[business.subscriptionStatus] ??
                      "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {SUBSCRIPTION_LABELS[business.subscriptionStatus] ??
                      business.subscriptionStatus}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right column — stats */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="flex items-center gap-2.5 px-5 py-4 border-b border-slate-100">
                <Globe className="w-4 h-4 text-slate-400" />
                <h2 className="text-sm font-semibold text-slate-700">
                  Resumen del negocio
                </h2>
              </div>
              <div className="divide-y divide-slate-100">
                <StatRow
                  icon={<Users className="w-4 h-4 text-teal-500" />}
                  label="Profesionales activos"
                  value={activeProfessionals}
                />
                <StatRow
                  icon={<Scissors className="w-4 h-4 text-teal-500" />}
                  label="Servicios activos"
                  value={activeServices}
                />
                <StatRow
                  icon={<UserCircle className="w-4 h-4 text-teal-500" />}
                  label="Clientes registrados"
                  value={totalClients}
                />
              </div>
            </div>

            {/* Login URL card */}
            <div className="bg-teal-50 border border-teal-100 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <Link2 className="w-4 h-4 text-teal-600" />
                <p className="text-sm font-semibold text-teal-700">
                  URL de acceso
                </p>
              </div>
              <p className="text-xs text-teal-600 mb-2">
                Compartí esta URL con tus profesionales para que puedan
                iniciar sesión.
              </p>
              <div className="bg-white border border-teal-200 rounded-lg px-3 py-2">
                <p className="text-xs font-mono text-slate-700 break-all">
                  caleio.app/login/{business.slug}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center justify-between px-5 py-3.5">
      <div className="flex items-center gap-2.5">
        {icon}
        <span className="text-sm text-slate-600">{label}</span>
      </div>
      <span className="text-sm font-semibold text-slate-800">{value}</span>
    </div>
  );
}
