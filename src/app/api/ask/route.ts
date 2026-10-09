import { askRequestSchema } from '@/contracts';
import { answerQuestion } from '@/server/workflow';
import { curatedWorkspace } from '@/server/corpus';
import { workspaceFor } from '@/server/session';
import { admitRequest } from '@/server/request-limits';
import { assertSameOrigin, readBody, jsonResponse, errorResponse } from '@/server/http';
import { AppError } from '@/server/errors';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  let cookie: string | undefined;
  try {
    assertSameOrigin(request);
    if (request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') throw new AppError('INVALID_CONTENT_TYPE', 'Send a JSON question.', 415, false);
    const workspace = workspaceFor(request); cookie = workspace.cookie;
    admitRequest(workspace.id, 'ask');
    let body: unknown;
    try { body = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(await readBody(request, 8192))); }
    catch (error) { if (error instanceof AppError) throw error; throw new AppError('INVALID_REQUEST', 'Send a valid JSON question.', 400, false); }
    const parsed = askRequestSchema.safeParse(body);
    if (!parsed.success) throw new AppError('INVALID_QUESTION', 'Enter a question of 1–1,000 characters.', 400, false);
    const signal = AbortSignal.any([request.signal, AbortSignal.timeout(90_000)]);
    const response = { ...await answerQuestion(parsed.data.question, () => curatedWorkspace(signal), signal), requestId };
    return jsonResponse(response, 200, cookie);
  } catch (error) { return errorResponse(error, requestId, cookie); }
}
