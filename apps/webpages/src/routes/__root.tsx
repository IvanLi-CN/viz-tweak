import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet, createRootRouteWithContext } from "@tanstack/react-router";
import * as React from "react";
import { Suspense, useState } from "react";
import type { trpc } from "../helpers/trpc.ts";

export interface RouterAppContext {
  trpc: typeof trpc;
}

export const Route = createRootRouteWithContext<RouterAppContext>()({
  component: RootComponent,
});

const TanStackRouterDevtools =
  process.env.NODE_ENV === "production"
    ? () => null // Render nothing in production
    : React.lazy(() =>
        // Lazy load in development
        import("@tanstack/router-devtools").then((res) => ({
          default: res.TanStackRouterDevtools,
          // For Embedded Mode
          // default: res.TanStackRouterDevtoolsPanel
        })),
      );

function RootComponent() {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <Suspense fallback="Loading...">
      <QueryClientProvider client={queryClient}>
        <Outlet />
        <TanStackRouterDevtools />
      </QueryClientProvider>
    </Suspense>
  );
}
