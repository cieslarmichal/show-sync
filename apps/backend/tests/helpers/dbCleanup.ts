import { sql } from 'drizzle-orm';

import type { DatabaseClient } from '../../src/infrastructure/database/database.ts';

export async function truncateTables(database: DatabaseClient): Promise<void> {
  const tables = [
    'user_favorite_series',
    'watchroom_participants',
    'recommendations',
    'watchrooms',
    'users',
    'user_sessions',
  ];

  for (const table of tables) {
    await database.db.execute(sql.raw(`TRUNCATE TABLE "${table}" CASCADE`));
  }
}

export async function cleanupTables(database: DatabaseClient, tableNames: string[]): Promise<void> {
  for (const table of tableNames) {
    await database.db.execute(sql.raw(`TRUNCATE TABLE "${table}" CASCADE`));
  }
}
