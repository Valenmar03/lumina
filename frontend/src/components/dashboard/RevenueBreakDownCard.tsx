import { BanknoteArrowDown } from "lucide-react";

type Props = {
  deposit: number;
  cash: number;
  isLoading?: boolean;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function RevenueBreakdownCard({
  deposit,
  cash,
  isLoading = false,
}: Props) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
            Ingresos hoy
          </p>

          {isLoading ? (
            <div className="mt-4 space-y-3 animate-pulse">
              <div className="h-3 w-32 rounded bg-slate-200" />
              <div className="h-3 w-32 rounded bg-slate-200" />
              <div className="h-3 w-32 rounded bg-slate-200" />
            </div>
          ) : (
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-500">Señas</span>
                <span className="font-semibold text-slate-700 text-xl tabular-nums">
                  {formatCurrency(deposit)}
                </span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-500">Caja</span>
                <span className="font-semibold text-slate-700 text-xl tabular-nums">
                  {formatCurrency(cash)}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-pink-50 text-pink-400">
          <BanknoteArrowDown className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}