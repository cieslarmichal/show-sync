import type { ExecutionContext } from '../../src/common/types/executionContext.ts';
import { UuidService } from '../../src/common/uuid/uuidService.ts';

export function createTestExecutionContext(overrides?: Partial<ExecutionContext>): ExecutionContext {
  return {
    requestId: UuidService.generateUuid(),
    ...overrides,
  };
}
