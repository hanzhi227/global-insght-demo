import { AppError } from './errors';
export function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new AppError('CONFIGURATION_MISSING', 'Server configuration is incomplete. Contact the operator.', 503, false);
  return value;
}
export function configurationReady(): boolean {
  return ['OPENROUTER_API_KEY', 'OPENROUTER_CHAT_MODEL', 'OPENROUTER_EMBEDDING_MODEL', 'OPENROUTER_DECISION_MODEL', 'ZILLIZ_ENDPOINT', 'ZILLIZ_TOKEN', 'ZILLIZ_COLLECTION', 'SESSION_SIGNING_SECRET', 'APP_ORIGIN'].every(name => !!process.env[name]?.trim()) && (process.env.SESSION_SIGNING_SECRET?.length ?? 0) >= 32;
}
