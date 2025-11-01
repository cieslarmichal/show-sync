# Love Series Feature - Implementation Plan

## Overview

Add a preference level system to favorite series, allowing users to mark series as either "like" or "love". This helps the AI recommendation system better understand user preferences and prioritize matching against strongly preferred series.

## Problem Statement

Currently, when users rate 10+ series, the AI recommendation model gets overwhelmed because it treats all favorite series equally. It cannot distinguish between:

- "This was pretty good" vs "This is one of my all-time favorites"
- Core preferences vs edge cases
- Strong signals vs weak signals

The gradation system will provide clearer signals to the AI, improving recommendation quality.

---

## Backend Implementation

### 1. Database Schema Changes

**File:** `apps/backend/src/infrastructure/database/schema.ts`

**Action:** Add a `preference_level` column to the `user_favorite_series` table

```typescript
export const userFavoriteSeries = pgTable(
  'user_favorite_series',
  {
    id: uuid('id').primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    seriesTmdbId: integer('series_tmdb_id').notNull(),
    preferenceLevel: varchar('preference_level', { length: 16 }).notNull(), // 'like' | 'love'
    addedAt: timestamp('added_at').notNull().defaultNow(),
  },
  (table) => [
    index('idx_user_favorite_series_user_id').on(table.userId),
    index('idx_user_favorite_series_user_series_tmdb_id').on(table.userId, table.seriesTmdbId),
    index('idx_user_favorite_series_preference_level').on(table.userId, table.preferenceLevel), // NEW INDEX
  ],
);
```

**Migration Required:**

- Create new Drizzle migration file
- Add `preference_level` column
- Add index for efficient filtering by preference level

### 2. Domain Types

**File:** `apps/backend/src/modules/series/domain/types/favoriteSeries.ts`

**Action:** Add `preferenceLevel` to the `FavoriteSeries` type

```typescript
export type PreferenceLevel = 'like' | 'love';

export interface FavoriteSeries {
  readonly id: string;
  readonly userId: string;
  readonly seriesTmdbId: number;
  readonly preferenceLevel: PreferenceLevel;
  readonly addedAt: Date;
}
```

### 3. Repository Layer

**File:** `apps/backend/src/modules/series/domain/repositories/favoriteSeriesRepository.ts`

**Action:** Update interfaces to support preference level

```typescript
export interface CreateFavoriteSeriesData {
  readonly userId: string;
  readonly seriesTmdbId: number;
  readonly preferenceLevel: PreferenceLevel; // NEW
}

export interface UpdateFavoriteSeriesPreferenceData {
  readonly userId: string;
  readonly seriesTmdbId: number;
  readonly preferenceLevel: PreferenceLevel;
}

export interface FavoriteSeriesRepository {
  create(favoriteSeriesData: CreateFavoriteSeriesData, tx?: Transaction): Promise<FavoriteSeries>;
  findMany(userId: string, page: number, pageSize: number): Promise<FavoriteSeries[]>;
  findManyByPreference(userId: string, preferenceLevel: PreferenceLevel, page: number, pageSize: number): Promise<FavoriteSeries[]>; // NEW
  count(userId: string): Promise<number>;
  countByPreference(userId: string, preferenceLevel: PreferenceLevel): Promise<number>; // NEW
  findOne(userId: string, seriesTmdbId: number, tx?: Transaction): Promise<FavoriteSeries | null>;
  updatePreferenceLevel(data: UpdateFavoriteSeriesPreferenceData, tx?: Transaction): Promise<FavoriteSeries>; // NEW
  delete(userId: string, seriesTmdbId: number, tx?: Transaction): Promise<void>;
}
```

**File:** `apps/backend/src/modules/series/infrastructure/repositories/favoriteSeriesRepositoryImpl.ts`

**Action:** Implement new methods and update existing ones

```typescript
public async create(favoriteSeriesData: CreateFavoriteSeriesData, tx?: Transaction): Promise<FavoriteSeries> {
  const db = tx ? tx : this.database.db;

  const [newFavorite] = await db
    .insert(userFavoriteSeries)
    .values({
      id: UuidService.generateUuid(),
      userId: favoriteSeriesData.userId,
      seriesTmdbId: favoriteSeriesData.seriesTmdbId,
      preferenceLevel: favoriteSeriesData.preferenceLevel, // NEW
    })
    .returning();

  if (!newFavorite) {
    throw new Error('Failed to create favorite series');
  }

  return this.mapToFavoriteSeries(newFavorite);
}

public async findManyByPreference(
  userId: string,
  preferenceLevel: PreferenceLevel,
  page: number,
  pageSize: number
): Promise<FavoriteSeries[]> {
  const favorites = await this.database.db
    .select()
    .from(userFavoriteSeries)
    .where(
      and(
        eq(userFavoriteSeries.userId, userId),
        eq(userFavoriteSeries.preferenceLevel, preferenceLevel)
      )
    )
    .orderBy(desc(userFavoriteSeries.addedAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  return favorites.map(this.mapToFavoriteSeries);
}

public async countByPreference(userId: string, preferenceLevel: PreferenceLevel): Promise<number> {
  const [countResult] = await this.database.db
    .select({ count: count() })
    .from(userFavoriteSeries)
    .where(
      and(
        eq(userFavoriteSeries.userId, userId),
        eq(userFavoriteSeries.preferenceLevel, preferenceLevel)
      )
    );

  return countResult?.count ?? 0;
}

public async updatePreferenceLevel(
  data: UpdateFavoriteSeriesPreferenceData,
  tx?: Transaction
): Promise<FavoriteSeries> {
  const db = tx ? tx : this.database.db;

  const [updated] = await db
    .update(userFavoriteSeries)
    .set({ preferenceLevel: data.preferenceLevel })
    .where(
      and(
        eq(userFavoriteSeries.userId, data.userId),
        eq(userFavoriteSeries.seriesTmdbId, data.seriesTmdbId)
      )
    )
    .returning();

  if (!updated) {
    throw new ResourceNotFoundError({
      resource: 'Favorite Series',
      userId: data.userId,
      seriesTmdbId: data.seriesTmdbId.toString(),
    });
  }

  return this.mapToFavoriteSeries(updated);
}
```

### 4. Application Actions

**New File:** `apps/backend/src/modules/series/application/actions/updateFavoriteSeriesPreferenceAction.ts`

```typescript
import type { LoggerService } from '../../../../common/logger/loggerService.ts';
import type { FavoriteSeriesRepository } from '../../domain/repositories/favoriteSeriesRepository.ts';
import type { FavoriteSeries, PreferenceLevel } from '../../domain/types/favoriteSeries.ts';

export interface UpdateFavoriteSeriesPreferencePayload {
  readonly userId: string;
  readonly seriesTmdbId: number;
  readonly preferenceLevel: PreferenceLevel;
}

export class UpdateFavoriteSeriesPreferenceAction {
  private readonly favoriteSeriesRepository: FavoriteSeriesRepository;
  private readonly loggerService: LoggerService;

  public constructor(
    favoriteSeriesRepository: FavoriteSeriesRepository,
    loggerService: LoggerService,
  ) {
    this.favoriteSeriesRepository = favoriteSeriesRepository;
    this.loggerService = loggerService;
  }

  public async execute(payload: UpdateFavoriteSeriesPreferencePayload): Promise<FavoriteSeries> {
    const { userId, seriesTmdbId, preferenceLevel } = payload;

    const updated = await this.favoriteSeriesRepository.updatePreferenceLevel({
      userId,
      seriesTmdbId,
      preferenceLevel,
    });

    this.loggerService.info({
      message: 'Series preference level updated',
      userId,
      seriesTmdbId,
      preferenceLevel,
    });

    return updated;
  }
}
```

**Update File:** `apps/backend/src/modules/series/application/actions/addFavoriteSeriesAction.ts`

```typescript
public async execute(
  userId: string,
  seriesTmdbId: number,
  preferenceLevel: PreferenceLevel // NEW PARAMETER
): Promise<FavoriteSeries> {
  // ... existing validation logic ...

  const favoriteSeries = await this.database.db.transaction(async (tx) => {
    // ... existing ignored series cleanup ...

    return await this.favoriteSeriesRepository.create(
      { userId, seriesTmdbId, preferenceLevel }, // UPDATED
      tx
    );
  });

  this.loggerService.info({
    message: 'Series added to favorites',
    userId,
    seriesTmdbId,
    preferenceLevel, // NEW
  });

  return favoriteSeries;
}
```

**New File:** `apps/backend/src/modules/series/application/actions/updateFavoriteSeriesPreferenceAction.test.ts`

Create comprehensive unit tests following the existing test patterns.

### 5. HTTP Routes & Schemas

**File:** `apps/backend/src/modules/series/routes/seriesSchemas.ts`

**Action:** Add new schemas and update existing ones

```typescript
// Add preference level enum
export const preferenceLevelSchema = Type.Union([
  Type.Literal('like'),
  Type.Literal('love'),
]);

// Update favorite series schema
export const favoriteSeriesSchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
  userId: Type.String({ format: 'uuid' }),
  seriesTmdbId: Type.Integer(),
  preferenceLevel: preferenceLevelSchema, // NEW
  addedAt: Type.String({ format: 'date-time' }),
});

// Update add favorite series request
export const addFavoriteSeriesRequestSchema = Type.Object({
  seriesTmdbId: Type.Integer(),
  preferenceLevel: preferenceLevelSchema, // NEW 
});

// New update preference schema
export const updateFavoriteSeriesPreferenceRequestSchema = Type.Object({
  preferenceLevel: preferenceLevelSchema,
});

export const updateFavoriteSeriesPreferenceParamsSchema = Type.Object({
  seriesTmdbId: Type.Integer(),
});

// Add query parameter for filtering by preference
export const favoriteSeriesQuerySchema = Type.Object({
  page: Type.Optional(Type.Integer({ minimum: 1 })),
  pageSize: Type.Optional(Type.Integer({ minimum: 1, maximum: 100 })),
  preferenceLevel: preferenceLevelSchema, // NEW
});
```

**File:** `apps/backend/src/modules/series/routes/seriesRoutes.ts`

**Action:** Add new route and update existing ones

```typescript
// POST /api/series/favorites - Add with preference level
fastify.post(
  '/favorites',
  {
    schema: {
      body: addFavoriteSeriesRequestSchema,
      response: { 200: favoriteSeriesSchema },
    },
    onRequest: [authMiddleware],
  },
  async (request, reply) => {
    const { seriesTmdbId, preferenceLevel } = request.body; // UPDATED
    const userId = request.userId!;

    const favorite = await addFavoriteSeriesAction.execute(
      userId,
      seriesTmdbId,
      preferenceLevel // NEW PARAMETER
    );

    return reply.send({
      id: favorite.id,
      userId: favorite.userId,
      seriesTmdbId: favorite.seriesTmdbId,
      preferenceLevel: favorite.preferenceLevel, // NEW
      addedAt: favorite.addedAt.toISOString(),
    });
  }
);

// PATCH /api/series/favorites/:seriesTmdbId/preference - Update preference level
fastify.patch(
  '/favorites/:seriesTmdbId/preference',
  {
    schema: {
      params: updateFavoriteSeriesPreferenceParamsSchema,
      body: updateFavoriteSeriesPreferenceRequestSchema,
      response: { 200: favoriteSeriesSchema },
    },
    onRequest: [authMiddleware],
  },
  async (request, reply) => {
    const { seriesTmdbId } = request.params;
    const { preferenceLevel } = request.body;
    const userId = request.userId!;

    const updated = await updateFavoriteSeriesPreferenceAction.execute({
      userId,
      seriesTmdbId,
      preferenceLevel,
    });

    return reply.send({
      id: updated.id,
      userId: updated.userId,
      seriesTmdbId: updated.seriesTmdbId,
      preferenceLevel: updated.preferenceLevel,
      addedAt: updated.addedAt.toISOString(),
    });
  }
);

// GET /api/series/favorites - Support filtering by preference level
fastify.get(
  '/favorites',
  {
    schema: {
      querystring: favoriteSeriesQuerySchema, // UPDATED
      response: { 200: favoriteSeriesListSchema },
    },
    onRequest: [authMiddleware],
  },
  async (request, reply) => {
    const { page = 1, pageSize = 20, preferenceLevel } = request.query; // NEW PARAM
    const userId = request.userId!;

    let favorites;
    let totalCount;

    if (preferenceLevel) {
      // Filter by preference level
      favorites = await favoriteSeriesRepository.findManyByPreference(
        userId,
        preferenceLevel,
        page,
        pageSize
      );
      totalCount = await favoriteSeriesRepository.countByPreference(userId, preferenceLevel);
    } else {
      // Get all favorites
      favorites = await getUserFavoriteSeriesAction.execute(userId, page, pageSize);
      totalCount = await favoriteSeriesRepository.count(userId);
    }

    return reply.send({
      data: favorites.map((f) => ({
        id: f.id,
        userId: f.userId,
        seriesTmdbId: f.seriesTmdbId,
        preferenceLevel: f.preferenceLevel, // NEW
        addedAt: f.addedAt.toISOString(),
      })),
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      },
    });
  }
);
```

### 6. AI Recommendation Prompt Updates

**File:** `apps/backend/src/modules/watchroom/application/actions/generateRecommendationsAction.ts`

**Action:** Update prompt to prioritize "loved" series

```typescript
interface ParticipantFavorites {
  participantId: string;
  lovedSeriesIds: number[];  // NEW
  likedSeriesIds: number[];  // NEW
}

private async fetchParticipantFavorites(
  participantIds: string[],
): Promise<ParticipantFavorites[]> {
  return Promise.all(
    participantIds.map(async (participantId) => {
      const allFavorites = await this.favoriteSeriesRepository.findMany(participantId, 1, 100);
      
      // Separate loved and liked series
      const lovedSeriesIds = allFavorites
        .filter(f => f.preferenceLevel === 'love')
        .map(f => f.seriesTmdbId);
      
      const likedSeriesIds = allFavorites
        .filter(f => f.preferenceLevel === 'like')
        .map(f => f.seriesTmdbId);

      return {
        participantId,
        lovedSeriesIds,
        likedSeriesIds,
      };
    }),
  );
}

private buildPromptMessage(
  participantFavorites: ParticipantFavorites[],
  ignoredSeriesIds: number[],
  seriesInfoMap: Map<number, SeriesInfo>,
  watchroomName: string,
  watchroomDescription: string | undefined,
): string {
  let message = `WATCH ROOM: "${watchroomName}"\n`;
  if (watchroomDescription) {
    message += `Description: ${watchroomDescription}\n`;
  }

  message += `\n---\n`;
  message += `PARTICIPANTS AND THEIR SERIES PREFERENCES:\n`;
  message += `These series are ALREADY WATCHED. DO NOT recommend any of these.\n`;
  message += `Pay special attention to LOVED series - these represent the strongest preferences.\n\n`;

  participantFavorites.forEach((participant, index) => {
    message += `Participant ${(index + 1).toString()}:\n\n`;
    
    // Show LOVED series first and prominently
    if (participant.lovedSeriesIds.length > 0) {
      message += `  ❤️ LOVED (HIGHEST PRIORITY - Core preferences):\n`;
      participant.lovedSeriesIds.forEach((tmdbId) => {
        const seriesInfo = seriesInfoMap.get(tmdbId);
        if (seriesInfo) {
          const firstOverviewSentence = seriesInfo.overview.split(/[.!?]/)[0];
          const summary = firstOverviewSentence ? firstOverviewSentence + '.' : '';

          message += `  - ${seriesInfo.name}\n`;
          message += `    Genres: ${seriesInfo.genres.join(', ')}\n`;
          message += `    Summary: ${summary}\n`;
          message += `    Rating: ${seriesInfo.voteAverage.toFixed(1)}/10\n`;
        }
      });
      message += '\n';
    }
    
    // Show LIKED series secondary
    if (participant.likedSeriesIds.length > 0) {
      message += `  👍 LIKED (Secondary preferences):\n`;
      participant.likedSeriesIds.forEach((tmdbId) => {
        const seriesInfo = seriesInfoMap.get(tmdbId);
        if (seriesInfo) {
          message += `  - ${seriesInfo.name} (${seriesInfo.genres.join(', ')})\n`;
        }
      });
      message += '\n';
    }
    
    message += '\n';
  });

  message += `\n---\n`;
  // ... rest of the prompt ...

  message += `RECOMMENDATION STRATEGY:\n`;
  message += `1. PRIORITIZE finding shows similar to ❤️ LOVED series - these are the strongest signals\n`;
  message += `2. Use 👍 LIKED series as secondary signals to understand broader taste\n`;
  message += `3. Look for thematic overlaps in LOVED series across participants\n`;
  message += `4. When multiple participants LOVE similar genres/themes, that's a very strong signal\n`;
  message += `5. LIKED series help understand edge cases but shouldn't dominate recommendations\n`;
  
  return message;
}
```

**Update system message:**

```typescript
const systemMessage = `You are an expert TV series recommender AI specializing in group recommendations.

Your expertise includes:
- Deep knowledge of TV series across all genres, eras, and platforms
- Understanding of thematic connections, narrative styles, and tonal similarities between shows
- Ability to identify common ground among diverse viewer preferences
- Recognition of emerging trends and hidden gems that match specific tastes

Core principles:
1. NEVER recommend series that are already in the user's favorites or ignored lists
2. PRIORITIZE matching LOVED series (❤️) over LIKED series (👍)
3. LOVED series represent core preferences - these are the most important signals
4. LIKED series provide context but shouldn't dominate the recommendation logic
5. When multiple participants LOVE similar themes/genres, that's your strongest signal
6. Consider both obvious and subtle connections (themes, mood, pacing, character types)
7. Balance popular acclaimed series with lesser-known quality recommendations
8. Ensure all recommended titles exist and use their exact TMDB names

Your recommendations should be thoughtful, well-justified, and demonstrate clear understanding of why each series would resonate with the group based on their collective preferences, especially their LOVED series.`;
```

### 7. Testing

**Unit Tests to Create/Update:**

1. `favoriteSeriesRepositoryImpl.test.ts` - Test new preference level methods
2. `addFavoriteSeriesAction.test.ts` - Test with preference level parameter
3. `updateFavoriteSeriesPreferenceAction.test.ts` - New action tests
4. `seriesRoutes.test.ts` - Test new endpoints and updated responses
5. `generateRecommendationsAction.test.ts` - Test AI prompt generation with preference levels

**Integration Tests:**

- Full flow: Add favorite with preference → Update preference → Generate recommendations

---

## Frontend Implementation

### 1. API Types

**File:** `apps/frontend/src/api/types/series.ts`

**Action:** Update types to include preference level

```typescript
export type PreferenceLevel = 'like' | 'love';

export interface FavoriteSeries {
  id: string;
  userId: string;
  seriesTmdbId: number;
  preferenceLevel: PreferenceLevel; // NEW
  addedAt: string;
}

export interface AddFavoriteSeriesRequest {
  seriesTmdbId: number;
  preferenceLevel: PreferenceLevel; // NEW
}

export interface UpdateFavoriteSeriesPreferenceRequest {
  preferenceLevel: PreferenceLevel;
}
```

### 2. API Queries

**File:** `apps/frontend/src/api/queries/addFavoriteSeries.ts`

**Action:** Update to support preference level

```typescript
export async function addFavoriteSeries(
  seriesTmdbId: number,
  preferenceLevel: PreferenceLevel = 'like' // NEW PARAMETER
): Promise<FavoriteSeries> {
  const response = await apiRequest<FavoriteSeries>('/series/favorites', {
    method: 'POST',
    body: JSON.stringify({ seriesTmdbId, preferenceLevel }), // UPDATED
  });

  return response;
}
```

**New File:** `apps/frontend/src/api/queries/updateFavoriteSeriesPreference.ts`

```typescript
import { apiRequest } from '../apiRequest';
import { FavoriteSeries, PreferenceLevel } from '../types/series';

export async function updateFavoriteSeriesPreference(
  seriesTmdbId: number,
  preferenceLevel: PreferenceLevel
): Promise<FavoriteSeries> {
  const response = await apiRequest<FavoriteSeries>(
    `/series/favorites/${seriesTmdbId}/preference`,
    {
      method: 'PATCH',
      body: JSON.stringify({ preferenceLevel }),
    }
  );

  return response;
}
```

**File:** `apps/frontend/src/api/queries/getFavoriteSeries.ts`

**Action:** Add preference level filter

```typescript
export async function getFavoriteSeries(
  page: number = 1,
  pageSize: number = 20,
  preferenceLevel: PreferenceLevel // NEW PARAMETER
): Promise<PaginatedResponse<FavoriteSeries>> {
  const params = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
    preferenceLevel: preferenceLevel, // NEW
  });

  const response = await apiRequest<PaginatedResponse<FavoriteSeries>>(
    `/series/favorites?${params.toString()}`,
    { method: 'GET' }
  );

  return response;
}
```

### 3. UI Components

**New Component:** `apps/frontend/src/components/ui/PreferenceToggle.tsx`

```tsx
import { Heart } from 'lucide-react';
import { PreferenceLevel } from '../api/types/series';
import { Button } from './ui/Button';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/Tooltip';

interface PreferenceToggleProps {
  preferenceLevel: PreferenceLevel;
  onToggle: (newLevel: PreferenceLevel) => void;
  disabled?: boolean;
}

export function PreferenceToggle({ 
  preferenceLevel, 
  onToggle, 
  disabled = false 
}: PreferenceToggleProps) {
  const isLoved = preferenceLevel === 'love';
  
  const handleClick = () => {
    onToggle(isLoved ? 'like' : 'love');
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          onClick={handleClick}
          disabled={disabled}
          variant="ghost"
          size="icon"
          className={`
            w-8 h-8 rounded-full transition-all duration-200
            ${isLoved 
              ? 'bg-red-500/20 hover:bg-red-500/30 text-red-500' 
              : 'bg-white/10 hover:bg-white/20 text-white/70 hover:text-white'
            }
          `}
          aria-label={isLoved ? 'Mark as liked' : 'Mark as loved'}
        >
          <Heart 
            className={`w-4 h-4 transition-all ${isLoved ? 'fill-current' : ''}`}
          />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        {isLoved ? 'Loved (click to change to Like)' : 'Liked (click to change to Love)'}
      </TooltipContent>
    </Tooltip>
  );
}
```

**Update Component:** `apps/frontend/src/components/FavoriteSeriesList.tsx`

**Action:** Add preference toggle to each series card

```tsx
import { updateFavoriteSeriesPreference } from '../api/queries/updateFavoriteSeriesPreference';
import { PreferenceToggle } from './ui/PreferenceToggle';

export default function FavoriteSeriesList({
  favorites,
  onRemoveFavorite,
  onUpdatePreference, // NEW PROP
  isLoading: externalLoading,
}: FavoriteSeriesListProps) {
  const [updatingIds, setUpdatingIds] = useState<Set<number>>(new Set());

  const handleUpdatePreference = async (
    seriesTmdbId: number, 
    newLevel: PreferenceLevel
  ) => {
    setUpdatingIds(prev => new Set(prev).add(seriesTmdbId));
    
    try {
      await onUpdatePreference(seriesTmdbId, newLevel);
    } catch (err) {
      console.error('Failed to update preference:', err);
    } finally {
      setUpdatingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(seriesTmdbId);
        return newSet;
      });
    }
  };

  return (
    // ... existing code ...
    
    {favorites.map((favorite) => {
      const details = seriesDetails.get(favorite.seriesTmdbId);
      const isRemoving = removingIds.has(favorite.seriesTmdbId);
      const isUpdating = updatingIds.has(favorite.seriesTmdbId);

      return (
        <div key={favorite.seriesTmdbId} className="group relative">
          <div className="relative w-full aspect-2/3 overflow-hidden rounded-lg">
            {/* ... existing poster code ... */}
            
            {/* Preference Toggle - Top Left */}
            <div className="absolute top-2 left-2 z-10">
              <PreferenceToggle
                preferenceLevel={favorite.preferenceLevel}
                onToggle={(newLevel) => 
                  handleUpdatePreference(favorite.seriesTmdbId, newLevel)
                }
                disabled={isUpdating || isRemoving}
              />
            </div>

            {/* Remove Button - Top Right */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={() => handleRemoveFavorite(favorite.seriesTmdbId)}
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 w-8 h-8"
                  disabled={isRemoving || isUpdating}
                >
                  <X className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Remove from favorites</TooltipContent>
            </Tooltip>

            {/* ... rest of card ... */}
          </div>
        </div>
      );
    })}
  );
}
```

**Update Component:** `apps/frontend/src/components/SeriesSearchResult.tsx`

**Action:** Add preference level selection when adding to favorites

```tsx
import { useState } from 'react';
import { Heart, Plus } from 'lucide-react';
import { Button } from './ui/Button';
import { PreferenceLevel } from '../api/types/series';

interface SeriesSearchResultProps {
  series: SeriesDetails;
  isFavorite: boolean;
  isIgnored: boolean;
  onAddFavorite: (seriesTmdbId: number, preferenceLevel: PreferenceLevel) => void;
  onRemoveFavorite: (seriesTmdbId: number) => void;
  onAddIgnored: (seriesTmdbId: number) => void;
  onRemoveIgnored: (seriesTmdbId: number) => void;
}

export function SeriesSearchResult({ 
  series, 
  isFavorite, 
  onAddFavorite,
  // ... other props
}: SeriesSearchResultProps) {
  const [selectedPreference, setSelectedPreference] = 
    useState<PreferenceLevel>('like');

  const handleAddFavorite = () => {
    onAddFavorite(series.id, selectedPreference);
  };

  return (
    <div className="series-card">
      {/* ... existing series display ... */}
      
      {!isFavorite && !isIgnored && (
        <div className="flex items-center gap-2">
          {/* Preference level selector */}
          <div className="flex gap-1 bg-muted rounded-lg p-1">
            <Button
              variant={selectedPreference === 'like' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSelectedPreference('like')}
              className="text-xs"
            >
              👍 Like
            </Button>
            <Button
              variant={selectedPreference === 'love' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSelectedPreference('love')}
              className="text-xs"
            >
              ❤️ Love
            </Button>
          </div>
          
          {/* Add button */}
          <Button onClick={handleAddFavorite} variant="primary">
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        </div>
      )}
    </div>
  );
}
```

### 4. Page Updates

**File:** `apps/frontend/src/pages/SeriesPage.tsx`

**Action:** Add filter tabs and update handlers

```tsx
import { useState } from 'react';
import { PreferenceLevel } from '../api/types/series';
import { updateFavoriteSeriesPreference } from '../api/queries/updateFavoriteSeriesPreference';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/Tabs';

export default function SeriesPage() {
  const [preferenceFilter, setPreferenceFilter] = 
    useState<PreferenceLevel | 'all'>('all');

  const handleUpdatePreference = async (
    seriesTmdbId: number, 
    preferenceLevel: PreferenceLevel
  ) => {
    try {
      await updateFavoriteSeriesPreference(seriesTmdbId, preferenceLevel);
      // Refresh favorites list
      await refetchFavorites();
    } catch (error) {
      // Handle error
    }
  };

  const handleAddFavorite = async (
    seriesTmdbId: number, 
    preferenceLevel: PreferenceLevel
  ) => {
    try {
      await addFavoriteSeries(seriesTmdbId, preferenceLevel);
      await refetchFavorites();
    } catch (error) {
      // Handle error
    }
  };

  return (
    <div className="series-page">
      {/* Filter tabs */}
      <Tabs value={preferenceFilter} onValueChange={setPreferenceFilter}>
        <TabsList>
          <TabsTrigger value="all">
            All ({totalFavoritesCount})
          </TabsTrigger>
          <TabsTrigger value="love">
            ❤️ Loved ({lovedCount})
          </TabsTrigger>
          <TabsTrigger value="like">
            👍 Liked ({likedCount})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <FavoriteSeriesList
        favorites={filteredFavorites}
        onRemoveFavorite={handleRemoveFavorite}
        onUpdatePreference={handleUpdatePreference}
        isLoading={isLoading}
      />
    </div>
  );
}
```

### 5. Testing

**Component Tests to Create/Update:**

1. `PreferenceToggle.test.tsx` - Test new component
2. `FavoriteSeriesList.test.tsx` - Test preference toggle integration
3. `SeriesSearchResult.test.tsx` - Test preference selection when adding
4. `SeriesPage.test.tsx` - Test filter tabs and preference updates

**E2E Tests (Playwright):**

**New File:** `apps/frontend/e2e/tests/series-preferences.spec.ts`

```typescript
test.describe('Series Preferences', () => {
  test('should add series as liked', async ({ page }) => {
    // Search for series
    // Select "Like" preference
    // Click Add
    // Verify series appears with heart outline
  });

  test('should add series as loved', async ({ page }) => {
    // Search for series
    // Select "Love" preference
    // Click Add
    // Verify series appears with filled heart
  });

  test('should toggle preference from like to love', async ({ page }) => {
    // Add series as liked
    // Click on preference toggle
    // Verify it changes to loved (filled heart)
  });

  test('should toggle preference from love to like', async ({ page }) => {
    // Add series as loved
    // Click on preference toggle
    // Verify it changes to liked (outline heart)
  });

  test('should filter favorites by preference level', async ({ page }) => {
    // Add multiple series with different preferences
    // Click "Loved" tab
    // Verify only loved series shown
    // Click "Liked" tab
    // Verify only liked series shown
    // Click "All" tab
    // Verify all series shown
  });
});
```

## Acceptance Criteria

### Backend

- ✅ Database schema includes `preference_level`
- ✅ Migration runs successfully without data loss
- ✅ API endpoint for adding favorites accepts `preferenceLevel`
- ✅ API endpoint for updating preference level works
- ✅ API endpoint for getting favorites supports filtering by preference level
- ✅ AI prompt prioritizes 'love' series over 'like' series
- ✅ All backend unit tests pass
- ✅ Integration tests cover preference level flows

### Frontend

- ✅ Users can select preference level when adding series
- ✅ Heart icon distinguishes between 'like' (outline) and 'love' (filled)
- ✅ Users can toggle preference level on existing favorites
- ✅ Filter tabs show counts for all/loved/liked series
- ✅ Filtering by preference level works correctly
- ✅ UI provides clear visual feedback during updates
- ✅ All component tests pass
- ✅ E2E tests cover full preference level workflows

### Quality

- ✅ Recommendation quality improves with new preference signals
- ✅ Users report better matches when using love/like distinction
- ✅ No performance degradation
- ✅ Error handling for all edge cases
- ✅ Proper loading states and disabled states
- ✅ Accessible keyboard navigation
