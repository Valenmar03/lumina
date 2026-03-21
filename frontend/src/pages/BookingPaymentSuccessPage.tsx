import { useEffect, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

export default function BookingPaymentSuccessPage() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const paymentId = searchParams.get("payment_id");
    const appointmentId = searchParams.get("external_reference");
    const paymentStatus = searchParams.get("status");

    if (!paymentId || !appointmentId || paymentStatus !== "approved") {
      setStatus("error");
      setErrorMsg("El pago no fue aprobado o faltan datos.");
      return;
    }

    fetch(`/booking/${slug}/appointments/${appointmentId}/confirm-payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentId }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) setStatus("success");
        else { setStatus("error"); setErrorMsg(data.error ?? "Error al confirmar el pago"); }
      })
      .catch(() => { setStatus("error"); setErrorMsg("Error de conexión"); });
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-6">
          <img src="/logo.png" alt="Caleio" className="w-7 h-7 object-contain" />
          <span className="text-lg font-semibold text-slate-800">Caleio</span>
        </div>

        {status === "loading" && (
          <>
            <Loader2 className="w-10 h-10 text-teal-500 animate-spin mx-auto mb-4" />
            <p className="text-slate-600 text-sm">Confirmando tu pago...</p>
          </>
        )}
        {status === "success" && (
          <>
            <CheckCircle className="w-12 h-12 text-teal-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-slate-800 mb-2">¡Turno confirmado!</h2>
            <p className="text-sm text-slate-500 mb-6">Tu seña fue procesada correctamente. Tu turno está reservado.</p>
            <Link to={`/reservar/${slug}`} className="text-sm text-teal-600 hover:underline">Volver al inicio</Link>
          </>
        )}
        {status === "error" && (
          <>
            <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-slate-800 mb-2">Algo salió mal</h2>
            <p className="text-sm text-slate-500 mb-6">{errorMsg}</p>
            <Link to={`/reservar/${slug}`} className="text-sm text-teal-600 hover:underline">Volver al inicio</Link>
          </>
        )}
      </div>
    </div>
  );
}
