import { describe, expect, it } from 'vitest';
import { ingestFile } from '../src/services/ragPipeline.js';
import { saveUpload } from '../src/services/supabaseClient.js';

describe('ragPipeline', () => {
  it('ingests an uploaded text file into chunks', async () => {
    const file = await saveUpload({
      kind: 'pdf',
      buffer: Buffer.from('This is sample RAG content for ingestion testing.'),
      metadata: {
        sourceName: 'sample.txt',
        mimeType: 'text/plain',
        size: 48,
        uploadedBy: 'test',
        storagePath: 'pdf/sample.txt',
        bucket: 'documents',
      },
    });

    const result = await ingestFile(file.id);

    expect(result.file.status).toBe('completed');
    expect(result.chunksCreated).toBeGreaterThan(0);
  });
});
