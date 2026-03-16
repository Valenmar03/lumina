import Sheet from "../ui/Sheet";
import { Phone, Mail, Calendar, DollarSign, Hash, Clock3, Trash2, UserX2, CheckCircle2, AlertCircle, X, Check } from "lucide-react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

import type { AppointmentStatus, Client } from "../../types/entities";
import { useClientAppointments } from "../../hooks/useClients";
import type { ReactNode } from "react";

type Props = {
   open: boolean;
   onClose: () => void;
   client: Client | null;
};

function getInitials(fullName: string) {
   return fullName
      .split(" ")
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("");
}

type AppointmentUiStatus = AppointmentStatus | "PENDING_RESOLUTION";

type StatusFormat = {
  label: string;
  className: string;
  icon: ReactNode;
};

export function formatStatus(status?: AppointmentUiStatus): StatusFormat {
  switch (status) {
    case "PENDING_RESOLUTION":
      return {
        label: "Pendiente",
        className: "border-violet-200 bg-violet-50 text-violet-700",
        icon: <AlertCircle className="h-3.5 w-3.5" />,
      };

    case "RESERVED":
      return {
        label: "Reservado",
        className: "border-cyan-200 bg-cyan-50 text-cyan-700",
        icon: <Clock3 className="h-3.5 w-3.5" />,
      };

    case "DEPOSIT_PAID":
      return {
        label: "Señado",
        className: "border-teal-200 bg-teal-50 text-teal-700",
        icon: <Check className="h-3.5 w-3.5" />,
      };

    case "COMPLETED":
      return {
        label: "Realizado",
        className: "border-emerald-200 bg-emerald-50 text-emerald-700",
        icon: <CheckCircle2 className="h-3.5 w-3.5" />,
      };

    case "CANCELED":
      return {
        label: "Cancelado",
        className: "border-red-200 bg-red-50 text-red-700",
        icon: <Trash2 className="h-3.5 w-3.5" />,
      };

    case "NO_SHOW":
      return {
        label: "No asistió",
        className: "border-amber-200 bg-amber-50 text-amber-700",
        icon: <UserX2 className="h-3.5 w-3.5" />,
      };

    default:
      return {
        label: "Sin estado",
        className: "border-slate-200 bg-slate-50 text-slate-700",
        icon: <AlertCircle className="h-3.5 w-3.5" />,
      };
  }
}

export default function ClientDetailSheet({ open, onClose, client }: Props) {
   const { data, isLoading } = useClientAppointments(client?.id);
   const appointments = data?.appointments ?? [];

   if (!client) return null;

   const visits = client.visitsCount ?? 0;
   const totalSpent = client.totalSpent ?? 0;

   return (
      <Sheet open={open} onClose={onClose} width="lg">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:px-6">
            <div>
                <h2 className="text-sm font-semibold text-slate-900">
                    Ficha de cliente
                </h2>
                <p className="text-xs text-slate-500">
                    Detalle e historial
                </p>
            </div>

            <button
                type="button"
                onClick={onClose}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"
                aria-label="Cerrar"
            >
                <X className="h-4 w-4" />
            </button>
        </div>

        <div className="p-4 sm:p-6 space-y-6">
            <div className="flex items-center gap-4">
               <div className="w-14 h-14 rounded-xl bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-xl">
                  {getInitials(client.fullName)}
               </div>

               <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                     {client.fullName}
                  </h2>

                  <div className="flex items-center gap-2 text-sm text-slate-500">
                     <Phone className="w-4 h-4" />
                     {client.phone}
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
               <div className="bg-slate-50 rounded-xl p-4 text-center">
                  <Hash className="w-4 h-4 text-slate-400 mx-auto" />
                  <p className="text-lg font-bold text-slate-800 mt-1">
                     {visits}
                  </p>
                  <p className="text-xs text-slate-500">Visitas</p>
               </div>

               <div className="bg-slate-50 rounded-xl p-4 text-center">
                  <DollarSign className="w-4 h-4 text-slate-400 mx-auto" />
                  <p className="text-lg font-bold text-slate-800 mt-1">
                     ${totalSpent.toLocaleString()}
                  </p>
                  <p className="text-xs text-slate-500">Total gastado</p>
               </div>

               <div className="bg-slate-50 rounded-xl p-4 text-center">
                  <Calendar className="w-4 h-4 text-slate-400 mx-auto" />
                  <p className="text-lg font-bold text-slate-800 mt-1">
                     {appointments.length}
                  </p>
                  <p className="text-xs text-slate-500">Turnos</p>
               </div>
            </div>

            <div className="space-y-2">
               {client.email && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                     <Mail className="w-4 h-4 text-slate-400" />
                     {client.email}
                  </div>
               )}
            </div>

            {client.notes && (
               <div className="bg-amber-50 rounded-lg p-4 text-sm text-amber-800">
                  <p className="font-medium text-xs text-amber-600 mb-1">
                     Observaciones
                  </p>
                  {client.notes}
               </div>
            )}

            <div>
               <h3 className="text-sm font-semibold text-slate-900 mb-3">
                  Historial de turnos
               </h3>

               {isLoading ? (
                  <div className="space-y-2">
                     {[...Array(4)].map((_, i) => (
                        <div
                           key={i}
                           className="rounded-xl border border-slate-200 bg-white p-3 animate-pulse"
                        >
                           <div className="flex items-center gap-3">
                              <div className="w-1.5 h-10 rounded-full bg-slate-200" />
                              <div className="flex-1 space-y-2">
                                 <div className="h-4 w-32 rounded bg-slate-200" />
                                 <div className="h-3 w-44 rounded bg-slate-100" />
                              </div>
                              <div className="space-y-2">
                                 <div className="h-4 w-16 rounded bg-slate-200" />
                                 <div className="h-5 w-20 rounded-full bg-slate-100" />
                              </div>
                           </div>
                        </div>
                     ))}
                  </div>
               ) : appointments.length === 0 ? (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                     Este cliente todavía no tiene turnos registrados.
                  </div>
               ) : (
                  <div className="space-y-2">
                     {appointments.map((appt: any) => {
                        const status = formatStatus(appt.status);

                        return (
                           <div
                              key={appt.id}
                              className="rounded-xl border border-slate-200 bg-white p-3"
                           >
                              <div className="flex items-start gap-3">
                                 <div
                                    className="w-1.5 h-12 rounded-full shrink-0"
                                    style={{
                                       background:
                                          appt.professional?.color || "#0D9488",
                                    }}
                                 />

                                 <div className="min-w-0 flex-1">
                                    <div className="flex items-start justify-between gap-3">
                                       <div className="min-w-0">
                                          <p className="text-sm font-medium text-slate-800 truncate">
                                             {appt.service?.name || "Servicio"}
                                          </p>

                                          <p className="text-xs text-slate-500 truncate">
                                             {appt.professional?.name ||
                                                "Profesional"}
                                          </p>
                                       </div>

                                       <div className="text-right shrink-0">
                                          <p className="text-sm font-semibold text-slate-800">
                                             $
                                             {Number(
                                                appt.priceFinal ?? 0,
                                             ).toLocaleString()}
                                          </p>
                                       </div>
                                    </div>

                                    <div className="mt-2 flex flex-wrap items-center gap-2">
                                       <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                                          <Calendar className="w-3.5 h-3.5" />
                                          {format(
                                             parseISO(appt.startAt),
                                             "d MMM yyyy",
                                             {
                                                locale: es,
                                             },
                                          )}
                                       </span>

                                       <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                                          <Clock3 className="w-3.5 h-3.5" />
                                          {format(
                                             parseISO(appt.startAt),
                                             "HH:mm",
                                          )}
                                       </span>

                                       <span
                                          className={`inline-flex rounded-full px-3 py-1 gap-1 items-center text-[11px] font-medium ${status.className}`}
                                       >
                                            {status.icon}
                                            {status.label}
                                       </span>
                                    </div>
                                 </div>
                              </div>
                           </div>
                        );
                     })}
                  </div>
               )}
            </div>
         </div>
      </Sheet>
   );
}
