import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { Generator } from '../../../../tests/generator.ts';
import { truncateTables } from '../../../../tests/helpers/dbCleanup.ts';
import { closeTestServer, createTestContext } from '../../../../tests/helpers/testServer.ts';
import type { DatabaseClient } from '../../../infrastructure/database/database.ts';

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
  let database: DatabaseClient;

  beforeAll(async () => {
    const testContext = await createTestContext();
    server = testContext.server;
    database = testContext.database;
  });

  afterAll(async () => {
    await closeTestServer();
  });

  beforeEach(async () => {
    await truncateTables(database);
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
        payload: { seriesTmdbId: seriesTmdbId1 },
      });

      await server.inject({
        method: 'POST',
        url: '/series/favorites',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
        payload: { seriesTmdbId: seriesTmdbId2 },
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
        },
      });

      expect(response.statusCode).toBe(201);

      const body = response.json<FavoriteSeriesDto>();

      expect(body.seriesTmdbId).toBe(seriesTmdbId);
      expect(body.addedAt).toBeTypeOf('string');
      expect(new Date(body.addedAt).getTime()).toBeGreaterThan(0);
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
      expect(body.ignoredAt).toBeTypeOf('string');
      expect(new Date(body.ignoredAt).getTime()).toBeGreaterThan(0);
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
});
