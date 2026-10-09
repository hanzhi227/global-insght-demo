import { expect, spyOn, test } from 'bun:test';
import { verifyAnswer } from './index';
import type { AskResponse, Passage } from '../../contracts';
const source: Passage = { id: crypto.randomUUID(), documentId: crypto.randomUUID(), documentName: 'procedure.md', category: 'safety', startLine: 1, endLine: 2, excerpt: 'Restart is permitted only after inspection.\nAuthorization is required.' };
const answer: AskResponse = { requestId: crypto.randomUUID(), status: 'answered', answer: 'Restart is permitted.', categories: ['safety'], citations: [{ ...source, excerpt: 'Restart is permitted', endLine: 1 }] };
for (const [name, verdict, expected] of [['supported', { supported: true }, true], ['unsupported', { supported: false }, false], ['invalid boolean', { supported: 'true' }, null], ['invalid envelope', { answer: 'yes' }, null]] as const) {
  test(`independent evidence validator: ${name}`, async () => {
    const previous = { key: process.env.OPENROUTER_API_KEY, model: process.env.OPENROUTER_CHAT_MODEL };
    process.env.OPENROUTER_API_KEY = 'test-private-key'; process.env.OPENROUTER_CHAT_MODEL = 'test/model';
    const fetch = spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ id: 'test', object: 'chat.completion', created: 1, model: 'test/model', choices: [{ index: 0, finish_reason: 'stop', message: { role: 'assistant', content: JSON.stringify(verdict) } }] }), { headers: { 'Content-Type': 'application/json' } }));
    try {
      const result = verifyAnswer('May I restart?', answer, [source]);
      if (expected === null) await expect(result).rejects.toMatchObject({ code: 'VERIFICATION_UNAVAILABLE' });
      else expect(await result).toBe(expected);
      const body = JSON.parse(String(fetch.mock.calls[0][1]?.body));
      expect(body.messages[0].content).toContain('EVERY substantive claim');
      expect(body.messages[0].content).toContain('acceptance/failure rules');
      const input = JSON.parse(body.messages[1].content);
      expect(input.passages[0].excerpt).toBe(source.excerpt);
      expect(input.citations[0].excerpt).toBe(answer.citations[0].excerpt);
      expect(JSON.stringify(body.messages)).not.toContain('test-private-key');
    } finally {
      fetch.mockRestore();
      if (previous.key === undefined) delete process.env.OPENROUTER_API_KEY; else process.env.OPENROUTER_API_KEY = previous.key;
      if (previous.model === undefined) delete process.env.OPENROUTER_CHAT_MODEL; else process.env.OPENROUTER_CHAT_MODEL = previous.model;
    }
  });
}
