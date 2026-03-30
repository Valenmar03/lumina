import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Eye, Plus, Search, Phone, Link2, Check, UserCircle } from "lucide-react";
import { useMemo, useState } from "react";

import Button from "../components/ui/Button";
import { useClients } from "../hooks/useClients";
import { useBusiness } from "../hooks/useBusiness";
import type { Client } from "../types/entities";
import ClientDetailModal from "../components/clients/ClientDetailModal";
import NewClientFormModal from "../components/clients/NewClientFormModal";
import ClientDetailSheet from "../components/clients/ClientDetailSheet";

export default function ClientsPage() {
  const currentDate = new Date();

  const [search, setSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showClientModal, setShowClientModal] = useState(false);
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [clientSheetOpen, setClientSheetOpen] = useState(false);

  const { data: clientsData, isLoading: clientsLoading } = useClients(search);
  const { data: businessData } = useBusiness();
  const [copiedBooking, setCopiedBooking] = useState(false);

  function handleCopyBookingLink() {
    if (!businessData?.business?.slug) return;
    const url = `https://app.caleio.app/reservar/${businessData.business.slug}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedBooking(true);
      setTimeout(() => setCopiedBooking(false), 2000);
    });
  }
  const clients = clientsData?.clients ?? [];

  const normalize = (str: string) =>
    str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

  const filteredClients = useMemo(() => {
    if (!search.trim()) return clients;

    return clients.filter((client) => {
      const fullName = normalize(client.fullName ?? "");
      const phone = normalize(client.phone ?? "");
      const email = normalize(client.email ?? "");
      const query = normalize(search);

      return (
        fullName.includes(query) ||
        phone.includes(query) ||
        email.includes(query)
      );
    });
  }, [clients, search]);

  const getInitials = (fullName: string) => {
    return fullName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("");
  };

  const handleNewClient = () => {
    setShowNewClientModal(true);
  };

  const handleEditClient = (client: Client) => {
    setSelectedClient(client);
    setShowClientModal(true);
  };

  const handleDetailSheetClient = (client: Client) => {
    setSelectedClient(client);
    setClientSheetOpen(true);
  };


const handleCloseClientModal = () => {
  setSelectedClient(null);
  setShowClientModal(false);
};

const handleCloseNewClientModal = () => {
  setShowNewClientModal(false);
};

  return (
    <>
      <div className="max-w-full mx-auto space-y-4 overflow-x-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Clientes
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {format(currentDate, "EEEE d 'de' MMMM, yyyy", {
                locale: es,
              })}
            </p>
          </div>

          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={handleCopyBookingLink}
              title="Copiar link de reservas"
              className="inline-flex items-center gap-2 rounded-lg border border-violet-200 bg-violet-50 px-4 py-2 text-sm font-medium text-violet-700 hover:bg-violet-100 transition-colors"
            >
              {copiedBooking ? <Check className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
              {copiedBooking ? "Copiado" : "Link de reservas"}
            </button>
            <button
              onClick={handleNewClient}
              className="inline-flex items-center justify-center rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuevo cliente
            </button>
          </div>
        </div>

        <div className="hidden md:flex flex-col xl:flex-row gap-3 items-start xl:items-center xl:justify-between">
          <div className="flex items-center gap-1.5">
            <div className="h-9 px-3 inline-flex items-center rounded-lg border border-slate-200 bg-white text-xs text-slate-500">
              {filteredClients.length} cliente
              {filteredClients.length !== 1 ? "s" : ""}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full xl:w-auto">
            <div className="relative flex items-center">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                placeholder="Buscar cliente..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-9 w-full sm:w-64 text-sm rounded-lg border border-slate-200 bg-white px-3 outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <Button
              variant="primary"
              onClick={handleNewClient}
              className="md:hidden inline-flex items-center justify-center rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuevo cliente
            </Button>
          </div>
        </div>

        <div className="flex md:hidden flex-col gap-2">
          <div className="relative flex items-center">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              placeholder="Buscar cliente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9 w-full text-sm rounded-lg border border-slate-200 bg-white px-3 outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <button
            onClick={handleNewClient}
            className="inline-flex items-center justify-center rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo cliente
          </button>
        </div>

        {clientsLoading ? (
          <>
            <div className="hidden md:block rounded-2xl border border-slate-200 bg-white overflow-hidden">
              <div className="divide-y divide-slate-100">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="grid grid-cols-12 gap-4 px-6 py-4 animate-pulse">
                    <div className="col-span-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-200" />
                      <div className="space-y-2">
                        <div className="h-4 w-36 rounded bg-slate-200" />
                        <div className="h-3 w-24 rounded bg-slate-100" />
                      </div>
                    </div>
                    <div className="col-span-2 h-4 w-28 rounded bg-slate-200 self-center" />
                    <div className="col-span-3 h-4 w-36 rounded bg-slate-200 self-center" />
                    <div className="col-span-1 h-4 w-8 rounded bg-slate-200 self-center" />
                    <div className="col-span-1 h-4 w-16 rounded bg-slate-200 self-center" />
                    <div className="col-span-1 h-4 w-14 rounded bg-slate-200 self-center" />
                  </div>
                ))}
              </div>
            </div>
            <div className="md:hidden space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3 animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-200 shrink-0" />
                    <div className="space-y-2 flex-1">
                      <div className="h-4 w-32 rounded bg-slate-200" />
                      <div className="h-3 w-20 rounded bg-slate-100" />
                    </div>
                  </div>
                  <div className="h-3 w-28 rounded bg-slate-100" />
                  <div className="h-8 rounded-lg bg-slate-100" />
                </div>
              ))}
            </div>
          </>
        ) : clients.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 flex flex-col items-center gap-3 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
              <UserCircle className="w-6 h-6 text-slate-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700">No hay clientes cargados</p>
              <p className="text-xs text-slate-400 mt-0.5">Los clientes aparecerán aquí cuando se agenden turnos</p>
            </div>
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-sm text-slate-500">
            No se encontraron clientes para esa búsqueda.
          </div>
        ) : (
          <>
            <div className="hidden md:block rounded-2xl border border-slate-200 bg-white overflow-hidden">
              <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-slate-50 border-b border-slate-200 text-xs font-medium text-slate-500">
                <div className="col-span-4">Cliente</div>
                <div className="col-span-2">Teléfono</div>
                <div className="col-span-2">Email</div>
                <div className="col-span-1 text-center">Visitas</div>
                <div className="col-span-1 text-center">Total gastado</div>
                <div className="col-span-1 text-center"></div>
                <div className="col-span-1 text-right"></div>
              </div>

              <div className="divide-y divide-slate-100">
                {filteredClients.map((client) => {
                  const visits = client.visitsCount ?? 0;
                  const totalSpent = client.totalSpent ?? 0;

                  return (
                    <div
                      key={client.id}
                      className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-slate-50/70 transition-colors"
                    >
                      <div className="col-span-4 flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-sm font-semibold text-slate-600 shrink-0">
                          {getInitials(client.fullName)}
                        </div>

                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-slate-900 truncate">
                            {client.fullName}
                          </div>
                          <div className="text-xs text-slate-400 truncate">
                            {client.notes || "Sin notas"}
                          </div>
                        </div>
                      </div>

                      <div className="col-span-2 min-w-0">
                        <div className="inline-flex items-center gap-2 text-sm text-slate-600 truncate">
                          <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                          <span className="truncate">{client.phone}</span>
                        </div>
                      </div>

                      <div className="col-span-2 min-w-0">
                        <div className="text-sm text-slate-600 truncate">
                          {client.email || "—"}
                        </div>
                      </div>

                      <div className="col-span-1 text-center text-sm font-medium text-slate-700">
                        {visits}
                      </div>

                      <div className="col-span-1 text-center text-sm font-semibold text-slate-800">
                        {new Intl.NumberFormat("es-AR", {
                          style: "currency",
                          currency: "ARS",
                          maximumFractionDigits: 0,
                        }).format(totalSpent)}
                      </div>

                      <div className="col-span-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleDetailSheetClient(client)}
                          className="inline-flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
                        >
                          
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="col-span-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleEditClient(client)}
                          className="inline-flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
                        >
                          <span>Editar</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="md:hidden space-y-3">
              {filteredClients.map((client) => {
                const visits = client.visitsCount ?? 0;
                const totalSpent = client.totalSpent ?? 0;

                return (
                  <div
                    key={client.id}
                    className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-sm font-semibold text-slate-600 shrink-0">
                        {getInitials(client.fullName)}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-slate-900 truncate">
                          {client.fullName}
                        </div>
                        <div className="text-xs text-slate-400 truncate">
                          {client.notes || "Sin notas"}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1 text-sm text-slate-600 min-w-0 overflow-hidden">
                      <div className="flex items-center gap-2 min-w-0">
                        <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="truncate">{client.phone}</span>
                      </div>
                      <div className="truncate">{client.email || "Sin email"}</div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Visitas: {visits}</span>
                      <span className="font-semibold text-slate-800">
                        {new Intl.NumberFormat("es-AR", {
                          style: "currency",
                          currency: "ARS",
                          maximumFractionDigits: 0,
                        }).format(totalSpent)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDetailSheetClient(client)}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleEditClient(client)}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Editar
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      <ClientDetailModal
        open={showClientModal}
        onClose={handleCloseClientModal}
        client={selectedClient}
      />

      <NewClientFormModal
        open={showNewClientModal}
        onClose={handleCloseNewClientModal}
      />

      <ClientDetailSheet
        open={clientSheetOpen}
        onClose={() => setClientSheetOpen(false)}
        client={selectedClient}
      />
    </>
  );
}