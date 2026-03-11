import { useQuery } from "@tanstack/react-query";
import { getProfessionalServices } from "../services/professionals.api";

export function useProfessionalServices(professionalId?: string) {
  return useQuery({
    queryKey: ["professional-services", professionalId],
    queryFn: () =>
      getProfessionalServices({
        professionalId: professionalId!,
      }),
    enabled: !!professionalId,
  });
}