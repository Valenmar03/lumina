type TimeLabelProps = {
  hour: number;
  className?: string;
};

export default function TimeLabel({
  hour,
  className = "",
}: TimeLabelProps) {
  return (
    <div
      className={`p-2 text-xs text-slate-400 text-right pr-3 border-r border-slate-100 flex items-start justify-end pt-1 ${className}`}
    >
      {String(hour).padStart(2, "0")}:00
    </div>
  );
}