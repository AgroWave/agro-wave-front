import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as React from "react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export interface AppProvidersProps {
  children: React.ReactNode;
}

/**
 * Root application providers wrapper configuring TanStack Query.
 * @param props - Child component tree.
 * @returns Component wrapped in essential contexts.
 */
export function AppProviders(props: AppProvidersProps) {
  const { children } = props;
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
