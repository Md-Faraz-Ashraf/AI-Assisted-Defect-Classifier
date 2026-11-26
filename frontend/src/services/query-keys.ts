// Centralizes TanStack Query cache keys used by query hooks and cache invalidation after mutations.
import type { InspectionFilters } from "@/types/api";

export const queryKeys = {
  users: ["users"] as const,
  batches: (loggedInUserId: string) => ["batches", loggedInUserId] as const,
  dashboard: (loggedInUserId: string) => ["dashboard", loggedInUserId] as const,
  inspections: (loggedInUserId: string, filters: InspectionFilters) =>
    ["inspections", loggedInUserId, filters] as const,
  image: (loggedInUserId: string, imageRef: string) =>
    ["image", loggedInUserId, imageRef] as const,
};
