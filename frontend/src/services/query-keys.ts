import type { InspectionFilters } from "@/types/api";

export const queryKeys = {
  users: ["users"] as const,
  batches: (demoUserId: string) => ["batches", demoUserId] as const,
  dashboard: (demoUserId: string) => ["dashboard", demoUserId] as const,
  inspections: (demoUserId: string, filters: InspectionFilters) =>
    ["inspections", demoUserId, filters] as const,
  image: (demoUserId: string, imageRef: string) =>
    ["image", demoUserId, imageRef] as const,
};
