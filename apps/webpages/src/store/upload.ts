import { atom } from "jotai";
import type { Chunk } from "../helpers/file.ts";

export type UploadChunkStatus = "pending" | "done" | "error";
export type UploadStatus = "pending" | "done" | "error" | "idle";

export const fileAtom = atom<File | undefined>(undefined);
export const chunksAtom = atom<
  (Chunk & { status: UploadChunkStatus; progress: number })[]
>([]);
export const uploadStatusAtom = atom<UploadStatus>("idle");
export const uploadErrorAtom = atom<Error | undefined>(undefined);
export const uploadedAttachmentInfoAtom = atom<
  { id: string; url: string } | undefined
>(undefined);