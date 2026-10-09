import { AppError } from './errors';
import { requiredEnv } from './config';
import type { ApiError } from '../contracts';

export function assertSameOrigin(request: Request): void {
  let expected: string;
  try { expected = new URL(requiredEnv('APP_ORIGIN')).origin; }
  catch (error) { if (error instanceof AppError) throw error; throw new AppError('INVALID_ORIGIN_CONFIGURATION', 'Server origin configuration is invalid.', 503, false); }
  if (request.headers.get('origin') !== expected || request.headers.get('sec-fetch-site') === 'cross-site') throw new AppError('ORIGIN_REJECTED', 'This request must come from the application.', 403, false);
}
export async function readBody(request: Request, limit: number): Promise<Uint8Array> {
  const declared = request.headers.get('content-length');
  if (declared && (!/^\d+$/.test(declared) || Number(declared) > limit)) throw new AppError('REQUEST_TOO_LARGE', 'The request is too large.', 413, false);
  if (!request.body) throw new AppError('EMPTY_REQUEST', 'The request body is empty.', 400, false);
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      request.signal.throwIfAborted();
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) throw new AppError('REQUEST_TOO_LARGE', 'The request is too large.', 413, false);
      chunks.push(value);
    }
  } catch (error) { await reader.cancel().catch(() => {}); throw error; }
  finally { reader.releaseLock(); }
  const result = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { result.set(chunk, offset); offset += chunk.length; }
  return result;
}
export function jsonResponse(body: unknown, status = 200, cookie?: string): Response {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store', ...(cookie ? { 'Set-Cookie': cookie } : {}) } });
}
export function errorResponse(error: unknown, requestId: string, cookie?: string): Response {
  const controlled = error instanceof AppError ? error : new AppError('REQUEST_FAILED', 'The request could not finish. Please try again.');
  const body: ApiError = { requestId, error: { code: controlled.code, message: controlled.message, retryable: controlled.retryable } };
  return jsonResponse(body, controlled.status, cookie);
}
