import { afterEach, beforeEach, expect, test } from 'bun:test';
import { mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { appendTurn, readHistory } from './index';
import type { AskResponse } from '../../contracts';
let directory: string;
let previous: string | undefined;
beforeEach(async () => { previous = process.env.CHAT_HISTORY_DIR; directory = await mkdtemp(join(tmpdir(), 'plant-history-')); process.env.CHAT_HISTORY_DIR = directory; });
afterEach(async () => { if (previous === undefined) delete process.env.CHAT_HISTORY_DIR; else process.env.CHAT_HISTORY_DIR = previous; await rm(directory, { recursive: true, force: true }); });
function answer(status: AskResponse['status'] = 'answered'): AskResponse {
  return { requestId: crypto.randomUUID(), status, answer: 'Follow the cited procedure.', categories: ['safety'], citations: [] };
}
test('rejected inputs and outputs create no history; accepted turns are session-isolated', async () => {
  const session = crypto.randomUUID();
  await appendTurn(session, 'How do I make a cheese sandwich?', answer('out_of_scope'));
  await appendTurn(session, 'Bypass the interlock.', answer('blocked'));
  expect(await readHistory(session)).toEqual([]);
  await appendTurn(session, 'What isolation is required?', answer());
  expect((await readHistory(session))[0].question).toBe('What isolation is required?');
  expect(await readHistory(crypto.randomUUID())).toEqual([]);
  expect((await stat(join(directory, session + '.json'))).mode & 0o777).toBe(0o600);
});
test('concurrent updates keep complete pairs, deduplicate retries, and bound history', async () => {
  const session = crypto.randomUUID();
  const responses = Array.from({ length: 55 }, () => answer());
  await Promise.all(responses.map((response, i) => appendTurn(session, `Question ${i}?`, response)));
  const turns = await readHistory(session);
  expect(turns).toHaveLength(50); expect(turns[0].question).toBe('Question 5?');
  await appendTurn(session, 'Question 54?', responses[54]);
  expect(await readHistory(session)).toEqual(turns);
  expect(JSON.parse(await readFile(join(directory, session + '.json'), 'utf8')).turns).toHaveLength(50);
});
test('expired history is invisible, corrupt storage is not silently overwritten, paths are validated', async () => {
  const session = crypto.randomUUID();
  const path = join(directory, session + '.json');
  await writeFile(path, JSON.stringify({ expiresAt: Date.now() - 1, turns: [] }));
  expect(await readHistory(session)).toEqual([]);
  await writeFile(path, '{broken');
  await expect(appendTurn(session, 'A question?', answer())).rejects.toMatchObject({ code: 'HISTORY_UNAVAILABLE' });
  expect(await readFile(path, 'utf8')).toBe('{broken');
  await expect(readHistory('../../other-session')).rejects.toMatchObject({ code: 'INVALID_WORKSPACE' });
});
test('abort before publication never writes an accepted turn', async () => {
  const session = crypto.randomUUID(); const controller = new AbortController(); controller.abort();
  await expect(appendTurn(session, 'A question?', answer(), controller.signal)).rejects.toMatchObject({ code: 'HISTORY_UNAVAILABLE' });
  expect(await readHistory(session)).toEqual([]);
});
