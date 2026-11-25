import {
  Activity,
  ClipboardCheck,
  LayoutDashboard,
  Plus,
  ShieldCheck,
} from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { useDemoUser } from "@/app/demo-user-context";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { QueryError } from "@/components/query-states";
import { useUsers } from "@/services/queries";
import { cn } from "@/lib/utils";

const navigation = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  {
    to: "/inspections",
    label: "Inspections",
    icon: ClipboardCheck,
    end: false,
  },
];

export function AppShell() {
  const { demoUserId, setDemoUserId } = useDemoUser();
  const usersQuery = useUsers();
  const currentUser = usersQuery.data?.find((user) => user.id === demoUserId);
  const roleLabel =
    currentUser?.role === "QUALITY_ENGINEER"
      ? "Quality Engineer"
      : "Production Supervisor";

  return (
    <div className="min-h-screen bg-muted/40 text-foreground">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r bg-background lg:flex">
        <div className="flex h-[76px] items-center gap-3 px-6">
          <div className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Activity className="size-5" aria-hidden="true" />
          </div>
          <div>
            <p className="font-semibold leading-tight">Inspectra</p>
            <p className="text-xs text-muted-foreground">
              Manufacturing quality
            </p>
          </div>
        </div>
        <Separator />
        <div className="px-4 py-5">
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Workspace
          </p>
          <nav className="space-y-1" aria-label="Main navigation">
            {navigation.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    "flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    isActive
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground",
                  )
                }
              >
                <Icon className="size-4" aria-hidden="true" />
                {label}
              </NavLink>
            ))}
            <NavLink
              to="/new-inspection"
              className={({ isActive }) =>
                cn(
                  "flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  isActive
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground",
                )
              }
            >
              <Plus className="size-4" aria-hidden="true" />
              New inspection
            </NavLink>
          </nav>
        </div>
        <div className="mt-auto p-4">
          <div className="rounded-xl border bg-card p-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <ShieldCheck className="size-4 text-primary" aria-hidden="true" />
              Human review stays final
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              AI suggestions are reviewed and confirmed by an inspector.
            </p>
          </div>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className="mx-auto flex min-h-[76px] max-w-[1500px] items-center justify-between gap-4 px-4 sm:px-7">
            <div className="flex items-center gap-3 lg:hidden">
              <div className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground">
                <Activity className="size-4" aria-hidden="true" />
              </div>
              <span className="font-semibold">Inspectra</span>
            </div>
            <div className="hidden lg:block">
              <p className="text-sm font-medium">Quality operations</p>
              <p className="text-xs text-muted-foreground">
                AI-assisted · human-confirmed
              </p>
            </div>
            <div className="ml-auto flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium">
                  {currentUser?.name ?? "Loading user"}
                </p>
                {currentUser && (
                  <p className="text-xs text-muted-foreground">{roleLabel}</p>
                )}
              </div>
              <Select
                value={demoUserId}
                onValueChange={setDemoUserId}
                disabled={usersQuery.isPending || usersQuery.isError}
              >
                <SelectTrigger
                  className="w-[148px] sm:w-[190px]"
                  aria-label="Select demo user"
                >
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent align="end">
                  {usersQuery.data?.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} ·{" "}
                      {user.role === "QUALITY_ENGINEER"
                        ? "Engineer"
                        : "Supervisor"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {currentUser && (
                <Badge variant="outline" className="hidden md:inline-flex">
                  {roleLabel}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex gap-2 overflow-x-auto border-t px-4 py-2 lg:hidden">
            {navigation.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    "flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    isActive
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground",
                  )
                }
              >
                <Icon className="size-4" aria-hidden="true" />
                {label}
              </NavLink>
            ))}
            <NavLink
              to="/new-inspection"
              className={({ isActive }) =>
                cn(
                  "flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  isActive
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground",
                )
              }
            >
              <Plus className="size-4" aria-hidden="true" /> New inspection
            </NavLink>
          </div>
        </header>

        <main className="mx-auto max-w-[1500px] px-4 py-7 sm:px-7 lg:py-9">
          {usersQuery.isError ? (
            <QueryError
              message={usersQuery.error.message}
              onRetry={() => void usersQuery.refetch()}
            />
          ) : (
            <Outlet />
          )}
        </main>
        <footer className="px-4 pb-6 text-center text-xs text-muted-foreground sm:px-7">
          Inspectra · Demo user selection is not production authentication
        </footer>
      </div>
    </div>
  );
}
