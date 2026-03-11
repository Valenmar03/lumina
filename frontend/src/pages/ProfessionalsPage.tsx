import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Plus } from "lucide-react";

import ProfessionalCard from "../components/professionals/ProfessionalCard";
import ProfessionalSkeleton from "../components/ui/Skeleton/ProfessionalSkeleton";
import { useProfessionals } from "../hooks/useProfessionals";
import Button from "../components/ui/Button";

export default function ProfessionalsPage() {
  const currentDate = new Date();
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

  return (
    <div className="max-w-full mx-auto space-y-4">
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

        <Button
          variant="primary"
          onClick={handleNewProfessional}
          className="hidden md:inline-flex items-center justify-center rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Profesional
        </Button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {professionals.map((professional) => (
          <ProfessionalCard
            key={professional.id}
            professional={professional}
          />
        ))}
      </div>
    </div>
  );
}