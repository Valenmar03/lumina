import { ArrowRight } from "lucide-react";

type SectionCardProps = {
  title: string;
  actionLabel?: string;
  onActionClick?: () => void;
  children: React.ReactNode;
};

export default function SectionCard({
  title,
  actionLabel,
  onActionClick,
  children,
}: SectionCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>

        {actionLabel && (
          <button
            onClick={onActionClick}
            className="inline-flex items-center gap-1 text-sm font-medium text-teal-600 transition hover:text-teal-700"
          >
            {actionLabel}
            <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="p-5">{children}</div>
    </div>
  );
}