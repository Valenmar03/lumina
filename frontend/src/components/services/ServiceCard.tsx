import { Clock, DollarSign, Banknote, Globe, EyeOff, Shuffle } from "lucide-react";
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
               {Number(service.basePrice).toLocaleString("es-AR")}
            </span>
         </div>
         <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
            {service.bookableOnline ? (
               <div className="flex items-center gap-1">
                  <Globe className="w-3 h-3 text-teal-500" />
                  <span className="text-[11px] text-teal-600 font-medium">Agendable online</span>
               </div>
            ) : (
               <div className="flex items-center gap-1">
                  <EyeOff className="w-3 h-3 text-slate-400" />
                  <span className="text-[11px] text-slate-500 font-medium">No agendable online</span>
               </div>
            )}
            {service.bookableOnline && service.allowClientChooseProfessional === false && (
               <div className="flex items-center gap-1">
                  <Shuffle className="w-3 h-3 text-slate-400" />
                  <span className="text-[11px] text-slate-500 font-medium">Profesional automático</span>
               </div>
            )}
         </div>
         {service.requiresDeposit && service.depositPercent && (
            <div className="flex items-center gap-1.5 mt-2">
               <Banknote className="w-3 h-3 text-amber-600" />
               <span className="text-[11px] text-amber-700 font-medium">
                  Seña {service.depositPercent}% · ${Math.round(Number(service.basePrice) * service.depositPercent / 100).toLocaleString("es-AR")}
               </span>
            </div>
         )}
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
