import { createHmac } from "node:crypto";
import { config } from "../config.ts";

export const signature = (imagorPath: string) => {
  const hash =
    config.IMAGOR_SECRET === "UNSAFE"
      ? "UNSAFE"
      : createHmac(config.IMAGOR_ALGORITHM, config.IMAGOR_SECRET)
          .update(imagorPath)
          .digest("base64")
          .slice(0, config.IMAGOR_SIGNER_TRUNCATE)
          .replaceAll(/\+/g, "-")
          .replaceAll(/\//g, "_");

  return hash;
};

export const getImagorUrl = (imagorPath: string) => {
  return `${config.IMAGOR_URL}/${signature(imagorPath)}/${imagorPath}`;
};