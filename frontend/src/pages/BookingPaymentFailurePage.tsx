import { useParams, Link } from "react-router-dom";
import { XCircle } from "lucide-react";

export default function BookingPaymentFailurePage() {
  const { slug } = useParams<{ slug: string }>();
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-6">
          <img src="/logo.png" alt="Caleio" className="w-7 h-7 object-contain" />
          <span className="text-lg font-semibold text-slate-800">Caleio</span>
        </div>
        <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-slate-800 mb-2">El pago no fue procesado</h2>
        <p className="text-sm text-slate-500 mb-6">Podés intentarlo de nuevo o elegir otro método.</p>
        <Link to={`/reservar/${slug}`} className="text-sm text-teal-600 hover:underline">Volver e intentar de nuevo</Link>
      </div>
    </div>
  );
}
