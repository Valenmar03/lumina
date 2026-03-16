import type { UseMutationResult } from "@tanstack/react-query";
import Button from "../ui/Button";


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
   showDepositInput: boolean;
   hasValidDepositAmount: boolean;
   isBusy: boolean
   updateMutation: updateMutationType
   handleSubmit: () => void
   onClose: () => void
};

export default function FooterDetail({
    canSubmit,
    showDepositInput,
    hasValidDepositAmount,
    isBusy,
    updateMutation,
    handleSubmit,
    onClose
}: Props) {
   
   return (
      <div className="flex gap-3 justify-end">
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
