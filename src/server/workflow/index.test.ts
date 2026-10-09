import { describe, expect, test } from 'bun:test';
import { createAnswerQuestion, type WorkflowDependencies } from './index';
import type { Passage } from '../../contracts';
const safety: Passage = { id: '11111111-1111-4111-8111-111111111111', documentId: '22222222-2222-4222-8222-222222222222', documentName: 'Safety', category: 'safety', startLine: 1, endLine: 1, excerpt: 'Follow the approved procedure.' };
const maintenance: Passage = { ...safety, id: '33333333-3333-4333-8333-333333333333', category: 'maintenance' };
function fixture(choices = ['allow', 'safety', 'allow'], passages = [safety]) {
  const states: string[] = [];
  const deps: WorkflowDependencies = {
    decide: async input => { states.push(input.state); return choices.shift()!; },
    retrieve: async () => passages,
    draft: async () => ({ status: 'answered', answer: 'Follow the approved procedure.', citationIds: passages.map(p => p.id) })
  };
  return { deps, states, ask: () => createAnswerQuestion(deps)('What hazards apply to servicing?', 'workspace') };
}
describe('answerQuestion checked workflow', () => {
  test('legitimate hazard question uses safety and guards complete output', async () => {
    const f = fixture(); const result = await f.ask();
    expect(result.status).toBe('answered'); expect(result.citations).toEqual([safety]);
    expect(JSON.parse(f.states[2]).citations[0].excerpt).toBe(safety.excerpt);
  });
  for (const [choice, passages] of [['maintenance', [maintenance]], ['safety_maintenance', [safety, maintenance]], ['all', [safety, maintenance, { ...safety, id: '44444444-4444-4444-8444-444444444444', category: 'quality' }]]] as const) {
    test(`decision route ${choice}`, async () => { expect((await fixture(['allow', choice, 'allow'], [...passages]).ask()).status).toBe('answered'); });
  }
  for (const choice of ['safety_quality', 'maintenance_quality']) test(`multi-category route ${choice} preserves labels`, async () => {
    const first = choice === 'safety_quality' ? safety : maintenance;
    const quality: Passage = { ...safety, id: '44444444-4444-4444-8444-444444444444', category: 'quality' };
    expect((await fixture(['allow', choice, 'allow'], [first, quality]).ask()).categories).toEqual([first.category, 'quality']);
  });
  test('output guard outage cannot expose draft', async () => {
    const f = fixture(); let calls = 0; f.deps.decide = async () => { if (++calls === 3) throw Error('offline'); return calls === 1 ? 'allow' : 'safety'; };
    await expect(f.ask()).rejects.toMatchObject({ code: 'WORKFLOW_FAILED' });
  });
  test('unknown decision fails closed', async () => { await expect(fixture(['allow', 'unknown']).ask()).rejects.toMatchObject({ code: 'INVALID_MODEL_OUTPUT' }); });
  test('missing category coverage abstains without drafting', async () => {
    const f = fixture(['allow', 'safety_maintenance', 'allow']); f.deps.draft = async () => { throw Error('must not draft'); };
    expect((await f.ask()).status).toBe('insufficient_evidence');
  });
  test('absent evidence abstains', async () => { expect((await fixture(['allow', 'safety', 'allow'], []).ask()).status).toBe('insufficient_evidence'); });
  test('forged citations fail', async () => {
    const f = fixture(); f.deps.draft = async () => ({ status: 'answered', answer: 'Wrong', citationIds: [maintenance.id] });
    await expect(f.ask()).rejects.toMatchObject({ code: 'INVALID_CITATIONS' });
  });
  test('answered requires citations', async () => {
    const f = fixture(); f.deps.draft = async () => ({ status: 'answered', answer: 'Wrong', citationIds: [] });
    await expect(f.ask()).rejects.toMatchObject({ code: 'INVALID_CITATIONS' });
  });
  test('input block stops routing', async () => { const f = fixture(['block']); expect((await f.ask()).status).toBe('blocked'); expect(f.states).toHaveLength(1); });
  test('output block hides draft and citations', async () => { const result = await fixture(['allow', 'safety', 'block']).ask(); expect(result.status).toBe('blocked'); expect(result.citations).toEqual([]); });
  test('provider outage fails closed', async () => { const f = fixture(); f.deps.decide = async () => { throw Error('offline'); }; await expect(f.ask()).rejects.toMatchObject({ code: 'WORKFLOW_FAILED' }); });
  test('multibyte input is rejected without decision calls', async () => { const f = fixture(); await expect(createAnswerQuestion(f.deps)('界'.repeat(501), 'workspace')).rejects.toMatchObject({ code: 'DECISION_INPUT_LIMIT' }); expect(f.states).toEqual([]); });
  test('complete oversized output rejected, not chunked', async () => { const f = fixture(['allow', 'safety'], [{ ...safety, excerpt: '界'.repeat(501) }]); await expect(f.ask()).rejects.toMatchObject({ code: 'DECISION_INPUT_LIMIT' }); expect(f.states).toHaveLength(2); });
  for (const route of ['clarify', 'out_of_scope']) test(`${route} receives output guard`, async () => { const f = fixture(['allow', route, 'block']); expect((await f.ask()).status).toBe('blocked'); expect(f.states).toHaveLength(3); });
  test('non-answer model text receives output guard', async () => { const f = fixture(['allow', 'safety', 'block']); f.deps.draft = async () => ({ status: 'needs_clarification', answer: 'Unsafe text', citationIds: [] }); expect((await f.ask()).status).toBe('blocked'); });
  test('exact quoted evidence gets its true source line span', async () => {
    const p = { ...safety, startLine: 10, endLine: 12, excerpt: 'Heading\nRecord the guard condition.\nOther information.' };
    const f = fixture(['allow', 'safety', 'allow'], [p]);
    f.deps.draft = async () => ({ status: 'answered', answer: 'Record the guard condition.', citationIds: [p.id], citationQuotes: { [p.id]: 'Record the guard condition.' } });
    const result = await f.ask();
    expect(result.citations[0]).toMatchObject({ excerpt: 'Record the guard condition.', startLine: 11, endLine: 11 });
    expect(JSON.parse(f.states[2]).citations[0].excerpt).toBe('Record the guard condition.');
  });
  test('fabricated quotation fails before output check', async () => {
    const f = fixture();
    f.deps.draft = async () => ({ status: 'answered', answer: 'Wrong', citationIds: [safety.id], citationQuotes: { [safety.id]: 'An invented sentence.' } });
    await expect(f.ask()).rejects.toMatchObject({ code: 'INVALID_CITATIONS' });
    expect(f.states).toHaveLength(2);
  });
  test('cancellation bounds uncooperative adapter', async () => { const f = fixture(); f.deps.decide = () => new Promise(() => {}); const controller = new AbortController(); const result = createAnswerQuestion(f.deps)('Question', 'workspace', controller.signal); controller.abort(); await expect(result).rejects.toMatchObject({ code: 'WORKFLOW_CANCELLED' }); });
});
