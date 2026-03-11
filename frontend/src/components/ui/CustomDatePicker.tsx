import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import "react-day-picker/dist/style.css";

type Props = {
  label?: string;
  value: string; // yyyy-MM-dd
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  color?: "teal" | "blue" | "violet" | "slate";
};

const colorConfig = {
  teal: {
    ring: "focus:ring-teal-500",
    selectedBg: "#0f766e",
    selectedHoverBg: "#115e59",
    selectedText: "#ffffff",
    todayBorder: "#14b8a6",
    todayText: "#0f766e",
    hoverBg: "#f0fdfa",
    hoverText: "#0f766e",
  },
  blue: {
    ring: "focus:ring-blue-500",
    selectedBg: "#2563eb",
    selectedHoverBg: "#1d4ed8",
    selectedText: "#ffffff",
    todayBorder: "#60a5fa",
    todayText: "#1d4ed8",
    hoverBg: "#eff6ff",
    hoverText: "#1d4ed8",
  },
  violet: {
    ring: "focus:ring-violet-500",
    selectedBg: "#7c3aed",
    selectedHoverBg: "#6d28d9",
    selectedText: "#ffffff",
    todayBorder: "#a78bfa",
    todayText: "#6d28d9",
    hoverBg: "#f5f3ff",
    hoverText: "#6d28d9",
  },
  slate: {
    ring: "focus:ring-slate-500",
    selectedBg: "#334155",
    selectedHoverBg: "#1e293b",
    selectedText: "#ffffff",
    todayBorder: "#94a3b8",
    todayText: "#334155",
    hoverBg: "#f8fafc",
    hoverText: "#334155",
  },
};

export default function CustomDatePicker({
  label,
  value,
  onChange,
  disabled = false,
  placeholder = "Seleccionar fecha",
  color = "teal",
}: Props) {
  const [open, setOpen] = useState(false);
  const [openUpwards, setOpenUpwards] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState({
    top: 0,
    left: 0,
    width: 320,
  });

  const boxRef = useRef<HTMLDivElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  const colors = colorConfig[color];

  const selectedDate = useMemo(() => {
    if (!value) return undefined;

    try {
      return parseISO(value);
    } catch {
      return undefined;
    }
  }, [value]);

  const [visibleMonth, setVisibleMonth] = useState<Date>(
    selectedDate ?? new Date()
  );

  useEffect(() => {
    if (selectedDate) {
      setVisibleMonth(selectedDate);
    }
  }, [selectedDate]);

  const formattedDate = useMemo(() => {
    if (!value) return placeholder;

    try {
      return format(parseISO(value), "EEEE d 'de' MMMM", { locale: es });
    } catch {
      return value;
    }
  }, [value, placeholder]);

  const updatePopoverPosition = () => {
    const box = boxRef.current;
    if (!box) return;

    const rect = box.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    const popoverHeight = 380;
    const popoverWidth = 320;
    const gap = 8;

    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;

    const shouldOpenUpwards =
      spaceBelow < popoverHeight && spaceAbove > spaceBelow;

    setOpenUpwards(shouldOpenUpwards);

    const top = shouldOpenUpwards
      ? Math.max(8, rect.top - popoverHeight - gap)
      : Math.min(viewportHeight - popoverHeight - 8, rect.bottom + gap);

    const maxWidth = Math.min(popoverWidth, viewportWidth - 32);

    const left = Math.min(rect.left, viewportWidth - maxWidth - 8);

    setPopoverPosition({
      top,
      left: Math.max(8, left),
      width: maxWidth,
    });
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      const clickedInsideBox = boxRef.current?.contains(target);
      const clickedInsidePopover = popoverRef.current?.contains(target);

      if (!clickedInsideBox && !clickedInsidePopover) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (disabled) setOpen(false);
  }, [disabled]);

  useEffect(() => {
    if (!open) return;

    updatePopoverPosition();

    const handleResize = () => updatePopoverPosition();
    const handleScroll = () => updatePopoverPosition();

    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll, true);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [open]);

  return (
    <div>
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-slate-700">
          {label}
        </label>
      )}

      <div ref={boxRef} className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            if (disabled) return;

            if (!open) {
              updatePopoverPosition();
              setVisibleMonth(selectedDate ?? new Date());
            }

            setOpen((prev) => !prev);
          }}
          className={`flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left shadow-sm transition-colors ${
            disabled
              ? "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400"
              : "border-slate-200 bg-white hover:border-slate-300"
          } ${colors.ring} focus:outline-none focus:ring-2`}
        >
          <div className="min-w-0">
            <div
              className={`truncate text-sm font-medium ${
                value ? "capitalize text-slate-800" : "text-slate-400"
              }`}
            >
              {formattedDate}
            </div>

            {value && (
              <div className="mt-0.5 text-xs text-slate-500">{value}</div>
            )}
          </div>

          <CalendarDays className="ml-3 h-4 w-4 shrink-0 text-slate-400" />
        </button>

        {open && (
          <div
            ref={popoverRef}
            className="fixed z-200 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl"
            style={{
              top: popoverPosition.top,
              left: popoverPosition.left,
              width: popoverPosition.width,
            }}
          >
            <DayPicker
              mode="single"
              locale={es}
              selected={selectedDate}
              month={visibleMonth}
              onMonthChange={setVisibleMonth}
              onSelect={(date) => {
                if (!date) return;
                onChange(format(date, "yyyy-MM-dd"));
                setVisibleMonth(date);
                setOpen(false);
              }}
              showOutsideDays
              fixedWeeks
              weekStartsOn={1}
              classNames={{
                root: "w-full",
                months: "flex flex-col",
                month: "space-y-3",
                caption:
                  "flex items-center justify-between px-1 pt-1 mb-2 text-slate-900",
                caption_label: "text-sm font-semibold capitalize",
                nav: "flex items-center gap-1",
                button_previous:
                  "inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50",
                button_next:
                  "inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50",
                month_grid: "w-full border-collapse",
                weekdays: "flex mb-1",
                weekday:
                  "w-10 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-400",
                week: "mt-1 flex w-full",
                day: "h-10 w-10 p-0 text-center",
                day_button:
                  "h-10 w-10 rounded-xl text-sm font-medium text-slate-700 transition-all outline-none hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-offset-2",
                selected: "",
                today: "",
                outside: "",
                disabled: "text-slate-300 opacity-50",
                hidden: "invisible",
              }}
              styles={{
                day_button: {
                  border: "none",
                },
              }}
              modifiersStyles={{
                selected: {
                  backgroundColor: colors.selectedBg,
                  color: colors.selectedText,
                  borderRadius: "0.75rem",
                },
                today: {
                  border: `1px solid ${colors.todayBorder}`,
                  color: colors.todayText,
                  borderRadius: "0.75rem",
                },
                outside: {
                  color: "#cbd5e1",
                  opacity: 0.5,
                  backgroundColor: "transparent",
                },
              }}
              components={{
                Chevron: ({ orientation, className }) =>
                  orientation === "left" ? (
                    <ChevronLeft className={className ?? "h-4 w-4"} />
                  ) : (
                    <ChevronRight className={className ?? "h-4 w-4"} />
                  ),
              }}
            />

            <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => {
                  const today = new Date();
                  onChange(format(today, "yyyy-MM-dd"));
                  setVisibleMonth(today);
                  setOpen(false);
                }}
                className="text-xs font-medium text-slate-500 transition-colors hover:text-slate-700"
              >
                Hoy
              </button>

              {value && (
                <button
                  type="button"
                  onClick={() => {
                    onChange("");
                    setOpen(false);
                  }}
                  className="text-xs font-medium text-slate-500 transition-colors hover:text-slate-700"
                >
                  Limpiar
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {open && (
        <style>{`
          .rdp-root button[aria-selected="true"] {
            background: ${colors.selectedBg} !important;
            color: ${colors.selectedText} !important;
          }

          .rdp-root button[aria-selected="true"]:hover {
            background: ${colors.selectedHoverBg} !important;
          }

          .rdp-root .rdp-day_button:hover {
            background: ${colors.hoverBg};
            color: ${colors.hoverText};
          }

          .rdp-root .rdp-today:not(.rdp-selected) button {
            border: 1px solid ${colors.todayBorder};
            color: ${colors.todayText};
          }

          .rdp-root .rdp-outside {
            color: #cbd5e1 !important;
            opacity: 1 !important;
          }

          .rdp-root .rdp-outside button,
          .rdp-root button.rdp-outside {
            color: #cbd5e1 !important;
            background: transparent !important;
          }

          .rdp-root .rdp-outside button:hover,
          .rdp-root button.rdp-outside:hover {
            color: #cbd5e1 !important;
            background: transparent !important;
          }
        `}</style>
      )}
    </div>
  );
}