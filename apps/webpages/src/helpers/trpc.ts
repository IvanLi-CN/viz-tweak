import { createTRPCClient, httpBatchLink } from "@trpc/react-query";
import type { AppRouter } from "viz-tweak-server/src/trpc/trpc.ts";

export const trpc = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: "/trpc",
    }),
  ],
});
