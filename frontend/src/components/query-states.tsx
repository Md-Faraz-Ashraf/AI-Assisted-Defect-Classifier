import { AlertCircle, RefreshCw } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function PageLoading({
  label = "Loading inspection data",
}: {
  label?: string;
}) {
  return (
    <div className="space-y-5" aria-label={label} role="status">
      <span className="sr-only">{label}…</span>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {["total", "passed", "rejected", "rate"].map((metric) => (
          <Card key={metric}>
            <CardContent className="space-y-3 p-5">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-3 w-36" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardContent className="space-y-3 p-5">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-56 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

export function QueryError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <Card role="alert" className="border-destructive/30">
      <CardContent className="flex flex-col items-start gap-3 p-6 sm:flex-row sm:items-center">
        <AlertCircle
          className="mt-0.5 size-5 text-destructive"
          aria-hidden="true"
        />
        <div className="flex-1">
          <p className="font-medium">We couldn’t load this information.</p>
          <p className="mt-1 text-sm text-muted-foreground">{message}</p>
        </div>
        <Button variant="outline" onClick={onRetry}>
          <RefreshCw aria-hidden="true" /> Retry
        </Button>
      </CardContent>
    </Card>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center rounded-xl border border-dashed bg-card px-6 py-10 text-center">
      <p className="font-medium">{title}</p>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">
        {description}
      </p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
