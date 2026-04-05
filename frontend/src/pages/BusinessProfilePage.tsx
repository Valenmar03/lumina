import { useState, useRef, useCallback, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useBusiness } from "../hooks/useBusiness";
import { updateBusiness, uploadBusinessLogo } from "../services/business.api";
import { Upload, Check, Globe, MapPin, MessageCircle, Palette, Building2, Loader2, Copy } from "lucide-react";
import AddressAutocomplete from "../components/ui/AddressAutocomplete";

// ─── Booking themes ──────────────────────────────────────────────────────────

type BookingTheme = {
  id: string;
  name: string;
  primary: string;
  color: string; // hex for swatch
};

const BOOKING_THEMES: BookingTheme[] = [
  { id: "default",      name: "Caleio", primary: "#0d9488", color: "#14b8a6" },
  { id: "desert-sand",  name: "Desert Sand",   primary: "#bf7450", color: "#ca8f6d" },
  { id: "bay-of-many",  name: "Bay of Many",   primary: "#5b7fc9", color: "#7899d4" },
  { id: "hippie-blue",  name: "Hippie Blue",   primary: "#3d6a7d", color: "#5a97aa" },
  { id: "carissma",     name: "Carissma",      primary: "#c06882", color: "#d48fa4" },
  { id: "wisteria",     name: "Wisteria",      primary: "#966297", color: "#cca5cd" },
  { id: "sea-nymph",    name: "Sea Nymph",     primary: "#3d645d", color: "#74a096" },
  { id: "hopbush",      name: "Hopbush",       primary: "#ac568a", color: "#d294be" },
  { id: "pesto",        name: "Pesto",         primary: "#7c7b49", color: "#a7a86d" },
  { id: "picton-blue",  name: "Picton Blue",   primary: "#4a87b8", color: "#6aaad0" },
];

// ─── Theme preview with skeleton ─────────────────────────────────────────────

function ThemePreview({ theme, name }: { theme: string; name: string }) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);
  }, [theme]);

  return (
    <div className="mt-4 rounded-xl overflow-hidden border border-slate-200 w-full max-w-80 mx-auto bg-slate-100" style={{ aspectRatio: "9/16" }}>
      {!loaded && <div className="w-full h-full animate-pulse bg-slate-100" />}
      <img
        key={theme}
        src={`/theme-previews/${theme}.png`}
        alt={`Vista previa ${name}`}
        onLoad={() => setLoaded(true)}
        className={`w-full object-cover object-top transition-opacity duration-200 ${loaded ? "opacity-100" : "opacity-0"}`}
      />
    </div>
  );
}

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

// ─── Booking URL row ─────────────────────────────────────────────────────────

function BookingUrlRow({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="flex items-center gap-2 bg-white border border-violet-200 rounded-lg px-3 py-2">
      <p className="text-xs font-mono text-slate-700 break-all flex-1">{url}</p>
      <button
        onClick={handleCopy}
        title="Copiar URL"
        className="shrink-0 text-violet-500 hover:text-violet-700 transition-colors"
      >
        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
      </button>
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
  const [tagline, setTagline] = useState(business?.tagline ?? "");
  const [bookingTheme, setBookingTheme] = useState(business?.bookingTheme ?? "default");
  const [savedSection, setSavedSection] = useState<string | null>(null);

  // Keep local state in sync with server data on first load
  const [initialized, setInitialized] = useState(false);
  if (business && !initialized) {
    setAddress(business.address ?? "");
    setWhatsappPhone(business.whatsappPhone ?? "");
    setTagline(business.tagline ?? "");
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
      { address: address || null, whatsappPhone: whatsappPhone || null, tagline: tagline || null },
      { onSuccess: () => showSaved("contact") }
    );
  }

  function saveTheme() {
    mutation.mutate(
      { bookingTheme: bookingTheme },
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
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 items-start">

      {/* ── Columna izquierda (logo + contacto + link) ── */}
      <div className="lg:col-span-2 space-y-4">

        {/* Logo */}
        <Section title="Imagen del negocio" icon={Building2}>
          <LogoUploader currentUrl={business.logoUrl} onUploaded={handleLogoUploaded} />
          <div className="flex justify-end mt-3 h-4">
            <SavedBadge show={savedSection === "logo"} />
          </div>
        </Section>

        {/* Contacto */}
        <Section title="Contacto y ubicación" icon={MapPin}>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Descripción corta</label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="Ej: Tu espacio de confianza para un corte perfecto"
                maxLength={120}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400"
              />
              <p className="text-[11px] text-slate-400 mt-1">Se muestra debajo del nombre en tu página de reservas.</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Dirección</label>
              <AddressAutocomplete
                value={address}
                onChange={setAddress}
                placeholder="Buscá la dirección del negocio..."
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Se muestra como botón en tu página de reservas.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">WhatsApp</label>
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
                Formato internacional sin espacios ni +.
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

        {/* Link */}
        <div className="bg-violet-50 border border-violet-100 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="w-4 h-4 text-violet-600" />
            <p className="text-sm font-semibold text-violet-700">Link de reservas</p>
          </div>
          <p className="text-xs text-violet-600 mb-2">
            Compartí este link con tus clientes para que puedan reservar su turno online.
          </p>
          <BookingUrlRow url={bookingUrl} />
        </div>
      </div>

      {/* ── Columna derecha (estilo) ── */}
      <div className="lg:col-span-3">
        <Section title="Estilo de reservas" icon={Palette}>
          {/* Selector */}
          <div className="flex gap-2.5 overflow-x-auto pb-1 -mx-1 px-1">
            {BOOKING_THEMES.map((theme) => {
              const active = bookingTheme === theme.id;
              return (
                <button
                  key={theme.id}
                  onClick={() => setBookingTheme(theme.id)}
                  className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border-2 transition-all shrink-0 ${
                    active ? "border-slate-700 bg-slate-50" : "border-transparent hover:border-slate-200"
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-full ${active ? "ring-2 ring-offset-2 ring-slate-400" : ""}`}
                    style={{ backgroundColor: theme.color }}
                  />
                  <span className="text-[10px] text-slate-600 font-medium text-center leading-tight">
                    {theme.name}
                  </span>
                  {active && <Check className="w-3 h-3 text-slate-600" />}
                </button>
              );
            })}
          </div>

          {/* Preview */}
          <ThemePreview theme={bookingTheme} name={selectedTheme.name} />

          <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: selectedTheme.primary }} />
              <span className="text-xs text-slate-500">
                Seleccionado: <span className="font-medium text-slate-700">{selectedTheme.name}</span>
              </span>
            </div>
            <div className="flex items-center gap-3">
              <SavedBadge show={savedSection === "theme"} />
              <button
                onClick={saveTheme}
                disabled={mutation.isPending}
                className="px-4 py-2 text-sm font-medium bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 transition-colors"
              >
                {mutation.isPending ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </Section>
      </div>

    </div>
  );
}
