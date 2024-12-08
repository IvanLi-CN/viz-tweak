import { createOpenAI } from "@ai-sdk/openai";
import { createXai } from "@ai-sdk/xai";
import { type CoreMessage, generateObject } from "ai";
import { z } from "zod";
import { config } from "./config.ts";
import { logger } from "./logger.ts";

const xai = createXai({
  apiKey: config.XAI_API_KEY,
});

const openai = createOpenAI({
  apiKey: config.OPENAI_API_KEY,
  baseURL: config.OPENAI_BASE_URL,
});

export const generateImageInfo = async (
  url: string,
): Promise<{ name: string; description: string; slug: string }> => {
  try {
    const result = await generateObject({
      model: openai("gpt-4o-2024-08-06"),
      mode: "json",
      schema: z.object({
        name: z
          .string()
          .describe(
            `The name of the image in ${config.AI_GENERATION_LANGUAGE}. The name should be concise and highlight the main content of the image`,
          ),
        description: z
          .string()
          .describe(
            `A brief description of the image in ${config.AI_GENERATION_LANGUAGE}.`,
          ),
        slug: z
          .string()
          .describe("A URL-friendly version of the name in English."),
      }),
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              image: new URL(url),
            },
            {
              type: "text",
              text: "Please provide information about this image.",
            },
          ],
        },
      ] as CoreMessage[],
    });

    logger.debug("Generated for: %s", url);
    logger.debug("Generated result: %s", result);
    return {
      ...result.object,
      slug: result.object.slug
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, ""),
    };
  } catch (error) {
    logger.error(error, "Failed to generate image info. %s");

    throw new Error(
      "Could not generate image information. Please check the URL or try again later.",
    );
  }
};
