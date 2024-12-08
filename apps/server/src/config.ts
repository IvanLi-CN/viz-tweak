import { isAbsolute, join } from "node:path";
import { z } from "zod";

const configSchema = z.object({
  // Server

  PORT: z
    .string()
    .regex(/^\d+$/)
    .transform(Number)
    .refine((port) => port >= 1 && port <= 65535, {
      message: "PORT must be between 1 and 65535",
    })
    .default("24113"),
  SERVER_URL: z.string().url().default("http://localhost:24113"),

  // Database

  DB_PATH: z
    .string()
    .default("./db.sqlite")
    .transform((path) => {
      if (isAbsolute(path)) {
        return path;
      }

      return join(process.cwd(), path);
    }),

  // S3

  S3_ACCESS_KEY_ID: z.string(),
  S3_SECRET_ACCESS_KEY: z.string(),
  S3_BUCKET_NAME: z.string(),
  S3_ENDPOINT: z.string(),
  S3_PORT: z.number({ coerce: true }).min(1).max(65535).optional(),
  S3_USE_SSL: z.boolean({ coerce: true }).default(true),
  S3_REGION: z.string().default("us-east-1"),
  S3_PATH_STYLE: z.boolean({ coerce: true }).default(false),
  S3_KEY_PREFIX: z.string().default("/"),

  IMAGOR_URL: z
    .string()
    .url()
    .transform((url) => url.replace(/\/+$/, "")),
  IMAGOR_SECRET: z.string().default("UNSAFE"),
  IMAGOR_ALGORITHM: z.enum(["sha1", "sha256", "sha512"]).default("sha1"),
  IMAGOR_SIGNER_TRUNCATE: z
    .string()
    .transform(Number)
    .refine((n) => z.number().int().positive().safeParse(n).success, {
      message: "IMAGOR_SIGNER_TRUNCATE must be a positive integer",
    })
    .optional(),

  // Authentication

  REMOTE_USER_HEADER: z
    .string()
    .transform((header) => header.toLowerCase())
    .default("Remote-User"),
  ALLOW_ANONYMOUS: z.boolean({ coerce: true }).default(false),

  // AI

  AI_PROVIDER: z.enum(["openai"]).optional(),
  AI_GENERATION_LANGUAGE: z
    .string()
    .default("en-US")
    .describe("The language to use for AI-generated content."),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_BASE_URL: z.string().optional(),
  OPENAI_MODEL: z
    .enum([
      "o1-preview",
      "o1-mini",
      "gpt-4o-mini-2024-07-18",
      "gpt-4o",
      "gpt-4o-2024-05-13",
      "gpt-4o-2024-08-06",
      "gpt-4o-2024-11-20",
    ])
    .default("gpt-4o-2024-08-06"),
});

export const config = configSchema.parse(process.env);
