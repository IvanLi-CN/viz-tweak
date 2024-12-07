import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { config } from "../config.ts";

export async function createContext({ req }: FetchCreateContextFnOptions) {
  const getUserFromHeader = () => {
    return req.headers.get(config.REMOTE_USER_HEADER);
  };

  const user: string | null = getUserFromHeader();

  return {
    user,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
