import { askRequestSchema, askResponseSchema, draftSchema, passageSchema, type AskResponse, type Passage } from '../../contracts';
import { AppError } from '../errors';
import { checkInput, checkSafety, routeQuestion } from '../guardrails';
import { verifyAnswer } from '../verification';
import { decisionChoice, generateDraft } from '../providers/openrouter';
import { retrievePassages } from '../retrieval';

export type WorkflowDependencies = {
  decide: typeof decisionChoice;
  retrieve: typeof retrievePassages;
  draft: typeof generateDraft;
  verify?: typeof verifyAnswer;
};
const defaults: WorkflowDependencies = { decide: decisionChoice, retrieve: retrievePassages, draft: generateDraft, verify: verifyAnswer };
const messages = {
  blocked: 'Please don’t waste company resources. Even the servers have work to do.',
  needs_clarification: 'Please clarify the equipment, task, or document requirements.',
  out_of_scope: 'Please don’t waste company resources. Even the servers have work to do.',
  insufficient_evidence: 'The selected documents do not provide enough evidence to answer.'
};

export function createAnswerQuestion(deps: WorkflowDependencies = defaults) {
  return async (question: string, workspaceId: string | (() => Promise<string>), signal?: AbortSignal): Promise<AskResponse> => {
    const controller = new AbortController();
    const combined = signal ? AbortSignal.any([signal, controller.signal]) : controller.signal;
    const timer = setTimeout(() => controller.abort(), 90_000);
    // Race the whole workflow too: adapters/mocks that ignore cancellation cannot expose late drafts.
    const cancelled = new Promise<never>((_, reject) => {
      const abort = () => reject(new AppError('WORKFLOW_CANCELLED', 'The answer checks did not finish. Please try again.'));
      if (combined.aborted) abort(); else combined.addEventListener('abort', abort, { once: true });
    });
    const run = async (): Promise<AskResponse> => {
      const parsed = askRequestSchema.safeParse({ question });
      if (!parsed.success) throw new AppError('INVALID_QUESTION', 'Enter a question of at most 1000 characters.', 422, false);
      question = parsed.data.question;
      const requestId = crypto.randomUUID();
      const response = (status: AskResponse['status'], categories: AskResponse['categories'] = []): AskResponse => ({ requestId, status, answer: messages[status as keyof typeof messages], categories, citations: [] });
      const finish = async (result: AskResponse, evidence: Passage[] = []): Promise<AskResponse> => {
        const checked = askResponseSchema.parse(result);
        // Complete displayed model answer and all source metadata/excerpts in one decision; never truncate.
        if (!await checkSafety(JSON.stringify({ answer: checked.answer, citations: checked.citations.map(({ documentName, category, startLine, endLine, excerpt }) => ({ documentName, category, startLine, endLine, excerpt })) }), deps.decide, combined))
          return response('blocked', checked.categories);
        if (checked.status === 'answered' && !await (deps.verify ?? verifyAnswer)(question, checked, evidence, combined)) {
          combined.throwIfAborted();
          return response('insufficient_evidence', checked.categories);
        }
        combined.throwIfAborted();
        return checked;
      };
      const input = await checkInput(question, deps.decide, combined);
      if (input === 'block') return response('blocked');
      if (input === 'out_of_scope') return response('out_of_scope');
      const route = await routeQuestion(question, deps.decide, combined);
      if (route.kind === 'clarify') return finish(response('needs_clarification'));
      if (route.kind === 'out_of_scope') return finish(response('out_of_scope'));
      const resolvedWorkspace = typeof workspaceId === 'function' ? await workspaceId() : workspaceId;
      combined.throwIfAborted();
      const retrieved = await deps.retrieve({ question, workspaceId: resolvedWorkspace, categories: route.categories }, combined);
      if (retrieved.length > 6) throw new AppError('INVALID_RETRIEVAL', 'The retrieved evidence could not be checked.');
      const passages = retrieved.map(p => passageSchema.parse(p));
      if (passages.some(p => !route.categories.includes(p.category)) || new Set(passages.map(p => p.id)).size !== passages.length)
        throw new AppError('INVALID_RETRIEVAL', 'The retrieved evidence could not be checked.');
      if (route.categories.some(category => !passages.some(p => p.category === category)))
        return finish(response('insufficient_evidence', route.categories));
      const context = JSON.stringify(passages);
      if (Buffer.byteLength(context) > 24_000) throw new AppError('CONTEXT_LIMIT', 'The retrieved evidence is too large to check.', 422, false);
      const parsedDraft = draftSchema.safeParse(await deps.draft(question, context, combined));
      if (!parsedDraft.success) throw new AppError('INVALID_MODEL_OUTPUT', 'An evidence-backed answer could not be generated. Please try again.');
      const draft = parsedDraft.data;
      if (draft.status !== 'answered') {
        if (draft.citationIds.length || Object.keys(draft.citationQuotes ?? {}).length) throw new AppError('INVALID_CITATIONS', 'Non-answer responses cannot cite evidence.');
        return finish(response(draft.status, route.categories));
      }
      const byId = new Map(passages.map(p => [p.id, p]));
      if (new Set(draft.citationIds).size !== draft.citationIds.length || draft.citationIds.some(id => !byId.has(id)) ||
          (draft.status === 'answered' ? draft.citationIds.length === 0 : draft.citationIds.length !== 0))
        throw new AppError('INVALID_CITATIONS', 'The answer citations could not be verified. Please try again.');
      if (Object.keys(draft.citationQuotes ?? {}).some(id => !draft.citationIds.includes(id)))
        throw new AppError('INVALID_CITATIONS', 'The answer quotes could not be verified. Please try again.');
      const citations = draft.citationIds.map(id => {
        const source = byId.get(id)!;
        const quote = draft.citationQuotes?.[id] ?? source.excerpt;
        const offset = source.excerpt.indexOf(quote);
        if (offset < 0) throw new AppError('INVALID_CITATIONS', 'The quoted evidence does not match the source. Please try again.');
        const startLine = source.startLine + (source.excerpt.slice(0, offset).match(/\n/g)?.length ?? 0);
        const endLine = startLine + (quote.replace(/\n$/, '').match(/\n/g)?.length ?? 0);
        return { ...source, excerpt: quote, startLine, endLine };
      });
      if (draft.status === 'answered' && route.categories.some(category => !citations.some(p => p.category === category)))
        return finish(response('insufficient_evidence', route.categories));
      return finish({ requestId, status: draft.status, answer: draft.answer, categories: route.categories, citations }, passages);
    };
    try { return await Promise.race([run(), cancelled]); }
    catch (error) { if (error instanceof AppError) throw error; throw new AppError('WORKFLOW_FAILED', 'The answer checks did not finish. Please try again.'); }
    finally { clearTimeout(timer); controller.abort(); }
  };
}
export const answerQuestion = createAnswerQuestion();
