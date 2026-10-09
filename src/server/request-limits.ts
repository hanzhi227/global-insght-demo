import { AppError } from './errors';
type Counter = { count: number; expires: number };
const counters = new Map<string, Counter>();
function take(key: string, max: number, windowMs: number, now: number): void {
  let counter = counters.get(key);
  if (!counter || counter.expires <= now) { counter = { count: 0, expires: now + windowMs }; counters.set(key, counter); }
  if (counter.count >= max) throw new AppError('RATE_LIMITED', 'Too many requests. Wait a moment and try again.', 429, true);
  counter.count++;
}
// shortcut: limits and upload locks are process-local, use shared limits before adding replicas.
export function admitRequest(workspaceId: string, operation: 'read' | 'ask' | 'upload'): void {
  const now = Date.now();
  for (const [key, value] of counters) if (value.expires <= now) counters.delete(key);
  if (counters.size >= 5000) throw new AppError('RATE_LIMITED', 'The demo is busy. Please try again shortly.', 429, true);
  take('global', 90, 60_000, now);
  take(`${workspaceId}:all`, 30, 60_000, now);
  if (operation === 'upload') { take('global:uploads', 20, 3_600_000, now); take(`${workspaceId}:uploads`, 8, 3_600_000, now); }
  if (operation === 'ask') { take('global:asks', 200, 3_600_000, now); take(`${workspaceId}:asks`, 10, 60_000, now); }
}
