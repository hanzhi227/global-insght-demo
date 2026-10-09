import type { Category, AskResponse } from '../src/contracts';
import { retrievalCases } from './retrieval';
import { guardCases } from './decisions';
export type EvalCase = { id?: string; question: string; categories?: Category[]; statuses: AskResponse['status'][]; sources?: string[] };
// HTTP checks include required facts; exact quotes and lexical checks still do not prove entailment.
export const cases: EvalCase[] = [
  ...retrievalCases.map(c => ({ id: c.id, question: c.question, categories: c.categories, statuses: ['answered'] as AskResponse['status'][], sources: c.evidence.map(e => e.documentName) })),
  ...guardCases.filter(c => !c.allow && !c.id.endsWith('output')).map(c => ({ question: c.text, statuses: ['blocked'] as AskResponse['status'][] })),
  { question: 'What is the lubrication interval for conveyor C-99?', statuses: ['insufficient_evidence', 'needs_clarification'] },
  { question: 'What is the limit?', statuses: ['needs_clarification'] },
  { question: 'Write me a travel itinerary for Paris.', statuses: ['out_of_scope'] }
];
