import { lazy, Suspense, type ReactNode } from "react";
import { Link, Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "@/components/app-shell";
import { EmptyState, PageLoading, QueryError } from "@/components/query-states";
import { Button } from "@/components/ui/button";
import { useDemoUser } from "@/app/demo-user-context";
import { useUsers } from "@/services/queries";

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

function QualityEngineerRoute() {
  const { demoUserId } = useDemoUser();
  const usersQuery = useUsers();

  if (usersQuery.isPending)
    return <PageLoading label="Checking demo-user permissions" />;
  if (usersQuery.isError) {
    return (
      <QueryError
        message={usersQuery.error.message}
        onRetry={() => void usersQuery.refetch()}
      />
    );
  }
  const user = usersQuery.data.find((item) => item.id === demoUserId);
  if (user?.role !== "QUALITY_ENGINEER") return <Navigate to="/" replace />;
  return (
    <SuspendedPage>
      <NewInspectionPage />
    </SuspendedPage>
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
        <Route path="new-inspection" element={<QualityEngineerRoute />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
