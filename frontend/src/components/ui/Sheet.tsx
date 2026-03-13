import { useEffect } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  width?: "sm" | "md" | "lg";
};

const widthMap = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
};

export default function Sheet({
  open,
  onClose,
  children,
  width = "md",
}: Props) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (open) {
      document.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      {/* overlay */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
      />

      {/* panel */}
      <div
        className={`fixed right-0 top-0 h-full w-full ${widthMap[width]} bg-white shadow-xl z-50 animate-slideIn`}
      >
        <div className="h-full overflow-y-auto">{children}</div>
      </div>
    </>
  );
}