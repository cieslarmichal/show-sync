import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { Generator } from '../../../../tests/generator.ts';
import { truncateTables } from '../../../../tests/helpers/dbCleanup.ts';
import { closeTestServer, createTestServerContext } from '../../../../tests/helpers/testServer.ts';
import type { DatabaseClient } from '../../../infrastructure/database/databaseClient.ts';

import type {
  SeriesRatingListResponse,
  SeriesRatingDto,
  SeriesWatchlistListResponse,
  SeriesWatchlistDto,
} from './seriesSchemas.ts';

type LoginResponse = {
  accessToken: string;
};

describe('Series Routes Integration Tests', () => {
  let server: FastifyInstance;
  let databaseClient: DatabaseClient;

  beforeAll(async () => {
    const testContext = await createTestServerContext();
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

  describe('GET /series/ratings', () => {
    it('should return empty list for user with no ratings', async () => {
      const accessToken = await registerAndLogin();

      const response = await server.inject({
        method: 'GET',
        url: '/series/ratings',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      });

      expect(response.statusCode).toBe(200);

      const body = response.json<SeriesRatingListResponse>();

      expect(body.data).toHaveLength(0);
      expect(body.metadata).toMatchObject({
        page: 1,
        pageSize: 20,
        total: 0,
      });
    });

    it('should return paginated list of rating series', async () => {
      const accessToken = await registerAndLogin();

      const seriesTmdbId1 = 12345;
      const seriesTmdbId2 = 67890;

      await server.inject({
        method: 'POST',
        url: '/series/ratings',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
        payload: { seriesTmdbId: seriesTmdbId1, rating: 'like' },
      });

      await server.inject({
        method: 'POST',
        url: '/series/ratings',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
        payload: { seriesTmdbId: seriesTmdbId2, rating: 'like' },
      });

      const response = await server.inject({
        method: 'GET',
        url: '/series/ratings',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      });

      expect(response.statusCode).toBe(200);

      const body = response.json<SeriesRatingListResponse>();

      expect(body.data).toHaveLength(2);
      expect(body.metadata.total).toBe(2);
      expect(body.data.map((s) => s.seriesTmdbId)).toContain(seriesTmdbId1);
      expect(body.data.map((s) => s.seriesTmdbId)).toContain(seriesTmdbId2);
    });

    it('should return 401 when not authenticated', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/series/ratings',
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('POST /series/ratings', () => {
    it('should add series to ratings', async () => {
      const accessToken = await registerAndLogin();

      const seriesTmdbId = 12345;

      const response = await server.inject({
        method: 'POST',
        url: '/series/ratings',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
        payload: {
          seriesTmdbId,
          rating: 'like',
        },
      });

      expect(response.statusCode).toBe(201);

      const body = response.json<SeriesRatingDto>();

      expect(body.seriesTmdbId).toBe(seriesTmdbId);
      expect(body.rating).toBe('like');
    });

    it('should return 409 when series is already in ratings', async () => {
      const accessToken = await registerAndLogin();

      const seriesTmdbId = 12345;

      // Add to ratings first time
      await server.inject({
        method: 'POST',
        url: '/series/ratings',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
        payload: {
          seriesTmdbId,
          rating: 'like',
        },
      });

      // Try to add again
      const response = await server.inject({
        method: 'POST',
        url: '/series/ratings',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
        payload: {
          seriesTmdbId,
          rating: 'like',
        },
      });

      expect(response.statusCode).toBe(409);
    });

    it('should return 401 when not authenticated', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/series/ratings',
        payload: {
          seriesTmdbId: 12345,
          rating: 'like',
        },
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('DELETE /series/ratings/:seriesTmdbId', () => {
    it('should remove series from ratings', async () => {
      const accessToken = await registerAndLogin();

      const seriesTmdbId = 12345;

      // Add rating first
      await server.inject({
        method: 'POST',
        url: '/series/ratings',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
        payload: {
          seriesTmdbId,
          rating: 'like',
        },
      });

      // Remove favorite
      const response = await server.inject({
        method: 'DELETE',
        url: `/series/ratings/${String(seriesTmdbId)}`,
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      });

      expect(response.statusCode).toBe(204);

      // Verify it was removed
      const getResponse = await server.inject({
        method: 'GET',
        url: '/series/ratings',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      });

      const body = getResponse.json<SeriesRatingListResponse>();
      expect(body.data).toHaveLength(0);
    });

    it('should return 404 when series is not in ratings', async () => {
      const accessToken = await registerAndLogin();

      const seriesTmdbId = 12345;

      // Try to remove without adding first
      const response = await server.inject({
        method: 'DELETE',
        url: `/series/ratings/${String(seriesTmdbId)}`,
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      });

      expect(response.statusCode).toBe(404);
    });

    it('should return 401 when not authenticated', async () => {
      const response = await server.inject({
        method: 'DELETE',
        url: '/series/ratings/12345',
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('GET /series/ignored', () => {
    it('should return empty list for user with no watchlist', async () => {
      const accessToken = await registerAndLogin();

      const response = await server.inject({
        method: 'GET',
        url: '/series/watchlist',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      });

      expect(response.statusCode).toBe(200);

      const body = response.json<SeriesWatchlistListResponse>();

      expect(body.data).toHaveLength(0);
      expect(body.metadata).toMatchObject({
        page: 1,
        pageSize: 20,
        total: 0,
      });
    });

    it('should return paginated list of watchlist', async () => {
      const accessToken = await registerAndLogin();

      const seriesTmdbId1 = 12345;
      const seriesTmdbId2 = 67890;

      // Add watchlist
      await server.inject({
        method: 'POST',
        url: '/series/watchlist',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
        payload: { seriesTmdbId: seriesTmdbId1, type: 'notInterested' },
      });

      await server.inject({
        method: 'POST',
        url: '/series/watchlist',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
        payload: { seriesTmdbId: seriesTmdbId2, type: 'wantToWatch' },
      });

      // Get watchlist
      const response = await server.inject({
        method: 'GET',
        url: '/series/watchlist',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      });

      expect(response.statusCode).toBe(200);

      const body = response.json<SeriesWatchlistListResponse>();

      expect(body.data).toHaveLength(2);
      expect(body.metadata.total).toBe(2);
      expect(body.data.map((s) => s.seriesTmdbId)).toContain(seriesTmdbId1);
      expect(body.data.map((s) => s.seriesTmdbId)).toContain(seriesTmdbId2);
    });

    it('should return 401 when not authenticated', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/series/watchlist',
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('POST /series/watchlist', () => {
    it('should add series to watchlist', async () => {
      const accessToken = await registerAndLogin();

      const seriesTmdbId = 12345;

      const response = await server.inject({
        method: 'POST',
        url: '/series/watchlist',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
        payload: {
          seriesTmdbId,
          type: 'notInterested',
        },
      });

      expect(response.statusCode).toBe(201);

      const body = response.json<SeriesWatchlistDto>();

      expect(body.seriesTmdbId).toBe(seriesTmdbId);
      expect(body.type).toBe('notInterested');
    });

    it('should return 409 when series is already in watchlist', async () => {
      const accessToken = await registerAndLogin();

      const seriesTmdbId = 12345;

      // Add to watchlist first time
      await server.inject({
        method: 'POST',
        url: '/series/watchlist',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
        payload: {
          seriesTmdbId,
          type: 'wantToWatch',
        },
      });

      // Try to add again
      const response = await server.inject({
        method: 'POST',
        url: '/series/watchlist',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
        payload: {
          seriesTmdbId,
          type: 'notInterested',
        },
      });

      expect(response.statusCode).toBe(409);
    });

    it('should return 401 when not authenticated', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/series/watchlist',
        payload: {
          seriesTmdbId: 12345,
          type: 'notInterested',
        },
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('DELETE /series/watchlist/:seriesTmdbId', () => {
    it('should remove series from watchlist', async () => {
      const accessToken = await registerAndLogin();

      const seriesTmdbId = 12345;

      // Add to watchlist first
      await server.inject({
        method: 'POST',
        url: '/series/watchlist',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
        payload: {
          seriesTmdbId,
          type: 'notInterested',
        },
      });

      // Remove from watchlist
      const response = await server.inject({
        method: 'DELETE',
        url: `/series/watchlist/${String(seriesTmdbId)}`,
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      });

      expect(response.statusCode).toBe(204);

      // Verify it was removed
      const getResponse = await server.inject({
        method: 'GET',
        url: '/series/watchlist',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      });

      const body = getResponse.json<SeriesWatchlistListResponse>();
      expect(body.data).toHaveLength(0);
    });

    it('should return 404 when series is not in watchlist', async () => {
      const accessToken = await registerAndLogin();

      const seriesTmdbId = 12345;

      // Try to remove without adding first
      const response = await server.inject({
        method: 'DELETE',
        url: `/series/watchlist/${String(seriesTmdbId)}`,
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      });

      expect(response.statusCode).toBe(404);
    });

    it('should return 401 when not authenticated', async () => {
      const response = await server.inject({
        method: 'DELETE',
        url: '/series/watchlist/12345',
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('PATCH /series/ratings/:seriesTmdbId', () => {
    it('should update rating from like to love', async () => {
      const accessToken = await registerAndLogin();

      const seriesTmdbId = 12345;

      // Add rating with 'like' rating
      const addResponse = await server.inject({
        method: 'POST',
        url: '/series/ratings',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
        payload: {
          seriesTmdbId,
          rating: 'like',
        },
      });

      expect(addResponse.statusCode).toBe(201);

      // Update to 'love'
      const updateResponse = await server.inject({
        method: 'PATCH',
        url: `/series/ratings/${String(seriesTmdbId)}`,
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
        payload: {
          rating: 'love',
        },
      });

      expect(updateResponse.statusCode).toBe(200);

      const body = updateResponse.json<SeriesRatingDto>();
      expect(body.seriesTmdbId).toBe(seriesTmdbId);
      expect(body.rating).toBe('love');
    });

    it('should update rating from love to like', async () => {
      const accessToken = await registerAndLogin();

      const seriesTmdbId = 67890;

      // Add rating with 'love' rating
      await server.inject({
        method: 'POST',
        url: '/series/ratings',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
        payload: {
          seriesTmdbId,
          rating: 'love',
        },
      });

      // Update to 'like'
      const updateResponse = await server.inject({
        method: 'PATCH',
        url: `/series/ratings/${String(seriesTmdbId)}`,
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
        payload: {
          rating: 'like',
        },
      });

      expect(updateResponse.statusCode).toBe(200);

      const body = updateResponse.json<SeriesRatingDto>();
      expect(body.seriesTmdbId).toBe(seriesTmdbId);
      expect(body.rating).toBe('like');
    });

    it('should return 404 when rating series does not exist', async () => {
      const accessToken = await registerAndLogin();

      const seriesTmdbId = 99999;

      const response = await server.inject({
        method: 'PATCH',
        url: `/series/ratings/${String(seriesTmdbId)}`,
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
        payload: {
          rating: 'love',
        },
      });

      expect(response.statusCode).toBe(404);
    });

    it('should return 401 when not authenticated', async () => {
      const response = await server.inject({
        method: 'PATCH',
        url: '/series/ratings/12345',
        payload: {
          rating: 'love',
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 400 for invalid rating', async () => {
      const accessToken = await registerAndLogin();

      const seriesTmdbId = 12345;

      // Add rating first
      await server.inject({
        method: 'POST',
        url: '/series/ratings',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
        payload: {
          seriesTmdbId,
          rating: 'like',
        },
      });

      // Try to update with invalid rating
      const response = await server.inject({
        method: 'PATCH',
        url: `/series/ratings/${String(seriesTmdbId)}`,
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
        payload: {
          rating: 'invalid',
        },
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('GET /series/ratings with rating filter', () => {
    it('should filter ratings by love rating', async () => {
      const accessToken = await registerAndLogin();

      // Add ratings with different ratings
      await server.inject({
        method: 'POST',
        url: '/series/ratings',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
        payload: {
          seriesTmdbId: 11111,
          rating: 'love',
        },
      });

      await server.inject({
        method: 'POST',
        url: '/series/ratings',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
        payload: {
          seriesTmdbId: 22222,
          rating: 'like',
        },
      });

      await server.inject({
        method: 'POST',
        url: '/series/ratings',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
        payload: {
          seriesTmdbId: 33333,
          rating: 'love',
        },
      });

      // Get only loved ratings
      const response = await server.inject({
        method: 'GET',
        url: '/series/ratings?rating=love',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      });

      expect(response.statusCode).toBe(200);

      const body = response.json<SeriesRatingListResponse>();
      expect(body.data).toHaveLength(2);
      expect(body.data.every((f) => f.rating === 'love')).toBe(true);
      expect(body.data.map((f) => f.seriesTmdbId)).toContain(11111);
      expect(body.data.map((f) => f.seriesTmdbId)).toContain(33333);
    });

    it('should filter ratings by like rating', async () => {
      const accessToken = await registerAndLogin();

      // Add ratings with different ratings
      await server.inject({
        method: 'POST',
        url: '/series/ratings',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
        payload: {
          seriesTmdbId: 11111,
          rating: 'love',
        },
      });

      await server.inject({
        method: 'POST',
        url: '/series/ratings',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
        payload: {
          seriesTmdbId: 22222,
          rating: 'like',
        },
      });

      // Get only liked ratings
      const response = await server.inject({
        method: 'GET',
        url: '/series/ratings?rating=like',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      });

      expect(response.statusCode).toBe(200);

      const body = response.json<SeriesRatingListResponse>();
      expect(body.data).toHaveLength(1);
      expect(body.data[0]?.rating).toBe('like');
      expect(body.data[0]?.seriesTmdbId).toBe(22222);
    });

    it('should return all ratings when no filter is applied', async () => {
      const accessToken = await registerAndLogin();

      // Add ratings with different ratings
      await server.inject({
        method: 'POST',
        url: '/series/ratings',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
        payload: {
          seriesTmdbId: 11111,
          rating: 'love',
        },
      });

      await server.inject({
        method: 'POST',
        url: '/series/ratings',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
        payload: {
          seriesTmdbId: 22222,
          rating: 'like',
        },
      });

      // Get all ratings
      const response = await server.inject({
        method: 'GET',
        url: '/series/ratings',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      });

      expect(response.statusCode).toBe(200);

      const body = response.json<SeriesRatingListResponse>();
      expect(body.data).toHaveLength(2);
    });
  });

  describe('POST /series/ratings with rating', () => {
    it('should create rating with love rating', async () => {
      const accessToken = await registerAndLogin();

      const response = await server.inject({
        method: 'POST',
        url: '/series/ratings',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
        payload: {
          seriesTmdbId: 12345,
          rating: 'love',
        },
      });

      expect(response.statusCode).toBe(201);

      const body = response.json<SeriesRatingDto>();
      expect(body.seriesTmdbId).toBe(12345);
      expect(body.rating).toBe('love');
    });

    it('should create rating with like rating', async () => {
      const accessToken = await registerAndLogin();

      const response = await server.inject({
        method: 'POST',
        url: '/series/ratings',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
        payload: {
          seriesTmdbId: 67890,
          rating: 'like',
        },
      });

      expect(response.statusCode).toBe(201);

      const body = response.json<SeriesRatingDto>();
      expect(body.seriesTmdbId).toBe(67890);
      expect(body.rating).toBe('like');
    });

    it('should return 400 when rating is not provided', async () => {
      const accessToken = await registerAndLogin();

      const response = await server.inject({
        method: 'POST',
        url: '/series/ratings',
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
