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
  Copy,
  KeyRound,
  ExternalLink,
  Info,
  MessageCircle,
  Mail,
} from "lucide-react";
import { apiFetch } from "../services/api";
import PasswordInput from "../components/ui/PasswordInput";
import CustomSelect from "../components/ui/CustomSelect";
import { useBusiness, useUpdateBusiness } from "../hooks/useBusiness";
import { useProfessionals } from "../hooks/useProfessionals";
import { useServices } from "../hooks/useServices";
import { useClients } from "../hooks/useClients";
import { useAuth } from "../hooks/useAuth";

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
                  app.caleio.app/login/{displayDraft}
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
                app.caleio.app/login/{value}
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
  const { user } = useAuth();
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

            {/* MercadoPago */}
            <MercadoPagoSection
              currentToken={business.mpAccessToken ?? null}
              onSave={(mpAccessToken) => update({ mpAccessToken }).then(() => {})}
            />

            {/* WhatsApp Business — próximamente */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden opacity-60">
              <div className="flex items-center gap-2.5 px-6 py-4 border-b border-slate-100">
                <MessageCircle className="w-4 h-4 text-slate-400" />
                <h2 className="text-sm font-semibold text-slate-700">WhatsApp Business</h2>
                <span className="ml-auto text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                  Próximamente
                </span>
              </div>
              <div className="px-6 py-4">
                <p className="text-xs text-slate-500">
                  Estamos trabajando en la integración con WhatsApp Business. Próximamente podrás enviar notificaciones automáticas desde tu propio número.
                </p>
              </div>
            </div>

            {/* Notificaciones por email */}
            <EmailNotificationsSection
              currentEnabled={business.emailNotificationsEnabled ?? true}
              currentReminderHours={business.emailReminderHours ?? null}
              onSave={(data) => update(data).then(() => {})}
            />

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
            {/* Cambiar contraseña */}
            <ChangePasswordForm />
          </div>

          {/* Right column — stats */}
          <div className="space-y-4 order-first lg:order-0">
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
              <CopyUrlRow url={`app.caleio.app/login/${business.slug}`} />
            </div>

            {/* Booking URL card */}
            <div className="bg-violet-50 border border-violet-100 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <Globe className="w-4 h-4 text-violet-600" />
                <p className="text-sm font-semibold text-violet-700">
                  Link de reservas
                </p>
              </div>
              <p className="text-xs text-violet-600 mb-2">
                Compartí este link con tus clientes para que puedan reservar su turno online.
              </p>
              <CopyUrlRow url={`app.caleio.app/reservar/${business.slug}`} accent="violet" />
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

function CopyUrlRow({ url, accent = "teal" }: { url: string; accent?: "teal" | "violet" }) {
  const [copied, setCopied] = useState(false);

  const colors = {
    teal: "border-teal-200 text-teal-500 hover:text-teal-700",
    violet: "border-violet-200 text-violet-500 hover:text-violet-700",
  };

  function handleCopy() {
    navigator.clipboard.writeText(`https://${url}`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className={`flex items-center gap-2 bg-white border rounded-lg px-3 py-2 ${colors[accent].split(" ")[0]}`}>
      <p className="text-xs font-mono text-slate-700 break-all flex-1">{url}</p>
      <button
        onClick={handleCopy}
        title="Copiar URL"
        className={`shrink-0 transition-colors ${colors[accent].split(" ").slice(1).join(" ")}`}
      >
        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
      </button>
    </div>
  );
}

function MercadoPagoSection({
  currentToken,
  onSave,
}: {
  currentToken: string | null;
  onSave: (token: string | null) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(currentToken ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!editing) setDraft(currentToken ?? "");
  }, [currentToken, editing]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      await onSave(draft.trim() || null);
      setEditing(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err?.message ?? "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setDraft(currentToken ?? "");
    setEditing(false);
    setError(null);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="flex items-center gap-2.5 px-6 py-4 border-b border-slate-100">
        <KeyRound className="w-4 h-4 text-slate-400" />
        <h2 className="text-sm font-semibold text-slate-700">MercadoPago</h2>
      </div>
      <div className="px-6 py-4">
        <p className="text-xs text-slate-500 mb-3">
          Conectá tu cuenta de MercadoPago para cobrar señas online cuando los clientes reservan turno.
        </p>

        <div className="rounded-lg border border-teal-100 bg-teal-50 px-4 py-3 mb-4 space-y-2">
          <div className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-teal-600 shrink-0" />
            <p className="text-xs font-medium text-teal-700">¿Cómo obtener el Access Token?</p>
          </div>
          <ol className="text-xs text-teal-700 space-y-1 pl-5 list-decimal">
            <li>Ingresá a tu cuenta de MercadoPago</li>
            <li>Ir a <strong>Tu negocio → Configuración → Credenciales</strong></li>
            <li>Seleccioná <strong>Credenciales de producción</strong></li>
            <li>Copiá el campo <strong>Access Token</strong> (empieza con <code className="bg-teal-100 px-1 rounded">APP_USR-</code>)</li>
            <li>Pegalo en el campo de abajo y guardá</li>
          </ol>
          <a
            href="https://www.mercadopago.com.ar/developers/panel/app"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-teal-700 font-medium hover:text-teal-900 underline underline-offset-2 mt-1"
          >
            <ExternalLink className="w-3 h-3" />
            Ir al panel de desarrolladores de MercadoPago
          </a>
        </div>

        <div className="py-2 flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">
              Token de MercadoPago
            </p>
            {editing ? (
              <div className="space-y-1.5">
                <PasswordInput
                  autoFocus
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  className="w-full max-w-sm rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="APP_USR-..."
                />
                {error && (
                  <p className="flex items-center gap-1 text-xs text-red-600">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {error}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm font-medium text-slate-800">
                {currentToken ? "••••••••••••••••" : <span className="text-slate-400 italic">No configurado</span>}
              </p>
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

        {success && (
          <p className="flex items-center gap-1.5 text-xs text-emerald-600 mt-1">
            <Check className="w-3.5 h-3.5 shrink-0" />
            Token guardado correctamente
          </p>
        )}
      </div>
    </div>
  );
}

const WA_REMINDER_OPTIONS = [
  { value: "", label: "Desactivado" },
  { value: "1", label: "1 hora antes" },
  { value: "2", label: "2 horas antes" },
  { value: "6", label: "6 horas antes" },
  { value: "12", label: "12 horas antes" },
  { value: "24", label: "24 horas antes" },
  { value: "48", label: "48 horas antes" },
];

const EMAIL_REMINDER_OPTIONS = [
  { value: "2", label: "2 horas antes" },
  { value: "4", label: "4 horas antes" },
  { value: "8", label: "8 horas antes" },
  { value: "12", label: "12 horas antes" },
  { value: "24", label: "24 horas antes" },
  { value: "48", label: "48 horas antes" },
];

function WhatsAppSection({
  currentPhoneNumberId,
  currentAccessToken,
  currentReminderHours,
  onSave,
}: {
  currentPhoneNumberId: string | null;
  currentAccessToken: string | null;
  currentReminderHours: number | null;
  onSave: (data: {
    waPhoneNumberId: string | null;
    waAccessToken: string | null;
    waReminderHours: number | null;
  }) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [phoneNumberId, setPhoneNumberId] = useState(currentPhoneNumberId ?? "");
  const [accessToken, setAccessToken] = useState(currentAccessToken ?? "");
  const [reminderHours, setReminderHours] = useState(
    currentReminderHours ? String(currentReminderHours) : ""
  );
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await onSave({
        waPhoneNumberId: phoneNumberId.trim() || null,
        waAccessToken: accessToken.trim() || null,
        waReminderHours: reminderHours ? Number(reminderHours) : null,
      });
      setEditing(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError("No se pudo guardar la configuración.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setPhoneNumberId(currentPhoneNumberId ?? "");
    setAccessToken(currentAccessToken ?? "");
    setReminderHours(currentReminderHours ? String(currentReminderHours) : "");
    setEditing(false);
    setError(null);
  };

  const isConnected = !!(currentPhoneNumberId && currentAccessToken);

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="flex items-center gap-2.5 px-6 py-4 border-b border-slate-100">
        <MessageCircle className="w-4 h-4 text-slate-400" />
        <h2 className="text-sm font-semibold text-slate-700">WhatsApp Business</h2>
        {isConnected && (
          <span className="ml-auto text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
            Conectado
          </span>
        )}
      </div>
      <div className="px-6 py-4 space-y-4">
        <p className="text-xs text-slate-500">
          Conectá tu cuenta de WhatsApp Business para enviar notificaciones automáticas a tus clientes.
        </p>

        <div className="rounded-lg border border-teal-100 bg-teal-50 px-4 py-3 space-y-2">
          <div className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-teal-600 shrink-0" />
            <p className="text-xs font-medium text-teal-700">¿Cómo obtener las credenciales?</p>
          </div>
          <ol className="text-xs text-teal-700 space-y-1 pl-5 list-decimal">
            <li>Creá una app en <strong>Meta for Developers</strong> del tipo "Business"</li>
            <li>Agregá el producto <strong>WhatsApp</strong> a tu app</li>
            <li>En <strong>WhatsApp → Configuración de la API</strong>, copiá el <strong>Phone Number ID</strong> y el <strong>Token de acceso permanente</strong></li>
            <li>
              Creá los templates:{" "}
              <code className="bg-teal-100 px-1 rounded">turno_confirmado</code>,{" "}
              <code className="bg-teal-100 px-1 rounded">turno_recordatorio</code>,{" "}
              <code className="bg-teal-100 px-1 rounded">turno_cancelado</code>,{" "}
              <code className="bg-teal-100 px-1 rounded">turno_modificado</code>,{" "}
              <code className="bg-teal-100 px-1 rounded">nuevo_turno_negocio</code>
            </li>
          </ol>
          <a
            href="https://developers.facebook.com/apps"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-teal-700 font-medium hover:text-teal-900 underline underline-offset-2 mt-1"
          >
            <ExternalLink className="w-3 h-3" />
            Ir al panel de Meta for Developers
          </a>
        </div>

        {editing ? (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Phone Number ID
              </label>
              <input
                type="text"
                value={phoneNumberId}
                onChange={(e) => setPhoneNumberId(e.target.value)}
                placeholder="123456789012345"
                className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Access Token
              </label>
              <PasswordInput
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                placeholder="EAAxxxxxx..."
                className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Recordatorio automático
              </label>
              <CustomSelect
                placeholder="Desactivado"
                value={reminderHours}
                onChange={(v) => setReminderHours(v)}
                options={WA_REMINDER_OPTIONS}
              />
            </div>
            {error && (
              <p className="flex items-center gap-1 text-xs text-red-600">
                <AlertCircle className="w-3.5 h-3.5" />
                {error}
              </p>
            )}
            <div className="flex gap-2 justify-end pt-1">
              <button
                type="button"
                onClick={handleCancel}
                disabled={saving}
                className="px-3 py-1.5 rounded-lg text-sm text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="px-3 py-1.5 rounded-lg text-sm font-medium bg-teal-600 text-white hover:bg-teal-700 transition-colors"
              >
                {saving ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">
                  Phone Number ID
                </p>
                <p className="text-sm text-slate-800 font-medium">
                  {currentPhoneNumberId ? (
                    "••••••••••••"
                  ) : (
                    <span className="text-slate-400 italic">No configurado</span>
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="p-1.5 rounded-md text-slate-300 hover:bg-slate-100 hover:text-slate-500 transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">
                Recordatorio
              </p>
              <p className="text-sm text-slate-800">
                {currentReminderHours ? (
                  WA_REMINDER_OPTIONS.find((o) => o.value === String(currentReminderHours))
                    ?.label ?? `${currentReminderHours}h antes`
                ) : (
                  <span className="text-slate-400 italic">Desactivado</span>
                )}
              </p>
            </div>
          </div>
        )}

        {success && (
          <p className="flex items-center gap-1.5 text-xs text-emerald-600">
            <Check className="w-3.5 h-3.5 shrink-0" />
            Configuración guardada correctamente
          </p>
        )}
      </div>
    </div>
  );
}

function OwnerPhoneSection({
  currentPhone,
  onSave,
}: {
  currentPhone: string | null;
  onSave: (phone: string | null) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(currentPhone ?? "");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(draft.trim() || null);
      setEditing(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="flex items-center gap-2.5 px-6 py-4 border-b border-slate-100">
        <UserCircle className="w-4 h-4 text-slate-400" />
        <h2 className="text-sm font-semibold text-slate-700">Tu número de WhatsApp</h2>
      </div>
      <div className="px-6 py-4">
        <p className="text-xs text-slate-500 mb-3">
          Usamos este número para avisarte cuando entra un turno nuevo desde la página de reservas.
        </p>
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            {editing ? (
              <input
                autoFocus
                type="tel"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="+54 11 1234-5678"
                className="w-full max-w-sm rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-teal-500"
              />
            ) : (
              <p className="text-sm font-medium text-slate-800">
                {currentPhone || (
                  <span className="text-slate-400 italic">No configurado</span>
                )}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {editing ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setDraft(currentPhone ?? "");
                    setEditing(false);
                  }}
                  disabled={saving}
                  className="p-1.5 rounded-md text-slate-400 hover:bg-slate-100 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
                <button
                  type="button"
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
                type="button"
                onClick={() => setEditing(true)}
                className="p-1.5 rounded-md text-slate-300 hover:bg-slate-100 hover:text-slate-500 transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
        {success && (
          <p className="flex items-center gap-1.5 text-xs text-emerald-600 mt-2">
            <Check className="w-3.5 h-3.5 shrink-0" />
            Número guardado correctamente
          </p>
        )}
      </div>
    </div>
  );
}

function EmailNotificationsSection({
  currentEnabled,
  currentReminderHours,
  onSave,
}: {
  currentEnabled: boolean;
  currentReminderHours: number | null;
  onSave: (data: { emailNotificationsEnabled: boolean; emailReminderHours: number | null }) => Promise<void>;
}) {
  const [enabled, setEnabled] = useState(currentEnabled);
  const [reminderHours, setReminderHours] = useState(
    currentReminderHours ? String(currentReminderHours) : ""
  );
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (newEnabled: boolean, newReminderHours: string) => {
    setSaving(true);
    setError(null);
    try {
      await onSave({
        emailNotificationsEnabled: newEnabled,
        emailReminderHours: newReminderHours ? Number(newReminderHours) : null,
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch {
      setError("No se pudo guardar la configuración.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = () => {
    const newEnabled = !enabled;
    setEnabled(newEnabled);
    handleSave(newEnabled, reminderHours);
  };

  const handleReminderChange = (v: string) => {
    setReminderHours(v);
    handleSave(enabled, v);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="flex items-center gap-2.5 px-6 py-4 border-b border-slate-100">
        <Mail className="w-4 h-4 text-slate-400" />
        <h2 className="text-sm font-semibold text-slate-700">Notificaciones por email</h2>
        {enabled && (
          <span className="ml-auto text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
            Activo
          </span>
        )}
      </div>
      <div className="px-6 py-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-700">Enviar notificaciones por email</p>
            <p className="text-xs text-slate-400 mt-0.5">Los emails se envían desde noreply@caleio.app</p>
          </div>
          <button
            type="button"
            onClick={handleToggle}
            disabled={saving}
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none disabled:opacity-50 ${
              enabled ? "bg-teal-600" : "bg-slate-200"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                enabled ? "translate-x-4" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {enabled && (
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Recordatorio automático
            </label>
            <CustomSelect
              placeholder="Sin recordatorio"
              value={reminderHours}
              onChange={handleReminderChange}
              options={EMAIL_REMINDER_OPTIONS}
            />
          </div>
        )}

        <p className="text-xs text-slate-400 italic">
          Activar WhatsApp desactivará las notificaciones por email automáticamente.
        </p>

        {error && (
          <p className="flex items-center gap-1 text-xs text-red-600">
            <AlertCircle className="w-3.5 h-3.5" />
            {error}
          </p>
        )}
        {success && !saving && (
          <p className="flex items-center gap-1 text-xs text-emerald-600">
            <Check className="w-3.5 h-3.5" />
            Guardado
          </p>
        )}
      </div>
    </div>
  );
}

function ChangePasswordForm() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (next !== confirm) {
      setError("Las contraseñas nuevas no coinciden");
      return;
    }
    if (next.length < 8) {
      setError("La nueva contraseña debe tener al menos 8 caracteres");
      return;
    }

    setSaving(true);
    try {
      await apiFetch("/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      setSuccess(true);
      setCurrent("");
      setNext("");
      setConfirm("");
    } catch (err: any) {
      setError(err?.message ?? "Error al cambiar la contraseña");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="flex items-center gap-2.5 px-6 py-4 border-b border-slate-100">
        <KeyRound className="w-4 h-4 text-slate-400" />
        <h2 className="text-sm font-semibold text-slate-700">Cambiar contraseña</h2>
      </div>
      <form onSubmit={handleSubmit} className="px-6 py-4 space-y-3">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Contraseña actual</label>
          <PasswordInput
            required
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            className="w-full max-w-sm rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-teal-500"
            placeholder="••••••••"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Nueva contraseña</label>
          <PasswordInput
            required
            value={next}
            onChange={(e) => setNext(e.target.value)}
            className="w-full max-w-sm rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-teal-500"
            placeholder="••••••••"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Confirmar nueva contraseña</label>
          <PasswordInput
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full max-w-sm rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-teal-500"
            placeholder="••••••••"
          />
        </div>

        {error && (
          <p className="flex items-center gap-1.5 text-xs text-red-600">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            {error}
          </p>
        )}
        {success && (
          <p className="flex items-center gap-1.5 text-xs text-emerald-600">
            <Check className="w-3.5 h-3.5 shrink-0" />
            Contraseña actualizada correctamente
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="mt-1 py-1.5 px-4 rounded-lg bg-slate-800 text-white text-sm font-medium hover:bg-slate-700 disabled:opacity-60 disabled:cursor-not-allowed transition"
        >
          {saving ? "Guardando..." : "Guardar contraseña"}
        </button>
      </form>
    </div>
  );
}
