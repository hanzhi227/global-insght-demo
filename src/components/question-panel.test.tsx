import { expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import Page from '../app/page';
test('main screen has example questions in the menu bar and downloadable sources without uploads', async () => {
  const html = renderToStaticMarkup(await Page());
  expect(html).toContain('Questions and answers');
  expect(html).toContain('Clear history');
  expect(html).toContain('<nav aria-label="Main menu"><details class="sample-questions"><summary>Example questions</summary>');
  expect(html.indexOf('Example questions')).toBeLessThan(html.indexOf('<main'));
  expect(html.match(/class="sample-questions"/g)).toHaveLength(1);
  expect(html).toContain('Choose a question to fill the box, then select Ask.');
  expect(html).toContain('How long is a C-12 isolation authorization valid, and what happens at expiry?');
  expect(html).toContain('What preventive maintenance inspections apply to conveyor C-12?');
  expect(html).toContain('What is the caliper calibration interval? Is there an overdue grace period?');
  expect(html).toContain('What information belongs in the production shift handover?');
  expect(html).toContain('What final inspection sample does Quality require for AX-210, and what container capacity does Operations allow?');
  expect(html).toContain('What is the lubrication interval for conveyor C-99?');
  expect(html).toContain('Loading saved chats');
  expect(html).toContain('Anyone using this browser can see them.');
  expect(html).toContain('Source documents');
  expect(html).toContain('aria-label="Browse and download all documents"');
  expect(html).toContain('<details class="document-menu">');
  expect(html.indexOf('class="document-menu"')).toBeLessThan(html.indexOf('<main'));
  expect(html.slice(html.indexOf('<main'))).not.toContain('download=');
  expect(html.match(/download="[^"]+\.md"/g)).toHaveLength(12);
  for (const [category, prefix] of [['safety', 'saf'], ['maintenance', 'mnt'], ['quality', 'qua'], ['operations', 'ops']]) {
    for (const number of ['001', '002', '003']) {
      expect(html).toContain(`href="/demo/${category}/${prefix}-${number}.md"`);
    }
  }
  expect(html).not.toContain('Plant documents');
  expect(html).not.toContain('Upload and index');
  expect(html).not.toContain('type="file"');
});
