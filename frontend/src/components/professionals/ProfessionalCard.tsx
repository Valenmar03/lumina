import { useProfessionalServices } from "../../hooks/useProfessionalServices";

type Props = {
  professional: any;
};

export default function ProfessionalCard({ professional }: Props) {
  const { data, isLoading } = useProfessionalServices(professional.id);

  const services = data?.services ?? [];

  const serviceNames = services.map((s: any) => s.service?.name);
  const visibleServices = serviceNames.slice(0, 3);
  const extraServices = serviceNames.length - visibleServices.length;

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 hover:shadow-sm transition-all cursor-pointer">
      <div className="flex items-start gap-3.5">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-semibold text-lg shrink-0"
          style={{ background: professional.color || "#0D9488" }}
        >
          {professional.name?.[0]?.toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-800 truncate">
              {professional.name}
            </h3>

            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                professional.active
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-slate-200 text-slate-600"
              }`}
            >
              {professional.active ? "Activo" : "Inactivo"}
            </span>
          </div>

          {/* Servicios */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {isLoading && (
              <span className="text-xs text-slate-400">
                Cargando servicios...
              </span>
            )}

            {!isLoading && visibleServices.map((name: string) => (
              <span
                key={name}
                className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md"
              >
                {name}
              </span>
            ))}

            {!isLoading && extraServices > 0 && (
              <span className="text-xs text-slate-400">
                +{extraServices} más
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-3 pt-3 flex items-center justify-between border-t border-slate-200">
        <div className="flex gap-3 text-xs">
          <span className="text-slate-500">
            <span className="font-medium text-slate-700">*Cantidad*</span> hoy
          </span>

          <span className="text-slate-500">
            <span className="font-medium text-slate-700">*Total*</span> total
          </span>
        </div>

        <span className="text-xs text-slate-400">
          {isLoading ? "..." : `${services.length} servicios`}
        </span>
      </div>
    </div>
  );
}