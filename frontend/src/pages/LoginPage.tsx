import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useParams, useLocation, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import PasswordInput from "../components/ui/PasswordInput";
import { Mail, ArrowLeft, Loader2 } from "lucide-react";

const API_URL = "/api";

async function fetchBusinessName(slug: string): Promise<string | null> {
  try {
    const res = await fetch(`${API_URL}/auth/business/${slug}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.name ?? null;
  } catch {
    return null;
  }
}

export default function LoginPage() {
  const { slug } = useParams<{ slug?: string }>();
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const justRegistered = (location.state as any)?.justRegistered === true;
  const registeredEmail = (location.state as any)?.email as string | undefined;

  const [businessName, setBusinessName] = useState<string | null>(null);
  const [slugInput, setSlugInput] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!slug) return;
    fetchBusinessName(slug).then((name) => {
      if (name) {
        setBusinessName(name);
      } else {
        setError("No encontramos un negocio con esa URL.");
      }
    });
  }, [slug]);

  async function handleSlugSubmit(e: FormEvent) {
    e.preventDefault();
    const normalized = slugInput.trim().toLowerCase();
    if (!normalized) return;
    navigate(`/login/${normalized}`);
  }

  async function handleLoginSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login(slug!, identifier.trim(), password);
      navigate("/", { replace: true });
    } catch (err: any) {
      if (err?.message === "Email not verified") {
        setError("Necesitás confirmar tu email antes de ingresar. Revisá tu bandeja de entrada.");
      } else {
        setError(err?.message ?? "Error al iniciar sesión");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <img src="/logo.png" alt="Caleio" className="w-8 h-8 object-contain" />
            <h1 className="text-2xl font-semibold text-slate-800 tracking-tight">Caleio</h1>
          </div>
          <p className="text-sm text-slate-500">Gestión de turnos</p>
        </div>

        {justRegistered && (
          <div role="status" className="mb-4 bg-teal-50 border border-teal-200 rounded-xl px-4 py-3 text-sm text-teal-800 flex items-start gap-2">
            <Mail className="w-4 h-4 mt-0.5 shrink-0" />
            <span>Revisá tu email{registeredEmail ? ` (${registeredEmail})` : ""} para confirmar tu cuenta antes de iniciar sesión.</span>
          </div>
        )}

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          {!slug ? (
            <>
              <h2 className="text-base font-medium text-slate-700 mb-5">Acceder a tu negocio</h2>
              <form onSubmit={handleSlugSubmit} className="space-y-4">
                <div>
                  <label htmlFor="slug" className="block text-sm font-medium text-slate-600 mb-1">
                    URL del negocio
                  </label>
                  <div className="flex items-center rounded-lg border border-slate-200 overflow-hidden focus-within:ring-2 focus-within:ring-teal-500">
                    <span className="px-3 py-2.5 text-sm text-slate-400 bg-slate-50 border-r border-slate-200 whitespace-nowrap">
                      app.caleio.app/
                    </span>
                    <input
                      id="slug"
                      type="text"
                      required
                      value={slugInput}
                      onChange={(e) => setSlugInput(e.target.value)}
                      className="flex-1 px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
                      placeholder="mi-negocio"
                      autoFocus
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 transition"
                >
                  Continuar
                </button>
                <p className="text-center text-sm text-slate-500">
                  ¿Sos nuevo?{" "}
                  <Link to="/register" className="text-teal-600 hover:underline font-medium">
                    Registrá tu negocio
                  </Link>
                </p>
              </form>
            </>
          ) : (
            <>
              {businessName && (
                <p className="text-xs font-medium text-teal-700 bg-teal-50 rounded-lg px-3 py-1.5 mb-4 text-center">
                  {businessName}
                </p>
              )}
              <h2 className="text-base font-medium text-slate-700 mb-5">Iniciar sesión</h2>
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label htmlFor="identifier" className="block text-sm font-medium text-slate-600 mb-1">
                    Email o usuario
                  </label>
                  <input
                    id="identifier"
                    type="text"
                    autoComplete="username"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                    placeholder="tu@email.com o nombre de usuario"
                    autoFocus
                  />
                </div>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-slate-600 mb-1">
                    Contraseña
                  </label>
                  <PasswordInput
                    id="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                    placeholder="••••••••"
                  />
                </div>

                {error && (
                  <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting || !businessName}
                  className="w-full py-2.5 px-4 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 disabled:opacity-60 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isSubmitting ? "Ingresando..." : "Ingresar"}
                </button>
                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={() => navigate("/login")}
                    className="flex items-center gap-1 text-sm text-slate-400 hover:text-slate-600 transition"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Cambiar negocio
                  </button>
                  <Link to="/olvide-password" className="text-sm text-teal-600 hover:underline">
                    Olvidé mi contraseña
                  </Link>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
