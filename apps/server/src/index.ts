import { Hono } from "hono";

import { trpcServer } from "@hono/trpc-server";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import { pinoLogger } from "hono-pino";
import { serveStatic } from "hono/bun";
import { db } from "./db.ts";
import { logger } from "./logger.ts";
import { appRouter } from "./trpc/trpc.ts";

const skipMigration = process.argv.includes("--skip-migration");

if (!skipMigration) {
  migrate(db, { migrationsFolder: "./migrations" });
}

const app = new Hono();

app.use(
  pinoLogger({
    pino: logger,
  }),
);

app.use(
  "/trpc/*",
  trpcServer({
    router: appRouter,
  }),
);

app.get(
  "/*",
  serveStatic({
    root: "../webpages/dist",
  }),
);

app.get(
  "*",
  serveStatic({
    root: "../webpages/dist",
    rewriteRequestPath: (path) => {
      return "/index.html";
    },
  }),
);

export default app;
