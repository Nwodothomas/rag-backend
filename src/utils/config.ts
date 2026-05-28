import dotenv from 'dotenv';

dotenv.config();

function parseNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export const config = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseNumber(process.env.PORT, 4000),
  adminApiKey: process.env.ADMIN_API_KEY ?? 'dev-admin-key',
  jwtSecret: process.env.JWT_SECRET ?? 'dev-jwt-secret',
  uploadBucket: process.env.SUPABASE_STORAGE_BUCKET ?? 'documents',
  supabaseUrl: process.env.SUPABASE_URL ?? '',
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
  openaiApiKey: process.env.OPENAI_API_KEY ?? '',
  embeddingModel: process.env.OPENAI_EMBEDDING_MODEL ?? 'text-embedding-3-small',
  completionModel: process.env.OPENAI_COMPLETION_MODEL ?? 'gpt-4o-mini',
  maxChunkSize: parseNumber(process.env.MAX_CHUNK_SIZE, 1000),
  chunkOverlap: parseNumber(process.env.CHUNK_OVERLAP, 150),
  rateLimitWindowMs: parseNumber(process.env.RATE_LIMIT_WINDOW_MS, 60_000),
  rateLimitMax: parseNumber(process.env.RATE_LIMIT_MAX, 60),
};

export function isSupabaseConfigured(): boolean {
  return Boolean(config.supabaseUrl && config.supabaseServiceRoleKey);
}

export function isOpenAIConfigured(): boolean {
  return Boolean(config.openaiApiKey);
}
