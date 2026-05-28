export type DocumentKind = 'pdf' | 'docx' | 'xls' | 'video' | 'url';

export type IngestionStatus =
  | 'uploaded'
  | 'queued'
  | 'processing'
  | 'embedded'
  | 'completed'
  | 'failed';

export interface UploadMetadata {
  sourceName: string;
  mimeType: string;
  size: number;
  uploadedBy: string;
  storagePath: string;
  bucket: string;
  tags?: string[];
  attributes?: Record<string, string>;
}

export interface FileRecord {
  id: string;
  kind: DocumentKind;
  status: IngestionStatus;
  createdAt: string;
  updatedAt: string;
  metadata: UploadMetadata;
  sourceUrl?: string;
  extractedText?: string;
  chunkCount?: number;
  error?: string;
}

export interface ChunkRecord {
  id: string;
  fileId: string;
  index: number;
  text: string;
  embedding: number[];
  metadata: Record<string, string | number>;
}

export interface QueryRequest {
  question: string;
  topK?: number;
  filters?: Record<string, string>;
}

export interface QueryResponse {
  answer: string;
  matches: Array<{
    fileId: string;
    chunkId: string;
    score: number;
    preview: string;
  }>;
}

export interface IngestionResult {
  file: FileRecord;
  chunksCreated: number;
  embeddingModel: string;
}

export interface VectorStats {
  files: number;
  chunks: number;
  completedFiles: number;
  failedFiles: number;
}

export interface HealthReport {
  status: 'ok' | 'degraded';
  service: string;
  timestamp: string;
  storage: 'configured' | 'mock';
  openai: 'configured' | 'mock';
}
