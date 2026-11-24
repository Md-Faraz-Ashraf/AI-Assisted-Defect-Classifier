import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, FilterX } from "lucide-react";
import { useDemoUser } from "@/app/demo-user-context";
import { EmptyState, PageLoading, QueryError } from "@/components/query-states";
import { PageHeader } from "@/components/page-header";
import { InspectionTable } from "@/features/inspections/components/inspection-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBatches, useInspections } from "@/services/queries";
import { DEFECT_TYPES, type DefectType } from "@/types/api";

const PAGE_SIZE = 10;

export function InspectionHistoryPage() {
  const { demoUserId } = useDemoUser();
  const [defectFilter, setDefectFilter] = useState<DefectType | "">("");
  const [batchFilter, setBatchFilter] = useState("");
  const [page, setPage] = useState(1);
  const batchesQuery = useBatches(demoUserId);
  const filters = useMemo(
    () => ({
      defect_type: defectFilter || undefined,
      batch_id: batchFilter || undefined,
      page,
      page_size: PAGE_SIZE,
      sort_by: "inspected_at" as const,
      sort_order: "desc" as const,
    }),
    [defectFilter, batchFilter, page],
  );
  const inspectionsQuery = useInspections(demoUserId, filters);

  if (batchesQuery.isPending || inspectionsQuery.isPending) {
    return <PageLoading label="Loading inspection history" />;
  }
  if (batchesQuery.isError || inspectionsQuery.isError) {
    const query = batchesQuery.isError ? batchesQuery : inspectionsQuery;
    return (
      <QueryError
        message={
          query.error?.message ?? "The inspection history request failed."
        }
        onRetry={() => void query.refetch()}
      />
    );
  }

  const result = inspectionsQuery.data;
  const hasFilter = Boolean(defectFilter || batchFilter);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Traceable decisions"
        title="Inspection history"
        description="Review submitted outcomes, AI acceptance or override, and product context."
        action={
          <Badge variant="outline">
            {result.total.toLocaleString()} records
          </Badge>
        }
      />

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Filter inspections</CardTitle>
          <CardDescription>
            Filters run against final human-confirmed defect categories.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 pt-0 sm:flex-row sm:items-center">
          <Select
            value={defectFilter || "all"}
            onValueChange={(value) => {
              setDefectFilter(value === "all" ? "" : (value as DefectType));
              setPage(1);
            }}
          >
            <SelectTrigger
              className="sm:w-56"
              aria-label="Filter by final defect"
            >
              <SelectValue placeholder="All defect categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All defect categories</SelectItem>
              {DEFECT_TYPES.map((defect) => (
                <SelectItem key={defect} value={defect}>
                  {defect}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={batchFilter || "all"}
            onValueChange={(value) => {
              setBatchFilter(value === "all" ? "" : value);
              setPage(1);
            }}
          >
            <SelectTrigger className="sm:w-64" aria-label="Filter by batch">
              <SelectValue placeholder="All batches" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All batches</SelectItem>
              {batchesQuery.data.map((batch) => (
                <SelectItem key={batch.id} value={batch.id}>
                  {batch.batch_number} · {batch.product_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="ghost"
            className="sm:ml-auto"
            disabled={!hasFilter}
            onClick={() => {
              setDefectFilter("");
              setBatchFilter("");
              setPage(1);
            }}
          >
            <FilterX aria-hidden="true" /> Clear filters
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {result.items.length === 0 ? (
            <div className="p-5">
              <EmptyState
                title={
                  hasFilter
                    ? "No inspections match these filters"
                    : "No inspections yet"
                }
                description={
                  hasFilter
                    ? "Try another defect category or batch to broaden the results."
                    : "Submitted inspections will be listed here with their image and final decision."
                }
              />
            </div>
          ) : (
            <InspectionTable
              inspections={result.items}
              demoUserId={demoUserId}
            />
          )}
        </CardContent>
        <div className="flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {result.total === 0
              ? "No records"
              : `Showing ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, result.total)} of ${result.total}`}
          </p>
          <div className="flex items-center justify-between gap-3 sm:justify-end">
            <span className="text-xs text-muted-foreground">
              Page {page} of {Math.max(result.total_pages, 1)}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                <ChevronLeft aria-hidden="true" /> Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={
                  result.total_pages === 0 || page >= result.total_pages
                }
                onClick={() => setPage((current) => current + 1)}
              >
                Next <ChevronRight aria-hidden="true" />
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
