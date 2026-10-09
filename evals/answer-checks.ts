// Explicit reference-fact checks catch omissions a probabilistic judge can miss. They do not prove entailment.
export const requiredFacts: Record<string, RegExp[]> = {
  'isolation-duration': [/12\s*hours?/i, /expir/i, /never|not|no\s+restart/i],
  'spill-eligibility': [/5\s*lit(?:er|re)/i, /2\s*(?:square\s*met(?:er|re)|m²)/i, /(?:other|all)(?:\s+(?:other|listed|eligibility))?\s+conditions/i],
  'fire-watch': [/60\s*minutes?/i, /120\s*minutes?/i, /30[ -]*minute/i],
  'belt-deflection': [/10\s*[-–—]\s*14\s*mm/i, /20\s*N\b/i, /isolat/i],
  'pressure-decay': [/5\s*bar/i, /60\s*seconds?/i, /authoriz/i],
  'dryer-dewpoint': [/\+?5\s*°?\s*C\b/i, /15\s*minutes?/i],
  'final-sample': [/20\s*brackets?/i, /fewer|less\s+than/i, /zero|no\s+(?:failures|nonconform)|one\s+(?:failure|nonconform)/i],
  'hold-escalation': [/(?:one|1)\s*hour/i, /(?:three|3)\s*NCR/i, /30\s*calendar\s*days?/i],
  'calibration': [/(?:six|6)\s*months?/i, /no\s*grace/i],
  'handover-window': [/15\s*minutes?/i, /log/i, /before/i],
  'container-capacity': [/120\s*brackets?/i, /one\s*batch|single\s*batch|not\s*be\s*mixed/i],
  'dispatch-gate': [/60\s*minutes?/i, /before/i],
  'multi-isolation-belt': [/12\s*hours?/i, /10\s*[-–—]\s*14\s*mm/i, /20\s*N\b/i, /isolat/i],
  'multi-inspection-container': [/20\s*brackets?/i, /fewer|less\s+than/i, /zero|no\s+(?:failures|nonconform)|one\s+(?:failure|nonconform)/i, /120\s*brackets?/i, /one\s*batch|single\s*batch/i]
};
export function missingFacts(id: string, answer: string): string[] {
  if (!requiredFacts[id]) throw new Error(`Missing answer rubric for ${id}`);
  return requiredFacts[id].filter(pattern => !pattern.test(answer)).map(pattern => pattern.source);
}
