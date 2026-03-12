import { useQuery } from "@tanstack/react-query";
import { getServices, getServicesWithProfessional } from "../services/services.api";

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