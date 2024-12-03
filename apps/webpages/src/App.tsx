import "./App.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { Suspense, useState } from "react";
import Upload from "./Upload.tsx";
import { trpc } from "./helpers/trpc.ts";

function App() {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <Suspense fallback="Loading...">
      <QueryClientProvider client={queryClient}>
        <Upload />
      </QueryClientProvider>
    </Suspense>
  );
}

export default App;
