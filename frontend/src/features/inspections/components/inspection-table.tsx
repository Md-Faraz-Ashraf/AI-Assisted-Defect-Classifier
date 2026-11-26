import { ArrowDownRight, Check, MessageSquareText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ProtectedImage } from "@/components/protected-image";
import { Button } from "@/components/ui/button";
import type { Inspection } from "@/types/api";

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

export function InspectionTable({
  inspections,
  loggedInUserId,
  compact = false,
  onReview,
}: {
  inspections: Inspection[];
  loggedInUserId: string;
  compact?: boolean;
  onReview?: (inspection: Inspection) => void;
}) {
  const showReviewAction =
    Boolean(onReview) &&
    inspections.some((inspection) => inspection.status === "UNREVIEWED");
  const imageColumnWidth = compact
    ? "w-[9%]"
    : showReviewAction
      ? "w-[7%]"
      : "w-[8%]";
  const batchColumnWidth = compact
    ? "w-[25%]"
    : showReviewAction
      ? "w-[19%]"
      : "w-[22%]";
  const decisionColumnWidth = compact
    ? "w-[43%]"
    : showReviewAction
      ? "w-[36%]"
      : "w-[38%]";
  const inspectorColumnWidth = showReviewAction ? "w-[12%]" : "w-[14%]";
  const inspectedAtColumnWidth = compact
    ? "w-[23%]"
    : showReviewAction
      ? "w-[15%]"
      : "w-[18%]";

  return (
    <Table
      className={`table-fixed ${compact ? "min-w-[920px]" : showReviewAction ? "min-w-[1160px]" : "min-w-[1040px]"}`}
    >
      <TableHeader>
        <TableRow>
          <TableHead className={imageColumnWidth}>Image</TableHead>
          <TableHead className={batchColumnWidth}>Batch / product</TableHead>
          <TableHead className={decisionColumnWidth}>Decision</TableHead>
          {!compact && (
            <TableHead className={inspectorColumnWidth}>Inspector</TableHead>
          )}
          <TableHead className={`${inspectedAtColumnWidth} text-right`}>
            Inspected at
          </TableHead>
          {showReviewAction && (
            <TableHead className="w-32 text-right">Action</TableHead>
          )}
        </TableRow>
      </TableHeader>
      <TableBody>
        {inspections.map((inspection) => (
          <TableRow key={inspection.inspection_id}>
            <TableCell className={imageColumnWidth}>
              <ProtectedImage
                imageRef={inspection.image_ref}
                loggedInUserId={loggedInUserId}
                alt={`Product in ${inspection.batch_number}`}
                className="h-12 w-16"
              />
            </TableCell>
            <TableCell className={batchColumnWidth}>
              <p className="font-medium">{inspection.batch_number}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {inspection.product_name}
              </p>
            </TableCell>
            <TableCell className={`${decisionColumnWidth} whitespace-nowrap`}>
              <div className="flex items-center gap-2 text-xs">
                <span>
                  <span className="text-muted-foreground">AI:</span>{" "}
                  {inspection.original_ai_prediction}
                </span>
                <span aria-hidden="true" className="text-muted-foreground">
                  —
                </span>
                {inspection.status === "UNREVIEWED" ? (
                  <Badge variant="outline">Pending decision</Badge>
                ) : inspection.was_overridden ? (
                  <Badge
                    variant="outline"
                    className="gap-1 border-amber-300 text-amber-800"
                  >
                    <ArrowDownRight aria-hidden="true" /> Overridden
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="gap-1 border-emerald-300 text-emerald-800"
                  >
                    <Check aria-hidden="true" /> AI accepted
                  </Badge>
                )}
                <span aria-hidden="true" className="text-muted-foreground">
                  —
                </span>
                <span>
                  <span className="text-muted-foreground">Final:</span>{" "}
                  {inspection.status === "UNREVIEWED"
                    ? "Awaiting review"
                    : inspection.final_defect_type}
                </span>
              </div>
            </TableCell>
            {!compact && (
              <TableCell className={inspectorColumnWidth}>
                <span
                  className={`group relative inline-flex items-center gap-2 ${inspection.comments ? "cursor-help" : ""}`}
                  tabIndex={inspection.comments ? 0 : undefined}
                  aria-label={
                    inspection.comments
                      ? `${inspection.inspector_name}. Comment: ${inspection.comments}`
                      : inspection.inspector_name
                  }
                >
                  {inspection.inspector_name}
                  {inspection.comments && (
                    <span
                      className="inline-flex text-muted-foreground"
                      aria-hidden="true"
                    >
                      <MessageSquareText
                        className="size-4"
                        aria-hidden="true"
                      />
                    </span>
                  )}
                  {inspection.comments && (
                    <span
                      role="tooltip"
                      className="pointer-events-none invisible absolute left-0 top-full z-50 mt-1 w-max max-w-72 whitespace-normal rounded-md bg-foreground px-3 py-2 text-left text-xs font-normal text-background opacity-0 shadow-lg transition-opacity duration-75 group-hover:visible group-hover:opacity-100 group-focus:visible group-focus:opacity-100"
                    >
                      {inspection.comments}
                    </span>
                  )}
                </span>
              </TableCell>
            )}
            <TableCell
              className={`${inspectedAtColumnWidth} whitespace-nowrap text-right text-sm text-muted-foreground`}
            >
              {inspection.inspected_at
                ? formatDate(inspection.inspected_at)
                : "Not reviewed"}
            </TableCell>
            {showReviewAction && (
              <TableCell className="w-[11%] text-right">
                {inspection.status === "UNREVIEWED" && onReview && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => onReview(inspection)}
                  >
                    Review now
                  </Button>
                )}
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
