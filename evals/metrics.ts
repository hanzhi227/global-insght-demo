import type { Passage } from '../src/contracts';
export type EvidenceLabel = { documentName: string; startLine: number; endLine: number };
export function retrievalMetrics(passages: Passage[], labels: EvidenceLabel[]) {
  if (!labels.length) throw new Error('Recall requires at least one gold evidence span.');
  const relevant = (p: Passage, label: EvidenceLabel) => p.documentName === label.documentName && p.startLine <= label.endLine && p.endLine >= label.startLine;
  const hits = labels.filter(label => passages.some(p => relevant(p, label))).length;
  const first = passages.findIndex(p => labels.some(label => relevant(p, label)));
  return { recallAt6: hits / labels.length, reciprocalRank: first < 0 ? 0 : 1 / (first + 1), hit: hits > 0 };
}
export function cosine(a: number[], b: number[]): number {
  if (!a.length || a.length !== b.length || [...a, ...b].some(v => !Number.isFinite(v))) throw new Error('Invalid vectors.');
  let dot = 0, aa = 0, bb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; aa += a[i] ** 2; bb += b[i] ** 2; }
  if (!aa || !bb) throw new Error('Zero vector.');
  return dot / Math.sqrt(aa * bb);
}
