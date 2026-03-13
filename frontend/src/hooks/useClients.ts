import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createClient,
  deleteClient,
  getClients,
  searchClients,
  updateClient,
  getClientAppointments 
} from "../services/clients.api";
import type { CreateClientPayload, UpdateClientPayload } from "../types/entities";

export function useClients(search?: string) {
  return useQuery({
    queryKey: ["clients", search ?? ""],
    queryFn: () => getClients(search),
  });
}

export function useClientSearch(q: string, limit = 8) {
  return useQuery({
    queryKey: ["clients-search", q, limit],
    queryFn: () => searchClients(q, limit),
    enabled: q.trim().length >= 2,
    staleTime: 30_000,
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateClientPayload) => createClient(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["clients-search"] });
    },
  });
}

export function useUpdateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateClientPayload) => updateClient(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["clients-search"] });
    },
  });
}

export function useDeleteClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (clientId: string) => deleteClient(clientId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["clients-search"] });
    },
  });
}

export function useClientAppointments(clientId?: string) {
  return useQuery({
    queryKey: ["client-appointments", clientId],
    queryFn: () => getClientAppointments(clientId!),
    enabled: !!clientId,
  });
}