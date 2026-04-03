import { useState, useRef, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useBusiness } from "../hooks/useBusiness";
import { updateBusiness, uploadBusinessLogo } from "../services/business.api";
import { Upload, Check, Globe, MapPin, MessageCircle, Palette, Building2, Loader2 } from "lucide-react";
import AddressAutocomplete from "../components/ui/AddressAutocomplete";

// ─── Booking themes ──────────────────────────────────────────────────────────

type BookingTheme = {
  id: string;
  name: string;
  primary: string;
  swatch: string;
};

const BOOKING_THEMES: BookingTheme[] = [
  { id: "default", name: "Verde azulado", primary: "#0d9488", swatch: "bg-teal-500" },
  { id: "rose",    name: "Rosa",          primary: "#e11d48", swatch: "bg-rose-500" },
  { id: "violet",  name: "Violeta",       primary: "#7c3aed", swatch: "bg-violet-600" },
  { id: "amber",   name: "Ámbar",         primary: "#d97706", swatch: "bg-amber-500" },
  { id: "ocean",   name: "Océano",        primary: "#0284c7", swatch: "bg-sky-500" },
  { id: "slate",   name: "Gris neutro",   primary: "#475569", swatch: "bg-slate-500" },
];

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6">
      <div className="flex items-center gap-2 mb-5">
        <Icon className="w-4.5 h-4.5 text-slate-400" />
        <h2 className="text-sm font-semibold text-slate-700">{title}</h2>
      </div>
      {children}
    </div>
  );
}

// ─── Saved indicator ─────────────────────────────────────────────────────────

function SavedBadge({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <span className="flex items-center gap-1 text-xs text-teal-600 font-medium">
      <Check className="w-3.5 h-3.5" />
      Guardado
    </span>
  );
}

// ─── Logo uploader ────────────────────────────────────────────────────────────

function LogoUploader({
  currentUrl,
  onUploaded,
}: {
  currentUrl?: string | null;
  onUploaded: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      setUploading(true);
      try {
        const { logoUrl } = await uploadBusinessLogo(file);
        onUploaded(logoUrl);
      } catch (e: any) {
        setError(e.message ?? "Error al subir la imagen");
      } finally {
        setUploading(false);
      }
    },
    [onUploaded]
  );

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className="flex items-start gap-6">
      {/* Preview */}
      <div className="w-20 h-20 rounded-xl border-2 border-slate-200 bg-slate-50 flex items-center justify-center shrink-0 overflow-hidden">
        {currentUrl ? (
          <img src={currentUrl} alt="Logo" className="w-full h-full object-contain p-1" />
        ) : (
          <Building2 className="w-8 h-8 text-slate-300" />
        )}
      </div>

      {/* Drop zone */}
      <div
        className="flex-1 border-2 border-dashed border-slate-200 rounded-xl p-4 text-center cursor-pointer hover:border-slate-300 hover:bg-slate-50 transition-colors"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-2 py-1">
            <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
            <span className="text-xs text-slate-400">Subiendo...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1.5 py-1">
            <Upload className="w-5 h-5 text-slate-400" />
            <p className="text-xs text-slate-500 font-medium">
              Arrastrá o hacé clic para subir
            </p>
            <p className="text-[11px] text-slate-400">JPG, PNG, WebP o SVG · Máx. 2 MB</p>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/svg+xml"
          className="hidden"
          onChange={onInputChange}
        />
      </div>

      {error && (
        <p className="text-xs text-red-500 mt-1">{error}</p>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function BusinessProfilePage() {
  const queryClient = useQueryClient();
  const { data } = useBusiness();
  const business = data?.business;

  const [address, setAddress] = useState(business?.address ?? "");
  const [whatsappPhone, setWhatsappPhone] = useState(business?.whatsappPhone ?? "");
  const [bookingTheme, setBookingTheme] = useState(business?.bookingTheme ?? "default");
  const [savedSection, setSavedSection] = useState<string | null>(null);

  // Keep local state in sync with server data on first load
  const [initialized, setInitialized] = useState(false);
  if (business && !initialized) {
    setAddress(business.address ?? "");
    setWhatsappPhone(business.whatsappPhone ?? "");
    setBookingTheme(business.bookingTheme ?? "default");
    setInitialized(true);
  }

  const mutation = useMutation({
    mutationFn: updateBusiness,
    onSuccess: (result) => {
      queryClient.setQueryData(["business"], result);
    },
  });

  function showSaved(section: string) {
    setSavedSection(section);
    setTimeout(() => setSavedSection(null), 2500);
  }

  function saveContact() {
    mutation.mutate(
      { address: address || null, whatsappPhone: whatsappPhone || null },
      { onSuccess: () => showSaved("contact") }
    );
  }

  function saveTheme(themeId: string) {
    setBookingTheme(themeId);
    mutation.mutate(
      { bookingTheme: themeId },
      { onSuccess: () => showSaved("theme") }
    );
  }

  function handleLogoUploaded(logoUrl: string) {
    queryClient.setQueryData(["business"], (old: any) =>
      old ? { ...old, business: { ...old.business, logoUrl } } : old
    );
    showSaved("logo");
  }

  if (!business) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
      </div>
    );
  }

  const bookingUrl = `${window.location.origin}/reservar/${business.slug}`;
  const selectedTheme = BOOKING_THEMES.find((t) => t.id === bookingTheme) ?? BOOKING_THEMES[0];

  return (
    <div className="max-w-2xl mx-auto space-y-5">

      {/* Logo */}
      <Section title="Imagen del negocio" icon={Building2}>
        <LogoUploader currentUrl={business.logoUrl} onUploaded={handleLogoUploaded} />
        <div className="flex justify-end mt-3">
          <SavedBadge show={savedSection === "logo"} />
        </div>
      </Section>

      {/* Contact + booking links */}
      <Section title="Contacto y ubicación" icon={MapPin}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">
              Dirección
            </label>
            <AddressAutocomplete
              value={address}
              onChange={setAddress}
              placeholder="Buscá la dirección del negocio..."
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Se muestra como botón de dirección en tu página de reservas.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">
              Número de WhatsApp
            </label>
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                value={whatsappPhone}
                onChange={(e) => setWhatsappPhone(e.target.value)}
                placeholder="Ej: 5491138853213"
                className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Formato internacional sin espacios ni +. Ej: 5491138853213
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
          <SavedBadge show={savedSection === "contact"} />
          <button
            onClick={saveContact}
            disabled={mutation.isPending}
            className="ml-auto px-4 py-2 text-sm font-medium bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 transition-colors"
          >
            {mutation.isPending ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </Section>

      {/* Booking link */}
      <Section title="Link de reservas" icon={Globe}>
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5">
          <span className="text-sm text-slate-600 truncate flex-1">{bookingUrl}</span>
          <button
            onClick={() => navigator.clipboard.writeText(bookingUrl)}
            className="text-xs text-teal-600 font-medium hover:underline shrink-0"
          >
            Copiar
          </button>
        </div>
        <p className="text-[11px] text-slate-400 mt-1.5">
          Compartí este link con tus clientes para que reserven online.
        </p>
      </Section>

      {/* Theme */}
      <Section title="Estilo de la página de reservas" icon={Palette}>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
          {BOOKING_THEMES.map((theme) => {
            const active = bookingTheme === theme.id;
            return (
              <button
                key={theme.id}
                onClick={() => saveTheme(theme.id)}
                className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border-2 transition-all ${
                  active
                    ? "border-slate-700 bg-slate-50"
                    : "border-transparent hover:border-slate-200"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full ${theme.swatch} ${
                    active ? "ring-2 ring-offset-2 ring-slate-400" : ""
                  }`}
                />
                <span className="text-[10px] text-slate-600 font-medium text-center leading-tight">
                  {theme.name}
                </span>
                {active && (
                  <Check className="w-3 h-3 text-slate-600" />
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded-full shrink-0"
              style={{ backgroundColor: selectedTheme.primary }}
            />
            <span className="text-xs text-slate-500">
              Estilo activo: <span className="font-medium text-slate-700">{selectedTheme.name}</span>
            </span>
          </div>
          <SavedBadge show={savedSection === "theme"} />
        </div>
      </Section>

    </div>
  );
}
