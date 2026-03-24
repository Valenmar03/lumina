import { useNavigate } from "react-router-dom";

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-7xl font-bold text-teal-600 mb-4">404</p>
        <h1 className="text-xl font-semibold text-slate-800 mb-2">Página no encontrada</h1>
        <p className="text-sm text-slate-500 mb-8">
          La página que buscás no existe o fue movida.
        </p>
        <button
          onClick={() => navigate(-1)}
          className="px-5 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 transition-colors"
        >
          Volver
        </button>
      </div>
    </div>
  );
}
