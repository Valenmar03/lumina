import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronDown, Plus, Search, Users } from "lucide-react";
import { useMemo, useState } from "react";
import type { FormEvent } from "react";

import ProfessionalCard from "../components/professionals/ProfessionalCard";
import ProfessionalDetailModal from "../components/professionals/ProfessionalDetailModal";
import NewProfessionalFormModal from "../components/professionals/NewProfessionalFormModal";
import ProfessionalSkeleton from "../components/ui/Skeleton/ProfessionalSkeleton";
import { useProfessionals } from "../hooks/useProfessionals";
import Button from "../components/ui/Button";
import type { Professional } from "../types/entities";
import { createProfessionalAccount } from "../services/professionals.api";
import { useQueryClient } from "@tanstack/react-query";

export default function ProfessionalsPage() {
  const currentDate = new Date();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [selectedProfessional, setSelectedProfessional] =
    useState<Professional | null>(null);
  const [showProfessionalModal, setShowProfessionalModal] = useState(false);
  const [showNewProfessionalModal, setShowNewProfessionalModal] = useState(false);
  const [showInactive, setShowInactive] = useState(false);

  // Activate account modal
  const [accountProfessional, setAccountProfessional] = useState<Professional | null>(null);
  const [accountUsername, setAccountUsername] = useState("");
  const [accountPassword, setAccountPassword] = useState("");
  const [accountError, setAccountError] = useState<string | null>(null);
  const [accountSubmitting, setAccountSubmitting] = useState(false);

  async function handleActivateAccount(e: FormEvent) {
    e.preventDefault();
    if (!accountProfessional) return;
    setAccountError(null);
    setAccountSubmitting(true);
    try {
      await createProfessionalAccount(accountProfessional.id, accountUsername, accountPassword);
      queryClient.invalidateQueries({ queryKey: ["professionals"] });
      setAccountProfessional(null);
      setAccountUsername("");
      setAccountPassword("");
    } catch (err: any) {
      setAccountError(err?.message ?? "Error al crear la cuenta");
    } finally {
      setAccountSubmitting(false);
    }
  }

  const { data: professionalsData, isLoading: professionalsLoading } =
    useProfessionals();

  const professionals = professionalsData?.professionals ?? [];

  const normalize = (str: string) =>
    str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

  const filteredProfessionals = useMemo(() => {
    if (!search.trim()) return professionals;

    return professionals.filter((p) =>
      normalize(p.name).includes(normalize(search))
    );
  }, [professionals, search]);

  const activeProfessionals = useMemo(
    () => filteredProfessionals.filter((p) => p.active),
    [filteredProfessionals]
  );

  const inactiveProfessionals = useMemo(
    () => filteredProfessionals.filter((p) => !p.active),
    [filteredProfessionals]
  );

  const totalInactive = useMemo(
    () => professionals.filter((p) => p.active === false).length,
    [professionals]
  );

  const handleNewProfessional = () => {
    setShowNewProfessionalModal(true);
  };

  const handleOpenProfessional = (professional: Professional) => {
    setSelectedProfessional(professional);
    setShowProfessionalModal(true);
  };

  const handleCloseProfessionalModal = () => {
    setSelectedProfessional(null);
    setShowProfessionalModal(false);
  };

  const handleCloseNewProfessionalModal = () => {
    setShowNewProfessionalModal(false);
  };

  return (
    <>
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

          <button
            onClick={handleNewProfessional}
            className="hidden md:inline-flex items-center justify-center rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo profesional
          </button>
        </div>

        <div className="hidden md:flex flex-col xl:flex-row gap-3 items-start xl:items-center xl:justify-between">
          <div className="flex items-center gap-1.5">
            <div className="h-9 px-3 inline-flex items-center rounded-lg border border-slate-200 bg-white text-xs text-slate-500">
              {activeProfessionals.length} profesional
              {activeProfessionals.length !== 1 ? "es" : ""} activo
              {activeProfessionals.length !== 1 ? "s" : ""}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full xl:w-auto">
            <div className="relative flex items-center">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                placeholder="Buscar profesional..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-9 w-full sm:w-64 text-sm rounded-lg border border-slate-200 bg-white px-3 outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <Button
              variant="primary"
              onClick={handleNewProfessional}
              className="md:hidden inline-flex items-center justify-center rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuevo profesional
            </Button>
          </div>
        </div>

        <div className="flex md:hidden flex-col gap-2">
          <div className="relative flex items-center">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              placeholder="Buscar profesional..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9 w-full text-sm rounded-lg border border-slate-200 bg-white px-3 outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <button
            onClick={handleNewProfessional}
            className="inline-flex items-center justify-center rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo profesional
          </button>
        </div>

        {professionalsLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
            {[...Array(6)].map((_, i) => (
              <ProfessionalSkeleton key={i} />
            ))}
          </div>
        ) : professionals.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 flex flex-col items-center gap-3 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
              <Users className="w-6 h-6 text-slate-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700">No hay profesionales cargados</p>
              <p className="text-xs text-slate-400 mt-0.5">Agregá tu primer profesional para empezar</p>
            </div>
          </div>
        ) : activeProfessionals.length === 0 && inactiveProfessionals.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-sm text-slate-500">
            No se encontraron profesionales para esa búsqueda.
          </div>
        ) : (
          <div className="space-y-6">
            {activeProfessionals.length > 0 && (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
                {activeProfessionals.map((professional) => (
                  <ProfessionalCard
                    key={professional.id}
                    professional={professional}
                    onClick={() => handleOpenProfessional(professional)}
                    onActivateAccount={setAccountProfessional}
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
                        {inactiveProfessionals.length > 0 && (
                          <span className="ml-1 text-slate-400">
                            ({inactiveProfessionals.length})
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
                    {inactiveProfessionals.length > 0 ? (
                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
                        {inactiveProfessionals.map((professional) => (
                          <ProfessionalCard
                            key={professional.id}
                            professional={professional}
                            onClick={() => handleOpenProfessional(professional)}
                            onActivateAccount={setAccountProfessional}
                          />
                        ))}
                      </div>
                    ) : search.trim() ? (
                      <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
                        No hay profesionales inactivos que coincidan con la búsqueda.
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <ProfessionalDetailModal
        open={showProfessionalModal}
        onClose={handleCloseProfessionalModal}
        professional={selectedProfessional}
      />

      <NewProfessionalFormModal
        open={showNewProfessionalModal}
        onClose={handleCloseNewProfessionalModal}
      />

      {accountProfessional && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-lg w-full max-w-sm p-6">
            <h3 className="text-base font-semibold text-slate-800 mb-1">Activar acceso</h3>
            <p className="text-sm text-slate-500 mb-5">
              Crear credenciales de acceso para <span className="font-medium text-slate-700">{accountProfessional.name}</span>.
            </p>
            <form onSubmit={handleActivateAccount} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Usuario</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={accountUsername}
                  onChange={(e) => setAccountUsername(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                  placeholder="nombre de usuario"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Contraseña</label>
                <input
                  type="password"
                  required
                  value={accountPassword}
                  onChange={(e) => setAccountPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                  placeholder="••••••••"
                />
              </div>
              {accountError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  {accountError}
                </p>
              )}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => { setAccountProfessional(null); setAccountError(null); setAccountUsername(""); setAccountPassword(""); }}
                  className="flex-1 py-2 px-4 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={accountSubmitting}
                  className="flex-1 py-2 px-4 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 disabled:opacity-60 disabled:cursor-not-allowed transition"
                >
                  {accountSubmitting ? "Guardando..." : "Activar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}