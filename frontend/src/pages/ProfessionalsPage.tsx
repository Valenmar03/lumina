import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Plus, Search } from "lucide-react";

import ProfessionalCard from "../components/professionals/ProfessionalCard";
import ProfessionalSkeleton from "../components/ui/Skeleton/ProfessionalSkeleton";
import { useProfessionals } from "../hooks/useProfessionals";
import Button from "../components/ui/Button";
import { useState } from "react";

export default function ProfessionalsPage() {
  const currentDate = new Date();
  const [search, setSearch] = useState("");
  const { data: professionalsData, isLoading: professionalsLoading } = useProfessionals();

  const professionals = (professionalsData?.professionals ?? []).filter((p) => p.active);

  const handleNewProfessional = () => {};

  if (professionalsLoading) {
    return (
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <ProfessionalSkeleton key={i} />
        ))}
      </div>
    );
  }
  const normalize = (str: string) =>
    str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

  const filteredProfessionals = professionals.filter((p) =>
    normalize(p.name).includes(normalize(search))
  );
  
  return (
    <div className="max-w-full lg:max-w-7/8 xl:max-w-6/8 mx-auto space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Profesionales
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {format(currentDate, "EEEE d 'de' MMMM, yyyy", {
              locale: es,
            })}
          </p>
        </div>
        <div className="flex gap-2">

          <div className="relative flex items-center">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                placeholder="Buscar cliente, servicio o profesional..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-9 w-full sm:w-64 text-sm rounded-lg border border-slate-200 bg-white px-3 outline-none focus:ring-2 focus:ring-teal-500"
                />
          </div>
          <Button
            variant="primary"
            onClick={handleNewProfessional}
            className="hidden md:inline-flex items-center justify-center rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 transition-colors"
            >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Profesional
          </Button>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProfessionals.length === 0 ? (
          <div className="text-sm text-slate-500 col-span-full text-center py-10">
            No se encontraron profesionales
          </div>
        ) : (
          filteredProfessionals.map((professional) => (
            <ProfessionalCard
              key={professional.id}
              professional={professional}
            />
          ))
        )}
      </div>
    </div>
  );
}