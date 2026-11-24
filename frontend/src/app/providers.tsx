import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { DemoUserProvider } from "@/app/demo-user-context";

export function AppProviders({
  children,
  initialUserId,
}: {
  children: ReactNode;
  initialUserId?: string;
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
      <DemoUserProvider initialUserId={initialUserId}>
        {children}
      </DemoUserProvider>
    </QueryClientProvider>
  );
}
