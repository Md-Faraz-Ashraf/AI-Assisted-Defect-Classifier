import { lazy, Suspense, type ReactNode } from "react";
import { Link, Route, Routes } from "react-router-dom";
import { AppShell } from "@/components/app-shell";
import { EmptyState, PageLoading } from "@/components/query-states";
import { Button } from "@/components/ui/button";

const DashboardPage = lazy(() =>
  import("@/features/dashboard/dashboard-page").then((module) => ({
    default: module.DashboardPage,
  })),
);
const InspectionHistoryPage = lazy(() =>
  import("@/features/inspections/inspection-history-page").then((module) => ({
    default: module.InspectionHistoryPage,
  })),
);
const NewInspectionPage = lazy(() =>
  import("@/features/inspections/new-inspection-page").then((module) => ({
    default: module.NewInspectionPage,
  })),
);

function SuspendedPage({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<PageLoading label="Loading page" />}>
      {children}
    </Suspense>
  );
}

function NotFoundPage() {
  return (
    <EmptyState
      title="This page isn’t here"
      description="Use the workspace navigation to return to the dashboard or inspection history."
      action={
        <Button asChild variant="outline">
          <Link to="/">Go to dashboard</Link>
        </Button>
      }
    />
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route
          index
          element={
            <SuspendedPage>
              <DashboardPage />
            </SuspendedPage>
          }
        />
        <Route
          path="inspections"
          element={
            <SuspendedPage>
              <InspectionHistoryPage />
            </SuspendedPage>
          }
        />
        <Route
          path="new-inspection"
          element={
            <SuspendedPage>
              <NewInspectionPage />
            </SuspendedPage>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
