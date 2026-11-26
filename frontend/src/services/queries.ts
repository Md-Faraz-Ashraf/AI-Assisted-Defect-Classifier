import { useMutation, useQuery } from "@tanstack/react-query";
import type { UseMutationOptions } from "@tanstack/react-query";
import { api } from "@/services/api";
import { queryKeys } from "@/services/query-keys";
import type {
  AIAnalysis,
  FinalizeInspectionRequest,
  Inspection,
  InspectionFilters,
} from "@/types/api";

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

export function useInspectionImage(loggedInUserId: string, imageRef: string) {
  return useQuery({
    queryKey: queryKeys.image(loggedInUserId, imageRef),
    queryFn: ({ signal }) => api.getImage(loggedInUserId, imageRef, signal),
    enabled: Boolean(loggedInUserId && imageRef),
    staleTime: Infinity,
  });
}

interface AnalyzeImageVariables {
  batchId: string;
  image: File;
}

export function useAiAnalysis(
  loggedInUserId: string,
  options?: Omit<
    UseMutationOptions<AIAnalysis, Error, AnalyzeImageVariables>,
    "mutationFn"
  >,
) {
  return useMutation({
    mutationFn: ({ batchId, image }: AnalyzeImageVariables) =>
      api.predict(loggedInUserId, batchId, image),
    ...options,
  });
}

export function useFinalizeInspection(
  loggedInUserId: string,
  options?: Omit<
    UseMutationOptions<Inspection, Error, FinalizeInspectionRequest>,
    "mutationFn"
  >,
) {
  return useMutation({
    mutationFn: (request: FinalizeInspectionRequest) =>
      api.finalizeInspection(loggedInUserId, request),
    ...options,
  });
}
