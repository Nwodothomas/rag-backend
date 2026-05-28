import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createServerApp } from '../src/server.js';

describe('routes', () => {
  const app = createServerApp();

  it('returns health information', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
  });

  it('rejects upload without admin authentication', async () => {
    const response = await request(app).post('/upload/url').send({ url: 'https://example.com' });

    expect(response.status).toBe(401);
  });
});
