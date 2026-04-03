import { Check } from "lucide-react";

type Props = {
  checked: boolean;
  onChange: () => void;
  label?: string;
  className?: string;
};

export default function Checkbox({ checked, onChange, label, className = "" }: Props) {
  return (
    <label className={`flex items-center gap-2 cursor-pointer select-none ${className}`}>
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        onClick={onChange}
        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
          checked
            ? "border-teal-600 bg-teal-600"
            : "border-slate-300 bg-white hover:border-slate-400"
        }`}
      >
        {checked && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
      </button>
      {label && <span className="text-sm font-medium text-slate-800">{label}</span>}
    </label>
  );
}
