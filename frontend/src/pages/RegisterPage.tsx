import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = "/api";

function normalizeSlug(raw: string): string {
  return raw
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export default function RegisterPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [slug, setSlug] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleBusinessNameChange(value: string) {
    setBusinessName(value);
    setSlug(normalizeSlug(value));
  }

  function handleSlugChange(value: string) {
    setSlug(normalizeSlug(value));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password, businessName, slug }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Error al registrar" }));
        throw new Error(data.error ?? "Error al registrar");
      }

      navigate(`/login/${slug}`);
    } catch (err: any) {
      setError(err?.message ?? "Error al registrar");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-slate-800 tracking-tight">Caleio</h1>
          <p className="text-sm text-slate-500 mt-1">Gestión de turnos</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-base font-medium text-slate-700 mb-5">Registrar negocio</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="businessName" className="block text-sm font-medium text-slate-600 mb-1">
                Nombre del negocio
              </label>
              <input
                id="businessName"
                type="text"
                required
                value={businessName}
                onChange={(e) => handleBusinessNameChange(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                placeholder="Peluquería María"
              />
            </div>

            <div>
              <label htmlFor="slug" className="block text-sm font-medium text-slate-600 mb-1">
                URL del negocio
              </label>
              <div className="flex items-center rounded-lg border border-slate-200 overflow-hidden focus-within:ring-2 focus-within:ring-teal-500">
                <span className="px-3 py-2 text-sm text-slate-400 bg-slate-50 border-r border-slate-200 whitespace-nowrap">
                  caleio.app/
                </span>
                <input
                  id="slug"
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  className="flex-1 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
                  placeholder="peluqueria-maria"
                />
              </div>
              {slug && (
                <p className="mt-1 text-xs text-slate-400">
                  Tus profesionales ingresarán en: <span className="text-teal-600 font-medium">caleio.app/login/{slug}</span>
                </p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-600 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                placeholder="tu@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-600 mb-1">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
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
              disabled={isSubmitting}
              className="w-full py-2 px-4 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 disabled:opacity-60 disabled:cursor-not-allowed transition"
            >
              {isSubmitting ? "Registrando..." : "Crear negocio"}
            </button>
            <p className="text-center text-sm text-slate-500">
              ¿Ya tenés cuenta?{" "}
              <a href="/login" className="text-teal-600 hover:underline font-medium">
                Iniciá sesión
              </a>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
