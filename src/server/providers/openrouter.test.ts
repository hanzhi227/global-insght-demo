import { expect, spyOn, test } from 'bun:test';
import { generateDraft } from './openrouter';
test('chat disables reasoning to reserve its bounded token budget for structured output', async () => {
  const previous = { key: process.env.OPENROUTER_API_KEY, model: process.env.OPENROUTER_CHAT_MODEL };
  process.env.OPENROUTER_API_KEY = 'test-key'; process.env.OPENROUTER_CHAT_MODEL = 'test/model';
  const id = crypto.randomUUID();
  const draft = { status: 'answered' as const, answer: 'Supported.', citationIds: [id], citationQuotes: { [id]: 'x'.repeat(350) } };
  const fetch = spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ id: 'test', object: 'chat.completion', created: 1, model: 'test/model', choices: [{ index: 0, finish_reason: 'stop', message: { role: 'assistant', content: JSON.stringify(draft) } }] }), { headers: { 'Content-Type': 'application/json' } }));
  try {
    expect(await generateDraft('Question?', '[]')).toEqual(draft);
    const body = JSON.parse(String(fetch.mock.calls[0][1]?.body));
    expect(body.reasoning).toEqual({ enabled: false });
    expect(body.response_format).toEqual({ type: 'json_object' });
    expect(body.max_tokens).toBe(1000);
    expect(body.messages[0].content).toContain('acceptance/failure rules and small-lot exceptions');
    expect(body.messages[0].content).toContain('remove unsupported claims');
  } finally {
    fetch.mockRestore();
    if (previous.key === undefined) delete process.env.OPENROUTER_API_KEY; else process.env.OPENROUTER_API_KEY = previous.key;
    if (previous.model === undefined) delete process.env.OPENROUTER_CHAT_MODEL; else process.env.OPENROUTER_CHAT_MODEL = previous.model;
  }
});
