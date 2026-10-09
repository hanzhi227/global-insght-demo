import { expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import Page from '../app/page';
test('main screen is Q&A only, with browser-history controls and no document catalog or uploads', () => {
  const html = renderToStaticMarkup(<Page />);
  expect(html).toContain('Questions and answers');
  expect(html).toContain('Clear history');
  expect(html).toContain('Loading saved chats');
  expect(html).toContain('Anyone using this browser can see them.');
  expect(html).not.toContain('Plant documents');
  expect(html).not.toContain('Upload and index');
  expect(html).not.toContain('type="file"');
});
