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

export function useBatches(loggedInUserId: string) {
  return useQuery({
    queryKey: queryKeys.batches(loggedInUserId),
    queryFn: ({ signal }) => api.listBatches(loggedInUserId, signal),
    enabled: Boolean(loggedInUserId),
  });
}

export function useDashboard(loggedInUserId: string) {
  return useQuery({
    queryKey: queryKeys.dashboard(loggedInUserId),
    queryFn: ({ signal }) => api.getDashboard(loggedInUserId, signal),
    enabled: Boolean(loggedInUserId),
  });
}

export function useInspections(
  loggedInUserId: string,
  filters: InspectionFilters,
  keepPreviousUserResults = false,
) {
  return useQuery({
    queryKey: queryKeys.inspections(loggedInUserId, filters),
    queryFn: ({ signal }) =>
      api.listInspections(loggedInUserId, filters, signal),
    enabled: Boolean(loggedInUserId),
    placeholderData: keepPreviousUserResults
      ? (previousData, previousQuery) =>
          previousQuery?.queryKey[1] === loggedInUserId
            ? previousData
            : undefined
      : undefined,
  });
}
