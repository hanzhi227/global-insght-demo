import { errorResponse } from '@/server/http';
import { AppError } from '@/server/errors';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export function GET() {
  return errorResponse(new AppError('BROWSER_HISTORY_ONLY', 'Chat history is stored only in this browser. Server history is no longer available.', 410, false), crypto.randomUUID());
}
