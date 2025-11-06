import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { Generator } from '../../../../tests/generator.ts';
import { truncateTables } from '../../../../tests/helpers/dbCleanup.ts';
import { closeTestServer, createTestContext } from '../../../../tests/helpers/testServer.ts';
import type { DatabaseClient } from '../../../infrastructure/database/databaseClient.ts';

import type {
  FavoriteSeriesListResponse,
  FavoriteSeriesDto,
  IgnoredSeriesListResponse,
  IgnoredSeriesDto,
} from './seriesSchemas.ts';

type LoginResponse = {
  accessToken: string;
};

describe('Series Routes Integration Tests', () => {
  let server: FastifyInstance;
  let databaseClient: DatabaseClient;

  beforeAll(async () => {
    const testContext = await createTestContext();
    server = testContext.server;
    databaseClient = testContext.databaseClient;
  });

  afterAll(async () => {
    await closeTestServer();
  });

  beforeEach(async () => {
    await truncateTables(databaseClient);
  });

  // Helper function to register and login a user
  async function registerAndLogin(): Promise<string> {
    const userData = {
      name: Generator.firstName(),
      email: Generator.email(),
      password: Generator.password(),
    };

    // Register user
    await server.inject({
      method: 'POST',
      url: '/users/register',
      payload: userData,
    });

    // Login
    const loginResponse = await server.inject({
      method: 'POST',
      url: '/users/login',
      payload: {
        email: userData.email,
        password: userData.password,
      },
    });

    const loginBody = loginResponse.json<LoginResponse>();
    return loginBody.accessToken;
  }

  describe('GET /series/favorites', () => {
    it('should return empty list for user with no favorites', async () => {
      const accessToken = await registerAndLogin();

      const response = await server.inject({
        method: 'GET',
        url: '/series/favorites',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      });

      expect(response.statusCode).toBe(200);

      const body = response.json<FavoriteSeriesListResponse>();

      expect(body.data).toHaveLength(0);
      expect(body.metadata).toMatchObject({
        page: 1,
        pageSize: 20,
        total: 0,
      });
    });

    it('should return paginated list of favorite series', async () => {
      const accessToken = await registerAndLogin();

      const seriesTmdbId1 = 12345;
      const seriesTmdbId2 = 67890;

      // Add favorites
      await server.inject({
        method: 'POST',
        url: '/series/favorites',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
        payload: { seriesTmdbId: seriesTmdbId1, preferenceLevel: 'like' },
      });

      await server.inject({
        method: 'POST',
        url: '/series/favorites',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
        payload: { seriesTmdbId: seriesTmdbId2, preferenceLevel: 'like' },
      });

      // Get favorites
      const response = await server.inject({
        method: 'GET',
        url: '/series/favorites',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      });

      expect(response.statusCode).toBe(200);

      const body = response.json<FavoriteSeriesListResponse>();

      expect(body.data).toHaveLength(2);
      expect(body.metadata.total).toBe(2);
      expect(body.data.map((s) => s.seriesTmdbId)).toContain(seriesTmdbId1);
      expect(body.data.map((s) => s.seriesTmdbId)).toContain(seriesTmdbId2);
    });

    it('should return 401 when not authenticated', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/series/favorites',
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('POST /series/favorites', () => {
    it('should add series to favorites', async () => {
      const accessToken = await registerAndLogin();

      const seriesTmdbId = 12345;

      const response = await server.inject({
        method: 'POST',
        url: '/series/favorites',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
        payload: {
          seriesTmdbId,
          preferenceLevel: 'like',
        },
      });

      expect(response.statusCode).toBe(201);

      const body = response.json<FavoriteSeriesDto>();

      expect(body.seriesTmdbId).toBe(seriesTmdbId);
      expect(body.preferenceLevel).toBe('like');
    });

    it('should return 409 when series is already in favorites', async () => {
      const accessToken = await registerAndLogin();

      const seriesTmdbId = 12345;

      // Add to favorites first time
      await server.inject({
        method: 'POST',
        url: '/series/favorites',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
        payload: {
          seriesTmdbId,
          preferenceLevel: 'like',
        },
      });

      // Try to add again
      const response = await server.inject({
        method: 'POST',
        url: '/series/favorites',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
        payload: {
          seriesTmdbId,
          preferenceLevel: 'like',
        },
      });

      expect(response.statusCode).toBe(409);
    });

    it('should return 401 when not authenticated', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/series/favorites',
        payload: {
          seriesTmdbId: 12345,
          preferenceLevel: 'like',
        },
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('DELETE /series/favorites/:seriesTmdbId', () => {
    it('should remove series from favorites', async () => {
      const accessToken = await registerAndLogin();

      const seriesTmdbId = 12345;

      // Add favorite first
      await server.inject({
        method: 'POST',
        url: '/series/favorites',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
        payload: {
          seriesTmdbId,
          preferenceLevel: 'like',
        },
      });

      // Remove favorite
      const response = await server.inject({
        method: 'DELETE',
        url: `/series/favorites/${String(seriesTmdbId)}`,
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      });

      expect(response.statusCode).toBe(204);

      // Verify it was removed
      const getResponse = await server.inject({
        method: 'GET',
        url: '/series/favorites',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      });

      const body = getResponse.json<FavoriteSeriesListResponse>();
      expect(body.data).toHaveLength(0);
    });

    it('should return 404 when series is not in favorites', async () => {
      const accessToken = await registerAndLogin();

      const seriesTmdbId = 12345;

      // Try to remove without adding first
      const response = await server.inject({
        method: 'DELETE',
        url: `/series/favorites/${String(seriesTmdbId)}`,
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      });

      expect(response.statusCode).toBe(404);
    });

    it('should return 401 when not authenticated', async () => {
      const response = await server.inject({
        method: 'DELETE',
        url: '/series/favorites/12345',
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('GET /series/ignored', () => {
    it('should return empty list for user with no ignored series', async () => {
      const accessToken = await registerAndLogin();

      const response = await server.inject({
        method: 'GET',
        url: '/series/ignored',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      });

      expect(response.statusCode).toBe(200);

      const body = response.json<IgnoredSeriesListResponse>();

      expect(body.data).toHaveLength(0);
      expect(body.metadata).toMatchObject({
        page: 1,
        pageSize: 20,
        total: 0,
      });
    });

    it('should return paginated list of ignored series', async () => {
      const accessToken = await registerAndLogin();

      const seriesTmdbId1 = 12345;
      const seriesTmdbId2 = 67890;

      // Add ignored series
      await server.inject({
        method: 'POST',
        url: '/series/ignored',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
        payload: { seriesTmdbId: seriesTmdbId1 },
      });

      await server.inject({
        method: 'POST',
        url: '/series/ignored',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
        payload: { seriesTmdbId: seriesTmdbId2 },
      });

      // Get ignored series
      const response = await server.inject({
        method: 'GET',
        url: '/series/ignored',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      });

      expect(response.statusCode).toBe(200);

      const body = response.json<IgnoredSeriesListResponse>();

      expect(body.data).toHaveLength(2);
      expect(body.metadata.total).toBe(2);
      expect(body.data.map((s) => s.seriesTmdbId)).toContain(seriesTmdbId1);
      expect(body.data.map((s) => s.seriesTmdbId)).toContain(seriesTmdbId2);
    });

    it('should return 401 when not authenticated', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/series/ignored',
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('POST /series/ignored', () => {
    it('should add series to ignored list', async () => {
      const accessToken = await registerAndLogin();

      const seriesTmdbId = 12345;

      const response = await server.inject({
        method: 'POST',
        url: '/series/ignored',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
        payload: {
          seriesTmdbId,
        },
      });

      expect(response.statusCode).toBe(201);

      const body = response.json<IgnoredSeriesDto>();

      expect(body.seriesTmdbId).toBe(seriesTmdbId);
    });

    it('should return 409 when series is already ignored', async () => {
      const accessToken = await registerAndLogin();

      const seriesTmdbId = 12345;

      // Add to ignored first time
      await server.inject({
        method: 'POST',
        url: '/series/ignored',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
        payload: {
          seriesTmdbId,
        },
      });

      // Try to add again
      const response = await server.inject({
        method: 'POST',
        url: '/series/ignored',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
        payload: {
          seriesTmdbId,
        },
      });

      expect(response.statusCode).toBe(409);
    });

    it('should return 401 when not authenticated', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/series/ignored',
        payload: {
          seriesTmdbId: 12345,
        },
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('DELETE /series/ignored/:seriesTmdbId', () => {
    it('should remove series from ignored list', async () => {
      const accessToken = await registerAndLogin();

      const seriesTmdbId = 12345;

      // Add to ignored first
      await server.inject({
        method: 'POST',
        url: '/series/ignored',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
        payload: {
          seriesTmdbId,
        },
      });

      // Remove from ignored
      const response = await server.inject({
        method: 'DELETE',
        url: `/series/ignored/${String(seriesTmdbId)}`,
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      });

      expect(response.statusCode).toBe(204);

      // Verify it was removed
      const getResponse = await server.inject({
        method: 'GET',
        url: '/series/ignored',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      });

      const body = getResponse.json<IgnoredSeriesListResponse>();
      expect(body.data).toHaveLength(0);
    });

    it('should return 404 when series is not in ignored list', async () => {
      const accessToken = await registerAndLogin();

      const seriesTmdbId = 12345;

      // Try to remove without adding first
      const response = await server.inject({
        method: 'DELETE',
        url: `/series/ignored/${String(seriesTmdbId)}`,
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      });

      expect(response.statusCode).toBe(404);
    });

    it('should return 401 when not authenticated', async () => {
      const response = await server.inject({
        method: 'DELETE',
        url: '/series/ignored/12345',
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('PATCH /series/favorites/:seriesTmdbId/preference', () => {
    it('should update preference level from like to love', async () => {
      const accessToken = await registerAndLogin();

      const seriesTmdbId = 12345;

      // Add favorite with 'like' preference
      const addResponse = await server.inject({
        method: 'POST',
        url: '/series/favorites',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
        payload: {
          seriesTmdbId,
          preferenceLevel: 'like',
        },
      });

      expect(addResponse.statusCode).toBe(201);

      // Update to 'love'
      const updateResponse = await server.inject({
        method: 'PATCH',
        url: `/series/favorites/${String(seriesTmdbId)}/preference`,
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
        payload: {
          preferenceLevel: 'love',
        },
      });

      expect(updateResponse.statusCode).toBe(200);

      const body = updateResponse.json<FavoriteSeriesDto>();
      expect(body.seriesTmdbId).toBe(seriesTmdbId);
      expect(body.preferenceLevel).toBe('love');
    });

    it('should update preference level from love to like', async () => {
      const accessToken = await registerAndLogin();

      const seriesTmdbId = 67890;

      // Add favorite with 'love' preference
      await server.inject({
        method: 'POST',
        url: '/series/favorites',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
        payload: {
          seriesTmdbId,
          preferenceLevel: 'love',
        },
      });

      // Update to 'like'
      const updateResponse = await server.inject({
        method: 'PATCH',
        url: `/series/favorites/${String(seriesTmdbId)}/preference`,
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
        payload: {
          preferenceLevel: 'like',
        },
      });

      expect(updateResponse.statusCode).toBe(200);

      const body = updateResponse.json<FavoriteSeriesDto>();
      expect(body.seriesTmdbId).toBe(seriesTmdbId);
      expect(body.preferenceLevel).toBe('like');
    });

    it('should return 404 when favorite series does not exist', async () => {
      const accessToken = await registerAndLogin();

      const seriesTmdbId = 99999;

      const response = await server.inject({
        method: 'PATCH',
        url: `/series/favorites/${String(seriesTmdbId)}/preference`,
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
        payload: {
          preferenceLevel: 'love',
        },
      });

      expect(response.statusCode).toBe(404);
    });

    it('should return 401 when not authenticated', async () => {
      const response = await server.inject({
        method: 'PATCH',
        url: '/series/favorites/12345/preference',
        payload: {
          preferenceLevel: 'love',
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 400 for invalid preference level', async () => {
      const accessToken = await registerAndLogin();

      const seriesTmdbId = 12345;

      // Add favorite first
      await server.inject({
        method: 'POST',
        url: '/series/favorites',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
        payload: {
          seriesTmdbId,
          preferenceLevel: 'like',
        },
      });

      // Try to update with invalid preference
      const response = await server.inject({
        method: 'PATCH',
        url: `/series/favorites/${String(seriesTmdbId)}/preference`,
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
        payload: {
          preferenceLevel: 'invalid',
        },
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('GET /series/favorites with preferenceLevel filter', () => {
    it('should filter favorites by love preference', async () => {
      const accessToken = await registerAndLogin();

      // Add favorites with different preferences
      await server.inject({
        method: 'POST',
        url: '/series/favorites',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
        payload: {
          seriesTmdbId: 11111,
          preferenceLevel: 'love',
        },
      });

      await server.inject({
        method: 'POST',
        url: '/series/favorites',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
        payload: {
          seriesTmdbId: 22222,
          preferenceLevel: 'like',
        },
      });

      await server.inject({
        method: 'POST',
        url: '/series/favorites',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
        payload: {
          seriesTmdbId: 33333,
          preferenceLevel: 'love',
        },
      });

      // Get only loved favorites
      const response = await server.inject({
        method: 'GET',
        url: '/series/favorites?preferenceLevel=love',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      });

      expect(response.statusCode).toBe(200);

      const body = response.json<FavoriteSeriesListResponse>();
      expect(body.data).toHaveLength(2);
      expect(body.data.every((f) => f.preferenceLevel === 'love')).toBe(true);
      expect(body.data.map((f) => f.seriesTmdbId)).toContain(11111);
      expect(body.data.map((f) => f.seriesTmdbId)).toContain(33333);
    });

    it('should filter favorites by like preference', async () => {
      const accessToken = await registerAndLogin();

      // Add favorites with different preferences
      await server.inject({
        method: 'POST',
        url: '/series/favorites',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
        payload: {
          seriesTmdbId: 11111,
          preferenceLevel: 'love',
        },
      });

      await server.inject({
        method: 'POST',
        url: '/series/favorites',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
        payload: {
          seriesTmdbId: 22222,
          preferenceLevel: 'like',
        },
      });

      // Get only liked favorites
      const response = await server.inject({
        method: 'GET',
        url: '/series/favorites?preferenceLevel=like',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      });

      expect(response.statusCode).toBe(200);

      const body = response.json<FavoriteSeriesListResponse>();
      expect(body.data).toHaveLength(1);
      expect(body.data[0]?.preferenceLevel).toBe('like');
      expect(body.data[0]?.seriesTmdbId).toBe(22222);
    });

    it('should return all favorites when no filter is applied', async () => {
      const accessToken = await registerAndLogin();

      // Add favorites with different preferences
      await server.inject({
        method: 'POST',
        url: '/series/favorites',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
        payload: {
          seriesTmdbId: 11111,
          preferenceLevel: 'love',
        },
      });

      await server.inject({
        method: 'POST',
        url: '/series/favorites',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
        payload: {
          seriesTmdbId: 22222,
          preferenceLevel: 'like',
        },
      });

      // Get all favorites
      const response = await server.inject({
        method: 'GET',
        url: '/series/favorites',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      });

      expect(response.statusCode).toBe(200);

      const body = response.json<FavoriteSeriesListResponse>();
      expect(body.data).toHaveLength(2);
    });
  });

  describe('POST /series/favorites with preferenceLevel', () => {
    it('should create favorite with love preference', async () => {
      const accessToken = await registerAndLogin();

      const response = await server.inject({
        method: 'POST',
        url: '/series/favorites',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
        payload: {
          seriesTmdbId: 12345,
          preferenceLevel: 'love',
        },
      });

      expect(response.statusCode).toBe(201);

      const body = response.json<FavoriteSeriesDto>();
      expect(body.seriesTmdbId).toBe(12345);
      expect(body.preferenceLevel).toBe('love');
    });

    it('should create favorite with like preference', async () => {
      const accessToken = await registerAndLogin();

      const response = await server.inject({
        method: 'POST',
        url: '/series/favorites',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
        payload: {
          seriesTmdbId: 67890,
          preferenceLevel: 'like',
        },
      });

      expect(response.statusCode).toBe(201);

      const body = response.json<FavoriteSeriesDto>();
      expect(body.seriesTmdbId).toBe(67890);
      expect(body.preferenceLevel).toBe('like');
    });

    it('should return 400 when preferenceLevel is not provided', async () => {
      const accessToken = await registerAndLogin();

      const response = await server.inject({
        method: 'POST',
        url: '/series/favorites',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
        payload: {
          seriesTmdbId: 99999,
        },
      });

      expect(response.statusCode).toBe(400);
    });
  });
});
