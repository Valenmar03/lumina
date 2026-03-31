import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getBusinessUnavailabilities,
  createBusinessUnavailability,
  deleteBusinessUnavailability,
} from "../services/business.api";

export function useBusinessUnavailabilities() {
  return useQuery({
    queryKey: ["business-unavailabilities"],
    queryFn: getBusinessUnavailabilities,
  });
}

export function useCreateBusinessUnavailability() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { date: string; reason?: string | null }) =>
      createBusinessUnavailability(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business-unavailabilities"] });
    },
  });
}

export function useDeleteBusinessUnavailability() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteBusinessUnavailability(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business-unavailabilities"] });
    },
  });
}
