import { useMemo, useState } from "react";
import { addDays, format, parseISO, startOfWeek } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus, Search } from "lucide-react";

import { useProfessionals } from "../hooks/useProfessionals";
import { useAgendaDaily, useAgendaWeekly } from "../hooks/useAgenda";
import type { AgendaAppointment, Professional } from "../types/agenda";
import NewAppointmentModal from "../components/agenda/NewAppointmentModal";
import DayView from "../components/agenda/DayView";
import WeekView from "../components/agenda/WeekView";
import MobileAgenda from "../components/agenda/MobileAgenda.tsx";

const HOURS = Array.from({ length: 14 }, (_, i) => i + 8);

export type AgendaView = "day" | "week";

function getAppointmentTopAndHeight(appt: AgendaAppointment) {
   const start = parseISO(appt.startAt);
   const end = parseISO(appt.endAt);

   const startMinutes = start.getHours() * 60 + start.getMinutes();
   const endMinutes = end.getHours() * 60 + end.getMinutes();

   const duration = endMinutes - startMinutes;
   const hourStart = start.getHours() * 60;
   const offsetInsideHour = startMinutes - hourStart;

   const top = (offsetInsideHour / 60) * 64;
   const height = Math.max((duration / 60) * 64, 28);

   return { top, height };
}

export default function AgendaPage() {
   const [currentDate, setCurrentDate] = useState(new Date());
   const [view, setView] = useState<AgendaView>("day");
   const [search, setSearch] = useState("");
   const [selectedProfessionalId, setSelectedProfessionalId] =
      useState<string>("all");
   const [showNewAppointmentModal, setShowNewAppointmentModal] =
      useState(false);
   const [prefillSlot, setPrefillSlot] = useState<{
      date: string;
      time: string;
   } | null>(null);

   const { data: professionalsData, isLoading: professionalsLoading } =
      useProfessionals();
   const professionals = (professionalsData?.professionals ?? []).filter(
      (p) => p.active,
   );

   const currentDateYMD = format(currentDate, "yyyy-MM-dd");
   const effectiveProfessionalId =
      selectedProfessionalId === "all" ? undefined : selectedProfessionalId;

   const { data: dailyAgenda, isLoading: dailyLoading } = useAgendaDaily(
      effectiveProfessionalId,
      currentDateYMD,
   );

   const { data: weeklyAgenda, isLoading: weeklyLoading } = useAgendaWeekly(
      effectiveProfessionalId,
      currentDateYMD,
   );

   const isLoading =
      professionalsLoading || (view === "day" ? dailyLoading : weeklyLoading);

   const selectedProfessional = useMemo(() => {
      if (selectedProfessionalId === "all") return null;
      return professionals.find((p) => p.id === selectedProfessionalId) ?? null;
   }, [professionals, selectedProfessionalId]);

   const appointments = useMemo(() => {
      const source =
         view === "day"
            ? (dailyAgenda?.appointments ?? [])
            : (weeklyAgenda?.appointments ?? []);

      if (!search.trim()) return source;

      const q = search.toLowerCase();

      return source.filter((appt) => {
         const professionalName = appt.professional?.name?.toLowerCase() ?? "";

         return (
            appt.client.fullName.toLowerCase().includes(q) ||
            appt.service.name.toLowerCase().includes(q) ||
            professionalName.includes(q)
         );
      });
   }, [view, dailyAgenda, weeklyAgenda, search]);

   const weekDays = useMemo(() => {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 });
      return Array.from({ length: 7 }, (_, i) => addDays(start, i));
   }, [currentDate]);

   const navigate = (direction: -1 | 1) => {
      const step = view === "week" ? 7 : 1;
      setCurrentDate((prev) => addDays(prev, direction * step));
   };

   const handleNewAppointment = () => {
      setPrefillSlot({
         date: format(currentDate, "yyyy-MM-dd"),
         time: "09:00",
      });
      setShowNewAppointmentModal(true);
   };

   const handleSlotClick = (
      date: Date,
      time: string,
      professionalId?: string,
   ) => {
      if (selectedProfessionalId === "all" && !professionalId) return;

      setPrefillSlot({
         date: format(date, "yyyy-MM-dd"),
         time,
      });

      if (selectedProfessionalId !== "all" && professionalId) {
         setSelectedProfessionalId(professionalId);
      }

      setShowNewAppointmentModal(true);
   };

   const handleAppointmentClick = (appointment: AgendaAppointment) => {
      console.log("Editar/ver turno", appointment);
   };

   const dayAppointments = appointments.filter((appt) => {
      return format(parseISO(appt.startAt), "yyyy-MM-dd") === currentDateYMD;
   });

   const dailyScheduleBlocksByProfessional =
      dailyAgenda?.scheduleBlocksByProfessional ?? {};

   return (
      <>
         <div className="max-w-full mx-auto space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
               <div>
                  <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                     Agenda
                  </h1>
                  <p className="text-sm text-slate-500 mt-0.5">
                     {format(currentDate, "EEEE d 'de' MMMM, yyyy", {
                        locale: es,
                     })}
                  </p>
               </div>

               <button
                  onClick={handleNewAppointment}
                  className="hidden md:inline-flex items-center justify-center rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 transition-colors"
               >
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo turno
               </button>
            </div>

            <div className="hidden md:flex flex-col xl:flex-row gap-3 items-start xl:items-center xl:justify-between">
               <div className="flex items-center gap-1.5">
                  <button
                     onClick={() => navigate(-1)}
                     className="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50"
                  >
                     <ChevronLeft className="w-4 h-4" />
                  </button>

                  <button
                     onClick={() => setCurrentDate(new Date())}
                     className="h-9 px-3 text-xs rounded-lg border border-slate-200 bg-white hover:bg-slate-50"
                  >
                     Hoy
                  </button>

                  <button
                     onClick={() => navigate(1)}
                     className="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50"
                  >
                     <ChevronRight className="w-4 h-4" />
                  </button>

                  <div className="flex gap-1 bg-slate-100 rounded-lg p-0.5">
                     {(["day", "week"] as AgendaView[]).map((v) => (
                        <button
                           key={v}
                           onClick={() => setView(v)}
                           className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                              view === v
                                 ? "bg-white shadow-sm text-slate-800"
                                 : "text-slate-500 hover:text-slate-700"
                           }`}
                        >
                           {v === "day" ? "Día" : "Semana"}
                        </button>
                     ))}
                  </div>
               </div>

               <div className="flex flex-col sm:flex-row gap-2 w-full xl:w-auto">
                  <div className="relative">
                     <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                     <input
                        placeholder="Buscar cliente, servicio o profesional..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-8 h-9 w-full sm:w-64 text-sm rounded-lg border border-slate-200 bg-white px-3 outline-none focus:ring-2 focus:ring-teal-500"
                     />
                  </div>

                  <select
                     value={selectedProfessionalId}
                     onChange={(e) => setSelectedProfessionalId(e.target.value)}
                     className="h-9 min-w-56 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-teal-500"
                  >
                     <option value="all">Todos los profesionales</option>
                     {professionals.map((p: Professional) => (
                        <option key={p.id} value={p.id}>
                           {p.name}
                        </option>
                     ))}
                  </select>
               </div>
            </div>

            {isLoading ? (
               <div className="bg-white rounded-xl border border-slate-200 p-8 text-sm text-slate-500">
                  Cargando agenda...
               </div>
            ) : professionals.length === 0 ? (
               <div className="bg-white rounded-xl border border-slate-200 p-8 text-sm text-slate-500">
                  No hay profesionales cargados.
               </div>
            ) : (
               <>
                  <div className="block md:hidden">
                    <MobileAgenda
                      view={view}
                      setView={setView}
                      currentDate={currentDate}
                      setCurrentDate={setCurrentDate}
                      weekDays={weekDays}
                      appointments={appointments}
                      HOURS={HOURS}
                      selectedProfessionalId={selectedProfessionalId}
                      selectedProfessional={selectedProfessional}
                      professionals={professionals}
                      handleSlotClick={handleSlotClick}
                      handleAppointmentClick={handleAppointmentClick}
                    />
                  </div>

                  <div className="hidden md:block bg-white rounded-xl border border-slate-200/80 overflow-hidden">
                    {view === "day" ? (
                      <DayView
                        selectedProfessionalId={selectedProfessionalId}
                        selectedProfessional={selectedProfessional}
                        professionals={professionals}
                        dailyScheduleBlocksByProfessional={dailyScheduleBlocksByProfessional}
                        dayAppointments={dayAppointments}
                        HOURS={HOURS}
                        currentDate={currentDate}
                        handleSlotClick={handleSlotClick}
                        handleAppointmentClick={handleAppointmentClick}
                        getAppointmentTopAndHeight={getAppointmentTopAndHeight}
                      />
                    ) : (
                      <WeekView
                        weekDays={weekDays}
                        HOURS={HOURS}
                        appointments={appointments}
                        selectedProfessionalId={selectedProfessionalId}
                        selectedProfessional={selectedProfessional}
                        handleSlotClick={handleSlotClick}
                        handleAppointmentClick={handleAppointmentClick}
                        getAppointmentTopAndHeight={getAppointmentTopAndHeight}
                        setCurrentDate={setCurrentDate}
                        setView={setView}
                      />
                    )}
                  </div>
                </>
            )}
         </div>

         <NewAppointmentModal
            open={showNewAppointmentModal}
            onClose={() => {
               setShowNewAppointmentModal(false);
               setPrefillSlot(null);
            }}
            professionalId={
               selectedProfessionalId === "all"
                  ? undefined
                  : selectedProfessionalId
            }
            date={prefillSlot?.date}
            time={prefillSlot?.time}
         />
      </>
   );
}
