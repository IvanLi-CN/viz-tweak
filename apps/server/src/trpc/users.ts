import { initTRPC } from "@trpc/server";
import { protectedProcedure } from "./middlewares/authorization.ts";

const t = initTRPC.create();

export const usersRouter = t.router({
  whoami: protectedProcedure.query(async ({ ctx }) => {
    return {
      name: ctx.user,
    };
  }),
});
