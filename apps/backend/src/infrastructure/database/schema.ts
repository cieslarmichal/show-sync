import { index, integer, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey(),
  name: varchar('name', { length: 64 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: text('password').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const userSessions = pgTable(
  'user_sessions',
  {
    id: uuid('id').primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    currentRefreshHash: text('current_refresh_hash').notNull().unique(),
    prevRefreshHash: text('prev_refresh_hash'),
    prevUsableUntil: timestamp('prev_usable_until'),
    lastRotatedAt: timestamp('last_rotated_at').notNull().defaultNow(),
    status: varchar('status', { length: 16 }).notNull().default('active'), // 'active' | 'revoked'
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [index('idx_user_sessions_user_id').on(table.userId)],
);

export const userFavoriteSeries = pgTable(
  'user_favorite_series',
  {
    id: uuid('id').primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    seriesTmdbId: integer('series_tmdb_id').notNull(),
    preferenceLevel: varchar('preference_level', { length: 16 }).notNull().default('like'),
  },
  (table) => [
    index('idx_user_favorite_series_user_id').on(table.userId),
    index('idx_user_favorite_series_user_series_tmdb_id').on(table.userId, table.seriesTmdbId),
    index('idx_user_favorite_series_preference_level').on(table.userId, table.preferenceLevel),
  ],
);

export const userIgnoredSeries = pgTable(
  'user_ignored_series',
  {
    id: uuid('id').primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    seriesTmdbId: integer('series_tmdb_id').notNull(),
  },
  (table) => [
    index('idx_user_ignored_series_user_id').on(table.userId),
    index('idx_user_ignored_series_user_series_tmdb_id').on(table.userId, table.seriesTmdbId),
  ],
);

export const watchrooms = pgTable(
  'watchrooms',
  {
    id: uuid('id').primaryKey(),
    name: varchar('name', { length: 64 }).notNull(),
    description: varchar('description', { length: 256 }),
    ownerId: uuid('owner_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    publicLinkId: varchar('public_link_id', { length: 21 }).notNull().unique(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [index('idx_watchrooms_owner_id').on(table.ownerId)],
);

export const watchroomParticipants = pgTable(
  'watchroom_participants',
  {
    id: uuid('id').primaryKey(),
    watchroomId: uuid('watchroom_id')
      .notNull()
      .references(() => watchrooms.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
  },
  (table) => [
    index('idx_watchroom_participants_watchroom_id').on(table.watchroomId),
    index('idx_watchroom_participants_user_id').on(table.userId),
    index('idx_watchroom_participants_watchroom_user').on(table.watchroomId, table.userId),
  ],
);

export const recommendations = pgTable(
  'recommendations',
  {
    id: uuid('id').primaryKey(),
    watchroomId: uuid('watchroom_id')
      .notNull()
      .references(() => watchrooms.id, { onDelete: 'cascade' }),
    requestId: uuid('request_id').notNull(),
    seriesTmdbId: integer('series_tmdb_id').notNull(),
    justification: text('justification').notNull(),
  },
  (table) => [
    index('idx_recommendations_watchroom_id').on(table.watchroomId),
    index('idx_recommendations_series_tmdb_id').on(table.seriesTmdbId),
    index('idx_recommendations_request_id').on(table.requestId),
  ],
);
