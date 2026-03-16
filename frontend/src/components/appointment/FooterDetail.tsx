import type { UseMutationResult } from "@tanstack/react-query";
import { appointmentStatusLabels, type AgendaAppointment, type AppointmentStatus, type AppointmentUiStatus } from "../../types/entities";
import Button from "../ui/Button";
import { Check, CheckCircle2, Trash2, UserX2 } from "lucide-react";

type statusMutation =  UseMutationResult<unknown, Error, {
    id: string;
    status: AppointmentStatus;
    depositAmount?: number;
}, unknown>

type updateMutationType = 
    UseMutationResult<unknown, Error, {
    id: string;
    professionalId: string;
    clientId: string;
    serviceId: string;
    startAt: string;
}, unknown>


type Props = {
   canSubmit: boolean;
   appointment: AgendaAppointment | null;
   showDepositInput: boolean;
   hasValidDepositAmount: boolean;
   handleChangeStatus: (status: AppointmentStatus) => void
   isCanceled: boolean,
   statusMutation: statusMutation
   isBusy: boolean
   isCompleted: boolean
   handleSubmit: () => void
   updateMutation: updateMutationType
   currentStatus: AppointmentStatus | undefined
   effectiveStatus: AppointmentUiStatus | undefined
   onClose: () => void
};

export default function FooterDetail({
   canSubmit,
   appointment,
   showDepositInput,
   hasValidDepositAmount,
   handleChangeStatus,
   isCanceled,
   statusMutation,
   isBusy,
   isCompleted,
   handleSubmit,
   currentStatus,
   effectiveStatus, 
   updateMutation,
   onClose
}: Props) {
   
   return (
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
         <div className="flex flex-wrap gap-2">
            {!isCanceled && (
               <Button
                  variant="border border-red-200 bg-red-100 text-red-600 hover:bg-red-200"
                  onClick={() => handleChangeStatus("CANCELED")}
                  disabled={!appointment?.id || isBusy}
               >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {statusMutation.isPending ? "Procesando..." : "Cancelar"}
               </Button>
            )}

            {currentStatus !== "NO_SHOW" && !isCompleted && !isCanceled && (
               <Button
                  variant="border border-amber-200 bg-amber-100 text-amber-700 hover:bg-amber-200"
                  onClick={() => handleChangeStatus("NO_SHOW")}
                  disabled={!appointment?.id || isBusy}
               >
                  <UserX2 className="mr-2 h-4 w-4" />
                  {appointmentStatusLabels.NO_SHOW}
               </Button>
            )}

            {!isCompleted && !isCanceled && (
               <Button
                  variant="border border-emerald-200 bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                  onClick={() => handleChangeStatus("COMPLETED")}
                  disabled={!appointment?.id || isBusy}
               >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  {appointmentStatusLabels.COMPLETED}
               </Button>
            )}

            {effectiveStatus !== "RESERVED" && !isCompleted && !isCanceled && (
               <Button
                  variant="border border-cyan-200 bg-cyan-100 text-cyan-700 hover:bg-cyan-200"
                  onClick={() => handleChangeStatus("RESERVED")}
                  disabled={!appointment?.id || isBusy}
               >
                  <Check className="mr-2 h-4 w-4" />
                  {appointmentStatusLabels.RESERVED}
               </Button>
            )}

            {effectiveStatus !== "DEPOSIT_PAID" &&
               !isCompleted &&
               !isCanceled && (
                  <Button
                     variant="border border-teal-200 bg-teal-100 text-teal-700 hover:bg-teal-200"
                     onClick={() => handleChangeStatus("DEPOSIT_PAID")}
                     disabled={!appointment?.id || isBusy}
                  >
                     <Check className="mr-2 h-4 w-4" />
                     {showDepositInput
                        ? hasValidDepositAmount
                           ? "Confirmar seña"
                           : "Ingresá la seña"
                        : appointmentStatusLabels.DEPOSIT_PAID}
                  </Button>
               )}
         </div>

         <div className="flex gap-2">
            <Button variant="secondary" onClick={onClose} disabled={isBusy}>
               Cerrar
            </Button>
            <Button
               onClick={handleSubmit}
               disabled={!canSubmit}
               title={
                  showDepositInput && !hasValidDepositAmount
                     ? "Ingresá una seña válida para continuar"
                     : undefined
               }
            >
               {updateMutation.isPending
                  ? "Guardando..."
                  : showDepositInput && !hasValidDepositAmount
                    ? "Completá la seña"
                    : "Guardar cambios"}
            </Button>
         </div>
      </div>
   );
}
