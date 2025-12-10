import { boolean, index, integer, pgTable, text, timestamp, unique, uuid, varchar } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey(),
  name: varchar('name', { length: 64 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: text('password'),
  oauthProvider: varchar('oauth_provider', { length: 20 }),
  oauthProviderId: text('oauth_provider_id'),
  isEmailVerified: boolean('is_email_verified').notNull().default(false),
  language: varchar('language', { length: 2 }).notNull().default('en'),
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

export const oneTimeTokens = pgTable(
  'one_time_tokens',
  {
    id: uuid('id').primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: text('token_hash').notNull().unique(),
    purpose: varchar('purpose', { length: 64 }).notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    usedAt: timestamp('used_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('idx_one_time_tokens_user_id').on(table.userId),
    index('idx_one_time_tokens_token_hash_purpose_expires_at_used_at').on(
      table.tokenHash,
      table.purpose,
      table.expiresAt,
      table.usedAt,
    ),
    index('idx_one_time_tokens_expires_at').on(table.expiresAt),
  ],
);

export const emails = pgTable(
  'emails',
  {
    id: uuid('id').primaryKey(),
    payload: text('payload').notNull(),
    recipient: varchar('recipient', { length: 255 }).notNull(),
    status: varchar('status', { length: 20 }).notNull(),
    templateName: varchar('template_name', { length: 20 }).notNull(),
    language: varchar('language', { length: 2 }).notNull().default('en'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('emails_recipient_idx').on(table.recipient),
    index('emails_status_idx').on(table.status),
    index('emails_template_name_idx').on(table.templateName),
  ],
);

export const userSeriesRatings = pgTable(
  'user_series_ratings',
  {
    id: uuid('id').primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    seriesTmdbId: integer('series_tmdb_id').notNull(),
    rating: varchar('rating', { length: 16 }).notNull(), // 'like' | 'love' | 'dislike'
  },
  (table) => [
    index('idx_user_series_ratings_user_id').on(table.userId),
    index('idx_user_series_ratings_user_series_tmdb_id').on(table.userId, table.seriesTmdbId),
    index('idx_user_series_ratings_rating').on(table.userId, table.rating),
    unique('uq_user_series_ratings_user_series').on(table.userId, table.seriesTmdbId),
  ],
);

export const userSeriesWatchlist = pgTable(
  'user_series_watchlist',
  {
    id: uuid('id').primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    seriesTmdbId: integer('series_tmdb_id').notNull(),
    type: varchar('type', { length: 16 }).notNull(), // 'notInterested' | 'wantToWatch'
  },
  (table) => [
    index('idx_user_series_watchlist_user_id').on(table.userId),
    index('idx_user_series_watchlist_user_series_tmdb_id').on(table.userId, table.seriesTmdbId),
    index('idx_user_series_watchlist_type').on(table.userId, table.type),
    unique('uq_user_series_watchlist_user_series').on(table.userId, table.seriesTmdbId),
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
    seriesLengthPreference: varchar('series_length_preference', { length: 20 }).default('all'),
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
    unique('uq_watchroom_participants').on(table.watchroomId, table.userId),
  ],
);

export const recommendationRequests = pgTable(
  'recommendation_requests',
  {
    id: uuid('id').primaryKey(),
    watchroomId: uuid('watchroom_id').references(() => watchrooms.id, { onDelete: 'set null' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }), // user who made the request
    status: varchar('status', { length: 16 }).notNull(), // 'pending' | 'completed' | 'failed'
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('idx_recommendation_requests_watchroom_id').on(table.watchroomId),
    index('idx_recommendation_requests_status').on(table.status),
    index('idx_recommendation_requests_user_id_status').on(table.userId, table.status),
    index('idx_recommendation_requests_user_id_status_created_at').on(table.userId, table.status, table.createdAt),
  ],
);

export const recommendations = pgTable(
  'recommendations',
  {
    id: uuid('id').primaryKey(),
    recommendationRequestId: uuid('recommendation_request_id')
      .notNull()
      .references(() => recommendationRequests.id, { onDelete: 'cascade' }),
    seriesTmdbId: integer('series_tmdb_id').notNull(),
    justification: text('justification').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('idx_recommendations_recommendation_request_id').on(table.recommendationRequestId),
    index('idx_recommendations_series_tmdb_id').on(table.seriesTmdbId),
  ],
);

export const recommendationFeedback = pgTable(
  'recommendation_feedback',
  {
    id: uuid('id').primaryKey(),
    recommendationRequestId: uuid('recommendation_request_id')
      .notNull()
      .references(() => recommendationRequests.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    rating: integer('rating').notNull(),
    foundSomething: boolean('found_something').notNull(),
    comment: text('comment'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('idx_recommendation_feedback_recommendation_request_id').on(table.recommendationRequestId),
    index('idx_recommendation_feedback_user_id').on(table.userId),
    unique('uq_recommendation_feedback_request_user').on(table.recommendationRequestId, table.userId),
  ],
);
