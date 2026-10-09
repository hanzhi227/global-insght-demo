import { mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, join } from 'node:path';
import { z } from 'zod';
import { askRequestSchema, askResponseSchema, type AskResponse } from '../../contracts';
import { AppError } from '../errors';

const MAX_TURNS = 50;
const TTL_MS = 7 * 24 * 60 * 60 * 1000;
const acceptedStatuses = ['answered', 'needs_clarification', 'insufficient_evidence'];
const turnSchema = z.object({ question: askRequestSchema.shape.question, response: askResponseSchema.refine(r => acceptedStatuses.includes(r.status)), createdAt: z.string().datetime() }).strict();
const historySchema = z.object({ expiresAt: z.number().int().positive(), turns: z.array(turnSchema).max(MAX_TURNS) }).strict();
export type ChatTurn = z.infer<typeof turnSchema>;
const writes = new Map<string, Promise<void>>();

function filename(sessionId: string): string {
  if (!z.string().uuid().safeParse(sessionId).success) throw new AppError('INVALID_WORKSPACE', 'Invalid workspace.', 400, false);
  const directory = process.env.CHAT_HISTORY_DIR?.trim();
  if ((directory && !isAbsolute(directory)) || (!directory && process.env.NODE_ENV === 'production'))
    throw new AppError('HISTORY_CONFIGURATION_MISSING', 'Persistent chat storage is not configured.', 503, false);
  return join(directory || join(process.cwd(), '.data', 'chat-history'), sessionId + '.json');
}
function unavailable(): AppError { return new AppError('HISTORY_UNAVAILABLE', 'Chat history could not be saved or loaded. Please try again.'); }

export async function checkHistoryReadiness(): Promise<void> {
  const directory = dirname(filename(crypto.randomUUID()));
  const probe = join(directory, crypto.randomUUID() + '.tmp');
  try {
    await mkdir(directory, { recursive: true, mode: 0o700 });
    await writeFile(probe, '', { mode: 0o600, flag: 'wx' });
    await unlink(probe);
  } catch { throw unavailable(); }
}

export async function readHistory(sessionId: string): Promise<ChatTurn[]> {
  const path = filename(sessionId);
  try {
    let text: string;
    try { text = await readFile(path, 'utf8'); }
    catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') return []; throw error; }
    const history = historySchema.parse(JSON.parse(text));
    // shortcut: expired files are ignored on access; schedule directory cleanup before long-term production use.
    if (history.expiresAt <= Date.now()) return [];
    return history.turns;
  } catch { throw unavailable(); }
}

/** One process/replica; serialize updates and atomically publish complete user/assistant pairs. */
export async function appendTurn(sessionId: string, question: string, response: AskResponse, signal?: AbortSignal): Promise<void> {
  if (!acceptedStatuses.includes(response.status)) return;
  const path = filename(sessionId);
  const turn = turnSchema.parse({ question, response, createdAt: new Date().toISOString() });
  const previous = writes.get(sessionId) ?? Promise.resolve();
  const next = previous.catch(() => {}).then(async () => {
    const turns = await readHistory(sessionId);
    if (turns.some(t => t.response.requestId === response.requestId)) return;
    signal?.throwIfAborted();
    const directory = dirname(path);
    await mkdir(directory, { recursive: true, mode: 0o700 });
    const temporary = path + '.' + crypto.randomUUID() + '.tmp';
    try {
      await writeFile(temporary, JSON.stringify({ expiresAt: Date.now() + TTL_MS, turns: [...turns, turn].slice(-MAX_TURNS) }), { mode: 0o600, flag: 'wx' });
      signal?.throwIfAborted();
      await rename(temporary, path);
    } finally { await unlink(temporary).catch(error => { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }); }
  });
  writes.set(sessionId, next);
  try { await next; }
  catch { throw unavailable(); }
  finally { if (writes.get(sessionId) === next) writes.delete(sessionId); }
}
