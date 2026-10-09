import { getCuratedCorpus, curatedDocuments, seedCorpus } from '../src/server/corpus';
import { requiredEnv } from '../src/server/config';
import { seedToken } from '../src/server/seed-credentials';
import { AppError } from '../src/server/errors';
import { createMilvusClient, collectionName, MilvusVectorStore, assertSearchReady } from '../src/server/retrieval/vector-store';

const args = process.argv.slice(2);
if (args.some(arg => !['--verify', '--use-runtime-token'].includes(arg)) || args.length > 1) { console.error('Usage: bun run seed:corpus [--verify | --use-runtime-token]'); process.exit(1); }
const verify = args.includes('--verify');
const useRuntimeToken = args.includes('--use-runtime-token');
let client: ReturnType<typeof createMilvusClient> | undefined;
try {
  const token = verify ? requiredEnv('ZILLIZ_TOKEN') : seedToken(useRuntimeToken);
  if (useRuntimeToken) console.log('Using the runtime token for this explicit operator run. It must have write permissions; deploy a query-only runtime token.');
  client = createMilvusClient(token);
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
