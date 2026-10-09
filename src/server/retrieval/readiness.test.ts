import { test, expect } from 'bun:test';
import type { MilvusClient } from '@zilliz/milvus2-sdk-node';
import { assertSearchReady } from './vector-store';
function client(index = true, state = 'Finished', loaded = 'LoadStateLoaded', metric = 'COSINE') {
  return {
    describeIndex: async () => ({ status: { error_code: 'Success', code: 0 }, index_descriptions: index ? [{ field_name: 'embedding', state, params: [{ key: 'metric_type', value: metric }] }] : [] }),
    getLoadState: async () => ({ status: { error_code: 'Success', code: 0 }, state: loaded })
  } as unknown as Pick<MilvusClient, 'describeIndex' | 'getLoadState'>;
}
test('readiness requires a finished compatible index and a loaded collection', async () => {
  await expect(assertSearchReady(client(), 'demo')).resolves.toBeUndefined();
  for (const fake of [client(false), client(true, 'InProgress'), client(true, 'Finished', 'LoadStateNotLoad'), client(true, 'Finished', 'LoadStateLoading'), client(true, 'Finished', 'LoadStateLoaded', 'L2')]) await expect(assertSearchReady(fake, 'demo')).rejects.toThrow();
});
