import type { InsertChunk, VectorStore } from '../src/server/retrieval/vector-store';
import { cosine } from './metrics';
// Local exact COSINE search evaluates embeddings/chunking/filtering; it is not a Zilliz ANN benchmark.
export function localStore(): VectorStore {
  let rows: InsertChunk[] = [];
  return {
    info: async () => ({ dimension: rows[0]?.embedding.length ?? 0, strategy: 'dense' }),
    queryChunks: async (workspaceId, ids) => rows.filter(r => r.workspaceId === workspaceId && (!ids || ids.includes(r.documentId))),
    insertChunks: async chunks => { rows.push(...chunks); },
    commitChunks: async chunks => { const ids = new Set(chunks.map(c => c.chunkId)); rows = rows.map(r => ids.has(r.chunkId) ? { ...r, isReady: true } : r); },
    deleteDocument: async (workspaceId, documentId) => { rows = rows.filter(r => r.workspaceId !== workspaceId || r.documentId !== documentId); },
    search: async (workspaceId, ids, vector, _query, category) => rows.filter(r => r.workspaceId === workspaceId && ids.includes(r.documentId) && r.isReady && r.category === category).map(row => ({ row, score: cosine(vector, row.embedding) })).sort((a, b) => b.score - a.score).slice(0, 6).map(r => r.row)
  };
}
