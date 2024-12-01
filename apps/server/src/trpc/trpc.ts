import { initTRPC } from "@trpc/server";
import { z } from "zod";
import { attachmentsRouter } from "./attachments.ts";

const t = initTRPC.create();

const publicProcedure = t.procedure;
const router = t.router;

export const appRouter = router({
  hello: publicProcedure.input(z.string().nullish()).query(({ input }) => {
    return `Hello ${input ?? "World"}!`;
  }),

  attachments: attachmentsRouter,
});

export type AppRouter = typeof appRouter;