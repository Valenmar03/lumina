import { ChevronLeft, ChevronRight} from "lucide-react";
import { format, parseISO, addDays } from "date-fns";
import { es } from "date-fns/locale";
import CustomDatePicker from "../ui/CustomDatePicker";

type Props = {
  value: string; // yyyy-MM-dd
  onChange: (value: string) => void;
};

export default function DashboardDateNavigator({ value, onChange }: Props) {
  const currentDate = parseISO(value);

  const handlePrev = () => {
    onChange(format(addDays(currentDate, -1), "yyyy-MM-dd"));
  };

  const handleNext = () => {
    onChange(format(addDays(currentDate, 1), "yyyy-MM-dd"));
  };

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
          Dashboard diario
        </p>
        <p className="mt-1 text-lg font-semibold text-slate-900">
          {format(currentDate, "EEEE d 'de' MMMM", { locale: es })}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handlePrev}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
          <CustomDatePicker
            value={value}
            onChange={onChange}
          />
        </div>

        <button
          type="button"
          onClick={handleNext}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}