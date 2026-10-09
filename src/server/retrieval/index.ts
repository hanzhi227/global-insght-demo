import { categories, categorySchema, type Category, type Passage } from '../../contracts';
import { AppError } from '../errors';
import { requiredEnv } from '../config';
import { embedTexts } from '../providers/openrouter';
import { completedDocuments } from '../documents';
import { getVectorStore, validateWorkspace, createMilvusClient, collectionName, collectionFields, modelIdentity, validateCollection, checkStatus, assertSearchReady, type VectorReader } from './vector-store';
export type RetrievalInput = { workspaceId: string; categories: Category[]; question: string };
export function createRetriever(store: VectorReader, embed: typeof embedTexts) {
 return async (input: RetrievalInput, signal?: AbortSignal): Promise<Passage[]> => {
  validateWorkspace(input.workspaceId);
  if (!Array.isArray(input.categories) || !input.categories.length || input.categories.length > categories.length || new Set(input.categories).size !== input.categories.length || input.categories.some(c => !categorySchema.safeParse(c).success) || typeof input.question !== 'string' || !input.question.trim() || input.question.length > 1000) throw new AppError('INVALID_RETRIEVAL', 'Invalid retrieval request.', 400, false);
  signal?.throwIfAborted();
  const documents = completedDocuments(await store.queryChunks(input.workspaceId));
  if (!documents.some(d => input.categories.includes(d.category))) return [];
  const [vector] = await embed([input.question], signal);
  const groups: Passage[][] = [];
  for (const category of input.categories) {
   signal?.throwIfAborted();
   const ids = documents.filter(d => d.category === category).map(d => d.id);
   if (!ids.length) continue;
   const rows = await store.search(input.workspaceId, ids, vector, input.question, category);
   groups.push(rows.map(r => {
    if (r.workspaceId !== input.workspaceId || r.category !== category || !r.isReady || !ids.includes(r.documentId) || documents.find(d => d.id === r.documentId)?.name !== r.documentName) throw new AppError('INVALID_RETRIEVAL_RESULT', 'Invalid stored passage.');
    return { id: r.chunkId, documentId: r.documentId, documentName: r.documentName, category: r.category, startLine: r.startLine, endLine: r.endLine, excerpt: r.text };
   }));
  }
  const result: Passage[] = [];
  for (let i = 0; i < 6; i++) for (const group of groups) if (group[i] && result.length < 6 && !result.some(r => r.id === group[i].id)) result.push(group[i]);
  signal?.throwIfAborted(); return result;
 };
}
export async function retrievePassages(input: RetrievalInput, signal?: AbortSignal): Promise<Passage[]> { return createRetriever(getVectorStore(), embedTexts)(input, signal); }
export async function checkVectorReadiness(): Promise<void> {
 const client = createMilvusClient();
 try { await getVectorStore().info(); await assertSearchReady(client, collectionName()); }
 finally { await client.closeConnection(); }
}
export async function setupCollection(verifyOnly: boolean): Promise<void> {
 const client = createMilvusClient(verifyOnly ? undefined : requiredEnv('ZILLIZ_SEED_TOKEN')); const collection = collectionName();
 try {
  const exists = await client.hasCollection({ collection_name: collection }); checkStatus(exists);
  if (verifyOnly) {
   if (!exists.value) throw new AppError('VECTOR_COLLECTION_MISSING', 'Run vector setup before starting the service.', 503, false);
   validateCollection(await client.describeCollection({ collection_name: collection, cache: false }));
   await assertSearchReady(client, collection); return;
  }
  const [probe] = await embedTexts(['Embedding dimension probe.']);
  if (exists.value) validateCollection(await client.describeCollection({ collection_name: collection, cache: false }), probe.length);
  else checkStatus({ status: await client.createCollection({ collection_name: collection, description: modelIdentity(), fields: collectionFields(probe.length), enable_dynamic_field: false }) });
  const indexes = await client.describeIndex({ collection_name: collection });
  if (String(indexes.status.error_code) !== 'IndexNotExist') checkStatus(indexes);
  const index = indexes.index_descriptions?.find(i => i.field_name === 'embedding');
  if (index && index.params.find(p => p.key === 'metric_type')?.value !== 'COSINE') throw new AppError('VECTOR_SCHEMA_MISMATCH', 'The existing index is incompatible; use a new collection.', 503, false);
  if (!index) checkStatus({ status: await client.createIndex({ collection_name: collection, field_name: 'embedding', index_type: 'AUTOINDEX', metric_type: 'COSINE' }) });
  checkStatus({ status: await client.loadCollection({ collection_name: collection }) });
  validateCollection(await client.describeCollection({ collection_name: collection, cache: false }), probe.length);
  await assertSearchReady(client, collection);
 } catch (error) { if (error instanceof AppError) throw error; throw new AppError('VECTOR_STORE_UNAVAILABLE', 'Vector setup could not finish.'); }
 finally { await client.closeConnection(); }
}
