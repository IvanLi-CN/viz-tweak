import { createOpenAI } from "@ai-sdk/openai";
import { type CoreMessage, generateObject } from "ai";
import { z } from "zod";
import { config } from "./config.ts";
import { logger } from "./logger.ts";

const openai = createOpenAI({
  apiKey: config.OPENAI_API_KEY,
  baseURL: config.OPENAI_BASE_URL,
});

export const generateImageInfo = async (
  url: string,
): Promise<{ names: string[]; description: string; slugs: string[] }> => {
  try {
    const result = await generateObject({
      model: openai(config.OPENAI_MODEL),
      mode: "json",
      schema: z.object({
        names: z
          .array(
            z
              .string()
              .describe(
                `The title of the image in ${config.AI_GENERATION_LANGUAGE}. The title should be concise and highlight the main content of the image`,
              ),
          )
          .max(7)
          .min(3)
          .describe(
            "Provide multiple differentiated proposals for me to choose from",
          ),
        description: z
          .string()
          .describe(
            `A brief description of the image in ${config.AI_GENERATION_LANGUAGE}. If you recognize the subject of it, describe around that subject. If there is text in the picture, then it may be important. Please describe it in detail, but don't overstate how you feel about the picture.`,
          ),
        slugs: z
          .array(
            z
              .string()
              .describe("A URL-friendly version of the name in English."),
          )
          .max(7)
          .min(3)
          .describe(
            "Provide multiple differentiated proposals for me to choose from",
          ),
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
      slugs: result.object.slugs.map((slug) =>
        slug
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, ""),
      ),
    };
  } catch (error) {
    logger.error(error, "Failed to generate image info");

    throw new Error(
      "Could not generate image information. Please check the URL or try again later.",
    );
  }
};
