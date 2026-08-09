import { describe, it, expect, beforeAll } from 'vitest';
import supertest from 'supertest';
import { createApp } from '../src/server';

describe('GET /health', () => {
  let request: ReturnType<typeof supertest>;

  beforeAll(() => {
    const { app } = createApp();
    request = supertest(app);
  });

  it('returns 200', async () => {
    const res = await request.get('/health');
    expect(res.status).toBe(200);
  });

  it('returns status ok', async () => {
    const res = await request.get('/health');
    expect(res.body.status).toBe('ok');
  });

  it('returns uptime as a number', async () => {
    const res = await request.get('/health');
    expect(typeof res.body.uptime).toBe('number');
    expect(res.body.uptime).toBeGreaterThanOrEqual(0);
  });

  it('returns a valid ISO timestamp', async () => {
    const res = await request.get('/health');
    expect(typeof res.body.timestamp).toBe('string');
    expect(new Date(res.body.timestamp).toISOString()).toBe(res.body.timestamp);
  });
});
