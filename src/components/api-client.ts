import type { ApiError, AskResponse, Category, DocumentSummary } from '@/contracts';

export type Failure = { message: string; retryable: boolean };

const fallbackFailure: Failure = { message: 'The request could not finish. Please try again.', retryable: true };

export class RequestError extends Error {
  readonly retryable: boolean;
  constructor(failure: Failure) {
    super(failure.message);
    this.retryable = failure.retryable;
  }
}

export function failureOf(error: unknown): Failure {
  if (error instanceof RequestError) return { message: error.message, retryable: error.retryable };
  return fallbackFailure;
}

async function send<T>(input: string, init: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(input, init);
  } catch {
    throw new RequestError(fallbackFailure);
  }
  const body: unknown = await response.json().catch(() => undefined);
  if (response.ok && body !== undefined) return body as T;
  const error = (body as Partial<ApiError> | undefined)?.error;
  throw new RequestError(error?.message ? { message: error.message, retryable: error.retryable ?? true } : fallbackFailure);
}

export function listDocuments() {
  return send<{ documents: DocumentSummary[] }>('/api/documents', { cache: 'no-store' });
}

export function uploadDocument(file: File, category: Category) {
  const form = new FormData();
  form.append('file', file);
  form.append('category', category);
  return send<{ document: DocumentSummary }>('/api/documents', { method: 'POST', body: form });
}

export function askQuestion(question: string) {
  return send<AskResponse & { requestId: string }>('/api/ask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question }),
  });
}
