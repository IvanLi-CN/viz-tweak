const CHUNK_SIZE = 1024 * 1024; // 1MB

export const getExtension = (filename: string) => {
  const arr = filename.replace(/^.*\./, "").split(".");

  if (arr.length > 1) {
    return arr[arr.length - 1];
  }

  return undefined;
};

export type Chunk = {
  part: number;
  blob: Blob;
};

export const getChunks = (file: File) => {
  const size = file.size;

  const chunks: Chunk[] = [];

  for (let i = 0; i < size; i += CHUNK_SIZE) {
    chunks.push({
      part: i / CHUNK_SIZE + 1,
      blob: file.slice(i, i + CHUNK_SIZE),
    });
  }

  return chunks;
};