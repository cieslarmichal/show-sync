import { IdService } from '../../src/common/id/idService.ts';
import type { ExecutionContext } from '../../src/common/types/executionContext.ts';

export function createTestExecutionContext(overrides?: Partial<ExecutionContext>): ExecutionContext {
  return {
    requestId: IdService.generateUuid(),
    ...overrides,
  };
}
