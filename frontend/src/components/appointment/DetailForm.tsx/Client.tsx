import { Check, ChevronDown, Search, X } from "lucide-react";
import type { ClientOption } from "../AppointmentDetailModal";
import type { Client } from "../../../types/entities";

type Props = {
    handleSelectClient: (client: ClientOption) => void
    clientBoxRef: React.RefObject<HTMLDivElement | null>
    clientSearch: string
    isFormDisabled:boolean,
    setClientSearch: React.Dispatch<React.SetStateAction<string>>
    setClientId: React.Dispatch<React.SetStateAction<string>>,
    setClientComboboxOpen: React.Dispatch<React.SetStateAction<boolean>>,
    handleClearClient:() => void
    clientComboboxOpen: boolean;
    clientsLoading: boolean;
    clients: Client[]
    clientId: string 
    selectedClient: Client | undefined
}


export default function Client({
    handleSelectClient,
    clientBoxRef,
    clientSearch,
    isFormDisabled,
    setClientSearch, 
    setClientId,
    setClientComboboxOpen,
    handleClearClient, 
    clientComboboxOpen,
    clientsLoading,
    clients,
    clientId, 
    selectedClient
} : Props) {
   return (
      <>
         <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
               Cliente
            </label>

            <div ref={clientBoxRef} className="relative">
               <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <input
                     value={clientSearch}
                     onChange={(e) => {
                        if (isFormDisabled) return;
                        setClientSearch(e.target.value);
                        setClientId("");
                        setClientComboboxOpen(true);
                     }}
                     onFocus={() => {
                        if (!isFormDisabled) setClientComboboxOpen(true);
                     }}
                     placeholder="Buscar cliente por nombre, teléfono o email"
                     disabled={isFormDisabled}
                     className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-20 text-sm outline-none focus:ring-2 focus:ring-teal-500 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
                  />

                  <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
                     {clientSearch && !isFormDisabled && (
                        <button
                           type="button"
                           onClick={handleClearClient}
                           className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                           aria-label="Limpiar cliente"
                        >
                           <X className="h-4 w-4" />
                        </button>
                     )}

                     <button
                        type="button"
                        onClick={() => {
                           if (!isFormDisabled) {
                              setClientComboboxOpen((prev) => !prev);
                           }
                        }}
                        disabled={isFormDisabled}
                        className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label="Abrir selector de clientes"
                     >
                        <ChevronDown className="h-4 w-4" />
                     </button>
                  </div>
               </div>

               {clientComboboxOpen && !isFormDisabled && (
                  <div className="absolute z-30 mt-2 max-h-72 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                     <div className="max-h-72 overflow-y-auto py-1">
                        {clientsLoading ? (
                           <div className="px-3 py-3 text-sm text-slate-500">
                              Cargando clientes...
                           </div>
                        ) : clients.length === 0 ? (
                           <div className="px-3 py-3 text-sm text-slate-500">
                              No se encontraron clientes.
                           </div>
                        ) : (
                           clients.map((client) => {
                              const isSelected = client.id === clientId;

                              return (
                                 <button
                                    key={client.id}
                                    type="button"
                                    onClick={() => handleSelectClient(client)}
                                    className="flex w-full items-start justify-between gap-3 px-3 py-2 text-left transition-colors hover:bg-slate-50"
                                 >
                                    <div className="min-w-0">
                                       <div className="truncate text-sm font-medium text-slate-800">
                                          {client.fullName}
                                       </div>

                                       {(client.phone || client.email) && (
                                          <div className="mt-0.5 text-xs text-slate-500">
                                             {[client.phone, client.email]
                                                .filter(Boolean)
                                                .join(" · ")}
                                          </div>
                                       )}
                                    </div>

                                    {isSelected && (
                                       <Check className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />
                                    )}
                                 </button>
                              );
                           })
                        )}
                     </div>
                  </div>
               )}
            </div>

            {selectedClient && (
               <p className="mt-1 text-xs text-slate-500">
                  Cliente seleccionado:{" "}
                  <span className="font-medium text-slate-700">
                     {selectedClient.fullName}
                  </span>
               </p>
            )}
         </div>
      </>
   );
}
