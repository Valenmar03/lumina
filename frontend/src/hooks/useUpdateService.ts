import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateService } from "../services/services.api";

export function useUpdateService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      queryClient.invalidateQueries({ queryKey: ["services-professionals"] });
    },
  });
}