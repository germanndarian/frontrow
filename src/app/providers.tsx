"use client";

import { useState } from "react";
import {
  QueryClient,
  QueryClientProvider,
  isServer,
} from "@tanstack/react-query";
import { ThemeController } from "@/components/system/ThemeController";
import { SessionBridge } from "@/components/system/SessionBridge";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Data is treated as fresh for 20s; live games override with their own
        // refetchInterval at the hook level.
        staleTime: 20_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: true,
        retry: 1,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

function getQueryClient() {
  if (isServer) return makeQueryClient();
  if (!browserQueryClient) browserQueryClient = makeQueryClient();
  return browserQueryClient;
}

export function Providers({ children }: { children: React.ReactNode }) {
  // useState ensures a stable client across re-renders without sharing between
  // requests on the server.
  const [queryClient] = useState(getQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeController />
      <SessionBridge />
      {children}
    </QueryClientProvider>
  );
}
