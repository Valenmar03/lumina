import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Clock } from "lucide-react";

type Props = {
  label?: string;
  value: string; // HH:mm
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  stepMin?: number; // default 30
};

function generateTimes(stepMin: number): string[] {
  const times: string[] = [];
  for (let total = 0; total < 24 * 60; total += stepMin) {
    const h = String(Math.floor(total / 60)).padStart(2, "0");
    const m = String(total % 60).padStart(2, "0");
    times.push(`${h}:${m}`);
  }
  return times;
}

const PICKER_OPEN_EVENT = "timepicker:open";
let instanceCounter = 0;

export default function CustomTimePicker({
  label,
  value,
  onChange,
  disabled = false,
  placeholder = "Seleccionar hora",
  stepMin = 30,
}: Props) {
  const instanceId = useRef(++instanceCounter);
  const [open, setOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });

  const boxRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);

  const times = generateTimes(stepMin);

  const updatePosition = () => {
    const box = boxRef.current;
    if (!box) return;

    const rect = box.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const dropdownHeight = 220;
    const gap = 4;

    const spaceBelow = viewportHeight - rect.bottom;
    const top =
      spaceBelow >= dropdownHeight
        ? rect.bottom + gap
        : Math.max(8, rect.top - dropdownHeight - gap);

    setDropdownPosition({ top, left: rect.left, width: rect.width });
  };

  // Close when another time picker opens
  useEffect(() => {
    const handleOtherOpen = (e: Event) => {
      const id = (e as CustomEvent<number>).detail;
      if (id !== instanceId.current) setOpen(false);
    };
    document.addEventListener(PICKER_OPEN_EVENT, handleOtherOpen);
    return () => document.removeEventListener(PICKER_OPEN_EVENT, handleOtherOpen);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (!boxRef.current?.contains(target) && !dropdownRef.current?.contains(target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (disabled) setOpen(false);
  }, [disabled]);

  // Reposition on scroll/resize
  useEffect(() => {
    if (!open) return;
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  // Scroll selected item into view when dropdown opens
  useEffect(() => {
    if (open && selectedRef.current) {
      selectedRef.current.scrollIntoView({ block: "center" });
    }
  }, [open]);

  return (
    <div>
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>
      )}

      <div ref={boxRef} className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            if (disabled) return;
            if (!open) {
              document.dispatchEvent(
                new CustomEvent<number>(PICKER_OPEN_EVENT, { detail: instanceId.current })
              );
              updatePosition();
            }
            setOpen((prev) => !prev);
          }}
          className={`flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 ${
            disabled
              ? "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400"
              : "border-slate-200 bg-white hover:border-slate-300"
          }`}
        >
          <span
            className={`text-sm font-medium ${value ? "text-slate-800" : "text-slate-400"}`}
          >
            {value || placeholder}
          </span>
          <Clock className="ml-3 h-4 w-4 shrink-0 text-slate-400" />
        </button>

        {open &&
          createPortal(
            <div
              ref={dropdownRef}
              className="fixed z-200 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl"
              style={{
                top: dropdownPosition.top,
                left: dropdownPosition.left,
                width: Math.max(dropdownPosition.width, 120),
                maxHeight: 220,
              }}
            >
              {times.map((t) => (
                <button
                  key={t}
                  ref={t === value ? selectedRef : undefined}
                  type="button"
                  onClick={() => {
                    onChange(t);
                    setOpen(false);
                  }}
                  className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                    t === value
                      ? "bg-teal-50 font-semibold text-teal-700"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>,
            document.body
          )}
      </div>
    </div>
  );
}
