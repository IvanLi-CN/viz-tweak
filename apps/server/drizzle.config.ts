import { join } from "node:path";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: join(import.meta.dir, "./db/schema.ts"),
  out: join(import.meta.dir, "./drizzle"),
  dialect: "sqlite",
  dbCredentials: {
    url: `file:${join(import.meta.dir, "./db.sqlite")}`,
  },
});
