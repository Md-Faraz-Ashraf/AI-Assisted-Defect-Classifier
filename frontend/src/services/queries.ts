import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { queryKeys } from "@/services/query-keys";
import type { InspectionFilters } from "@/types/api";

export function useUsers() {
  return useQuery({
    queryKey: queryKeys.users,
    queryFn: ({ signal }) => api.listUsers(signal),
  });
}

export function useBatches(demoUserId: string) {
  return useQuery({
    queryKey: queryKeys.batches(demoUserId),
    queryFn: ({ signal }) => api.listBatches(demoUserId, signal),
    enabled: Boolean(demoUserId),
  });
}

export function useDashboard(demoUserId: string) {
  return useQuery({
    queryKey: queryKeys.dashboard(demoUserId),
    queryFn: ({ signal }) => api.getDashboard(demoUserId, signal),
    enabled: Boolean(demoUserId),
  });
}

export function useInspections(
  demoUserId: string,
  filters: InspectionFilters,
  keepPreviousUserResults = false,
) {
  return useQuery({
    queryKey: queryKeys.inspections(demoUserId, filters),
    queryFn: ({ signal }) => api.listInspections(demoUserId, filters, signal),
    enabled: Boolean(demoUserId),
    placeholderData: keepPreviousUserResults
      ? (previousData, previousQuery) =>
          previousQuery?.queryKey[1] === demoUserId ? previousData : undefined
      : undefined,
  });
}
