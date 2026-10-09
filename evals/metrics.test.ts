import { expect, test } from 'bun:test';
import { cosine, retrievalMetrics } from './metrics';
import type { Passage } from '../src/contracts';
import { categories } from '../src/contracts';
import { routeQuestion } from '../src/server/guardrails';
const p: Passage = { id: crypto.randomUUID(), documentId: crypto.randomUUID(), documentName: 'saf-001.md', category: 'safety', startLine: 10, endLine: 20, excerpt: 'Evidence' };
test('recall counts evidence spans, not just document presence', () => {
  const labels = [{ documentName: p.documentName, startLine: 12, endLine: 13 }, { documentName: p.documentName, startLine: 30, endLine: 31 }];
  expect(retrievalMetrics([p], labels)).toEqual({ recallAt6: 0.5, reciprocalRank: 1, hit: true });
  expect(retrievalMetrics([{ ...p, documentName: 'other.md' }], labels).recallAt6).toBe(0);
  expect(() => retrievalMetrics([], [])).toThrow();
});
test('cosine validates vectors and produces expected ranking', () => {
  expect(cosine([1, 0], [1, 0])).toBe(1);
  expect(cosine([1, 0], [0, 1])).toBe(0);
  expect(() => cosine([0, 0], [1, 0])).toThrow();
  expect(() => cosine([1], [1, 0])).toThrow();
});
test('every four-category combination preserves human category labels', async () => {
  for (let mask = 1; mask < 1 << categories.length; mask++) {
    const selected = categories.filter((_, i) => mask & (1 << i));
    const choice = selected.length === 4 ? 'all' : selected.join('_');
    const result = await routeQuestion('Manufacturing question', async input => { expect(input.criteria[choice]).toBeDefined(); return choice; }, new AbortController().signal);
    expect(result).toEqual({ kind: 'retrieve', categories: selected });
  }
});
