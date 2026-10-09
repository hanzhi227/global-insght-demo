import { expect, test } from 'bun:test';
import { CHAT_STORAGE_KEY, MAX_SAVED_CHATS, readChats, writeChats, type ChatTurn } from './chat-history';
function store() {
  const values = new Map<string, string>();
  return { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); }, removeItem: (key: string) => { values.delete(key); } };
}
function turn(question = 'What checks are required?'): ChatTurn {
  return { question, savedAt: new Date().toISOString(), response: { requestId: crypto.randomUUID(), status: 'answered', answer: 'Use the approved procedure.', categories: ['safety'], citations: [{ id: crypto.randomUUID(), documentId: crypto.randomUUID(), documentName: 'saf-001.md', category: 'safety', startLine: 1, endLine: 1, excerpt: 'Use the approved procedure.' }] } };
}
test('browser history round-trips questions, answers, categories and exact citations', () => {
  const storage = store(); const entries = [turn()];
  expect(readChats(storage)).toEqual([]);
  expect(writeChats(storage, entries)).toEqual(entries);
  expect(readChats(storage)).toEqual(entries);
  storage.removeItem(CHAT_STORAGE_KEY);
  expect(readChats(storage)).toEqual([]);
});
test('retention keeps the latest 30 chats and leaves the input array intact', () => {
  const storage = store(); const entries = Array.from({ length: MAX_SAVED_CHATS + 3 }, (_, i) => turn(`Question ${i}`));
  expect(writeChats(storage, entries)).toEqual(entries.slice(3));
  expect(readChats(storage)).toHaveLength(MAX_SAVED_CHATS);
  expect(entries).toHaveLength(MAX_SAVED_CHATS + 3);
});
test('corrupt, oversized, unknown-version and duplicate history is rejected without overwriting it', () => {
  const storage = store(); const entry = turn();
  for (const raw of ['bad JSON', 'x'.repeat(1_000_001), JSON.stringify({ version: 2, turns: [] }), JSON.stringify({ version: 1, turns: [entry, entry] }), JSON.stringify({ version: 1, turns: [{ ...entry, response: { answer: 'Forged' } }] })]) {
    storage.setItem(CHAT_STORAGE_KEY, raw);
    expect(() => readChats(storage)).toThrow();
    expect(storage.getItem(CHAT_STORAGE_KEY)).toBe(raw);
  }
});
test('unavailable storage reports a failure instead of claiming chats are saved', () => {
  expect(() => readChats({ getItem: () => { throw new Error('Unavailable'); } })).toThrow();
  expect(() => writeChats({ setItem: () => { throw new Error('Quota exceeded'); } }, [turn()])).toThrow();
});
