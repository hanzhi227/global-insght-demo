import { askResponseSchema, type Category } from '../src/contracts';
import { cases } from '../evals/cases';

const base = (process.env.EVAL_BASE_URL ?? 'http://localhost:3000').replace(/\/$/, '');
let cookie = '';
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
  if (initialDocs.documents.length) throw new Error('Evaluation requires a disposable empty workspace.');
  for (const category of ['safety', 'maintenance', 'quality'] as Category[]) {
    const form = new FormData();
    form.set('category', category);
    form.set('file', new File([await Bun.file(`public/demo/${category}.md`).text()], `${category}.md`, { type: 'text/markdown' }));
    if (!(await request('/api/documents', { method: 'POST', body: form })).ok) throw new Error(`Fictional ${category} upload failed.`);
  }
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
      if (!item.statuses.includes(answer.status)) reasons.push(`status ${answer.status}`);
      if (item.categories && [...answer.categories].sort().join() !== [...item.categories].sort().join()) reasons.push(`route ${answer.categories.join(',')}`);
      if (answer.status === 'answered' && !answer.citations.length) reasons.push('missing citations');
      if (item.source && !answer.citations.some(c => c.category === item.source)) reasons.push(`missing ${item.source} evidence`);
      for (const citation of answer.citations) {
        const original = await Bun.file(`public/demo/${citation.category}.md`).text();
        const lines = original.replace(/\r\n?/g, '\n').split('\n');
        const span = lines.slice(citation.startLine - 1, citation.endLine).join('\n');
        if (!span.includes(citation.excerpt)) reasons.push('citation does not match exact fixture lines');
      }
    }
    if (reasons.length) failures++;
    console.log(`${reasons.length ? 'FAIL' : 'PASS'} ${index + 1}/${cases.length}: ${item.question}${reasons.length ? ' — ' + reasons.join('; ') : ''}`);
  }
  console.log(`${cases.length - failures}/${cases.length} cases passed. This checks routing/status/source mechanics, not semantic factual accuracy; human review remains required. Fictional evaluation documents remain stored in the disposable workspace.`);
  if (failures) process.exitCode = 1;
} catch (error) { console.error(error instanceof Error ? error.message : 'Evaluation failed.'); process.exitCode = 1; }
