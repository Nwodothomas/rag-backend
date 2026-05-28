import { describe, expect, it } from 'vitest';
import { extractTextFromFile } from '../src/services/fileProcessor.js';

describe('fileProcessor', () => {
  it('extracts text from plaintext buffers', async () => {
    const text = await extractTextFromFile({
      kind: 'docx',
      fileName: 'example.txt',
      buffer: Buffer.from('Developer handbook'),
    });

    expect(text).toContain('Developer handbook');
  });
});
