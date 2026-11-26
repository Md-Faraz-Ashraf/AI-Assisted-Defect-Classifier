import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, FilterX, LoaderCircle } from "lucide-react";
import { useDemoUser } from "@/app/demo-user-context";
import { EmptyState, PageLoading, QueryError } from "@/components/query-states";
import { PageHeader } from "@/components/page-header";
import { InspectionTable } from "@/features/inspections/components/inspection-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBatches, useInspections } from "@/services/queries";
import {
  DEFECT_TYPES,
  type DefectType,
  type InspectionStatus,
  type Inspection,
} from "@/types/api";

const PAGE_SIZE = 10;

export function InspectionHistoryPage() {
  const { demoUserId } = useDemoUser();
  const navigate = useNavigate();
  const [defectFilter, setDefectFilter] = useState<DefectType | "">("");
  const [batchFilter, setBatchFilter] = useState("");
  const [status, setStatus] = useState<InspectionStatus>("REVIEWED");
  const [page, setPage] = useState(1);
  const batchesQuery = useBatches(demoUserId);
  const filters = useMemo(
    () => ({
      defect_type: defectFilter || undefined,
      batch_id: batchFilter || undefined,
      status,
      page,
      page_size: PAGE_SIZE,
      sort_by: "inspected_at" as const,
      sort_order: "desc" as const,
    }),
    [defectFilter, batchFilter, status, page],
  );
  const inspectionsQuery = useInspections(demoUserId, filters, true);

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
    <div className="space-y-4">
      <PageHeader title="Inspection history" />

      <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-card px-3 py-2">
        <div
          className="flex w-fit rounded-md border p-0.5"
          role="group"
          aria-label="Inspection status filter"
        >
          {(["REVIEWED", "UNREVIEWED"] as const).map((value) => (
            <Button
              key={value}
              type="button"
              size="sm"
              variant={status === value ? "secondary" : "ghost"}
              aria-pressed={status === value}
              onClick={() => {
                setStatus(value);
                setPage(1);
              }}
            >
              {value === "REVIEWED" ? "Reviewed" : "Unreviewed"}
            </Button>
          ))}
        </div>
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
              <SelectItem key={batch.batch_id} value={batch.batch_id}>
                {batch.batch_number} · {batch.product_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          type="button"
          variant="ghost"
          disabled={!hasFilter}
          onClick={() => {
            setDefectFilter("");
            setBatchFilter("");
            setPage(1);
          }}
        >
          <FilterX aria-hidden="true" /> Clear filters
        </Button>
        {inspectionsQuery.isFetching && (
          <span
            className="flex items-center gap-2 text-xs text-muted-foreground sm:ml-auto"
            role="status"
          >
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
            Updating results…
          </span>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          {result.items.length === 0 ? (
            <div className="p-5">
              <EmptyState
                title={
                  hasFilter
                    ? `No ${status.toLowerCase()} inspections match these filters`
                    : status === "REVIEWED"
                      ? "No reviewed inspections yet"
                      : "No unreviewed inspections"
                }
                description={
                  hasFilter
                    ? "Try another defect category or batch to broaden the results."
                    : status === "REVIEWED"
                      ? "Finalized inspections will appear here with their image and final decision."
                      : "AI analyses awaiting an inspector decision will appear here."
                }
              />
            </div>
          ) : (
            <InspectionTable
              inspections={result.items}
              demoUserId={demoUserId}
              onReview={(inspection: Inspection) =>
                navigate("/new-inspection", {
                  state: { reviewInspection: inspection },
                })
              }
            />
          )}
        </CardContent>
        <div className="flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
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
