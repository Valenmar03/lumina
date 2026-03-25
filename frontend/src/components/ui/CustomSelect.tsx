import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";

type Option = {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
  color?: string;
};

type Props = {
  label?: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  disabled?: boolean;
  loading?: boolean;
  loadingText?: string;
  emptyText?: string;
  helperText?: string;
};

export default function CustomSelect({
  label,
  placeholder,
  value,
  onChange,
  options,
  disabled = false,
  loading = false,
  loadingText = "Cargando...",
  emptyText = "No hay opciones disponibles.",
  helperText,
}: Props) {
  const [open, setOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
  });

  const boxRef = useRef<HTMLDivElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const selectedOption = useMemo(
    () => options.find((option) => option.value === value),
    [options, value]
  );

  const updateDropdownPosition = () => {
    const box = boxRef.current;
    if (!box) return;

    const rect = box.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const dropdownHeight = 288; // max-h-72
    const gap = 4;

    const spaceBelow = viewportHeight - rect.bottom;
    const shouldOpenUpwards =
      spaceBelow < dropdownHeight && rect.top > spaceBelow;

    const top = shouldOpenUpwards
      ? Math.max(8, rect.top - dropdownHeight - gap)
      : rect.bottom + gap;

    setDropdownPosition({
      top,
      left: rect.left,
      width: rect.width,
    });
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const clickedInsideBox = boxRef.current?.contains(target);
      const clickedInsideDropdown = dropdownRef.current?.contains(target);
      if (!clickedInsideBox && !clickedInsideDropdown) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (disabled) setOpen(false);
  }, [disabled]);

  useEffect(() => {
    if (!open) return;

    updateDropdownPosition();

    const handleResize = () => updateDropdownPosition();
    const handleScroll = () => updateDropdownPosition();

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

      <div ref={boxRef}>
        <button
          type="button"
          onClick={() => {
            if (disabled) return;
            setOpen((prev) => !prev);
          }}
          disabled={disabled}
          className={`flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left shadow-sm transition-colors ${
            disabled
              ? "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400"
              : "border-slate-200 bg-white hover:border-slate-300"
          } focus:outline-none focus:ring-2 focus:ring-teal-500`}
        >
          <div className="min-w-0">
            <div
              className={`truncate text-sm font-medium ${
                selectedOption ? "text-slate-800" : "text-slate-400"
              }`}
            >
              {selectedOption?.label || placeholder}
            </div>

            {selectedOption?.description && (
              <div className="mt-0.5 truncate text-xs text-slate-500">
                {selectedOption.description}
              </div>
            )}
          </div>

          <ChevronDown
            className={`ml-3 h-4 w-4 shrink-0 text-slate-400 transition-transform ${
              open ? "rotate-180" : ""
            }`}
          />
        </button>
      </div>

      {open &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{
              position: "fixed",
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              width: dropdownPosition.width,
              zIndex: 9999,
            }}
            className="max-h-72 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg"
          >
            <div className="max-h-72 overflow-y-auto py-1">
              {loading ? (
                <div className="px-3 py-3 text-sm text-slate-500">
                  {loadingText}
                </div>
              ) : options.length === 0 ? (
                <div className="px-3 py-3 text-sm text-slate-500">
                  {emptyText}
                </div>
              ) : (
                options.map((option) => {
                  const isSelected = option.value === value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      disabled={option.disabled}
                      onClick={() => {
                        if (option.disabled) return;
                        onChange(option.value);
                        setOpen(false);
                      }}
                      className={`flex w-full cursor-pointer items-center justify-between gap-3 px-3 py-2 text-left transition-colors
                        ${isSelected ? "bg-teal-50 hover:bg-teal-50" : ""}
                        ${
                          option.disabled
                            ? "cursor-not-allowed opacity-50"
                            : "hover:bg-slate-100"
                        }`}
                    >
                      {option.color && (
                        <div
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{
                            background: option.color || "#0D9488",
                          }}
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-slate-800">
                          {option.label}
                        </div>

                        {option.description && (
                          <div className="mt-0.5 text-xs text-slate-500">
                            {option.description}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>,
          document.body
        )}

      {helperText && <p className="mt-1 text-xs text-slate-500">{helperText}</p>}
    </div>
  );
}
