import { expect, test } from 'bun:test';
import { seedToken } from './seed-credentials';
import { milvusAddress } from './retrieval/vector-store';
test('operator seeding never silently falls back to the runtime token', () => {
  const previous = { seed: process.env.ZILLIZ_SEED_TOKEN, runtime: process.env.ZILLIZ_TOKEN };
  process.env.ZILLIZ_TOKEN = 'runtime-test-token'; delete process.env.ZILLIZ_SEED_TOKEN;
  try {
    expect(() => seedToken(false)).toThrow();
    expect(seedToken(true)).toBe('runtime-test-token');
    process.env.ZILLIZ_SEED_TOKEN = 'operator-test-token';
    expect(seedToken(false)).toBe('operator-test-token');
    expect(seedToken(true)).toBe('runtime-test-token');
  } finally {
    if (previous.seed === undefined) delete process.env.ZILLIZ_SEED_TOKEN; else process.env.ZILLIZ_SEED_TOKEN = previous.seed;
    if (previous.runtime === undefined) delete process.env.ZILLIZ_TOKEN; else process.env.ZILLIZ_TOKEN = previous.runtime;
  }
});
test('HTTPS Zilliz endpoints use explicit port 443 while other ports remain unchanged', () => {
  expect(milvusAddress('https://plant.cloud.zilliz.com')).toBe('https://plant.cloud.zilliz.com:443');
  expect(milvusAddress('https://plant.cloud.zilliz.com:443/')).toBe('https://plant.cloud.zilliz.com:443');
  expect(milvusAddress('https://plant.cloud.zilliz.com:8443')).toBe('https://plant.cloud.zilliz.com:8443');
  expect(milvusAddress('localhost:19530')).toBe('localhost:19530');
  expect(() => milvusAddress('https://key:secret@plant.cloud.zilliz.com')).toThrow();
  expect(() => milvusAddress('https://plant.cloud.zilliz.com/path')).toThrow();
});
