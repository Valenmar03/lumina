import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getProfessionalSchedules,
  updateProfessionalSchedules,
} from "../services/professionals.api";
import type { UpdateProfessionalSchedulesPayload } from "../types/entities";

const EMPTY_SCHEDULES = {
  0: [],
  1: [],
  2: [],
  3: [],
  4: [],
  5: [],
  6: [],
};

export function useProfessionalSchedule(professionalId?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["professional-schedule", professionalId],
    queryFn: () =>
      getProfessionalSchedules({
        professionalId: professionalId!,
      }),
    enabled: !!professionalId,
  });

  const updateMutation = useMutation({
    mutationFn: (payload: UpdateProfessionalSchedulesPayload) =>
      updateProfessionalSchedules(professionalId!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["professional-schedule", professionalId],
      });
    },
  });

  return {
    ...query,
    schedules: query.data?.schedules ?? EMPTY_SCHEDULES,
    updateSchedule: updateMutation.mutate,
    updateScheduleAsync: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error,
  };
}