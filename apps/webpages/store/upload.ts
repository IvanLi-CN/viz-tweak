import { atom } from "jotai";
import type { Chunk } from "../src/helpers/file.ts";

export type UploadChunkStatus = "pending" | "done" | "error";

export const fileAtom = atom<File | undefined>(undefined);
export const chunksAtom = atom<
  (Chunk & { status: UploadChunkStatus; progress: number })[]
>([]);
