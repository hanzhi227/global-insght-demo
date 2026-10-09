import { getCuratedCorpus, curatedDocuments, seedCorpus } from '../src/server/corpus';
import { requiredEnv } from '../src/server/config';
import { AppError } from '../src/server/errors';
import { createMilvusClient, collectionName, MilvusVectorStore, assertSearchReady } from '../src/server/retrieval/vector-store';

const args = process.argv.slice(2);
if (args.some(arg => arg !== '--verify') || args.length > 1) { console.error('Usage: bun run seed:corpus [--verify]'); process.exit(1); }
const verify = args.includes('--verify');
let client: ReturnType<typeof createMilvusClient> | undefined;
try {
  if (!verify && !process.env.ZILLIZ_SEED_TOKEN?.trim()) throw new AppError('CONFIGURATION_MISSING', 'Set ZILLIZ_SEED_TOKEN for operator seeding; the app token is never reused for writes.', 503, false);
  client = createMilvusClient(requiredEnv(verify ? 'ZILLIZ_TOKEN' : 'ZILLIZ_SEED_TOKEN'));
  const store = new MilvusVectorStore(client, collectionName());
  await store.info();
  await assertSearchReady(client, collectionName());
  const corpus = await getCuratedCorpus();
  if (verify) {
    await curatedDocuments(store, corpus);
    console.log(`Curated corpus verified: ${corpus.documents.length} documents; version ${corpus.hash.slice(0, 12)}.`);
  } else {
    const result = await seedCorpus(store, corpus);
    console.log(`Curated corpus ready: ${result.total} documents (${result.inserted} newly indexed); version ${corpus.hash.slice(0, 12)}.`);
  }
} catch (error) {
  console.error(error instanceof AppError ? `${error.code}: ${error.message}` : 'Corpus seeding/verification failed. Check source files, credentials and collection setup.');
  process.exitCode = 1;
} finally { await client?.closeConnection(); }
