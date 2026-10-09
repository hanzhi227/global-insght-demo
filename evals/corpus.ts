import { readdir } from 'node:fs/promises';
import { categories, type Category } from '../src/contracts';
import { chunkText } from '../src/server/documents/chunking';
import type { EvidenceLabel } from './metrics';
export type CorpusDocument = { name: string; category: Category; text: string };
export async function loadCorpus(): Promise<CorpusDocument[]> {
  const documents: CorpusDocument[] = [];
  for (const category of categories) {
    const names = (await readdir(`public/demo/${category}`)).filter(n => n.endsWith('.md')).sort();
    if (names.length !== 3) throw new Error(`Expected three ${category} documents.`);
    for (const name of names) {
      const text = await Bun.file(`public/demo/${category}/${name}`).text();
      if (text.trim().split(/\s+/).length < 700 || !text.includes('Fictional demo document — not approved for real plant operations.')) throw new Error(`Invalid corpus document ${name}`);
      if (chunkText(text).map(c => c.text).join('') !== text) throw new Error(`Chunking lost text in ${name}`);
      documents.push({ name, category, text });
    }
  }
  const ids = new Set(documents.map(d => d.name.replace('.md', '').toUpperCase()));
  for (const doc of documents) for (const id of doc.text.match(/\b(?:SAF|MNT|QUA|OPS|QLT)-\d{3}\b/g) ?? []) if (!ids.has(id)) throw new Error(`Broken reference ${id} in ${doc.name}`);
  return documents;
}
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
