import { workspaceFor } from '@/server/session';
import { admitRequest } from '@/server/request-limits';
import { jsonResponse, errorResponse } from '@/server/http';
import { listCuratedDocuments } from '@/server/corpus';
import { AppError } from '@/server/errors';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  const requestId = crypto.randomUUID();
  let cookie: string | undefined;
  try {
    const workspace = workspaceFor(request); cookie = workspace.cookie;
    admitRequest(workspace.id, 'read');
    const documents = await listCuratedDocuments(AbortSignal.any([request.signal, AbortSignal.timeout(30_000)]));
    return jsonResponse({ documents }, 200, cookie);
  } catch (error) { return errorResponse(error, requestId, cookie); }
}
export function POST() {
  const response = errorResponse(new AppError('DOCUMENTS_READ_ONLY', 'Plant documents are managed by the demo operator. Public uploads are disabled.', 405, false), crypto.randomUUID());
  response.headers.set('Allow', 'GET');
  return response;
}
