import "./App.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Suspense } from "react";
import Upload from "./Upload.tsx";

const queryClient = new QueryClient();

function App() {
  return (
    <Suspense fallback="Loading...">
      <QueryClientProvider client={queryClient}>
        <Upload />
      </QueryClientProvider>
    </Suspense>
  );
}

export default App;
