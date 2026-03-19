
import { Check, CheckCircle2, Trash2, UserX2 } from "lucide-react";
import { appointmentStatusLabels, type AgendaAppointment, type AppointmentStatus, type AppointmentUiStatus } from "../../../types/entities";
import type { UseMutationResult } from "@tanstack/react-query";
import Button from "../../ui/Button";

type statusMutation =  UseMutationResult<unknown, Error, {
    id: string;
    status: AppointmentStatus;
    depositAmount?: number;
}, unknown>

type Props = {   
    handleChangeStatus: (status: AppointmentStatus) => void
   isCanceled: boolean,
   statusMutation: statusMutation
   isCompleted: boolean
   currentStatus: AppointmentStatus | undefined
   effectiveStatus: AppointmentUiStatus | undefined
   appointment: AgendaAppointment | null;
   showDepositInput: boolean;
   hasValidDepositAmount: boolean;
   isBusy: boolean
}

export default function Status({
    appointment,
    handleChangeStatus,
    isCanceled,
    statusMutation,
    isCompleted,
    currentStatus,
    effectiveStatus, 
    isBusy,
    showDepositInput,
    hasValidDepositAmount
} : Props) {
  return (
    <>
      <div className="flex flex-col gap-2">
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

            {effectiveStatus !== "RESERVED" && effectiveStatus !== "PENDING_RESOLUTION" && !isCompleted && !isCanceled && (
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
               effectiveStatus !== "PENDING_RESOLUTION" &&
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
    </>
  )
}
