import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  CheckCircle2,
  CircleAlert,
  ClipboardCheck,
  Percent,
  Sparkles,
} from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { useLoggedInUser } from "@/app/logged-in-user-context";
import { EmptyState, PageLoading, QueryError } from "@/components/query-states";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { InspectionTable } from "@/features/inspections/components/inspection-table";
import { useDashboard, useInspections } from "@/services/queries";
import { DEFECT_TYPES } from "@/types/api";

const chartColors = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

function MetricCard({
  label,
  value,
  description,
  icon: Icon,
  accent = "text-primary",
}: {
  label: string;
  value: string;
  description: string;
  icon: typeof Activity;
  accent?: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-2 px-3 py-2">
        <div>
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="mt-0.5 text-2xl font-semibold tracking-tight">
            {value}
          </p>
          <p className="text-[11px] text-muted-foreground">{description}</p>
        </div>
        <span className="grid size-8 place-items-center rounded-lg bg-muted">
          <Icon className={`size-3.5 ${accent}`} aria-hidden="true" />
        </span>
      </CardContent>
    </Card>
  );
}

export function DashboardPage() {
  const { loggedInUserId } = useLoggedInUser();
  const dashboardQuery = useDashboard(loggedInUserId);
  const recentFilters = useMemo(
    () => ({
      page: 1,
      page_size: 5,
      sort_by: "inspected_at" as const,
      sort_order: "desc" as const,
    }),
    [],
  );
  const recentQuery = useInspections(loggedInUserId, recentFilters);

  if (dashboardQuery.isPending || recentQuery.isPending) {
    return (
      <PageLoading label="Loading dashboard metrics and recent inspections" />
    );
  }
  if (dashboardQuery.isError || recentQuery.isError) {
    const query = dashboardQuery.isError ? dashboardQuery : recentQuery;
    return (
      <QueryError
        message={query.error?.message ?? "The dashboard request failed."}
        onRetry={() => void query.refetch()}
      />
    );
  }

  const summary = dashboardQuery.data;
  const recent = recentQuery.data.items;
  const breakdown = DEFECT_TYPES.map(
    (defectType) =>
      summary.defect_breakdown.find(
        (item) => item.defect_type === defectType,
      ) ?? {
        defect_type: defectType,
        count: 0,
      },
  );

  return (
    <div className="space-y-4">
      <PageHeader
        title="Inspection dashboard"
        description="A live view of confirmed inspection outcomes and AI-assisted review activity."
      />

      <section
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        aria-label="Inspection metrics"
      >
        <MetricCard
          label="Total inspections"
          value={summary.total_inspections.toLocaleString()}
          description="Submitted inspection records"
          icon={ClipboardCheck}
        />
        <MetricCard
          label="Passed"
          value={summary.passed_inspections.toLocaleString()}
          description="Confirmed as No Defect"
          icon={CheckCircle2}
          accent="text-emerald-700"
        />
        <MetricCard
          label="Rejected"
          value={summary.rejected_inspections.toLocaleString()}
          description="Confirmed with a defect"
          icon={CircleAlert}
          accent="text-amber-700"
        />
        <MetricCard
          label="Defect rate"
          value={`${summary.defect_rate.toFixed(1)}%`}
          description={`${summary.ai_acceptance_rate.toFixed(1)}% AI acceptance rate`}
          icon={Percent}
          accent="text-sky-700"
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(340px,0.9fr)]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="sparkle-icon size-4" aria-hidden="true" />
              AI acceptance rate
            </CardTitle>
            <CardDescription>
              Share of inspections where the inspector accepted the suggestion.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">Accepted</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums">
                  {summary.ai_accepted_count.toLocaleString()}
                </p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">Overridden</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums">
                  {summary.ai_overridden_count.toLocaleString()}
                </p>
              </div>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Accepted ÷ (Accepted + Overridden) × 100 =
            </p>
            <div className="flex items-end gap-3">
              <p className="text-5xl font-semibold tracking-tight">
                {summary.ai_acceptance_rate.toFixed(1)}%
              </p>
              <p className="pb-1 text-sm text-muted-foreground">
                of submitted inspections
              </p>
            </div>
            <div
              className="mt-5 h-2 overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-label="AI acceptance rate"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={summary.ai_acceptance_rate}
            >
              <div
                className="h-full rounded-full bg-primary transition-[width]"
                style={{ width: `${summary.ai_acceptance_rate}%` }}
              />
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Accepted No Defect predictions count as accepted decisions.
              Confidence scores are indicative, not calibrated probabilities.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Final defect breakdown</CardTitle>
            <CardDescription>
              Counts use the inspector’s confirmed classification.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {summary.total_inspections === 0 ? (
              <EmptyState
                title="No inspections to chart yet"
                description="The breakdown will appear after the first inspection is submitted."
              />
            ) : (
              <div className="grid items-center gap-5 md:grid-cols-[minmax(220px,0.9fr)_minmax(170px,1.1fr)]">
                <div
                  className="h-[240px] min-w-0"
                  aria-label="Defect category distribution chart"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={breakdown.filter((item) => item.count > 0)}
                        dataKey="count"
                        nameKey="defect_type"
                        innerRadius={62}
                        outerRadius={94}
                        paddingAngle={3}
                        stroke="var(--background)"
                        strokeWidth={3}
                      >
                        {breakdown
                          .filter((item) => item.count > 0)
                          .map((item) => (
                            <Cell
                              key={item.defect_type}
                              fill={
                                chartColors[
                                  DEFECT_TYPES.indexOf(item.defect_type)
                                ]
                              }
                            />
                          ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => [
                          `${value} inspections`,
                          "Final count",
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <ul
                  className="space-y-3"
                  aria-label="Counts by defect category"
                >
                  {breakdown.map((item, index) => (
                    <li
                      key={item.defect_type}
                      className="flex items-center justify-between gap-3 text-sm"
                    >
                      <span className="flex items-center gap-2">
                        <span
                          className="size-2.5 rounded-full"
                          style={{ backgroundColor: chartColors[index] }}
                          aria-hidden="true"
                        />
                        {item.defect_type}
                      </span>
                      <span className="font-semibold tabular-nums">
                        {item.count}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div>
            <CardTitle>Recent inspections</CardTitle>
            <CardDescription className="mt-1">
              Latest submitted human-confirmed outcomes.
            </CardDescription>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to="/inspections">View all</Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {recent.length === 0 ? (
            <div className="p-5">
              <EmptyState
                title="No inspections submitted yet"
                description="Once an inspection is submitted, its final outcome will appear here."
              />
            </div>
          ) : (
            <InspectionTable
              inspections={recent}
              loggedInUserId={loggedInUserId}
              compact
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
