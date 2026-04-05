import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import AR from "country-flag-icons/react/3x2/AR";
import MX from "country-flag-icons/react/3x2/MX";
import CO from "country-flag-icons/react/3x2/CO";
import CL from "country-flag-icons/react/3x2/CL";
import UY from "country-flag-icons/react/3x2/UY";
import PE from "country-flag-icons/react/3x2/PE";
import VE from "country-flag-icons/react/3x2/VE";

type Country = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Flag: React.ComponentType<any>;
  label: string;
  dialCode: string;
  mask: string; // X = digit, rest = separator chars
  maxDigits: number;
};

const COUNTRIES: Country[] = [
  { Flag: AR, label: "Argentina",  dialCode: "+54",  mask: "XX XXXX-XXXX",  maxDigits: 10 },
  { Flag: MX, label: "México",     dialCode: "+52",  mask: "XXX XXX-XXXX",  maxDigits: 10 },
  { Flag: CO, label: "Colombia",   dialCode: "+57",  mask: "XXX XXX-XXXX",  maxDigits: 10 },
  { Flag: CL, label: "Chile",      dialCode: "+56",  mask: "X XXXX-XXXX",   maxDigits: 9  },
  { Flag: UY, label: "Uruguay",    dialCode: "+598", mask: "XX XXX-XXXX",   maxDigits: 9  },
  { Flag: PE, label: "Perú",       dialCode: "+51",  mask: "XXX XXX-XXX",   maxDigits: 9  },
  { Flag: VE, label: "Venezuela",  dialCode: "+58",  mask: "XXX XXX-XXXX",  maxDigits: 10 },
];

function applyMask(digits: string, mask: string): string {
  let out = "";
  let d = 0;
  for (let i = 0; i < mask.length; i++) {
    if (d >= digits.length) break;
    if (mask[i] === "X") {
      out += digits[d++];
    } else {
      out += mask[i];
    }
  }
  return out;
}

type Props = {
  value: string;       // full value: dialCode + " " + formatted, e.g. "+54 11 1234-5678"
  onChange: (v: string) => void;
  required?: boolean;
};

export default function PhoneInput({ value, onChange, required }: Props) {
  const [open, setOpen] = useState(false);
  const [country, setCountry] = useState<Country>(COUNTRIES[0]);
  const [digits, setDigits] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Sync digits if value is cleared externally
  useEffect(() => {
    if (!value) setDigits("");
  }, [value]);

  function handleInput(raw: string) {
    const stripped = raw.replace(/\D/g, "").slice(0, country.maxDigits);
    setDigits(stripped);
    const formatted = applyMask(stripped, country.mask);
    onChange(stripped ? `${country.dialCode} ${formatted}` : "");
  }

  function handleCountryChange(c: Country) {
    setCountry(c);
    setOpen(false);
    // Re-format existing digits with new mask
    const clamped = digits.slice(0, c.maxDigits);
    setDigits(clamped);
    const formatted = applyMask(clamped, c.mask);
    onChange(clamped ? `${c.dialCode} ${formatted}` : "");
  }

  const displayValue = applyMask(digits, country.mask);

  return (
    <div>
      <label className="block text-sm font-medium text-slate-600 mb-1.5">
        Teléfono{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <div ref={ref} className="flex gap-2 relative">
        {/* Country selector */}
        <button
          type="button"
          onClick={() => setOpen((p) => !p)}
          className="flex items-center gap-1.5 border border-slate-200 rounded-xl px-3 py-3.5 bg-white text-sm text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 shrink-0"
        >
          <country.Flag className="w-5 h-auto rounded-sm" />
          <span className="text-xs text-slate-500">{country.dialCode}</span>
          <ChevronDown className="w-3 h-3 text-slate-400" />
        </button>

        {open && (
          <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-50 w-52 overflow-hidden">
            {COUNTRIES.map((c) => (
              <button
                key={c.dialCode}
                type="button"
                onClick={() => handleCountryChange(c)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50 transition-colors ${
                  c.dialCode === country.dialCode ? "bg-teal-50 text-teal-700" : "text-slate-700"
                }`}
              >
                <c.Flag className="w-5 h-auto rounded-sm shrink-0" />
                <span className="flex-1 text-left">{c.label}</span>
                <span className="text-xs text-slate-400">{c.dialCode}</span>
              </button>
            ))}
          </div>
        )}

        {/* Phone number input */}
        <input
          type="tel"
          inputMode="numeric"
          value={displayValue}
          onChange={(e) => handleInput(e.target.value)}
          placeholder={country.mask.replace(/X/g, "0")}
          className="flex-1 border border-slate-200 rounded-xl px-4 py-3.5 text-base text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white"
        />
      </div>
    </div>
  );
}
