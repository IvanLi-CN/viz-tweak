import { initTRPC } from "@trpc/server";
import { config } from "../config.ts";

const t = initTRPC.create();

export const configsRouter = t.router({
  get: t.procedure.query(async () => {
    return {
      ssoLoginUrl: config.SSO_LOGIN_URL,
    };
  }),
});
