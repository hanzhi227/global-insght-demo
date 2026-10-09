import { expect, spyOn, test } from 'bun:test';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import * as workflow from '../workflow';
import { POST } from '../../app/api/ask/route';
import { GET } from '../../app/api/history/route';

test('HTTP history stores only accepted pairs, isolates cookies, and fails closed when storage is unavailable', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'plant-history-api-'));
  const previous = { directory: process.env.CHAT_HISTORY_DIR, secret: process.env.SESSION_SIGNING_SECRET, origin: process.env.APP_ORIGIN };
  process.env.CHAT_HISTORY_DIR = directory;
  process.env.SESSION_SIGNING_SECRET = 'test-secret-long-enough-for-cookie-signing';
  process.env.APP_ORIGIN = 'http://localhost:3000';
  const answer = spyOn(workflow, 'answerQuestion').mockImplementation(async question => ({ requestId: crypto.randomUUID(), status: question.includes('sandwich') ? 'out_of_scope' : 'answered', answer: 'Checked response.', categories: [], citations: [] }));
  try {
    const initial = await GET(new Request('http://localhost:3000/api/history'));
    const cookie = initial.headers.get('set-cookie')!.split(';')[0];
    expect(await initial.json()).toEqual({ turns: [] });
    const ask = (question: string) => POST(new Request('http://localhost:3000/api/ask', { method: 'POST', headers: { cookie, origin: 'http://localhost:3000', 'content-type': 'application/json' }, body: JSON.stringify({ question }) }));
    expect((await ask('How do I make a cheese sandwich?')).status).toBe(200);
    const read = () => GET(new Request('http://localhost:3000/api/history', { headers: { cookie } }));
    expect(await (await read()).json()).toEqual({ turns: [] });
    const accepted = await ask('What inspection is required?');
    const body = await accepted.json(); expect(accepted.status).toBe(200);
    const history = await (await read()).json();
    expect(history.turns).toHaveLength(1); expect(history.turns[0].response.requestId).toBe(body.requestId);
    expect(history.turns[0].question).toBe('What inspection is required?');
    expect(await (await GET(new Request('http://localhost:3000/api/history'))).json()).toEqual({ turns: [] });
    expect((await GET(new Request('http://localhost:3000/api/history', { headers: { cookie, origin: 'https://other.example' } }))).status).toBe(403);
    const blocker = join(directory, 'not-a-directory'); await writeFile(blocker, 'private-storage-error');
    process.env.CHAT_HISTORY_DIR = blocker;
    const failed = await ask('What inspection is required?');
    expect(failed.status).toBe(503);
    const error = await failed.json(); expect(error.error.code).toBe('HISTORY_UNAVAILABLE');
    expect(JSON.stringify(error)).not.toContain('private-storage-error'); expect(JSON.stringify(error)).not.toContain(directory);
  } finally {
    answer.mockRestore();
    for (const [name, value] of [['CHAT_HISTORY_DIR', previous.directory], ['SESSION_SIGNING_SECRET', previous.secret], ['APP_ORIGIN', previous.origin]] as const) { if (value === undefined) delete process.env[name]; else process.env[name] = value; }
    await rm(directory, { recursive: true, force: true });
  }
});
