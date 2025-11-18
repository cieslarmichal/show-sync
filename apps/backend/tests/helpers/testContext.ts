import type { LoggerService } from '../../src/common/logger/loggerService.ts';
import { LoggerServiceFactory } from '../../src/common/logger/loggerServiceFactory.ts';
import type { Config } from '../../src/core/config.ts';
import { createConfig } from '../../src/core/config.ts';
import { DatabaseClient } from '../../src/infrastructure/database/databaseClient.ts';

export interface TestContext {
  config: Config;
  databaseClient: DatabaseClient;
  loggerService: LoggerService;
}

export function createTestContext(): TestContext {
  const config = createConfig();
  const loggerService = LoggerServiceFactory.create({ logLevel: 'silent' });
  const databaseClient = new DatabaseClient(config.database, loggerService);

  return {
    config,
    databaseClient,
    loggerService,
  };
}
