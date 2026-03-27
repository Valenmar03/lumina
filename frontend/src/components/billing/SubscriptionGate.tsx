import { useQuery } from "@tanstack/react-query";
import { CreditCard, MessageCircle } from "lucide-react";
import { getBillingStatus } from "../../services/billing.api";

const CONTACT_WHATSAPP = "https://wa.me/5491138853213?text=Hola%2C%20quiero%20suscribirme%20a%20Caleio.";

function isBlocked(
  status: "TRIAL" | "ACTIVE" | "PAST_DUE" | "CANCELED",
  trialEndsAt: string | null,
  billingExempt: boolean
): boolean {
  if (billingExempt) return false;
  if (status === "ACTIVE") return false;
  if (status === "TRIAL" && trialEndsAt && new Date(trialEndsAt) > new Date()) return false;
  return true;
}

export function SubscriptionGate({ children }: { children: React.ReactNode }) {
  const { data, isLoading } = useQuery({
    queryKey: ["billingStatus"],
    queryFn: getBillingStatus,
    refetchInterval: 60_000,
  });

  if (isLoading || !data) return <>{children}</>;

  const blocked = isBlocked(data.subscriptionStatus, data.trialEndsAt, data.billingExempt);

  if (!blocked) return <>{children}</>;

  return (
    <>
      {children}
      <div className="fixed inset-0 z-[9999] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
          <div className="w-14 h-14 bg-teal-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <CreditCard className="w-7 h-7 text-teal-600" />
          </div>

          <h2 className="text-xl font-semibold text-slate-800 mb-2">
            Tu período de prueba terminó
          </h2>

          <p className="text-sm text-slate-500 mb-4">
            Para continuar usando Caleio contactanos por WhatsApp y te activamos el acceso.
          </p>

          <div className="bg-slate-50 rounded-xl p-4 mb-6 text-left">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-slate-700">Caleio Pro</span>
              <span className="text-sm font-bold text-teal-600">$16.000 ARS/mes</span>
            </div>
            <ul className="space-y-1.5 text-xs text-slate-500">
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 bg-teal-500 rounded-full" />
                Hasta 2 profesionales incluidos
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 bg-teal-500 rounded-full" />
                Agenda y gestión de turnos
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 bg-teal-500 rounded-full" />
                Notificaciones por email
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 bg-teal-500 rounded-full" />
                Reservas online para clientes
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 bg-teal-500 rounded-full" />
                Métricas y análisis del negocio
              </li>
            </ul>
          </div>

          <a
            href={CONTACT_WHATSAPP}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-xl py-3 text-sm transition-colors mb-4"
          >
            <MessageCircle className="w-4 h-4" />
            Contactanos por WhatsApp
          </a>

          <p className="text-xs text-slate-400">
            Próximamente podrás suscribirte directamente con tarjeta.
          </p>
        </div>
      </div>
    </>
  );
}
