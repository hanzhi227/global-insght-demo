import { decisionChoice, embedTexts, generateDraft } from '../src/server/providers/openrouter';
import { checkVectorReadiness } from '../src/server/retrieval';
import { configurationReady } from '../src/server/config';
import { AppError } from '../src/server/errors';

try {
  if (!configurationReady()) throw new AppError('CONFIGURATION_MISSING', 'Fill in the required variables in .env before checking live providers.', 503, false);
  const choice = await decisionChoice({ state: 'Which documents explain required safety checks?', instructions: 'Select the documentation category for this manufacturing question.', criteria: { safety: 'Safety procedures', maintenance: 'Maintenance manuals', quality: 'Quality standards', operations: 'Operations procedures' } });
  if (choice !== 'safety') throw new Error('Decision smoke check did not select safety.');
  console.log('Decision API: safety routing verified.');
  const vectors = await embedTexts(['Fictional demo: conveyor C-12 inspection requires recording the guard condition.']);
  console.log(`Embeddings: valid vector, ${vectors[0].length} dimensions.`);
  const passageId = crypto.randomUUID();
  const draft = await generateDraft('What must be recorded during the inspection?', JSON.stringify([{ id: passageId, excerpt: 'Fictional demo: inspection requires recording the guard condition.' }]));
  if (draft.status !== 'answered' || !draft.citationIds.includes(passageId)) throw new Error('Chat smoke check did not cite the supplied evidence.');
  console.log('Chat: structured cited draft verified.');
  await checkVectorReadiness();
  console.log('Zilliz: compatible collection verified.');
} catch (error) {
  console.error(error instanceof AppError ? `${error.code}: ${error.message}` : 'Provider smoke check failed. No credentials or raw provider responses are logged.');
  process.exitCode = 1;
}
