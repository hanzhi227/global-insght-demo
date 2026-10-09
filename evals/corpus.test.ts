import { expect, test } from 'bun:test';
import { loadCorpus, goldLabels } from './corpus';
import { retrievalCases } from './retrieval';
import { createDocumentService } from '../src/server/documents';
import { createRetriever } from '../src/server/retrieval';
import { localStore } from './local-store';
test('all 12 substantial documents and gold evidence anchors are valid', async () => {
  const docs = await loadCorpus();
  expect(docs).toHaveLength(12);
  for (const c of retrievalCases) expect(goldLabels(docs, c.evidence)).toHaveLength(c.evidence.length);
});
test('local evaluator exercises production ingestion and tenant/category filtering', async () => {
  const store = localStore();
  const embed = async (texts: string[]) => texts.map(() => [1, 0]);
  const service = createDocumentService(store, embed);
  const workspaceId = crypto.randomUUID();
  await service.ingest({ workspaceId, name: 'ops-001.md', category: 'operations', text: 'Shift handover.' });
  await service.ingest({ workspaceId: crypto.randomUUID(), name: 'foreign.md', category: 'operations', text: 'Private.' });
  await service.ingest({ workspaceId, name: 'saf-001.md', category: 'safety', text: 'Safety.' });
  const passages = await createRetriever(store, embed)({ workspaceId, question: 'Handover?', categories: ['operations'] });
  expect(passages.map(p => p.excerpt)).toEqual(['Shift handover.']);
});
