export interface ChunkOptions {
  maxChunkSize: number;
  overlap: number;
}

export function splitIntoChunks(text: string, options: ChunkOptions): string[] {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized) {
    return [];
  }

  const { maxChunkSize, overlap } = options;
  const chunks: string[] = [];
  let start = 0;

  while (start < normalized.length) {
    const end = Math.min(start + maxChunkSize, normalized.length);
    chunks.push(normalized.slice(start, end).trim());
    if (end >= normalized.length) {
      break;
    }

    start = Math.max(end - overlap, start + 1);
  }

  return chunks.filter(Boolean);
}
