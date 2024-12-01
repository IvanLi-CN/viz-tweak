import { pino } from "pino";

export const logger =
  process.env.NODE_ENV === "development"
    ? pino({
        transport: {
          target: "pino-pretty",
          level: "trace",
          options: {
            colorize: true,
            levelFirst: true,
            translateTime: "yyyy-mm-dd HH:MM:ss",
          },
        },
      })
    : pino({
        level: "info",
      });
