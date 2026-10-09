import { mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { askResponseSchema } from '../src/contracts';
import { missingFacts } from '../evals/answer-checks';
import { loadCorpus } from '../evals/corpus';
import { cases } from '../evals/cases';

const base = (process.env.EVAL_BASE_URL ?? 'http://localhost:3000').replace(/\/$/, '');
let cookie = '';
const results: Record<string, unknown>[] = [];
const documents = await loadCorpus();
async function request(path: string, init: RequestInit = {}) {
  const response = await fetch(base + path, { ...init, headers: { Origin: new URL(base).origin, Cookie: cookie, ...init.headers }, signal: AbortSignal.timeout(130_000) });
  const setCookie = response.headers.get('set-cookie');
  if (setCookie) cookie = setCookie.split(';')[0];
  return response;
}
try {
  const health = await request('/api/health');
  if (!health.ok) throw new Error('App is not ready. Configure providers and run vector setup before live evals.');
  const initial = await request('/api/documents');
  if (!initial.ok) throw new Error('Workspace setup failed.');
  const initialDocs = await initial.json();
  if (initialDocs.documents.length !== documents.length || documents.some(doc => !initialDocs.documents.some((stored: { name: string; category: string }) => stored.name === doc.name && stored.category === doc.category))) throw new Error('The curated corpus does not match the fixtures. Run seed:corpus before evaluations.');
  if ((await request('/api/documents', { method: 'POST', body: 'Uploads must be rejected.' })).status !== 405) throw new Error('Public document uploads were not rejected.');
  const otherWorkspace = await fetch(base + '/api/documents');
  if (!otherWorkspace.ok || JSON.stringify((await otherWorkspace.json()).documents) !== JSON.stringify(initialDocs.documents)) throw new Error('Visitors did not receive the same shared corpus.');
  let failures = 0;
  for (const [index, item] of cases.entries()) {
    // Stay below the demo's per-workspace spending limit even with fast provider responses.
    if (index) await new Promise(resolve => setTimeout(resolve, 6500));
    const response = await request('/api/ask', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question: item.question }) });
    const parsed = askResponseSchema.safeParse(await response.json());
    const reasons: string[] = [];
    if (!response.ok || !parsed.success) reasons.push(`HTTP/provider/schema failure (${response.status})`);
    if (parsed.success && response.ok) {
      const answer = parsed.data;
      if (item.id) for (const fact of missingFacts(item.id, answer.answer)) reasons.push(`missing required fact: ${fact}`);
      if (!item.statuses.includes(answer.status)) reasons.push(`status ${answer.status}`);
      if (item.categories && [...answer.categories].sort().join() !== [...item.categories].sort().join()) reasons.push(`route ${answer.categories.join(',')}`);
      if (answer.status === 'answered' && !answer.citations.length) reasons.push('missing citations');
      for (const source of item.sources ?? []) if (!answer.citations.some(c => c.documentName === source)) reasons.push(`missing ${source} evidence`);
      for (const citation of answer.citations) {
        const original = documents.find(d => d.name === citation.documentName && d.category === citation.category)?.text;
        if (!original) { reasons.push('unknown citation document'); continue; }
        const lines = original.replace(/\r\n?/g, '\n').split('\n');
        const span = lines.slice(citation.startLine - 1, citation.endLine).join('\n');
        if (!span.includes(citation.excerpt)) reasons.push('citation does not match exact fixture lines');
      }
    }
    if (reasons.length) failures++;
    results.push({ id: item.id ?? `http-${index + 1}`, question: item.question, pass: !reasons.length, reasons, ...(parsed.success ? { answer: parsed.data } : {}) });
    console.log(`${reasons.length ? 'FAIL' : 'PASS'} ${index + 1}/${cases.length}: ${item.question}${reasons.length ? ' — ' + reasons.join('; ') : ''}`);
  }
  console.log(`${cases.length - failures}/${cases.length} cases passed. This checks routing/status/sources and required facts, not semantic entailment; human review remains required. Shared corpus was read without modifying stored documents.`);
  if (failures) process.exitCode = 1;
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Evaluation failed.');
  results.push({ id: 'suite-error', pass: false, error: error instanceof Error ? error.message : 'Evaluation failed.' });
  process.exitCode = 1;
} finally {
  await mkdir('evals/results', { recursive: true });
  await Bun.write('evals/results/api.json', JSON.stringify({ timestamp: new Date().toISOString(), base, corpusSha256: createHash('sha256').update(JSON.stringify(documents)).digest('hex'), models: { decision: process.env.OPENROUTER_DECISION_MODEL, embedding: process.env.OPENROUTER_EMBEDDING_MODEL, chat: process.env.OPENROUTER_CHAT_MODEL }, planned: cases.length, completed: results.filter(r => r.id !== 'suite-error').length, failures: results.filter(r => !r.pass).length, results }, null, 2));
  console.log('Report: evals/results/api.json');
}
