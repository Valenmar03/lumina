// frontend/src/components/billing/SubscriptionGate.tsx
import { useState } from "react";
import { CreditCard, MessageCircle, CheckCircle2, Loader2 } from "lucide-react";
import { useBusiness } from "../../hooks/useBusiness";
import { createCheckoutSession, createPortalSession } from "../../services/billing.api";

function isBlocked(
  status: string,
  trialEndsAt: string | null | undefined,
  billingExempt: boolean | null | undefined
): boolean {
  if (billingExempt) return false;
  if (status === "ACTIVE") return false;
  if (status === "TRIAL" && trialEndsAt && new Date(trialEndsAt) > new Date()) return false;
  return true;
}

function formatPrice(amount: number, currency: string): string {
  if (currency === "USD") return `$${amount} USD`;
  return `$${amount.toLocaleString("es-AR")} ARS`;
}

export default function SubscriptionGate({ children }: { children: React.ReactNode }) {
  const { data, isLoading } = useBusiness();
  const [redirecting, setRedirecting] = useState(false);

  if (isLoading) return <>{children}</>;

  const business = data?.business;
  if (!business) return <>{children}</>;

  const blocked = isBlocked(
    business.subscriptionStatus,
    business.trialEndsAt,
    business.billingExempt
  );

  if (!blocked) return <>{children}</>;

  const currency = business.currency ?? "ARS";
  const basePrice = currency === "USD" ? 18 : 16000;
  const extraPrice = currency === "USD" ? 7 : 7000;

  const STATUS_COPY: Record<string, { title: string; subtitle: string; buttonLabel: string }> = {
    PAST_DUE: {
      title: "Tenés un pago pendiente",
      subtitle: "Actualizá tu método de pago para recuperar el acceso.",
      buttonLabel: "Actualizar método de pago",
    },
    CANCELED: {
      title: "Tu suscripción fue cancelada",
      subtitle: "Suscribite nuevamente para continuar usando Caleio.",
      buttonLabel: "Suscribirme ahora",
    },
  };

  const copy = STATUS_COPY[business.subscriptionStatus] ?? {
    title: "Tu período de prueba ha vencido",
    subtitle: "Suscribite para continuar usando Caleio.",
    buttonLabel: "Suscribirme ahora",
  };

  const subscriptionStatus = business.subscriptionStatus;

  async function handleSubscribe() {
    setRedirecting(true);
    try {
      const status = subscriptionStatus;
      // PAST_DUE already has a subscription — open portal to fix payment method
      const { url } = status === "PAST_DUE"
        ? await createPortalSession()
        : await createCheckoutSession();
      window.location.href = url;
    } catch {
      setRedirecting(false);
    }
  }

  return (
    <>
      {children}
      {/* Fullscreen overlay — not closeable */}
      <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-br from-teal-600 to-teal-700 px-8 py-6 text-white text-center">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <CreditCard className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-semibold">{copy.title}</h2>
            <p className="text-teal-100 text-sm mt-1">{copy.subtitle}</p>
          </div>

          {/* Plan details */}
          <div className="px-8 py-6">
            <div className="bg-slate-50 rounded-xl p-4 mb-5">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-semibold text-slate-700">Plan Starter</span>
                <span className="text-lg font-bold text-teal-700">
                  {formatPrice(basePrice, currency)}<span className="text-sm font-normal text-slate-400">/mes</span>
                </span>
              </div>
              <p className="text-xs text-slate-500">
                +{formatPrice(extraPrice, currency)}/mes por cada profesional extra (más de 2)
              </p>
            </div>

            <ul className="space-y-2 mb-6">
              {[
                "Hasta 2 profesionales incluidos",
                "Agenda diaria y semanal",
                "Gestión de clientes y servicios",
                "Notificaciones por email",
                "Reservas online con link propio",
              ].map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm text-slate-600">
                  <CheckCircle2 className="w-4 h-4 text-teal-500 shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>

            <button
              onClick={handleSubscribe}
              disabled={redirecting}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {redirecting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Redirigiendo...
                </>
              ) : (
                copy.buttonLabel
              )}
            </button>

            <div className="mt-4 text-center">
              <a
                href="https://wa.me/5491112345678?text=Hola%2C%20tengo%20una%20consulta%20sobre%20Caleio"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                Hablar con soporte
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
