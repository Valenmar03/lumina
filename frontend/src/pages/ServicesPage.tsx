import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Plus, Search } from "lucide-react";
import Button from "../components/ui/Button";
import { useState } from "react";
import { useServicesWithProfessionals } from "../hooks/useServices";
import ProfessionalSkeleton from "../components/ui/Skeleton/ProfessionalSkeleton";
import ServiceCard from "../components/services/ServiceCard";

export default function ServicesPage() {
   const currentDate = new Date();

   const [search, setSearch] = useState("");
   const handleNewService = () => {};

   const { data: servicesData, isLoading: loadingServices } = useServicesWithProfessionals();
   const services = servicesData?.services ?? [];


   return (
      <>
         <div className="max-w-full mx-auto space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
               <div>
                  <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                     Servicios
                  </h1>
                  <p className="text-sm text-slate-500 mt-0.5">
                     {format(currentDate, "EEEE d 'de' MMMM, yyyy", {
                        locale: es,
                     })}
                  </p>
               </div>

               <button
                  onClick={handleNewService}
                  className="hidden md:inline-flex items-center justify-center rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 transition-colors"
               >
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo Servicio
               </button>
            </div>

            <div className="hidden md:flex md:flex-row gap-3 md:items-center md:justify-end">
               <div className="flex flex-col sm:flex-row gap-2 w-auto">
                  <div className="relative flex items-center">
                     <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                     <input
                        placeholder="Buscar servicio..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-8 h-9 w-full sm:w-64 text-sm rounded-lg border border-slate-200 bg-white px-3 outline-none focus:ring-2 focus:ring-teal-500"
                     />
                  </div>

                  <Button
                     variant="primary"
                     onClick={handleNewService}
                     className="md:hidden inline-flex items-center justify-center rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 transition-colors"
                  >
                     <Plus className="w-4 h-4 mr-2" />
                     Nuevo servicio
                  </Button>
               </div>
            </div>

            <div className="flex md:hidden flex-col gap-2">
               <div className="relative flex items-center">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                     placeholder="Buscar servicio..."
                     value={search}
                     onChange={(e) => setSearch(e.target.value)}
                     className="pl-8 h-9 w-full text-sm rounded-lg border border-slate-200 bg-white px-3 outline-none focus:ring-2 focus:ring-teal-500"
                  />
               </div>

               <button
                  onClick={handleNewService}
                  className="inline-flex items-center justify-center rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 transition-colors"
               >
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo servicio
               </button>
            </div>

            {loadingServices ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
                  {[...Array(6)].map((_, i) => (
                    <ProfessionalSkeleton key={i} />
                  ))}
                </div>
              ) : services.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 p-8 text-sm text-slate-500">
                  No hay profesionales cargados.
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-stretch">
                    {services.map((service) => (
                      <ServiceCard
                        key={service.id}
                        service={service}
                      />
                    ))}
                  </div>
                </div>
              )}
         </div>
      </>
   );
}
