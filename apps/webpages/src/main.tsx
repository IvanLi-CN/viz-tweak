import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./tailwind.css";
import "./index.css";
import invariant from "tiny-invariant";
import "./i18n.ts";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { trpc } from "./helpers/trpc.ts";
import { routeTree } from "./routeTree.gen";

import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";

// Create a new router instance
const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  defaultPendingComponent: () => (
    <div className={"p-2 text-2xl"}>
      <p>Loading...</p>
    </div>
  ),
  context: {
    trpc,
  },
});

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const rootEl = document.getElementById("root");

invariant(rootEl, "Root element not found");

createRoot(rootEl).render(
  <StrictMode>
    <RouterProvider router={router} />
    <ToastContainer />
  </StrictMode>,
);
