import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronDown, Plus, Search, Scissors } from "lucide-react";
import Button from "../components/ui/Button";
import { useMemo, useState } from "react";
import { useServicesWithProfessionals } from "../hooks/useServices";
import ProfessionalSkeleton from "../components/ui/Skeleton/ProfessionalSkeleton";
import ServiceCard from "../components/services/ServiceCard";
import type { ServiceWithProfessional } from "../types/entities";
import ServiceDetailModal from "../components/services/ServiceDetailModal";
import NewServiceFormModal from "../components/services/NewServiceFormModal";

export default function ServicesPage() {
  const currentDate = new Date();

  const [search, setSearch] = useState("");
  const [serviceDetailOpen, setServiceDetailOpen] = useState(false);
  const [selectedService, setSelectedService] =
    useState<ServiceWithProfessional | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const [showNewServiceModal, setShowNewServiceModal] = useState(false);

   const handleNewService = () => {
      setShowNewServiceModal(true);
   };

   const handleCloseNewServiceModal = () => {
      setShowNewServiceModal(false);
   };

  const { data: servicesData, isLoading: loadingServices } =
    useServicesWithProfessionals();

  const services = servicesData?.services ?? [];

  const normalize = (str: string) =>
    str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

  const filteredServices = useMemo(() => {
    if (!search.trim()) return services;

    return services.filter((service) =>
      normalize(service.name).includes(normalize(search))
    );
  }, [services, search]);

  const activeServices = useMemo(
    () => filteredServices.filter((service) => service.active),
    [filteredServices]
  );

  const inactiveServices = useMemo(
    () => filteredServices.filter((service) => !service.active),
    [filteredServices]
  );

  const totalInactive = useMemo(
    () => services.filter((service) => service.active === false).length,
    [services]
  );

  const handleOpenService = (service: ServiceWithProfessional) => {
    setSelectedService(service);
    setServiceDetailOpen(true);
  };

  const handleCloseServiceDetail = () => {
    setServiceDetailOpen(false);
    setSelectedService(null);
  };

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

        <div className="hidden md:flex flex-col xl:flex-row gap-3 items-start xl:items-center xl:justify-between">
          <div className="flex items-center gap-1.5">
            <div className="h-9 px-3 inline-flex items-center rounded-lg border border-slate-200 bg-white text-xs text-slate-500">
              {activeServices.length} servicio
              {activeServices.length !== 1 ? "s" : ""} activo
              {activeServices.length !== 1 ? "s" : ""}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full xl:w-auto">
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
          <div className="bg-white rounded-xl border border-slate-200 p-12 flex flex-col items-center gap-3 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
              <Scissors className="w-6 h-6 text-slate-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700">No hay servicios cargados</p>
              <p className="text-xs text-slate-400 mt-0.5">Agregá tu primer servicio para empezar</p>
            </div>
          </div>
        ) : activeServices.length === 0 && inactiveServices.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-sm text-slate-500">
            No se encontraron servicios para esa búsqueda.
          </div>
        ) : (
          <div className="space-y-6">
            {activeServices.length > 0 && (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-stretch">
                {activeServices.map((service) => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    onClick={() => handleOpenService(service)}
                  />
                ))}
              </div>
            )}

            {totalInactive > 0 && (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setShowInactive((prev) => !prev)}
                  className="w-full group"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-px flex-1 bg-slate-200" />

                    <div className="inline-flex items-center gap-2 text-sm text-slate-500 group-hover:text-slate-700 transition-colors">
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-300 ${
                          showInactive ? "rotate-180" : ""
                        }`}
                      />
                      <span>
                        Inactivos
                        {inactiveServices.length > 0 && (
                          <span className="ml-1 text-slate-400">
                            ({inactiveServices.length})
                          </span>
                        )}
                      </span>
                    </div>

                    <div className="h-px flex-1 bg-slate-200" />
                  </div>
                </button>

                <div
                  className={`grid transition-all duration-300 ease-out ${
                    showInactive
                      ? "grid-rows-[1fr] opacity-100 mt-4"
                      : "grid-rows-[0fr] opacity-0 mt-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    {inactiveServices.length > 0 ? (
                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-stretch">
                        {inactiveServices.map((service) => (
                          <ServiceCard
                            key={service.id}
                            service={service}
                            onClick={() => handleOpenService(service)}
                          />
                        ))}
                      </div>
                    ) : search.trim() ? (
                      <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
                        No hay servicios inactivos que coincidan con la búsqueda.
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <ServiceDetailModal
        open={serviceDetailOpen}
        onClose={handleCloseServiceDetail}
        service={selectedService}
      />
      <NewServiceFormModal
         open={showNewServiceModal}
         onClose={handleCloseNewServiceModal}
      />
    </>
  );
}