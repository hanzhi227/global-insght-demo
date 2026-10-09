import { expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import type { Passage } from '@/contracts';
import { SourcePassage } from './source-passage';

const passage: Passage = {
  id: crypto.randomUUID(), documentId: crypto.randomUUID(), documentName: 'saf-001.md',
  category: 'safety', startLine: 100, endLine: 102,
  excerpt: 'Use the approved procedure.\n\nRecord <inspection> & authorization.'
};

test('citations identify the source and preserve exact lines, including blank lines', () => {
  const html = renderToStaticMarkup(<SourcePassage passage={passage} number={2} />);
  expect(html).toContain('Source 2');
  expect(html).toContain('saf-001.md');
  expect(html).toContain('Safety · Lines 100–102');
  expect(html).toContain('aria-label="Excerpt from saf-001.md, lines 100–102"');
  expect(html).toContain('tabindex="0"');
  for (const line of [100, 101, 102]) expect(html).toContain(`aria-hidden="true">${line}</span>`);
  expect(html).toContain('<span class="excerpt-text"></span>');
  expect(html).toContain('Record &lt;inspection&gt; &amp; authorization.');
});

test('a single-line citation uses a singular line label', () => {
  const html = renderToStaticMarkup(<SourcePassage passage={{ ...passage, endLine: 100, excerpt: 'Use the approved procedure.' }} number={1} />);
  expect(html).toContain('Safety · Line 100');
  expect(html).toContain('aria-label="Excerpt from saf-001.md, line 100"');
  expect(html).not.toContain('100–100');
});
