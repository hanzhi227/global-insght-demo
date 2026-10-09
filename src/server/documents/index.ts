import { z } from 'zod';
import { MAX_DOCUMENTS, categorySchema, type Category, type DocumentSummary } from '../../contracts';
import { AppError } from '../errors';
import { embedTexts } from '../providers/openrouter';
import { validateWorkspace, type VectorStore, type InsertChunk, type ChunkMetadata } from '../retrieval/vector-store';
import { chunkText } from './chunking';
export type IngestInput = { workspaceId: string; name: string; category: Category; text: string };
export function completedDocuments(rows: ChunkMetadata[]): DocumentSummary[] {
 const groups = new Map<string, ChunkMetadata[]>();
 for (const row of rows) groups.set(row.documentId, [...(groups.get(row.documentId) ?? []), row]);
 return [...groups].flatMap(([id, group]) => {
  const first = group[0];
  if (group.length !== first.expectedChunkCount || group.some(r => !r.isReady || r.expectedChunkCount !== first.expectedChunkCount || r.documentName !== first.documentName || r.category !== first.category || r.workspaceId !== first.workspaceId) || new Set(group.map(r => r.chunkId)).size !== group.length || new Set(group.map(r => r.chunkIndex)).size !== group.length || group.some(r => r.chunkIndex >= group.length || r.startLine < 1 || r.endLine < r.startLine)) return [];
  return [{ id, name: first.documentName, category: first.category, chunkCount: group.length }];
 });
}
const locks = new Map<string, Promise<void>>();
async function serialized<T>(id: string, run: () => Promise<T>): Promise<T> {
 const previous = locks.get(id) ?? Promise.resolve();
 let release!: () => void;
 const next = new Promise<void>(resolve => { release = resolve; });
 const tail = previous.then(() => next); locks.set(id, tail);
 await previous;
 try { return await run(); } finally { release(); if (locks.get(id) === tail) locks.delete(id); }
}
export function createDocumentService(store: VectorStore, embed: typeof embedTexts) {
 return {
  async list(workspaceId: string, signal?: AbortSignal) { validateWorkspace(workspaceId); signal?.throwIfAborted(); return completedDocuments(await store.queryChunks(workspaceId)); },
  async ingest(input: IngestInput, signal?: AbortSignal): Promise<DocumentSummary> {
   validateWorkspace(input.workspaceId);
   if (!categorySchema.safeParse(input.category).success || !z.string().min(1).max(180).regex(/\.(txt|md)$/i).safeParse(input.name).success || Buffer.byteLength(input.name) > 720 || /[\x00-\x1f/\\]/.test(input.name) || typeof input.text !== 'string') throw new AppError('INVALID_DOCUMENT', 'Provide a TXT or Markdown document and category.', 400, false);
   const chunks = chunkText(input.text);
   return serialized(input.workspaceId, async () => {
    signal?.throwIfAborted();
    const existing = await store.queryChunks(input.workspaceId);
    if (new Set(existing.map(r => r.documentId)).size >= MAX_DOCUMENTS) throw new AppError('DOCUMENT_LIMIT', `This workspace already contains ${MAX_DOCUMENTS} documents.`, 409, false);
    const documentId = crypto.randomUUID(); const rows: InsertChunk[] = [];
    try {
     for (let i = 0; i < chunks.length; i += 16) {
      signal?.throwIfAborted();
      const batch = chunks.slice(i, i + 16); const vectors = await embed(batch.map(c => c.text), signal);
      if (vectors.length !== batch.length) throw new AppError('INVALID_EMBEDDINGS', 'Invalid document vectors.');
      const inserted = batch.map((chunk, j) => ({ ...chunk, embedding: vectors[j], workspaceId: input.workspaceId, documentId, chunkId: crypto.randomUUID(), documentName: input.name, category: input.category, chunkIndex: i + j, expectedChunkCount: chunks.length, isReady: false }));
      signal?.throwIfAborted(); await store.insertChunks(inserted); rows.push(...inserted);
     }
     signal?.throwIfAborted();
     // Publishing is the linearization boundary; finish even after a client disconnect.
     await store.commitChunks(rows);
     return { id: documentId, name: input.name, category: input.category, chunkCount: chunks.length };
    } catch (error) { try { await store.deleteDocument(input.workspaceId, documentId); } catch { /* Incomplete rows remain invisible and consume an admission slot. */ } throw error; }
   });
  }
 };
}
