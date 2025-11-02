import { sql } from 'drizzle-orm';

import type { DatabaseClient } from '../../src/infrastructure/database/database.ts';

export async function truncateTables(databaseClient: DatabaseClient): Promise<void> {
  const tables = [
    'user_favorite_series',
    'watchroom_participants',
    'recommendations',
    'watchrooms',
    'users',
    'user_sessions',
  ];

  for (const table of tables) {
    await databaseClient.db.execute(sql.raw(`TRUNCATE TABLE "${table}" CASCADE`));
  }
}

export async function cleanupTables(databaseClient: DatabaseClient, tableNames: string[]): Promise<void> {
  for (const table of tableNames) {
    await databaseClient.db.execute(sql.raw(`TRUNCATE TABLE "${table}" CASCADE`));
  }
}
