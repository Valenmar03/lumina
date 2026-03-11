import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: Variant | string;
};

const variantClasses: Record<Variant, string> = {
  primary: "bg-teal-600 text-white hover:bg-teal-700",
  secondary:
    "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50",
  ghost: "bg-transparent text-slate-600 hover:bg-slate-100",
  danger: "bg-red-600 text-white hover:bg-red-700",
};

export default function Button({
  children,
  className = "",
  variant,
  ...props
}: Props) {
  const resolvedVariant =
    !variant
      ? variantClasses.primary
      : variant in variantClasses
      ? variantClasses[variant as Variant]
      : variant;

  return (
    <button
      className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer ${resolvedVariant} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}