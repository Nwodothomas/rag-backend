import { extname } from 'node:path';
import type { DocumentKind } from '../utils/types.js';

function decodeBuffer(buffer: Buffer): string {
  return buffer.toString('utf8').replace(/\0/g, ' ').trim();
}

export async function extractTextFromFile(params: {
  kind: DocumentKind;
  fileName: string;
  buffer?: Buffer | null;
  sourceUrl?: string;
}): Promise<string> {
  if (params.kind === 'url') {
    return `Remote URL content placeholder for ${params.sourceUrl ?? 'unknown URL'}`;
  }

  const extension = extname(params.fileName).toLowerCase();
  const rawText = decodeBuffer(params.buffer ?? Buffer.alloc(0));

  if (extension === '.txt' || rawText) {
    return rawText || `Plaintext extraction fallback for ${params.fileName}`;
  }

  if (params.kind === 'video') {
    return `Transcript placeholder extracted from video file ${params.fileName}`;
  }

  return `Extraction placeholder for ${params.kind.toUpperCase()} file ${params.fileName}`;
}
