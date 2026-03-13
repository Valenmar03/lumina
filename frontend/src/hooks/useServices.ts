import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createService, getServices, getServicesWithProfessional } from "../services/services.api";

export function useServices() {
  return useQuery({
    queryKey: ["services"],
    queryFn: getServices,
  });
}

export function useServicesWithProfessionals() {
  return useQuery({
    queryKey: ["services-professionals"],
    queryFn: getServicesWithProfessional,
  });
}

export function useCreateService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      queryClient.invalidateQueries({ queryKey: ["services-professionals"] });
    },
  });
}