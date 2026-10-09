import type { EvidenceLabel } from './metrics';
import type { CorpusDocument } from '../src/server/corpus/source';
export { loadCorpus, type CorpusDocument } from '../src/server/corpus/source';
export function goldLabels(documents: CorpusDocument[], evidence: { documentName: string; anchor: string }[]): EvidenceLabel[] {
  return evidence.map(item => {
    const doc = documents.find(d => d.name === item.documentName);
    if (!doc) throw new Error(`Missing gold document ${item.documentName}`);
    const lines = doc.text.split('\n');
    const start = lines.findIndex(l => l.startsWith(item.anchor));
    if (start < 0 || lines.filter(l => l.startsWith(item.anchor)).length !== 1) throw new Error(`Invalid gold anchor ${item.anchor}`);
    let end = start;
    while (end + 1 < lines.length && lines[end + 1].trim()) end++;
    return { documentName: doc.name, startLine: start + 1, endLine: end + 1 };
  });
}
