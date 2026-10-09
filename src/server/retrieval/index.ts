import type { Category, Passage } from '../../contracts';
export type RetrievalInput = { workspaceId: string; categories: Category[]; question: string };
export async function retrievePassages(_input: RetrievalInput, _signal?: AbortSignal): Promise<Passage[]> { throw new Error('Retrieval not implemented'); }
export async function checkVectorReadiness(): Promise<void> { throw new Error('Vector verification not implemented'); }
export async function setupCollection(_verifyOnly: boolean): Promise<void> { throw new Error('Vector setup not implemented'); }
