import { expect, spyOn, test } from 'bun:test';
import { loadCorpus } from './source';
import { describeCorpus, curatedDocuments, seedCorpus } from './index';
import { localStore } from '../../../evals/local-store';
import { createDocumentService } from '../documents';
import { createRetriever } from '../retrieval';
import { GET as list, POST as upload } from '../../app/api/documents/route';
import { POST as ask } from '../../app/api/ask/route';
import * as vectorStore from '../retrieval/vector-store';
import * as workflow from '../workflow';
import type { InsertChunk } from '../retrieval/vector-store';
const embed = async (texts: string[]) => texts.map(() => [1, 0]);

test('public uploads fail without body parsing, cookies, configuration or provider spending', async () => {
  const response = upload();
  expect(response.status).toBe(405);
  expect(response.headers.get('allow')).toBe('GET');
  expect(response.headers.get('set-cookie')).toBeNull();
  expect((await response.json()).error.code).toBe('DOCUMENTS_READ_ONLY');
});
test('corpus version is stable and changes with source content, category or chunking', async () => {
  const docs = await loadCorpus();
  const first = describeCorpus(docs);
  expect(describeCorpus(docs).workspaceId).toBe(first.workspaceId);
  expect(describeCorpus([{ ...docs[0], text: docs[0].text + 'New revision.' }, ...docs.slice(1)]).workspaceId).not.toBe(first.workspaceId);
  expect(describeCorpus([{ ...docs[0], category: 'operations' }, ...docs.slice(1)]).workspaceId).not.toBe(first.workspaceId);
});
test('seeding is resumable, idempotent and excludes old user workspaces', async () => {
  const corpus = describeCorpus(await loadCorpus());
  const store = localStore();
  const browserId = crypto.randomUUID();
  const service = createDocumentService(store, embed);
  await service.ingest({ workspaceId: browserId, name: 'injected.md', category: 'safety', text: 'User-provided misleading evidence.' });
  await expect(curatedDocuments(store, corpus)).rejects.toMatchObject({ code: 'CORPUS_NOT_READY' });
  await service.ingest({ workspaceId: corpus.workspaceId, ...corpus.documents[0] });
  await expect(curatedDocuments(store, corpus)).rejects.toMatchObject({ code: 'CORPUS_NOT_READY' });
  expect(await seedCorpus(store, corpus, embed)).toEqual({ inserted: 11, total: 12 });
  expect(await seedCorpus(store, corpus, embed)).toEqual({ inserted: 0, total: 12 });
  expect(await curatedDocuments(store, corpus)).toHaveLength(12);
  expect(await service.list(browserId)).toHaveLength(1);
  const passages = await createRetriever(store, embed)({ workspaceId: corpus.workspaceId, categories: ['safety'], question: 'Isolation?' });
  expect(passages.every(p => p.documentName !== 'injected.md')).toBe(true);
});
test('incomplete current-version rows are repaired without touching other namespaces', async () => {
  const corpus = describeCorpus(await loadCorpus());
  const store = localStore();
  const originalCommit = store.commitChunks;
  store.commitChunks = async rows => { await originalCommit(rows.slice(0, 1)); throw new Error('Interrupted'); };
  await expect(seedCorpus(store, corpus, embed)).rejects.toThrow();
  await expect(curatedDocuments(store, corpus)).rejects.toMatchObject({ code: 'CORPUS_NOT_READY' });
  store.commitChunks = originalCommit;
  expect(await seedCorpus(store, corpus, embed)).toEqual({ inserted: 12, total: 12 });
});
test('HTTP listing and questions use the same complete corpus for different visitors', async () => {
  const corpus = describeCorpus(await loadCorpus());
  const store = localStore();
  await seedCorpus(store, corpus, embed);
  const readStore = spyOn(vectorStore, 'getVectorStore').mockReturnValue(store);
  const askedWorkspaces: string[] = [];
  const answer = spyOn(workflow, 'answerQuestion').mockImplementation(async (_question, workspace) => {
    askedWorkspaces.push(typeof workspace === 'function' ? await workspace() : workspace);
    return { requestId: crypto.randomUUID(), status: 'insufficient_evidence', answer: 'Missing evidence.', categories: [], citations: [] };
  });
  const previous = { secret: process.env.SESSION_SIGNING_SECRET, origin: process.env.APP_ORIGIN };
  process.env.SESSION_SIGNING_SECRET = 'test-secret-long-enough-for-cookie-signing'; process.env.APP_ORIGIN = 'http://localhost:3000';
  try {
    const first = await list(new Request('http://localhost:3000/api/documents'));
    const second = await list(new Request('http://localhost:3000/api/documents'));
    expect(first.status).toBe(200); expect(second.status).toBe(200);
    expect(await first.json()).toEqual(await second.json());
    expect(first.headers.get('set-cookie')).not.toBe(second.headers.get('set-cookie'));
    for (const response of [first, second]) {
      const question = await ask(new Request('http://localhost:3000/api/ask', { method: 'POST', headers: { origin: 'http://localhost:3000', cookie: response.headers.get('set-cookie')!.split(';')[0], 'content-type': 'application/json' }, body: JSON.stringify({ question: 'What isolation is required?' }) }));
      expect(question.status).toBe(200);
    }
    expect(askedWorkspaces).toEqual([corpus.workspaceId, corpus.workspaceId]);
    await store.deleteDocument(corpus.workspaceId, (await store.queryChunks(corpus.workspaceId))[0].documentId);
    expect((await list(new Request('http://localhost:3000/api/documents'))).status).toBe(503);
    const unavailable = await ask(new Request('http://localhost:3000/api/ask', { method: 'POST', headers: { origin: 'http://localhost:3000', 'content-type': 'application/json' }, body: JSON.stringify({ question: 'What isolation is required?' }) }));
    expect(unavailable.status).toBe(503);
    expect(answer).toHaveBeenCalledTimes(3);
  } finally {
    readStore.mockRestore(); answer.mockRestore();
    if (previous.secret === undefined) delete process.env.SESSION_SIGNING_SECRET; else process.env.SESSION_SIGNING_SECRET = previous.secret;
    if (previous.origin === undefined) delete process.env.APP_ORIGIN; else process.env.APP_ORIGIN = previous.origin;
  }
});
test('overlapping seed runs upsert the same records without duplicates or deletion', async () => {
  const corpus = describeCorpus(await loadCorpus());
  const store = localStore();
  const remove = spyOn(store, 'deleteDocument');
  await Promise.all([seedCorpus(store, corpus, embed), seedCorpus(store, corpus, embed)]);
  expect(await curatedDocuments(store, corpus)).toHaveLength(12);
  const rows = await store.queryChunks(corpus.workspaceId);
  expect(new Set(rows.map(row => row.chunkId)).size).toBe(rows.length);
  expect(remove).not.toHaveBeenCalled();
  expect(await seedCorpus(store, corpus, embed)).toEqual({ inserted: 0, total: 12 });
});
test('unexpected current-namespace data fails closed without deletion', async () => {
  const corpus = describeCorpus(await loadCorpus());
  const store = localStore();
  const row: InsertChunk = { workspaceId: corpus.workspaceId, documentId: crypto.randomUUID(), chunkId: crypto.randomUUID(), documentName: 'unknown.md', category: 'safety', chunkIndex: 0, expectedChunkCount: 1, isReady: true, startLine: 1, endLine: 1, text: 'Unexpected', embedding: [1, 0] };
  await store.insertChunks([row]);
  await expect(seedCorpus(store, corpus, embed)).rejects.toMatchObject({ code: 'CORPUS_CONFLICT' });
  expect(await store.queryChunks(corpus.workspaceId)).toHaveLength(1);
});
