import { useEffect, useRef, useState, type ReactNode } from "react";
import { X } from "lucide-react";

type ModalSize = "sm" | "md" | "lg" | "xl";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: ModalSize;
  closeOnBackdrop?: boolean;
};

const sizeClasses: Record<ModalSize, string> = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

const ANIMATION_DURATION = 200;

export default function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  closeOnBackdrop = true,
}: ModalProps) {
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(open);

  // Freeze content during close animation so empty-prop flashes don't show
  const frozenChildren = useRef<ReactNode>(children);
  const frozenFooter = useRef<ReactNode>(footer);
  if (visible) {
    frozenChildren.current = children;
    frozenFooter.current = footer;
  }

  useEffect(() => {
    if (open) {
      setMounted(true);
      let raf2: number;
      const raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => setVisible(true));
      });
      return () => {
        cancelAnimationFrame(raf1);
        cancelAnimationFrame(raf2);
      };
    } else {
      setVisible(false);
      const timer = setTimeout(() => setMounted(false), ANIMATION_DURATION);
      return () => clearTimeout(timer);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-100">
      <div
        className={`absolute inset-0 bg-slate-900/40 backdrop-blur-[1px] transition-opacity duration-200 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
        onClick={() => {
          if (closeOnBackdrop) onClose();
        }}
      />

      <div className="absolute inset-0 overflow-y-auto">
        <div className="flex min-h-full items-start justify-center p-3 sm:p-4 md:items-center">
          <div
            className={`relative z-101 flex w-full ${sizeClasses[size]} max-h-[calc(100dvh-1.5rem)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl sm:max-h-[calc(100dvh-2rem)] transition-all duration-200 ease-out ${
              visible
                ? "opacity-100 scale-100 translate-y-0"
                : "opacity-0 scale-95 translate-y-2"
            }`}
          >
            {(title || description) && (
              <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 px-4 py-4 sm:px-6">
                <div className="min-w-0">
                  {title && (
                    <h2 className="text-base font-semibold text-slate-900 sm:text-lg">
                      {title}
                    </h2>
                  )}
                  {description && (
                    <p className="mt-1 text-sm text-slate-500">{description}</p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="shrink-0 rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            )}

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
              {frozenChildren.current}
            </div>

            {frozenFooter.current && (
              <div className="shrink-0 border-t border-slate-100 bg-slate-50 px-4 py-4 sm:px-6">
                {frozenFooter.current}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}