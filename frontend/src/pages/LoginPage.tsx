import { FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

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
      await login(slug!, identifier, password);
      navigate("/", { replace: true });
    } catch (err: any) {
      setError(err?.message ?? "Error al iniciar sesión");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-slate-800 tracking-tight">Lumina</h1>
          <p className="text-sm text-slate-500 mt-1">Gestión de turnos</p>
        </div>

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
                    <span className="px-3 py-2 text-sm text-slate-400 bg-slate-50 border-r border-slate-200 whitespace-nowrap">
                      lumina.app/
                    </span>
                    <input
                      id="slug"
                      type="text"
                      required
                      value={slugInput}
                      onChange={(e) => setSlugInput(e.target.value)}
                      className="flex-1 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
                      placeholder="mi-negocio"
                      autoFocus
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full py-2 px-4 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 transition"
                >
                  Continuar
                </button>
                <p className="text-center text-sm text-slate-500">
                  ¿Sos nuevo?{" "}
                  <a href="/register" className="text-teal-600 hover:underline font-medium">
                    Registrá tu negocio
                  </a>
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
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                    placeholder="tu@email.com o nombre de usuario"
                    autoFocus
                  />
                </div>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-slate-600 mb-1">
                    Contraseña
                  </label>
                  <input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                    placeholder="••••••••"
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting || !businessName}
                  className="w-full py-2 px-4 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 disabled:opacity-60 disabled:cursor-not-allowed transition"
                >
                  {isSubmitting ? "Ingresando..." : "Ingresar"}
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="w-full text-center text-sm text-slate-400 hover:text-slate-600 transition"
                >
                  ← Cambiar negocio
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
