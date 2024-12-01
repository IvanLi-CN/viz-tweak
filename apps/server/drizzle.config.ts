import { dirname, join } from "node:path";
import { defineConfig } from "drizzle-kit";

const dirPath = dirname(new URL(import.meta.url).pathname);

export default defineConfig({
  schema: join(dirPath, "./db/schema.ts"),
  out: join(dirPath, "./drizzle"),
  dialect: "sqlite",
  dbCredentials: {
    url: `file:${join(dirPath, "./db.sqlite")}`,
  },
});
