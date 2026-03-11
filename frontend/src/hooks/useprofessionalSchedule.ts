import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getProfessionalSchedules,
  updateProfessionalScheduleForDay,
  updateProfessionalServices,
} from "../services/professionals.api";

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

  const updateDayMutation = useMutation({
    mutationFn: (params: {
      dayOfWeek: number;
      blocks: { startTime: string; endTime: string }[];
    }) =>
      updateProfessionalScheduleForDay({
        professionalId: professionalId!,
        dayOfWeek: params.dayOfWeek,
        blocks: params.blocks,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["professional-schedule", professionalId],
      });
    },
  });

  return {
    ...query,
    schedules: query.data?.schedules ?? EMPTY_SCHEDULES,
    updateScheduleForDay: updateDayMutation.mutate,
    updateScheduleForDayAsync: updateDayMutation.mutateAsync,
    isUpdating: updateDayMutation.isPending,
    updateError: updateDayMutation.error,
  };
}

export function useUpdateProfessionalServices() {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: (params: { professionalId: string; serviceIds: string[] }) =>
        updateProfessionalServices(params),
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({
          queryKey: ["professional-services", variables.professionalId],
        });

        queryClient.invalidateQueries({
          queryKey: ["professionals"],
        });
      },
    });
  }