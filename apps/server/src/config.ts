import { isAbsolute, join } from "node:path";
import { z } from "zod";

const configSchema = z.object({
  PORT: z
    .string()
    .regex(/^\d+$/)
    .transform(Number)
    .refine((port) => port >= 1 && port <= 65535, {
      message: "PORT must be between 1 and 65535",
    })
    .default("24113"),

  DB_PATH: z
    .string()
    .default("./db.sqlite")
    .transform((path) => {
      if (isAbsolute(path)) {
        return path;
      }

      return join(process.cwd(), path);
    }),

  S3_ACCESS_KEY_ID: z.string(),
  S3_SECRET_ACCESS_KEY: z.string(),
  S3_BUCKET_NAME: z.string(),
  S3_ENDPOINT: z.string(),
  S3_PORT: z.number({ coerce: true }).min(1).max(65535).optional(),
  S3_USE_SSL: z.boolean({ coerce: true }).default(true),
  S3_REGION: z.string().default("us-east-1"),
  S3_PATH_STYLE: z.boolean({ coerce: true }).default(false),
  S3_KEY_PREFIX: z.string().default("/"),
});

export const config = configSchema.parse(process.env);
