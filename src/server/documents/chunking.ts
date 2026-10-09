import { MAX_CHUNKS, MAX_FILE_BYTES } from '../../contracts';
import { AppError } from '../errors';
export function chunkText(text: string): { text: string; startLine: number; endLine: number }[] {
 if (!text.trim() || Buffer.byteLength(text) > MAX_FILE_BYTES || text.includes('\0') || /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/u.test(text)) throw new AppError('INVALID_DOCUMENT', 'Provide a nonempty UTF-8 document up to 1 MB.', 400, false);
 const lines = text.match(/[^\n]*\n|[^\n]+$/g) ?? [];
 const chunks: { text: string; startLine: number; endLine: number }[] = [];
 let current = ''; let start = 1; let end = 1;
 const flush = () => { if (current) chunks.push({ text: current, startLine: start, endLine: end }); current = ''; };
 lines.forEach((line, i) => {
  for (const char of line) {
   if (current.length + char.length > 3200) flush();
   if (!current) start = i + 1;
   current += char; end = i + 1;
  }
 });
 flush();
 if (chunks.length > MAX_CHUNKS) throw new AppError('TOO_MANY_CHUNKS', 'The document exceeds the indexing limit.', 422, false);
 return chunks;
}
