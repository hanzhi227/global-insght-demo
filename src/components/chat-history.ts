import { z } from 'zod';
import { askResponseSchema } from '@/contracts';
export const CHAT_STORAGE_KEY = 'plant-documentation-chats-v1';
export const MAX_SAVED_CHATS = 30;
const MAX_STORAGE_CHARS = 1_000_000;
const turnSchema = z.object({ question: z.string().trim().min(1).max(1000), savedAt: z.iso.datetime(), response: askResponseSchema }).strict();
const historySchema = z.object({ version: z.literal(1), turns: z.array(turnSchema).max(MAX_SAVED_CHATS) }).strict().refine(history => new Set(history.turns.map(t => t.response.requestId)).size === history.turns.length);
export type ChatTurn = z.infer<typeof turnSchema>;
export function readChats(storage: Pick<Storage, 'getItem'>): ChatTurn[] {
  const raw = storage.getItem(CHAT_STORAGE_KEY);
  if (raw === null) return [];
  if (raw.length > MAX_STORAGE_CHARS) throw new Error('Saved history exceeds its limit.');
  return historySchema.parse(JSON.parse(raw)).turns;
}
export function writeChats(storage: Pick<Storage, 'setItem'>, turns: ChatTurn[]): ChatTurn[] {
  const history = historySchema.parse({ version: 1, turns: turns.slice(-MAX_SAVED_CHATS) });
  const raw = JSON.stringify(history);
  if (raw.length > MAX_STORAGE_CHARS) throw new Error('Saved history exceeds its limit.');
  storage.setItem(CHAT_STORAGE_KEY, raw);
  return history.turns;
}
