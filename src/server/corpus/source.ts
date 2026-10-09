import { readdir, readFile } from 'node:fs/promises';
import { categories, type Category } from '../../contracts';
import { chunkText } from '../documents/chunking';
export type CorpusDocument = { name: string; category: Category; text: string };
export async function loadCorpus(): Promise<CorpusDocument[]> {
  const documents: CorpusDocument[] = [];
  for (const category of categories) {
    const names = (await readdir(`public/demo/${category}`)).filter(n => n.endsWith('.md')).sort();
    if (names.length !== 3) throw new Error(`Expected three ${category} documents.`);
    for (const name of names) {
      const text = new TextDecoder('utf-8', { fatal: true }).decode(await readFile(`public/demo/${category}/${name}`));
      if (text.trim().split(/\s+/).length < 700 || !text.includes('Fictional demo document — not approved for real plant operations.')) throw new Error(`Invalid corpus document ${name}`);
      if (chunkText(text).map(c => c.text).join('') !== text) throw new Error(`Chunking lost text in ${name}`);
      documents.push({ name, category, text });
    }
  }
  const ids = new Set(documents.map(d => d.name.replace('.md', '').toUpperCase()));
  for (const doc of documents) for (const id of doc.text.match(/\b(?:SAF|MNT|QUA|OPS|QLT)-\d{3}\b/g) ?? []) if (!ids.has(id)) throw new Error(`Broken reference ${id} in ${doc.name}`);
  return documents;
}
