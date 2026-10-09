import { expect, spyOn, test } from 'bun:test';
import * as workflow from '../workflow';
import * as history from './index';
import { POST } from '../../app/api/ask/route';
import { GET } from '../../app/api/history/route';

test('questions need no server history storage and the retired endpoint exposes no history', async () => {
  const previous = { directory: process.env.CHAT_HISTORY_DIR, secret: process.env.SESSION_SIGNING_SECRET, origin: process.env.APP_ORIGIN };
  process.env.CHAT_HISTORY_DIR = 'invalid-relative-directory';
  process.env.SESSION_SIGNING_SECRET = 'test-secret-long-enough-for-cookie-signing';
  process.env.APP_ORIGIN = 'http://localhost:3000';
  const answer = spyOn(workflow, 'answerQuestion').mockImplementation(async () => ({ requestId: crypto.randomUUID(), status: 'answered', answer: 'Checked response.', categories: [], citations: [] }));
  const append = spyOn(history, 'appendTurn').mockRejectedValue(new Error('Server history must not be written.'));
  const read = spyOn(history, 'readHistory').mockRejectedValue(new Error('Server history must not be read.'));
  try {
    const response = await POST(new Request('http://localhost:3000/api/ask', { method: 'POST', headers: { origin: 'http://localhost:3000', 'content-type': 'application/json' }, body: JSON.stringify({ question: 'What inspection is required?' }) }));
    expect(response.status).toBe(200);
    expect((await response.json()).answer).toBe('Checked response.');
    expect(GET().status).toBe(410);
    expect(GET().headers.get('set-cookie')).toBeNull();
    expect(append).not.toHaveBeenCalled(); expect(read).not.toHaveBeenCalled();
  } finally {
    answer.mockRestore(); append.mockRestore(); read.mockRestore();
    for (const [name, value] of [['CHAT_HISTORY_DIR', previous.directory], ['SESSION_SIGNING_SECRET', previous.secret], ['APP_ORIGIN', previous.origin]] as const) { if (value === undefined) delete process.env[name]; else process.env[name] = value; }
  }
});
