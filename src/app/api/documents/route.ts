import { workspaceFor } from '@/server/session';
import { admitRequest } from '@/server/request-limits';
import { assertSameOrigin, readBody, jsonResponse, errorResponse } from '@/server/http';
import { validateUpload } from '@/server/upload';
import { ingestDocument, listDocuments } from '@/server/documents';
import { MAX_FILE_BYTES } from '@/contracts';
import { AppError } from '@/server/errors';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  const requestId = crypto.randomUUID();
  let cookie: string | undefined;
  try {
    const workspace = workspaceFor(request); cookie = workspace.cookie;
    admitRequest(workspace.id, 'read');
    const documents = await listDocuments(workspace.id, AbortSignal.any([request.signal, AbortSignal.timeout(30_000)]));
    return jsonResponse({ documents }, 200, cookie);
  } catch (error) { return errorResponse(error, requestId, cookie); }
}
export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  let cookie: string | undefined;
  try {
    assertSameOrigin(request);
    const workspace = workspaceFor(request); cookie = workspace.cookie;
    admitRequest(workspace.id, 'upload');
    const contentType = request.headers.get('content-type') ?? '';
    if (!contentType.toLowerCase().startsWith('multipart/form-data;')) throw new AppError('INVALID_CONTENT_TYPE', 'Upload the document using the upload form.', 415, false);
    const bytes = await readBody(request, MAX_FILE_BYTES + 65_536);
    let form: FormData;
    try { form = await new Request(request.url, { method: 'POST', headers: { 'Content-Type': contentType }, body: new Blob([bytes as BlobPart]) }).formData(); }
    catch { throw new AppError('INVALID_UPLOAD', 'The upload form could not be read.', 400, false); }
    const input = await validateUpload(form);
    const document = await ingestDocument({ ...input, workspaceId: workspace.id }, AbortSignal.any([request.signal, AbortSignal.timeout(120_000)]));
    return jsonResponse({ document }, 201, cookie);
  } catch (error) { return errorResponse(error, requestId, cookie); }
}
