import { randomUUID } from 'node:crypto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { config, isSupabaseConfigured } from '../utils/config.js';
import { logger } from '../utils/logger.js';
import type { ChunkRecord, FileRecord, UploadMetadata, VectorStats } from '../utils/types.js';

const fileStore = new Map<string, FileRecord>();
const fileBuffers = new Map<string, Buffer>();
const chunkStore = new Map<string, ChunkRecord[]>();

const supabase: SupabaseClient | null = isSupabaseConfigured()
  ? createClient(config.supabaseUrl, config.supabaseServiceRoleKey)
  : null;

export function getSupabaseClient(): SupabaseClient | null {
  return supabase;
}

export async function saveUpload(params: {
  kind: FileRecord['kind'];
  metadata: UploadMetadata;
  buffer?: Buffer;
  sourceUrl?: string;
}): Promise<FileRecord> {
  const now = new Date().toISOString();
  const id = randomUUID();
  const record: FileRecord = {
    id,
    kind: params.kind,
    status: 'uploaded',
    createdAt: now,
    updatedAt: now,
    metadata: params.metadata,
    sourceUrl: params.sourceUrl,
  };

  if (params.buffer) {
    fileBuffers.set(id, params.buffer);
  }

  if (supabase && params.buffer) {
    const { error } = await supabase.storage
      .from(params.metadata.bucket)
      .upload(params.metadata.storagePath, params.buffer, {
        contentType: params.metadata.mimeType,
        upsert: true,
      });

    if (error) {
      logger.warn('Supabase storage upload failed, retaining local fallback only', {
        fileId: id,
        error: error.message,
      });
    }
  }

  fileStore.set(id, record);
  return record;
}

export async function listFiles(): Promise<FileRecord[]> {
  return Array.from(fileStore.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getFile(fileId: string): Promise<FileRecord | null> {
  return fileStore.get(fileId) ?? null;
}

export async function getFileBuffer(fileId: string): Promise<Buffer | null> {
  return fileBuffers.get(fileId) ?? null;
}

export async function updateFile(fileId: string, patch: Partial<FileRecord>): Promise<FileRecord | null> {
  const current = fileStore.get(fileId);
  if (!current) {
    return null;
  }

  const updated: FileRecord = {
    ...current,
    ...patch,
    metadata: patch.metadata ?? current.metadata,
    updatedAt: new Date().toISOString(),
  };

  fileStore.set(fileId, updated);
  return updated;
}

export async function saveChunks(fileId: string, chunks: ChunkRecord[]): Promise<void> {
  chunkStore.set(fileId, chunks);
}

export async function getChunks(fileId: string): Promise<ChunkRecord[]> {
  return chunkStore.get(fileId) ?? [];
}

function cosineSimilarity(left: number[], right: number[]): number {
  if (left.length !== right.length) {
    return 0;
  }

  return left.reduce((sum, value, index) => sum + value * right[index], 0);
}

export async function searchSimilarChunks(embedding: number[], topK: number): Promise<
  Array<{ chunk: ChunkRecord; score: number }>
> {
  const matches = Array.from(chunkStore.values())
    .flatMap((chunks) => chunks.map((chunk) => ({ chunk, score: cosineSimilarity(chunk.embedding, embedding) })))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  return matches;
}

export async function getVectorStats(): Promise<VectorStats> {
  const files = Array.from(fileStore.values());
  const chunks = Array.from(chunkStore.values()).reduce((sum, item) => sum + item.length, 0);

  return {
    files: files.length,
    chunks,
    completedFiles: files.filter((file) => file.status === 'completed').length,
    failedFiles: files.filter((file) => file.status === 'failed').length,
  };
}
