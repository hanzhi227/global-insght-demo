import { mkdir } from 'node:fs/promises';
import { checkSafety, routeQuestion } from '../src/server/guardrails';
import { decisionChoice } from '../src/server/providers/openrouter';
import { guardCases, routingCases } from '../evals/decisions';
import { AppError } from '../src/server/errors';

const results: { id: string; suite: string; pass: boolean; expected: unknown; actual?: unknown; error?: string; ms: number }[] = [];
for (const item of [...guardCases.map(c => ({ ...c, suite: 'guard' })), ...routingCases.map(c => ({ ...c, suite: 'route' }))]) {
  const started = Date.now();
  const expected = 'allow' in item ? item.allow : { kind: item.kind ?? 'retrieve', ...('categories' in item && item.categories ? { categories: item.categories } : {}) };
  try {
    const signal = AbortSignal.timeout(35_000);
    const actual = 'allow' in item ? await checkSafety(item.text, decisionChoice, signal) : await routeQuestion(item.question, decisionChoice, signal);
    const pass = JSON.stringify(actual) === JSON.stringify(expected);
    results.push({ id: item.id, suite: item.suite, pass, expected, actual, ms: Date.now() - started });
    console.log(`${pass ? 'PASS' : 'FAIL'} ${item.suite}/${item.id}: ${JSON.stringify(actual)}`);
  } catch (error) {
    const code = error instanceof AppError ? error.code : 'EVALUATION_ERROR';
    results.push({ id: item.id, suite: item.suite, pass: false, expected, error: code, ms: Date.now() - started });
    console.log(`ERROR ${item.suite}/${item.id}: ${code}`);
    // An unavailable provider is a blocker, not 34 independent model-quality failures.
    if (['PROVIDER_UNAVAILABLE', 'CONFIGURATION_MISSING'].includes(code)) break;
  }
}
await mkdir('evals/results', { recursive: true });
await Bun.write('evals/results/decisions.json', JSON.stringify({ timestamp: new Date().toISOString(), model: process.env.OPENROUTER_DECISION_MODEL, planned: guardCases.length + routingCases.length, completed: results.length, results }, null, 2));
console.log(`Live decisions: ${results.filter(r => r.pass).length}/${results.length} passed; report evals/results/decisions.json`);
if (results.length !== guardCases.length + routingCases.length || results.some(r => !r.pass)) process.exitCode = 1;
