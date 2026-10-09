import { categorySchema, MAX_FILE_BYTES, type Category } from '../contracts';
import { AppError } from './errors';
export async function validateUpload(form: FormData): Promise<{ name: string; category: Category; text: string }> {
  const fields = Array.from(form.keys());
  if (fields.length !== 2 || fields.some(key => key !== 'file' && key !== 'category')) throw new AppError('INVALID_UPLOAD', 'Upload one document and choose one category.', 400, false);
  const file = form.get('file');
  const category = categorySchema.safeParse(form.get('category'));
  if (!(file instanceof File) || !category.success) throw new AppError('INVALID_UPLOAD', 'Upload a document and choose Safety, Maintenance, or Quality.', 400, false);
  const name = file.name.split(/[\\/]/).pop()?.normalize('NFC').trim() ?? '';
  if (!/\.(txt|md)$/i.test(name) || name.length > 180 || /[\u0000-\u001f\u007f]/.test(name)) throw new AppError('INVALID_FILE_TYPE', 'Upload a TXT or Markdown document with a valid filename.', 400, false);
  if (!file.size || file.size > MAX_FILE_BYTES) throw new AppError('INVALID_FILE_SIZE', 'Upload a nonempty document up to 1 MB.', 400, false);
  let text: string;
  try { text = new TextDecoder('utf-8', { fatal: true }).decode(await file.arrayBuffer()); }
  catch { throw new AppError('INVALID_ENCODING', 'The document must be UTF-8 text.', 400, false); }
  if (!text.trim() || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(text)) throw new AppError('INVALID_DOCUMENT', 'The document must contain readable text, not binary data.', 400, false);
  return { name, category: category.data, text };
}
