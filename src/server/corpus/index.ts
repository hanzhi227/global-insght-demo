import { createHash } from 'node:crypto';
import { completedDocuments } from '../documents';
import { chunkText } from '../documents/chunking';
import { AppError } from '../errors';
import { embedTexts } from '../providers/openrouter';
import { getVectorStore, type VectorReader, type VectorStore } from '../retrieval/vector-store';
import { loadCorpus, type CorpusDocument } from './source';

function corpusId(value: string): string {
  const hash = createHash('sha256').update(value).digest('hex');
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-8${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
}
export function describeCorpus(documents: CorpusDocument[]) {
  const sources = documents.map(doc => ({ ...doc, chunks: chunkText(doc.text) }));
  const hash = createHash('sha256').update('curated-corpus-v2:').update(JSON.stringify(sources)).digest('hex');
  const workspaceId = corpusId(hash);
  return { workspaceId, hash, documents: sources };
}
export type CuratedCorpus = ReturnType<typeof describeCorpus>;
let corpus: Promise<CuratedCorpus> | undefined;
export function getCuratedCorpus(): Promise<CuratedCorpus> {
  return corpus ??= loadCorpus().then(describeCorpus);
}
export async function curatedDocuments(store: VectorReader, corpus: CuratedCorpus, signal?: AbortSignal) {
  signal?.throwIfAborted();
  const rows = await store.queryChunks(corpus.workspaceId);
  const documents = completedDocuments(rows);
  if (documents.length !== corpus.documents.length || rows.length !== corpus.documents.reduce((count, doc) => count + doc.chunks.length, 0) || corpus.documents.some(source => {
    const matching = documents.filter(d => d.name === source.name && d.category === source.category && d.chunkCount === source.chunks.length);
    return matching.length !== 1;
  })) throw new AppError('CORPUS_NOT_READY', 'The plant documents are not ready. Contact the demo operator.', 503, true);
  signal?.throwIfAborted();
  return documents;
}
export async function listCuratedDocuments(signal?: AbortSignal) {
  return curatedDocuments(getVectorStore(), await getCuratedCorpus(), signal);
}
export async function curatedWorkspace(signal?: AbortSignal): Promise<string> {
  const corpus = await getCuratedCorpus();
  await curatedDocuments(getVectorStore(), corpus, signal);
  return corpus.workspaceId;
}

export async function seedCorpus(store: VectorStore, corpus: CuratedCorpus, embed: typeof embedTexts = embedTexts) {
  const rows = await store.queryChunks(corpus.workspaceId);
  const existing = completedDocuments(rows);
  const expected = new Map(corpus.documents.map(doc => [doc.name, doc]));
  if (rows.some(row => !expected.has(row.documentName) || expected.get(row.documentName)!.category !== row.category) || existing.some(doc => doc.chunkCount !== expected.get(doc.name)!.chunks.length) || new Set(existing.map(doc => doc.name)).size !== existing.length)
    throw new AppError('CORPUS_CONFLICT', 'Unexpected data exists in the curated corpus namespace; no data was changed.', 409, false);
  let inserted = 0;
  for (const doc of corpus.documents) {
    if (existing.some(d => d.name === doc.name)) continue;
    const documentId = corpusId(`${corpus.hash}:${doc.name}`);
    const vectors: number[][] = [];
    for (let i = 0; i < doc.chunks.length; i += 16) vectors.push(...await embed(doc.chunks.slice(i, i + 16).map(chunk => chunk.text)));
    if (vectors.length !== doc.chunks.length) throw new AppError('INVALID_EMBEDDINGS', 'Invalid document vectors.');
    // Identical source versions upsert identical IDs, so retries and overlapping seed runs cannot duplicate passages.
    await store.commitChunks(doc.chunks.map((chunk, index) => ({ ...chunk, embedding: vectors[index], workspaceId: corpus.workspaceId, documentId, chunkId: corpusId(`${documentId}:${index}`), documentName: doc.name, category: doc.category, chunkIndex: index, expectedChunkCount: doc.chunks.length, isReady: true })));
    inserted++;
  }
  await curatedDocuments(store, corpus);
  return { inserted, total: corpus.documents.length };
}
