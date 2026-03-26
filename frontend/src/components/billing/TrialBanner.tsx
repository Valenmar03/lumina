import { useState } from "react";
import { AlertTriangle, X, Loader2 } from "lucide-react";
import { useBusiness } from "../../hooks/useBusiness";
import { createCheckoutSession } from "../../services/billing.api";
import { differenceInDays, parseISO } from "date-fns";

export default function TrialBanner() {
  const { data } = useBusiness();
  const [dismissed, setDismissed] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  const business = data?.business;
  if (!business) return null;

  // Only show for TRIAL status with trialEndsAt set
  if (business.subscriptionStatus !== "TRIAL" || !business.trialEndsAt) return null;

  const daysLeft = differenceInDays(parseISO(business.trialEndsAt), new Date());

  // Show banner only when 1 or 0 days left (days 13→14 and 14→15)
  if (daysLeft > 1 || daysLeft < 0) return null;
  if (dismissed) return null;

  async function handleSubscribe() {
    setRedirecting(true);
    try {
      const { url } = await createCheckoutSession();
      window.location.href = url;
    } catch {
      setRedirecting(false);
    }
  }

  const message =
    daysLeft <= 0
      ? "Tu período de prueba vence hoy."
      : "Tu período de prueba vence mañana.";

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex items-center gap-3">
      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
      <p className="text-sm text-amber-800 flex-1">
        {message}{" "}
        <button
          onClick={handleSubscribe}
          disabled={redirecting}
          className="font-semibold underline hover:no-underline inline-flex items-center gap-1"
        >
          {redirecting ? (
            <><Loader2 className="w-3 h-3 animate-spin" /> Redirigiendo...</>
          ) : (
            "Suscribite para no perder el acceso."
          )}
        </button>
      </p>
      <button
        onClick={() => setDismissed(true)}
        className="text-amber-500 hover:text-amber-700 transition-colors"
        aria-label="Cerrar"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
