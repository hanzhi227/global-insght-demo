import { test, expect } from 'bun:test';
import { MAX_DOCUMENTS, categories } from '../../contracts';
import { chunkText } from './chunking';
import { createDocumentService, completedDocuments } from './index';
import { createRetriever } from '../retrieval';
import { workspaceFilter, type VectorStore, type InsertChunk } from '../retrieval/vector-store';
const workspaceId = crypto.randomUUID();
function fake() {
 let rows: InsertChunk[] = []; let fail = false;
 const store: VectorStore = {
  info: async () => ({ dimension: 2, strategy: 'dense' }),
  queryChunks: async id => rows.filter(r => r.workspaceId === id),
  insertChunks: async batch => { rows.push(...batch); if (fail) throw Error('insert failed'); },
  commitChunks: async batch => { const ids = new Set(batch.map(row => row.chunkId)); rows = rows.map(r => ids.has(r.chunkId) ? { ...r, isReady: true } : r); },
  deleteDocument: async (id, doc) => { rows = rows.filter(r => r.workspaceId !== id || r.documentId !== doc); },
  search: async (id, docs, _v, _q, category) => rows.filter(r => r.workspaceId === id && docs.includes(r.documentId) && r.category === category && r.isReady).slice(0, 6)
 };
 return { store, rows: () => rows, fail: () => { fail = true; } };
}
const embed = async (texts: string[]) => texts.map(() => [1, 0]);
test('chunkText preserves exact source including CRLF, Unicode, and line spans', () => {
 const text = 'a\r\n' + '😀'.repeat(2000) + '\nend'; const chunks = chunkText(text);
 expect(chunks.map(c => c.text).join('')).toBe(text);
 expect(chunks.every(c => c.text.length <= 3200 && c.startLine <= c.endLine)).toBe(true);
 expect(chunks[0].startLine).toBe(1); expect(chunks.at(-1)?.endLine).toBe(3);
 expect(() => chunkText('a'.repeat(3200 * 257))).toThrow();
});
test('human categories persist, tenant exclusion and multi-category coverage', async () => {
 const f = fake(); const service = createDocumentService(f.store, embed);
 for (const category of categories) await service.ingest({ workspaceId, name: 'guide.md', category, text: category });
 await service.ingest({ workspaceId: crypto.randomUUID(), name: 'other.txt', category: 'safety', text: 'foreign' });
 expect(await service.list(workspaceId)).toHaveLength(4);
 const result = await createRetriever(f.store, embed)({ workspaceId, categories: ['safety', 'quality'], question: 'checks?' });
 expect(result.map(r => r.category)).toEqual(['safety', 'quality']);
 expect(result.some(r => r.excerpt === 'foreign')).toBe(false);
});
test('partial insert rolls back and incomplete documents are invisible', async () => {
 const f = fake(); f.fail();
 await expect(createDocumentService(f.store, embed).ingest({ workspaceId, name: 'guide.txt', category: 'safety', text: 'test' })).rejects.toThrow();
 expect(f.rows()).toHaveLength(0);
 expect(completedDocuments([{ workspaceId, documentId: crypto.randomUUID(), chunkId: crypto.randomUUID(), category: 'safety', documentName: 'x.txt', chunkIndex: 0, expectedChunkCount: 2, isReady: true, startLine: 1, endLine: 1 }])).toEqual([]);
});
test('admissions serialize at the workspace limit and reject invalid filters', async () => {
 const f = fake(); const service = createDocumentService(f.store, embed);
 const results = await Promise.allSettled(Array.from({ length: MAX_DOCUMENTS + 1 }, () => service.ingest({ workspaceId, name: 'guide.txt', category: 'safety', text: 'test' })));
 expect(results.filter(r => r.status === 'fulfilled')).toHaveLength(MAX_DOCUMENTS);
 expect(() => workspaceFilter('x" or true')).toThrow();
});
test('abort before publication cleans up', async () => {
 const f = fake(); const controller = new AbortController();
 await expect(createDocumentService(f.store, async texts => { controller.abort(); return embed(texts); }).ingest({ workspaceId, name: 'guide.txt', category: 'safety', text: 'test' }, controller.signal)).rejects.toThrow();
 expect(f.rows()).toHaveLength(0);
});
test('retrieval rejects returned tenant/category mismatch', async () => {
 const f = fake(); await createDocumentService(f.store, embed).ingest({ workspaceId, name: 'guide.txt', category: 'safety', text: 'test' });
 f.store.search = async () => [{ ...f.rows()[0], workspaceId: crypto.randomUUID() }];
 await expect(createRetriever(f.store, embed)({ workspaceId, categories: ['safety'], question: 'checks?' })).rejects.toThrow();
});
