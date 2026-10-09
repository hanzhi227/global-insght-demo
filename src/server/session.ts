import { createHmac, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import { requiredEnv } from './config';
import { AppError } from './errors';

const COOKIE = 'plant_workspace';
const TTL_SECONDS = 7 * 24 * 60 * 60;
function signingSecret(): string {
  const secret = requiredEnv('SESSION_SIGNING_SECRET');
  if (secret.length < 32) throw new AppError('INVALID_SESSION_SECRET', 'Workspace configuration is incomplete.', 503, false);
  return secret;
}
export function signWorkspace(id: string, expires: number, secret: string): string {
  const data = `${id}.${expires}`;
  return `${data}.${createHmac('sha256', secret).update(data).digest('base64url')}`;
}
export function verifyWorkspace(value: string, secret: string, now = Date.now()): string | undefined {
  const parts = value.split('.');
  if (parts.length !== 3) return;
  const [id, expires, signature] = parts;
  if (!z.string().uuid().safeParse(id).success || !/^\d{13}$/.test(expires) || Number(expires) <= now || Number(expires) > now + TTL_SECONDS * 1000) return;
  const expected = signWorkspace(id, Number(expires), secret).split('.')[2];
  const received = Buffer.from(signature);
  const correct = Buffer.from(expected);
  return received.length === correct.length && timingSafeEqual(received, correct) ? id : undefined;
}
export function workspaceFor(request: Request): { id: string; cookie?: string } {
  const secret = signingSecret();
  const raw = request.headers.get('cookie')?.split(';').map(s => s.trim()).find(s => s.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1);
  const existing = raw && verifyWorkspace(raw, secret);
  if (existing) return { id: existing };
  const id = crypto.randomUUID();
  const value = signWorkspace(id, Date.now() + TTL_SECONDS * 1000, secret);
  return { id, cookie: `${COOKIE}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${TTL_SECONDS}${process.env.NODE_ENV === 'production' ? '; Secure' : ''}` };
}
