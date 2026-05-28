import { describe, expect, it } from 'vitest';
import { embedText } from '../src/services/openaiClient.js';

describe('openaiClient', () => {
  it('returns a deterministic embedding vector', async () => {
    const vector = await embedText('hello world');

    expect(vector.length).toBeGreaterThan(0);
    expect(vector.every((value) => Number.isFinite(value))).toBe(true);
  });
});
