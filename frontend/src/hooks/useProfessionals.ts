import { useQuery } from "@tanstack/react-query";
import { getProfessionals, createProfessional, updateProfessional, getProfessionalUnavailabilities, createProfessionalUnavailability, deleteProfessionalUnavailability } from "../services/professionals.api";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useProfessionals() {
  return useQuery({
    queryKey: ["professionals"],
    queryFn: getProfessionals
  });
}

export function useCreateProfessional() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createProfessional,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professionals"] });
    },
  });
}


export function useUpdateProfessional() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: {
      professionalId: string;
      name?: string;
      color?: string;
      active?: boolean;
    }) => updateProfessional(params),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["professionals"],
      });

      queryClient.invalidateQueries({
        queryKey: ["professional-services", variables.professionalId],
      });

      queryClient.invalidateQueries({
        queryKey: ["professional-schedule", variables.professionalId],
      });
    },
  });
}

export function useProfessionalUnavailabilities(professionalId: string) {
  return useQuery({
    queryKey: ["professional-unavailabilities", professionalId],
    queryFn: () => getProfessionalUnavailabilities({ professionalId }),
    enabled: !!professionalId,
  });
}

export function useCreateUnavailability(professionalId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { startAt: string; endAt: string; reason?: string; cancelConflicting?: boolean }) =>
      createProfessionalUnavailability({ professionalId, ...params }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professional-unavailabilities", professionalId] });
    },
  });
}

export function useDeleteUnavailability(professionalId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteProfessionalUnavailability({ professionalId, id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professional-unavailabilities", professionalId] });
    },
  });
}