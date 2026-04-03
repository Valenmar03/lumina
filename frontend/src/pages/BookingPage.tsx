import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { format, addDays, startOfToday, isToday } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Clock, Check, Loader2, CreditCard, MapPin, MessageCircle, CalendarPlus } from "lucide-react";
import PhoneInput from "../components/ui/PhoneInput";

// ─── Types ───────────────────────────────────────────────────────────────────

type BusinessInfo = {
  id: string;
  name: string;
  slug: string;
  address?: string | null;
  logoUrl?: string | null;
  whatsappPhone?: string | null;
  bookingTheme?: string | null;
};
type Professional = { id: string; name: string; color: string };
type Slot = { startAt: string; endAt: string; label: string };

type Service = { id: string; name: string; description?: string; durationMin: number; basePrice: number; requiresDeposit: boolean; depositPercent: number | null; allowClientChooseProfessional: boolean };
type Step = "landing" | "service" | "professional" | "datetime" | "client" | "confirm" | "redirecting" | "done";

const STEPS: Step[] = ["landing", "service", "professional", "datetime", "client", "confirm", "redirecting", "done"];

// ─── Booking themes ──────────────────────────────────────────────────────────

type ThemeColors = { primary: string; primaryDark: string; primaryLight: string; ring: string; connector: string; todayText: string };

const THEME_COLORS: Record<string, ThemeColors | null> = {
  default: null,
  rose:   { primary: "#e11d48", primaryDark: "#be123c", primaryLight: "#fff1f2", ring: "#fce7f3", connector: "#fb7185", todayText: "#f43f5e" },
  violet: { primary: "#7c3aed", primaryDark: "#6d28d9", primaryLight: "#f5f3ff", ring: "#ede9fe", connector: "#a78bfa", todayText: "#8b5cf6" },
  amber:  { primary: "#d97706", primaryDark: "#b45309", primaryLight: "#fffbeb", ring: "#fef3c7", connector: "#fcd34d", todayText: "#f59e0b" },
  ocean:        { primary: "#0284c7", primaryDark: "#0369a1", primaryLight: "#f0f9ff", ring: "#e0f2fe", connector: "#38bdf8", todayText: "#0ea5e9" },
  slate:        { primary: "#475569", primaryDark: "#334155", primaryLight: "#f8fafc", ring: "#e2e8f0", connector: "#94a3b8", todayText: "#64748b" },
  "desert-sand": { primary: "#bf7450", primaryDark: "#b16145", primaryLight: "#faf6f2", ring: "#f4eae0", connector: "#dab497", todayText: "#ca8f6d" },
};

function buildThemeCSS(c: ThemeColors): string {
  return `
    .booking-themed .bg-teal-600 { background-color: ${c.primary} !important; }
    .booking-themed .hover\\:bg-teal-700:hover { background-color: ${c.primaryDark} !important; }
    .booking-themed .text-teal-600 { color: ${c.primary} !important; }
    .booking-themed .text-teal-700 { color: ${c.primaryDark} !important; }
    .booking-themed .bg-teal-50 { background-color: ${c.primaryLight} !important; }
    .booking-themed .border-teal-500 { border-color: ${c.primary} !important; }
    .booking-themed .bg-teal-400 { background-color: ${c.connector} !important; }
    .booking-themed .text-teal-100 { color: ${c.ring} !important; }
    .booking-themed .text-teal-500 { color: ${c.todayText} !important; }
    .booking-themed .hover\\:border-teal-400:hover { border-color: ${c.connector} !important; }
    .booking-themed .ring-teal-100 { --tw-ring-color: ${c.ring} !important; }
  `;
}

function stepIndex(s: Step) {
  return STEPS.indexOf(s);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatPrice(price: number) {
  return price > 0
    ? new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(price)
    : null;
}

function formatDuration(min: number) {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

// ─── Step indicator ──────────────────────────────────────────────────────────

const STEP_LABELS: Record<Step, string> = {
  landing: "",
  service: "Servicio",
  professional: "Profesional",
  datetime: "Fecha y hora",
  client: "Tus datos",
  confirm: "Confirmar",
  redirecting: "Pago",
  done: "Listo",
};

function StepBar({ current, showProfessional }: { current: Step; showProfessional: boolean }) {
  const visible: Step[] = showProfessional
    ? ["service", "professional", "datetime", "client", "confirm"]
    : ["service", "datetime", "client", "confirm"];
  const currentIdx = stepIndex(current);

  return (
    <div className="flex items-center gap-1 mb-8">
      {visible.map((step, i) => {
        const idx = stepIndex(step);
        const done = idx < currentIdx;
        const active = idx === currentIdx;
        return (
          <div key={step} className="flex items-center gap-1 flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                  done
                    ? "bg-teal-600 text-white"
                    : active
                    ? "bg-teal-600 text-white ring-4 ring-teal-100"
                    : "bg-slate-200 text-slate-400"
                }`}
              >
                {done ? <Check className="w-3.5 h-3.5" /> : i + 1}
              </div>
              <span className={`text-[10px] hidden sm:block ${active ? "text-teal-700 font-medium" : "text-slate-400"}`}>
                {STEP_LABELS[step]}
              </span>
            </div>
            {i < visible.length - 1 && (
              <div className={`flex-1 h-px mb-3 ${idx < currentIdx ? "bg-teal-400" : "bg-slate-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Date picker strip ───────────────────────────────────────────────────────

function DateStrip({
  selected,
  onChange,
}: {
  selected: Date;
  onChange: (d: Date) => void;
}) {
  const [offset, setOffset] = useState(0);
  const today = startOfToday();
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, offset + i));

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setOffset((o) => Math.max(0, o - 7))}
        disabled={offset === 0}
        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 disabled:opacity-30"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <div className="flex gap-1.5 flex-1 overflow-hidden">
        {days.map((day) => {
          const active = format(day, "yyyy-MM-dd") === format(selected, "yyyy-MM-dd");
          return (
            <button
              key={day.toISOString()}
              onClick={() => onChange(day)}
              className={`flex flex-col items-center flex-1 rounded-xl py-2 text-xs transition-colors ${
                active
                  ? "bg-teal-600 text-white font-semibold"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <span className="capitalize">{format(day, "EEE", { locale: es }).slice(0, 3)}</span>
              <span className="text-base font-bold leading-tight">{format(day, "d")}</span>
              {isToday(day) && (
                <span className={`text-[9px] ${active ? "text-teal-100" : "text-teal-500"}`}>
                  hoy
                </span>
              )}
            </button>
          );
        })}
      </div>

      <button
        onClick={() => setOffset((o) => o + 7)}
        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function BookingPage() {
  const { slug } = useParams<{ slug: string }>();

  const [business, setBusiness] = useState<BusinessInfo | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);

  const [step, setStep] = useState<Step>("landing");

  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(startOfToday());
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);

  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");

  const [loadingBusiness, setLoadingBusiness] = useState(true);
  const [loadingProfessionals, setLoadingProfessionals] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  // Load business info and services on mount
  useEffect(() => {
    if (!slug) return;
    Promise.all([
      fetch(`/booking/${slug}/info`).then((r) => {
        if (r.status === 404) throw new Error("not_found");
        return r.json();
      }),
      fetch(`/booking/${slug}/services`).then((r) => r.json()),
    ])
      .then(([biz, svcs]) => {
        setBusiness(biz);
        setServices(svcs);
      })
      .catch((e) => {
        if (e.message === "not_found") setNotFound(true);
      })
      .finally(() => setLoadingBusiness(false));
  }, [slug]);

  // Load professionals when service is selected
  useEffect(() => {
    if (!slug || !selectedService) return;
    setLoadingProfessionals(true);
    fetch(`/booking/${slug}/professionals?serviceId=${selectedService.id}`)
      .then((r) => r.json())
      .then(setProfessionals)
      .finally(() => setLoadingProfessionals(false));
  }, [slug, selectedService]);

  // Load slots when professional or date changes (during datetime step)
  useEffect(() => {
    if (!slug || !selectedService || step !== "datetime") return;
    setSlots([]);
    setSelectedSlot(null);
    setLoadingSlots(true);
    const dateStr = format(selectedDate, "yyyy-MM-dd");

    const url = selectedProfessional
      ? `/booking/${slug}/professionals/${selectedProfessional.id}/availability?date=${dateStr}&serviceId=${selectedService.id}`
      : `/booking/${slug}/availability?date=${dateStr}&serviceId=${selectedService.id}`;

    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        const now = new Date();
        const future = (data.slots ?? []).filter((s: Slot) => new Date(s.startAt) > now);
        setSlots(future);
      })
      .finally(() => setLoadingSlots(false));
  }, [slug, selectedProfessional, selectedService, selectedDate, step]);

  const showProfessionalStep = !!(selectedService?.allowClientChooseProfessional);

  function goBack() {
    const prev: Record<Step, Step> = {
      landing: "landing",
      service: "landing",
      professional: "service",
      datetime: showProfessionalStep ? "professional" : "service",
      client: "datetime",
      confirm: "client",
      redirecting: "redirecting",
      done: "done",
    };
    setStep(prev[step]);
  }

  async function handleConfirm() {
    if (!slug || !selectedService || !selectedSlot) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch(`/booking/${slug}/appointments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: selectedService.id,
          ...(selectedProfessional ? { professionalId: selectedProfessional.id } : {}),
          startAt: selectedSlot.startAt,
          clientFullName: clientName.trim(),
          clientPhone: clientPhone.trim(),
          clientEmail: clientEmail.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "No se pudo confirmar el turno");
      }
      const result = await res.json();
      // If backend auto-assigned a professional, store it for the done screen
      if (result.assignedProfessional && !selectedProfessional) {
        setSelectedProfessional(result.assignedProfessional);
      }
      if (result.checkoutUrl) {
        setStep("redirecting");
        setTimeout(() => {
          window.location.href = result.checkoutUrl;
        }, 300);
      } else {
        setStep("done");
      }
    } catch (e) {
      setSubmitError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  // ── Render guards ──

  if (loadingBusiness) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="text-center">
          <p className="text-2xl font-semibold text-slate-700">Negocio no encontrado</p>
          <p className="text-slate-400 mt-2">Revisá el link que te compartieron.</p>
        </div>
      </div>
    );
  }

  // ── Redirecting screen ──

  if (step === "redirecting") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 max-w-sm w-full text-center">
          <Loader2 className="w-10 h-10 text-teal-600 animate-spin mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-slate-800 mb-1">Redirigiendo a MercadoPago...</h2>
          <p className="text-slate-500 text-sm flex items-center justify-center gap-1.5 mt-2">
            <CreditCard className="w-4 h-4" />
            Procesando tu seña de forma segura
          </p>
        </div>
      </div>
    );
  }

  // ── Done screen ──

  if (step === "done") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 max-w-sm w-full text-center">
          <div className="w-14 h-14 rounded-full bg-teal-50 flex items-center justify-center mx-auto mb-4">
            <Check className="w-7 h-7 text-teal-600" />
          </div>
          <h2 className="text-xl font-semibold text-slate-800 mb-1">¡Turno confirmado!</h2>
          <p className="text-slate-500 text-sm mb-6">
            Tu turno en <span className="font-medium text-slate-700">{business?.name}</span> fue agendado.
          </p>
          <div className="bg-slate-50 rounded-xl p-4 text-left space-y-2 text-sm">
            <Row label="Servicio" value={selectedService?.name ?? ""} />
            <Row label="Profesional" value={selectedProfessional?.name ?? ""} />
            <Row
              label="Fecha"
              value={format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}
            />
            <Row label="Hora" value={selectedSlot?.label ?? ""} />
          </div>
          <p className="text-xs text-slate-400 mt-4 text-center">
            Para cancelar o modificar tu turno, comunicate directamente con el negocio.
          </p>
        </div>
      </div>
    );
  }

  const depositAmount = selectedService?.requiresDeposit && selectedService?.depositPercent
    ? Math.round(Number(selectedService.basePrice) * selectedService.depositPercent / 100)
    : null;

  const canGoNext: Record<Step, boolean> = {
    landing: true,
    service: !!selectedService,
    professional: showProfessionalStep ? !!selectedProfessional : true,
    datetime: !!selectedSlot,
    client: clientName.trim().length >= 2 && clientPhone.replace(/\D/g, "").length >= 6,
    confirm: true,
    redirecting: false,
    done: false,
  };

  const nextStep: Record<Step, Step> = {
    landing: "service",
    service: showProfessionalStep ? "professional" : "datetime",
    professional: "datetime",
    datetime: "client",
    client: "confirm",
    confirm: "confirm",
    redirecting: "redirecting",
    done: "done",
  };

  const themeColors = THEME_COLORS[business?.bookingTheme ?? "default"] ?? null;

  return (
    <div className="min-h-screen bg-slate-50 booking-themed">
      {themeColors && <style>{buildThemeCSS(themeColors)}</style>}

      {/* ── STEP: Landing ── */}
      {step === "landing" && (
        <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
          <div className="w-full max-w-sm flex flex-col items-center gap-6">
            {/* Logo / initial */}
            <div className="w-20 h-20 rounded-2xl bg-teal-600 flex items-center justify-center overflow-hidden shadow-md">
              {business?.logoUrl ? (
                <img src={business.logoUrl} alt={business.name} className="w-full h-full object-contain p-1" />
              ) : (
                <span className="text-white text-3xl font-bold">
                  {business?.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            {/* Name + tagline */}
            <div className="text-center">
              <h1 className="text-2xl font-bold text-slate-800">{business?.name}</h1>
              <p className="text-slate-500 text-sm mt-1">Reservá tu turno online</p>
            </div>

            {/* Action buttons */}
            <div className="w-full flex flex-col gap-3 mt-2">
              <button
                onClick={() => setStep("service")}
                className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl py-3.5 transition-colors text-sm"
              >
                <CalendarPlus className="w-4.5 h-4.5" />
                Reservar un turno
              </button>

              {business?.whatsappPhone && (
                <a
                  href={`https://wa.me/${business.whatsappPhone}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium rounded-xl py-3 transition-colors text-sm"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-500" />
                  Hablar por WhatsApp
                </a>
              )}

              {business?.address && (
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(business.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium rounded-xl py-3 transition-colors text-sm"
                >
                  <MapPin className="w-4 h-4 text-rose-500" />
                  Cómo llegar
                </a>
              )}
            </div>
          </div>

          <footer className="flex flex-col items-center gap-2 pt-12">
            <div className="flex items-center gap-1.5">
              <img src="/logo.png" alt="Caleio" className="w-4 h-4 object-contain opacity-40" />
              <span className="text-xs text-slate-300">Powered by Caleio</span>
            </div>
          </footer>
        </div>
      )}

      {/* Header (shown for all steps except landing) */}
      {step !== "landing" && (
        <div className="bg-white border-b border-slate-100">
          <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center overflow-hidden shrink-0">
              {business?.logoUrl ? (
                <img src={business.logoUrl} alt={business.name} className="w-full h-full object-contain p-0.5" />
              ) : (
                <span className="text-white text-xs font-bold">
                  {business?.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <p className="font-semibold text-slate-800 text-sm leading-tight">{business?.name}</p>
              <p className="text-xs text-slate-400">Reservar turno online</p>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {step !== "landing" && (
      <>
      <div className="max-w-lg mx-auto px-4 py-6">
        <StepBar current={step} showProfessional={showProfessionalStep} />

        {/* ── STEP: Service ── */}
        {step === "service" && (
          <StepWrapper title="¿Qué servicio necesitás?">
            {services.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-6">No hay servicios disponibles.</p>
            ) : (
              <div className="space-y-2">
                {services.map((svc) => (
                  <button
                    key={svc.id}
                    onClick={() => {
                      setSelectedService(svc);
                      setSelectedProfessional(null);
                      setSelectedSlot(null);
                    }}
                    className={`w-full flex items-center justify-between rounded-xl border px-4 py-3.5 text-left transition-colors ${
                      selectedService?.id === svc.id
                        ? "border-teal-500 bg-teal-50"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-slate-800 text-sm">{svc.name}</p>
                        {svc.requiresDeposit && svc.depositPercent && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                            Seña {formatPrice(Math.round(Number(svc.basePrice) * svc.depositPercent / 100))}
                          </span>
                        )}
                      </div>
                      {svc.description && (
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{svc.description}</p>
                      )}
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        {formatDuration(svc.durationMin)}
                      </p>
                    </div>
                    {formatPrice(svc.basePrice) && (
                      <span className="text-sm font-semibold text-slate-700">{formatPrice(svc.basePrice)}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </StepWrapper>
        )}

        {/* ── STEP: Professional ── */}
        {step === "professional" && (
          <StepWrapper title="¿Con quién querés atenderte?">
            {loadingProfessionals ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-teal-600" />
              </div>
            ) : professionals.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-6">No hay profesionales disponibles para este servicio.</p>
            ) : (
              <div className="space-y-2">
                {professionals.map((pro) => (
                  <button
                    key={pro.id}
                    onClick={() => setSelectedProfessional(pro)}
                    className={`w-full flex items-center gap-3 rounded-xl border px-4 py-3.5 text-left transition-colors ${
                      selectedProfessional?.id === pro.id
                        ? "border-teal-500 bg-teal-50"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div
                      className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-white text-xs font-semibold"
                      style={{ backgroundColor: pro.color || "#0d9488" }}
                    >
                      {pro.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium text-slate-800 text-sm">{pro.name}</span>
                    {selectedProfessional?.id === pro.id && (
                      <Check className="w-4 h-4 text-teal-600 ml-auto" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </StepWrapper>
        )}

        {/* ── STEP: Date & Time ── */}
        {step === "datetime" && (
          <StepWrapper title="Elegí fecha y horario">
            <div className="space-y-4">
              <DateStrip selected={selectedDate} onChange={(d) => setSelectedDate(d)} />

              <div>
                <p className="text-xs font-medium text-slate-500 mb-2 capitalize">
                  {format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}
                </p>

                {loadingSlots ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-teal-600" />
                  </div>
                ) : slots.length === 0 ? (
                  <p className="text-slate-400 text-sm text-center py-6 bg-white rounded-xl border border-slate-200">
                    No hay turnos disponibles para este día.
                  </p>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {slots.map((slot) => (
                      <button
                        key={slot.startAt}
                        onClick={() => setSelectedSlot(slot)}
                        className={`rounded-lg py-2 text-sm font-medium transition-colors ${
                          selectedSlot?.startAt === slot.startAt
                            ? "bg-teal-600 text-white"
                            : "bg-white border border-slate-200 text-slate-700 hover:border-teal-400"
                        }`}
                      >
                        {slot.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </StepWrapper>
        )}

        {/* ── STEP: Client info ── */}
        {step === "client" && (
          <StepWrapper title="Tus datos">
            <div className="space-y-3">
              <Field
                label="Nombre completo"
                required
                value={clientName}
                onChange={setClientName}
                placeholder="Ej: María García"
              />
              <PhoneInput
                value={clientPhone}
                onChange={setClientPhone}
                required
              />
              <div>
                <Field
                  label="Email"
                  value={clientEmail}
                  onChange={setClientEmail}
                  placeholder="Ej: maria@email.com"
                  type="email"
                />
                <p className="text-xs text-amber-600 mt-1">
                  Sin email no recibirás confirmaciones ni recordatorios del turno.
                </p>
              </div>
            </div>
          </StepWrapper>
        )}

        {/* ── STEP: Confirm ── */}
        {step === "confirm" && (
          <StepWrapper title="Confirmá tu turno">
            <div className="bg-slate-50 rounded-xl p-4 space-y-3 text-sm mb-4">
              <Row label="Servicio" value={selectedService?.name ?? ""} />
              <Row
                label="Duración"
                value={formatDuration(selectedService?.durationMin ?? 0)}
              />
              {selectedService && formatPrice(selectedService.basePrice) && (
                <Row label="Precio" value={formatPrice(selectedService.basePrice)!} />
              )}
              {depositAmount !== null && (
                <div className="flex justify-between gap-4 items-center">
                  <span className="text-slate-400">Seña requerida</span>
                  <span className="font-semibold text-teal-700">
                    {formatPrice(depositAmount)}
                  </span>
                </div>
              )}
              <div className="border-t border-slate-200 pt-3" />
              <Row
                label="Profesional"
                value={
                  selectedProfessional?.name ??
                  (selectedService?.allowClientChooseProfessional === false
                    ? "Se asignará automáticamente"
                    : "")
                }
              />
              <Row
                label="Fecha"
                value={format(selectedDate, "EEEE d 'de' MMMM yyyy", { locale: es })}
              />
              <Row label="Hora" value={selectedSlot?.label ?? ""} />
              <div className="border-t border-slate-200 pt-3" />
              <Row label="Nombre" value={clientName} />
              <Row label="Teléfono" value={clientPhone} />
              {clientEmail && <Row label="Email" value={clientEmail} />}
            </div>

            {submitError && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-3">
                {submitError}
              </p>
            )}

            <button
              onClick={handleConfirm}
              disabled={submitting}
              className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white font-semibold rounded-xl py-3 flex items-center justify-center gap-2 transition-colors"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : depositAmount !== null ? (
                <CreditCard className="w-4 h-4" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              {submitting
                ? "Confirmando..."
                : depositAmount !== null
                ? `Pagar seña ${formatPrice(depositAmount)}`
                : "Confirmar turno"}
            </button>
          </StepWrapper>
        )}

        {/* Navigation */}
        {step !== "confirm" && (
          <div className="flex items-center justify-between mt-6">
            <button
              onClick={goBack}
              disabled={false}
              className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 disabled:opacity-0 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Atrás
            </button>

            <button
              onClick={() => setStep(nextStep[step])}
              disabled={!canGoNext[step]}
              className="flex items-center gap-1 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-40 disabled:pointer-events-none px-5 py-2 rounded-xl transition-colors"
            >
              Continuar
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {step === "confirm" && (
          <button
            onClick={goBack}
            className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mt-4 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Atrás
          </button>
        )}
      </div>

      <footer className="flex flex-col items-center gap-2 py-6">
        <div className="flex items-center gap-1.5">
          <img src="/logo.png" alt="Caleio" className="w-4 h-4 object-contain opacity-40" />
          <span className="text-xs text-slate-300">Powered by Caleio</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-300">
          <a href="/terminos" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-slate-400">
            Términos
          </a>
          <span>·</span>
          <a href="/privacidad" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-slate-400">
            Privacidad
          </a>
          <span>·</span>
          <a href="/cookies" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-slate-400">
            Cookies
          </a>
        </div>
      </footer>
      </>
      )}
    </div>
  );
}

// ─── Small reusable components ───────────────────────────────────────────────

function StepWrapper({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-800 mb-4">{title}</h2>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-slate-400">{label}</span>
      <span className="font-medium text-slate-700 text-right capitalize">{value}</span>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  required,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white"
      />
    </div>
  );
}
