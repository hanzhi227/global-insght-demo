import { expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { DocumentPanel } from './document-panel';
test('document panel is read-only and announces loading', () => {
  const html = renderToStaticMarkup(<DocumentPanel />);
  expect(html).toContain('Managed by the demo operator. These documents are read-only.');
  expect(html).toContain('role="status"');
  expect(html).not.toContain('<form');
  expect(html).not.toContain('type="file"');
  expect(html).not.toContain('Upload and index');
});
