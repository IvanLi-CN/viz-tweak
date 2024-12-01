import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./tailwind.css";
import "./index.css";
import invariant from "tiny-invariant";
import "./i18n.ts";
import "chart.js/auto";

const rootEl = document.getElementById("root");

invariant(rootEl, "Root element not found");

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
