import { expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { DocumentMenu } from './document-menu';
test('document menu starts closed, names its icon and keeps downloads in a navigation region', () => {
  const html = renderToStaticMarkup(<DocumentMenu><a href="/demo/safety/saf-001.md" download>SAF-001</a></DocumentMenu>);
  expect(html).toContain('<details class="document-menu">');
  expect(html).not.toContain(' open=');
  expect(html).toContain('aria-label="Browse and download all documents"');
  expect(html).toContain('aria-hidden="true"');
  expect(html).toContain('aria-label="Source document downloads"');
  expect(html).toContain('href="/demo/safety/saf-001.md"');
});
