import { describe, expect, test } from 'bun:test';
import { signWorkspace, verifyWorkspace } from './session';
import { readBody, assertSameOrigin, errorResponse } from './http';
import { AppError } from './errors';
import { admitRequest } from './request-limits';

const secret = 'test-secret-long-enough-for-cookie-signing';
const id = 'adbe0d5a-d297-4682-a96e-2473b1ebfcef';
describe('workspace ownership', () => {
  test('signed, unexpired ID accepted; altered and expired IDs rejected', () => {
    const now = Date.now(); const signed = signWorkspace(id, now + 1000, secret);
    expect(verifyWorkspace(signed, secret, now)).toBe(id);
    expect(verifyWorkspace(signed.replace(id, crypto.randomUUID()), secret, now)).toBeUndefined();
    expect(verifyWorkspace(signed, 'different-secret', now)).toBeUndefined();
    expect(verifyWorkspace(signed, secret, now + 1001)).toBeUndefined();
    expect(verifyWorkspace('invalid', secret, now)).toBeUndefined();
  });
});
describe('HTTP boundaries', () => {
  test('enforces actual body length even without Content-Length', async () => {
    await expect(readBody(new Request('http://localhost', { method: 'POST', body: '12345' }), 4)).rejects.toMatchObject({ status: 413 });
    expect(new TextDecoder().decode(await readBody(new Request('http://localhost', { method: 'POST', body: '1234' }), 4))).toBe('1234');
  });
  test('only configured origin can mutate', () => {
    const previous = process.env.APP_ORIGIN; process.env.APP_ORIGIN = 'http://localhost:3000';
    try {
      expect(() => assertSameOrigin(new Request('http://localhost:3000', { headers: { origin: 'http://localhost:3000' } }))).not.toThrow();
      expect(() => assertSameOrigin(new Request('http://localhost:3000', { headers: { origin: 'https://attacker.test' } }))).toThrow(AppError);
      expect(() => assertSameOrigin(new Request('http://localhost:3000'))).toThrow(AppError);
    } finally { if (previous === undefined) delete process.env.APP_ORIGIN; else process.env.APP_ORIGIN = previous; }
  });
  test('unexpected errors do not leak internals', async () => {
    const response = errorResponse(new Error('private-token'), crypto.randomUUID());
    expect(response.status).toBe(503); expect(await response.text()).not.toContain('private-token');
  });
  test('per-workspace ask budget blocks request eleven', () => {
    const workspace = crypto.randomUUID();
    for (let i = 0; i < 10; i++) admitRequest(workspace, 'ask');
    expect(() => admitRequest(workspace, 'ask')).toThrow(AppError);
  });
});
