import { configurationReady } from '@/server/config';
import { checkVectorReadiness } from '@/server/retrieval';
import { listCuratedDocuments } from '@/server/corpus';
import { jsonResponse } from '@/server/http';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
let lastCheck: { expires: number; promise: Promise<boolean> } | undefined;
export async function GET() {
  if (!configurationReady()) return jsonResponse({ status: 'not_ready', reason: 'configuration' }, 503);
  if (!lastCheck || lastCheck.expires <= Date.now()) {
    lastCheck = { expires: Date.now() + 15_000, promise: Promise.all([checkVectorReadiness(), listCuratedDocuments()]).then(() => true, () => false) };
  }
  const ready = await lastCheck.promise;
  return jsonResponse({ status: ready ? 'ready' : 'not_ready', ...(ready ? {} : { reason: 'vector_store_or_corpus' }) }, ready ? 200 : 503);
}
