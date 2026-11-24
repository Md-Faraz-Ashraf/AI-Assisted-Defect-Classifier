import { ArrowDownRight, Check } from "lucide-react";
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
import type { Inspection } from "@/types/api";

export function formatTimestamp(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function InspectionTable({
  inspections,
  demoUserId,
  compact = false,
}: {
  inspections: Inspection[];
  demoUserId: string;
  compact?: boolean;
}) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-20">Image</TableHead>
            <TableHead>Batch / product</TableHead>
            <TableHead>Final defect</TableHead>
            {!compact && <TableHead>Inspector</TableHead>}
            <TableHead>Decision</TableHead>
            <TableHead className="text-right">Inspected</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {inspections.map((inspection) => (
            <TableRow key={inspection.id}>
              <TableCell>
                <ProtectedImage
                  imageRef={inspection.image_ref}
                  demoUserId={demoUserId}
                  alt={`Product in ${inspection.batch_number}`}
                  className="h-12 w-16"
                />
              </TableCell>
              <TableCell>
                <p className="font-medium">{inspection.batch_number}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {inspection.product_name}
                </p>
              </TableCell>
              <TableCell>
                <Badge
                  variant={
                    inspection.final_defect_type === "No Defect"
                      ? "secondary"
                      : "outline"
                  }
                >
                  {inspection.final_defect_type}
                </Badge>
              </TableCell>
              {!compact && <TableCell>{inspection.inspector_name}</TableCell>}
              <TableCell>
                {inspection.was_overridden ? (
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
                <p className="mt-1 text-xs text-muted-foreground">
                  AI: {inspection.original_ai_prediction}
                </p>
              </TableCell>
              <TableCell className="whitespace-nowrap text-right text-sm text-muted-foreground">
                {formatTimestamp(inspection.inspected_at)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
