import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Check, ChevronRight, Scissors, User, Clock, Sparkles, Plus, X } from "lucide-react";
import { apiFetch } from "../services/api";
import { updateBusiness } from "../services/business.api";
import Checkbox from "../components/ui/Checkbox";

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = "welcome" | "service" | "professional" | "hours" | "done";

const STEPS: Step[] = ["welcome", "service", "professional", "hours", "done"];

const COLORS = [
  "#0D9488", "#14B8A6", "#3B82F6", "#6366F1",
  "#8B5CF6", "#EC4899", "#F59E0B", "#EF4444",
  "#10B981", "#F43F5E",
];

const DURATION_OPTIONS = [15, 20, 30, 45, 60, 75, 90, 120];


// ─── Progress bar ─────────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: Step }) {
  const steps: { key: Step; label: string; icon: React.ReactNode }[] = [
    { key: "service", label: "Servicio", icon: <Scissors className="w-3.5 h-3.5" /> },
    { key: "professional", label: "Profesional", icon: <User className="w-3.5 h-3.5" /> },
    { key: "hours", label: "Horarios", icon: <Clock className="w-3.5 h-3.5" /> },
  ];
  const currentIdx = STEPS.indexOf(current);

  return (
    <div className="flex items-center gap-2">
      {steps.map((s, i) => {
        const idx = STEPS.indexOf(s.key);
        const done = currentIdx > idx;
        const active = current === s.key;
        return (
          <div key={s.key} className="flex items-center gap-2">
            <div
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                done
                  ? "bg-teal-100 text-teal-700"
                  : active
                  ? "bg-teal-600 text-white"
                  : "bg-slate-100 text-slate-400"
              }`}
            >
              {done ? <Check className="w-3 h-3" /> : s.icon}
              {s.label}
            </div>
            {i < steps.length - 1 && (
              <div className={`w-6 h-px ${currentIdx > idx ? "bg-teal-300" : "bg-slate-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Steps ────────────────────────────────────────────────────────────────────

function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex flex-col items-center text-center gap-6 py-8">
      <div className="w-16 h-16 rounded-2xl bg-teal-50 flex items-center justify-center">
        <Sparkles className="w-8 h-8 text-teal-600" />
      </div>
      <div>
        <h2 className="text-2xl font-bold text-slate-900">¡Bienvenido a Caleio!</h2>
        <p className="text-slate-500 mt-2 max-w-sm">
          En 3 pasos rápidos configurás tu negocio y empezás a recibir turnos.
        </p>
      </div>
      <div className="w-full max-w-sm space-y-2 text-left">
        {[
          { icon: <Scissors className="w-4 h-4 text-teal-600" />, text: "Creá tu primer servicio" },
          { icon: <User className="w-4 h-4 text-teal-600" />, text: "Agregá un profesional" },
          { icon: <Clock className="w-4 h-4 text-teal-600" />, text: "Configurá los horarios de atención" },
        ].map(({ icon, text }, i) => (
          <div key={i} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
            {icon}
            <span className="text-sm text-slate-700">{text}</span>
          </div>
        ))}
      </div>
      <button
        onClick={onNext}
        className="flex items-center gap-2 rounded-xl bg-teal-600 px-6 py-3 text-sm font-semibold text-white hover:bg-teal-700 transition-colors"
      >
        Empezar
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

function ServiceStep({
  onNext,
}: {
  onNext: (serviceId: string) => void;
}) {
  const [name, setName] = useState("");
  const [duration, setDuration] = useState(60);
  const [price, setPrice] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!name.trim()) return setError("El nombre es requerido");
    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum < 0) return setError("El precio debe ser un número válido");

    setSaving(true);
    setError(null);
    try {
      const res = await apiFetch<{ service: { id: string } }>("/services", {
        method: "POST",
        body: JSON.stringify({ name: name.trim(), durationMin: duration, basePrice: priceNum }),
      });
      onNext(res.service.id);
    } catch (e: any) {
      setError(e?.message ?? "Error al guardar");
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Primer servicio</h2>
        <p className="text-sm text-slate-500 mt-1">¿Qué ofrecés? Podés agregar más después.</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Nombre del servicio</label>
          <input
            autoFocus
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Corte de cabello"
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Duración</label>
          <div className="flex flex-wrap gap-2">
            {DURATION_OPTIONS.map((d) => (
              <button
                key={d}
                onClick={() => setDuration(d)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                  duration === d
                    ? "border-teal-500 bg-teal-50 text-teal-700"
                    : "border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
              >
                {d >= 60 ? `${d / 60}h${d % 60 ? ` ${d % 60}m` : ""}` : `${d}min`}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Precio</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">$</span>
            <input
              type="number"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0"
              className="w-full rounded-xl border border-slate-200 py-2.5 pl-7 pr-4 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={saving}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 py-3 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50 transition-colors"
      >
        {saving ? (
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <>Continuar <ChevronRight className="w-4 h-4" /></>
        )}
      </button>
    </div>
  );
}

function ProfessionalStep({
  onNext,
}: {
  onNext: (professionalId: string) => void;
}) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!name.trim()) return setError("El nombre es requerido");
    setSaving(true);
    setError(null);
    try {
      const res = await apiFetch<{ professional: { id: string } }>("/professionals", {
        method: "POST",
        body: JSON.stringify({ name: name.trim(), color }),
      });
      onNext(res.professional.id);
    } catch (e: any) {
      setError(e?.message ?? "Error al guardar");
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Primer profesional</h2>
        <p className="text-sm text-slate-500 mt-1">¿Quién atiende los turnos?</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Nombre</label>
          <input
            autoFocus
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: María García"
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-2">Color en agenda</label>
          <div className="flex flex-wrap gap-2">
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                style={{ backgroundColor: c }}
                className={`w-8 h-8 rounded-full transition-transform ${
                  color === c ? "ring-2 ring-offset-2 ring-slate-400 scale-110" : "hover:scale-105"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={saving}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 py-3 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50 transition-colors"
      >
        {saving ? (
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <>Continuar <ChevronRight className="w-4 h-4" /></>
        )}
      </button>
    </div>
  );
}

type Block = { startTime: string; endTime: string };
type DaySchedule = { enabled: boolean; blocks: Block[] };

const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
const DAY_LABELS: Record<number, string> = {
  1: "Lunes", 2: "Martes", 3: "Miércoles", 4: "Jueves",
  5: "Viernes", 6: "Sábado", 0: "Domingo",
};

function validateSchedule(schedule: Record<number, DaySchedule>): Record<number, string> {
  const errors: Record<number, string> = {};
  for (const day of DAY_ORDER) {
    const { enabled, blocks } = schedule[day];
    if (!enabled || blocks.length < 2) continue;
    const [a, b] = blocks;
    if (a.startTime >= a.endTime) { errors[day] = "El inicio debe ser anterior al fin."; continue; }
    if (b.startTime >= b.endTime) { errors[day] = "El inicio debe ser anterior al fin."; continue; }
    if (a.endTime > b.startTime) errors[day] = "Los bloques se superponen.";
  }
  return errors;
}

function buildDefaultSchedule(): Record<number, DaySchedule> {
  return {
    0: { enabled: false, blocks: [{ startTime: "09:00", endTime: "18:00" }] },
    1: { enabled: true,  blocks: [{ startTime: "09:00", endTime: "18:00" }] },
    2: { enabled: true,  blocks: [{ startTime: "09:00", endTime: "18:00" }] },
    3: { enabled: true,  blocks: [{ startTime: "09:00", endTime: "18:00" }] },
    4: { enabled: true,  blocks: [{ startTime: "09:00", endTime: "18:00" }] },
    5: { enabled: true,  blocks: [{ startTime: "09:00", endTime: "18:00" }] },
    6: { enabled: false, blocks: [{ startTime: "09:00", endTime: "14:00" }] },
  };
}

function HoursStep({ onNext }: { onNext: (schedule: Record<number, DaySchedule>) => void }) {
  const [schedule, setSchedule] = useState<Record<number, DaySchedule>>(buildDefaultSchedule);
  const [errors, setErrors] = useState<Record<number, string>>({});

  const update = (next: Record<number, DaySchedule>) => {
    setSchedule(next);
    setErrors(validateSchedule(next));
  };

  const toggleDay = (day: number) =>
    update({ ...schedule, [day]: { ...schedule[day], enabled: !schedule[day].enabled } });

  const updateBlock = (day: number, index: number, field: keyof Block, value: string) =>
    update({
      ...schedule,
      [day]: {
        ...schedule[day],
        blocks: schedule[day].blocks.map((b, i) => (i === index ? { ...b, [field]: value } : b)),
      },
    });

  const addBlock = (day: number) =>
    update({
      ...schedule,
      [day]: { ...schedule[day], blocks: [...schedule[day].blocks, { startTime: "09:00", endTime: "18:00" }] },
    });

  const removeBlock = (day: number, index: number) =>
    update({
      ...schedule,
      [day]: { ...schedule[day], blocks: schedule[day].blocks.filter((_, i) => i !== index) },
    });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Horarios de atención</h2>
        <p className="text-sm text-slate-500 mt-1">Elegí los días y horarios. Podés modificarlos después.</p>
      </div>

      <div className="space-y-3">
        {DAY_ORDER.map((day) => {
          const label = DAY_LABELS[day];
          const { enabled, blocks } = schedule[day];
          return (
            <div key={day} className="rounded-xl border border-slate-200 bg-white p-3">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <Checkbox checked={enabled} onChange={() => toggleDay(day)} label={label} className="min-w-28" />
                </div>
                <div className="space-y-2">
                  {!enabled ? (
                    <p className="text-sm text-slate-400">Día no laborable</p>
                  ) : (
                    <>
                      {blocks.map((block, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <input
                            type="time"
                            value={block.startTime}
                            onChange={(e) => updateBlock(day, index, "startTime", e.target.value)}
                            className="h-9 w-28 rounded-lg border border-slate-200 bg-white px-2 text-sm outline-none focus:ring-2 focus:ring-teal-500"
                          />
                          <span className="text-sm text-slate-400">–</span>
                          <input
                            type="time"
                            value={block.endTime}
                            onChange={(e) => updateBlock(day, index, "endTime", e.target.value)}
                            className="h-9 w-28 rounded-lg border border-slate-200 bg-white px-2 text-sm outline-none focus:ring-2 focus:ring-teal-500"
                          />
                          {blocks.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeBlock(day, index)}
                              className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50 shrink-0"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                      {blocks.length < 2 && (
                        <button
                          type="button"
                          onClick={() => addBlock(day)}
                          className="inline-flex items-center gap-1.5 text-sm text-teal-700 hover:text-teal-800"
                        >
                          <Plus className="w-4 h-4" />
                          Agregar bloque
                        </button>
                      )}
                      {errors[day] && (
                        <p className="text-xs text-red-500">{errors[day]}</p>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={() => {
          if (Object.keys(errors).length > 0) return;
          onNext(schedule);
        }}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 py-3 text-sm font-semibold text-white hover:bg-teal-700 transition-colors"
      >
        Finalizar configuración <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

function DoneStep({ onGo }: { onGo: () => void }) {
  return (
    <div className="flex flex-col items-center text-center gap-6 py-8">
      <div className="w-16 h-16 rounded-full bg-teal-50 flex items-center justify-center">
        <Check className="w-8 h-8 text-teal-600" />
      </div>
      <div>
        <h2 className="text-2xl font-bold text-slate-900">¡Todo listo!</h2>
        <p className="text-slate-500 mt-2 max-w-sm">
          Tu negocio está configurado. Podés empezar a cargar turnos y compartir tu link de reservas.
        </p>
      </div>
      <button
        onClick={onGo}
        className="flex items-center gap-2 rounded-xl bg-teal-600 px-6 py-3 text-sm font-semibold text-white hover:bg-teal-700 transition-colors"
      >
        Ir al panel
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [step, setStep] = useState<Step>("welcome");
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [professionalId, setProfessionalId] = useState<string | null>(null);

  const handleServiceDone = (id: string) => {
    setServiceId(id);
    setStep("professional");
  };

  const handleProfessionalDone = async (id: string) => {
    setProfessionalId(id);
    // Assign the service to the professional
    if (serviceId) {
      try {
        await apiFetch(`/professionals/${id}/services`, {
          method: "PUT",
          body: JSON.stringify({ serviceIds: [serviceId] }),
        });
      } catch {
        // non-blocking — user can assign manually later
      }
    }
    setStep("hours");
  };

  const handleHoursDone = async (schedule: Record<number, DaySchedule>) => {
    if (professionalId) {
      const activeDays = Object.entries(schedule).filter(([, d]) => d.enabled);
      await Promise.allSettled(
        activeDays.map(([day, d]) =>
          apiFetch(`/professionals/${professionalId}/schedules/${day}`, {
            method: "PUT",
            body: JSON.stringify({ blocks: d.blocks }),
          })
        )
      );
    }
    // Mark onboarding as complete and update cache immediately to avoid redirect loop
    const result = await updateBusiness({ onboardingCompleted: true }).catch(() => null);
    if (result) {
      queryClient.setQueryData(["business"], result);
    }
    setStep("done");
  };

  const handleGo = () => navigate("/");

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img src="/logo.png" alt="Caleio" className="h-8 object-contain" />
        </div>

        {/* Step indicator */}
        {step !== "welcome" && step !== "done" && (
          <div className="flex justify-center mb-6">
            <StepIndicator current={step} />
          </div>
        )}

        {/* Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          {step === "welcome" && <WelcomeStep onNext={() => setStep("service")} />}
          {step === "service" && <ServiceStep onNext={handleServiceDone} />}
          {step === "professional" && <ProfessionalStep onNext={handleProfessionalDone} />}
          {step === "hours" && <HoursStep onNext={handleHoursDone} />}
          {step === "done" && <DoneStep onGo={handleGo} />}
        </div>
      </div>
    </div>
  );
}
