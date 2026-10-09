import type { Category, DocumentSummary } from '../../contracts';
export type IngestInput = { workspaceId: string; name: string; category: Category; text: string };
export async function ingestDocument(_input: IngestInput, _signal?: AbortSignal): Promise<DocumentSummary> { throw new Error('Ingestion not implemented'); }
export async function listDocuments(_workspaceId: string, _signal?: AbortSignal): Promise<DocumentSummary[]> { throw new Error('Listing not implemented'); }
