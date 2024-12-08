import { Outlet, createRootRouteWithContext } from "@tanstack/react-router";
import * as React from "react";
import { Suspense, useEffect } from "react";
import { PasteUpload } from "../components/PasteUpload.tsx";
import type { RouterAppContext } from "../main.tsx";

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
  // Prevent browser from opening dropped files in new tab
  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (!e.dataTransfer) {
        return;
      }
      e.dataTransfer.dropEffect = "none";
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (!e.dataTransfer) {
        return;
      }
      e.dataTransfer.dropEffect = "none";
    };

    document.addEventListener("dragover", handleDragOver);
    document.addEventListener("drop", handleDrop);

    return () => {
      document.removeEventListener("dragover", handleDragOver);
      document.removeEventListener("drop", handleDrop);
    };
  }, []);

  return (
    <Suspense fallback="Loading...">
      <Outlet />
      <TanStackRouterDevtools />
      <PasteUpload />
    </Suspense>
  );
}
