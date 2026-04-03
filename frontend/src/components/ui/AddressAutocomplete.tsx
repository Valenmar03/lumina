import { useEffect, useRef, useState } from "react";
import { MapPin, Loader2 } from "lucide-react";

const MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

// ─── Script loader (singleton) ───────────────────────────────────────────────

let scriptPromise: Promise<void> | null = null;

function loadGoogleMapsScript(): Promise<void> {
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    if (window.google?.maps?.places) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error("No se pudo cargar Google Maps"));
    };
    document.head.appendChild(script);
  });

  return scriptPromise;
}

// ─── Component ───────────────────────────────────────────────────────────────

type Props = {
  value: string;
  onChange: (address: string) => void;
  placeholder?: string;
};

export default function AddressAutocomplete({ value, onChange, placeholder }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If no API key configured, render plain input
  if (!MAPS_API_KEY) {
    return (
      <div className="flex items-center gap-2">
        <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? "Ej: Av. Corrientes 1234, Buenos Aires"}
          className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400"
        />
      </div>
    );
  }

  return (
    <AutocompleteWithMaps
      inputRef={inputRef}
      autocompleteRef={autocompleteRef}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      loading={loading}
      setLoading={setLoading}
      error={error}
      setError={setError}
    />
  );
}

// Separate inner component so hooks run unconditionally
function AutocompleteWithMaps({
  inputRef,
  autocompleteRef,
  value,
  onChange,
  placeholder,
  loading,
  setLoading,
  error,
  setError,
}: {
  inputRef: React.RefObject<HTMLInputElement | null>;
  autocompleteRef: React.MutableRefObject<google.maps.places.Autocomplete | null>;
  value: string;
  onChange: (address: string) => void;
  placeholder?: string;
  loading: boolean;
  setLoading: (v: boolean) => void;
  error: string | null;
  setError: (v: string | null) => void;
}) {
  const [ready, setReady] = useState(() => !!window.google?.maps?.places);

  useEffect(() => {
    if (ready) return;
    setLoading(true);
    loadGoogleMapsScript()
      .then(() => setReady(true))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!ready || !inputRef.current || autocompleteRef.current) return;

    autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
      types: ["address"],
      fields: ["formatted_address"],
    });

    autocompleteRef.current.addListener("place_changed", () => {
      const place = autocompleteRef.current!.getPlace();
      if (place.formatted_address) {
        onChange(place.formatted_address);
      }
    });
  }, [ready]);

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        {loading ? (
          <Loader2 className="w-4 h-4 text-slate-400 shrink-0 animate-spin" />
        ) : (
          <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
        )}
        <input
          ref={inputRef}
          type="text"
          defaultValue={value}
          placeholder={placeholder ?? "Buscá la dirección..."}
          disabled={loading}
          className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 disabled:opacity-50"
        />
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
