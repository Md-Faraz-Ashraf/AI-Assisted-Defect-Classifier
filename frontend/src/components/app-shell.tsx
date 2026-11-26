import { useEffect } from "react";
import {
  Activity,
  Check,
  ChevronDown,
  ClipboardCheck,
  LayoutDashboard,
  Plus,
  ShieldCheck,
} from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { DropdownMenu as DropdownMenuPrimitive } from "radix-ui";
import { useLoggedInUser } from "@/app/logged-in-user-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { QueryError } from "@/components/query-states";
import { useUsers } from "@/services/queries";

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
  const { loggedInUserId, setLoggedInUserId } = useLoggedInUser();
  const usersQuery = useUsers();
  useEffect(() => {
    const users = usersQuery.data;
    const firstUser = users?.[0];
    if (!firstUser) return;

    const hasCurrentUser = users.some(
      (user) => user.user_id === loggedInUserId,
    );
    if (!hasCurrentUser) setLoggedInUserId(firstUser.user_id);
  }, [loggedInUserId, setLoggedInUserId, usersQuery.data]);
  const currentUser = usersQuery.data?.find(
    (user) => user.user_id === loggedInUserId,
  );
  const roleLabel = (role: string) =>
    role === "QUALITY_ENGINEER" ? "Quality Engineer" : "Production Supervisor";

  return (
    <div className="min-h-screen bg-muted/40 text-foreground">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r bg-background lg:flex">
        <div className="flex h-[76px] items-center gap-3 px-6">
          <div className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Activity className="size-5" aria-hidden="true" />
          </div>
          <div>
            <p className="font-semibold leading-tight">Quality Inspector</p>
            <p className="whitespace-nowrap text-[11px] text-muted-foreground">
              AI-assisted · human-confirmed
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
          <div className="mx-auto flex min-h-[76px] max-w-[1500px] items-center justify-between gap-4 px-6">
            <div className="flex items-center gap-3 lg:hidden">
              <div className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground">
                <Activity className="size-4" aria-hidden="true" />
              </div>
              <span className="font-semibold">Quality Inspector</span>
            </div>
            <div className="ml-auto flex items-center gap-3">
              {currentUser && (
                <Badge variant="outline">{roleLabel(currentUser.role)}</Badge>
              )}
              <DropdownMenuPrimitive.Root>
                <DropdownMenuPrimitive.Trigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="gap-2 rounded-full pl-1.5 pr-2"
                    disabled={usersQuery.isPending || usersQuery.isError}
                    aria-label={`User menu${currentUser ? ` for ${currentUser.name}` : ""}`}
                  >
                    <span className="grid size-8 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                      {currentUser?.name.charAt(0).toUpperCase() ?? "?"}
                    </span>
                    <ChevronDown
                      className="size-4 text-muted-foreground"
                      aria-hidden="true"
                    />
                  </Button>
                </DropdownMenuPrimitive.Trigger>
                <DropdownMenuPrimitive.Portal>
                  <DropdownMenuPrimitive.Content
                    align="end"
                    sideOffset={8}
                    className="z-50 min-w-56 rounded-lg border bg-popover p-1 text-popover-foreground shadow-md"
                  >
                    {currentUser && (
                      <div className="px-3 py-2">
                        <p className="text-sm font-medium">
                          {currentUser.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {roleLabel(currentUser.role)}
                        </p>
                      </div>
                    )}
                    <DropdownMenuPrimitive.Separator className="my-1 h-px bg-border" />
                    <DropdownMenuPrimitive.Label className="px-3 py-1.5 text-xs font-medium text-muted-foreground">
                      Switch user
                    </DropdownMenuPrimitive.Label>
                    {usersQuery.data?.map((user) => (
                      <DropdownMenuPrimitive.Item
                        key={user.user_id}
                        onSelect={() => setLoggedInUserId(user.user_id)}
                        className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground"
                      >
                        <span className="grid size-6 place-items-center rounded-full bg-muted text-xs font-medium">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                        <span className="flex-1">{user.name}</span>
                        {user.user_id === loggedInUserId && (
                          <Check
                            className="size-4 text-primary"
                            aria-hidden="true"
                          />
                        )}
                      </DropdownMenuPrimitive.Item>
                    ))}
                  </DropdownMenuPrimitive.Content>
                </DropdownMenuPrimitive.Portal>
              </DropdownMenuPrimitive.Root>
            </div>
          </div>
          <div className="flex gap-2 overflow-x-auto border-t px-6 py-2 lg:hidden">
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

        <main className="mx-auto max-w-[1500px] px-6 py-6">
          {usersQuery.isError ? (
            <QueryError
              message={usersQuery.error.message}
              onRetry={() => void usersQuery.refetch()}
            />
          ) : (
            <Outlet />
          )}
        </main>
      </div>
    </div>
  );
}
