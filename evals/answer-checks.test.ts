import { expect, test } from 'bun:test';
import { missingFacts, requiredFacts } from './answer-checks';
import { retrievalCases } from './retrieval';
import { cases } from './cases';
test('every gold answer has an explicit required-fact rubric', () => {
  for (const c of retrievalCases) {
    expect(requiredFacts[c.id]?.length).toBeGreaterThan(0);
    expect(cases.find(item => item.question === c.question)?.id).toBe(c.id);
  }
});
test('spill eligibility accepts equivalent qualifications but rejects limits alone', () => {
  const limits = 'No more than 5 liters and 2 square meters';
  expect(missingFacts('spill-eligibility', limits)).toHaveLength(1);
  for (const qualification of ['all conditions', 'other conditions', 'all other listed conditions', 'other eligibility conditions']) {
    expect(missingFacts('spill-eligibility', `${limits}, among ${qualification}.`)).toEqual([]);
  }
});
test('a correct number does not pass when a required acceptance rule is missing', () => {
  const incomplete = 'Final sample is 20 brackets, all if fewer than 20. Containers allow 120 brackets from one batch.';
  expect(missingFacts('multi-inspection-container', incomplete)).toHaveLength(1);
  expect(missingFacts('multi-inspection-container', incomplete + ' Zero failures are accepted.')).toEqual([]);
  expect(() => missingFacts('unknown', 'anything')).toThrow();
});
