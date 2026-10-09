import { requiredEnv } from './config';
import { AppError } from './errors';
// Runtime routes never call this operator-only credential selector.
export function seedToken(useRuntimeToken: boolean): string {
  if (useRuntimeToken) return requiredEnv('ZILLIZ_TOKEN');
  if (!process.env.ZILLIZ_SEED_TOKEN?.trim()) throw new AppError('CONFIGURATION_MISSING', 'Set ZILLIZ_SEED_TOKEN, or explicitly run seed:corpus --use-runtime-token for a local operator run if your existing token has write permissions.', 503, false);
  return requiredEnv('ZILLIZ_SEED_TOKEN');
}
