import { randomUUID } from 'node:crypto';
import { splitIntoChunks } from '../utils/chunker.js';
import { config } from '../utils/config.js';
import { logger } from '../utils/logger.js';
import type { IngestionResult, QueryRequest, QueryResponse } from '../utils/types.js';
import { embedText, answerQuestion } from './openaiClient.js';
import { extractTextFromFile } from './fileProcessor.js';
import { notifyIngestionEvent } from './notifier.js';
import {
  getFile,
  getFileBuffer,
  saveChunks,
  searchSimilarChunks,
  updateFile,
  getVectorStats,
} from './supabaseClient.js';

export async function ingestFile(fileId: string): Promise<IngestionResult> {
  const file = await getFile(fileId);
  if (!file) {
    throw new Error(`File ${fileId} was not found`);
  }

  await updateFile(fileId, { status: 'processing', error: undefined });
  await notifyIngestionEvent('ingestion.started', { fileId, kind: file.kind });

  try {
    const buffer = await getFileBuffer(fileId);
    const extractedText = await extractTextFromFile({
      kind: file.kind,
      fileName: file.metadata.sourceName,
      buffer,
      sourceUrl: file.sourceUrl,
    });

    const texts = splitIntoChunks(extractedText, {
      maxChunkSize: config.maxChunkSize,
      overlap: config.chunkOverlap,
    });

    const chunks = await Promise.all(
      texts.map(async (text, index) => ({
        id: randomUUID(),
        fileId,
        index,
        text,
        embedding: await embedText(text),
        metadata: {
          sourceName: file.metadata.sourceName,
          kind: file.kind,
        },
      })),
    );

    await saveChunks(fileId, chunks);
    const updated = await updateFile(fileId, {
      status: 'completed',
      extractedText,
      chunkCount: chunks.length,
    });

    if (!updated) {
      throw new Error(`File ${fileId} disappeared during ingestion`);
    }

    await notifyIngestionEvent('ingestion.completed', { fileId, chunks: chunks.length });
    return {
      file: updated,
      chunksCreated: chunks.length,
      embeddingModel: config.embeddingModel,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown ingestion error';
    await updateFile(fileId, { status: 'failed', error: message });
    await notifyIngestionEvent('ingestion.failed', { fileId, error: message });
    logger.error('RAG ingestion failed', { fileId, error: message });
    throw error;
  }
}

export async function queryKnowledgeBase(request: QueryRequest): Promise<QueryResponse> {
  const questionEmbedding = await embedText(request.question);
  const matches = await searchSimilarChunks(questionEmbedding, request.topK ?? 5);
  const answer = await answerQuestion(
    request.question,
    matches.map((entry) => entry.chunk.text),
  );

  return {
    answer,
    matches: matches.map(({ chunk, score }) => ({
      fileId: chunk.fileId,
      chunkId: chunk.id,
      score,
      preview: chunk.text.slice(0, 160),
    })),
  };
}

export async function getPipelineStats() {
  return getVectorStats();
}
