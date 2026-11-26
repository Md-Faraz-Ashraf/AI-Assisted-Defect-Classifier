import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { LoggedInUserProvider } from "@/app/logged-in-user-context";

export function AppProviders({
  children,
  initialLoggedInUserId,
}: {
  children: ReactNode;
  initialLoggedInUserId?: string;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 15_000, retry: 1, refetchOnWindowFocus: false },
          mutations: { retry: false },
        },
      }),
  );
  return (
    <QueryClientProvider client={queryClient}>
      <LoggedInUserProvider initialLoggedInUserId={initialLoggedInUserId}>
        {children}
      </LoggedInUserProvider>
    </QueryClientProvider>
  );
}
