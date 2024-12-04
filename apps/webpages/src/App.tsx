import "./App.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Suspense, useState } from "react";
import Upload from "./Upload.tsx";

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
