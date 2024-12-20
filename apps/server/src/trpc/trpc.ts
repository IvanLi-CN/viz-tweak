import { initTRPC } from "@trpc/server";
import { z } from "zod";
import { attachmentsRouter } from "./attachments.ts";
import { sharesRouter } from "./shares.ts";
import { usersRouter } from "./users.ts";

const t = initTRPC.create();

const publicProcedure = t.procedure;
const router = t.router;

export const appRouter = router({
  hello: publicProcedure.input(z.string().nullish()).query(({ input }) => {
    return `Hello ${input ?? "World"}!`;
  }),

  attachments: attachmentsRouter,
  shares: sharesRouter,
  users: usersRouter,
});

export type AppRouter = typeof appRouter;
