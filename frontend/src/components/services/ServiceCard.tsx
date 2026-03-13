import { Clock, DollarSign } from "lucide-react";
import type { ServiceWithProfessional } from "../../types/entities";
type Props = {
    service: ServiceWithProfessional;
    onClick?: () => void
}


export default function ServiceCard({service, onClick}: Props) {

    const assignedProfs = service.professionalServices


   return (
      <div
         className="bg-white rounded-xl border border-slate-200/80 p-4 hover:shadow-sm transition-all cursor-pointer"
         onClick={onClick}
      >
         <div className="flex items-start justify-between">
            <h4 className="text-sm font-semibold text-slate-800">
               {service.name}
            </h4>
            <span
                className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                  service.active
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {service.active ? "Activo" : "Inactivo"}
              </span>
         </div>
         {service.description && (
            <p className="text-xs text-slate-500 mt-1 line-clamp-2">{service.description}</p>
         )}
         <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
            <span className="flex items-center gap-1">
               <Clock className="w-3 h-3" /> {service.durationMin} min
            </span>
            <span className="flex items-center gap-1">
               <DollarSign className="w-3 h-3" />{" "}
               {service.basePrice}
            </span>
         </div>
         {assignedProfs.length > 0 && (
            <div className="flex -space-x-1.5 mt-3 pt-3 border-t border-slate-200">
               {assignedProfs.slice(0, 4).map((p) => (
                  <div
                     key={p.professional.id}
                     className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-[9px] text-white font-bold"
                     style={{ background: p.professional.color || "#0D9488" }}
                     title={p.professional.name}
                  >
                     {p.professional.name?.[0]}
                  </div>
               ))}
               {assignedProfs.length > 4 && (
                  <div className="w-6 h-6 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[9px] text-slate-600 font-bold">
                     +{assignedProfs.length - 4}
                  </div>
               )}
            </div>
         )}
      </div>
   );
}
