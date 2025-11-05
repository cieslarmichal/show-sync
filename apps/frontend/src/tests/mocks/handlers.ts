import { http, HttpResponse } from 'msw';

/**
 * MSW Handlers for API Mocking
 *
 * Mock API endpoints for testing purposes
 */

const API_BASE_URL = 'http://localhost:5000';

export const handlers = [
  // Auth endpoints
  http.post(`${API_BASE_URL}/users/register`, async ({ request }) => {
    const body = (await request.json()) as { name: string; email: string; password: string };

    return HttpResponse.json(
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: body.name,
        email: body.email,
        createdAt: new Date().toISOString(),
      },
      { status: 201 },
    );
  }),

  http.post(`${API_BASE_URL}/users/login`, async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string };

    // Simulate successful login
    if (body.email && body.password) {
      return HttpResponse.json({
        accessToken: 'mock-access-token',
        user: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Test User',
          email: body.email,
        },
      });
    }

    return HttpResponse.json({ message: 'Invalid credentials' }, { status: 401 });
  }),

  http.post(`${API_BASE_URL}/users/refresh`, () => {
    // Simulate no refresh token available (user not logged in)
    // This prevents act() warnings in tests by not triggering state updates
    return HttpResponse.json({ message: 'No refresh token available' }, { status: 401 });
  }),

  http.post(`${API_BASE_URL}/users/refresh-token`, () => {
    // Simulate no refresh token available (user not logged in)
    // This prevents act() warnings in tests by not triggering state updates
    return HttpResponse.json({ message: 'No refresh token available' }, { status: 401 });
  }),

  http.post(`${API_BASE_URL}/users/logout`, () => {
    return HttpResponse.json({}, { status: 204 });
  }),

  http.get(`${API_BASE_URL}/users/me`, () => {
    return HttpResponse.json({
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Test User',
      email: 'test@example.com',
      createdAt: new Date().toISOString(),
    });
  }),

  // User profile endpoints
  http.get(`${API_BASE_URL}/users/profile`, () => {
    return HttpResponse.json({
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Test User',
      email: 'test@example.com',
      favoriteSeries: [
        { id: 1396, name: 'Breaking Bad', posterPath: '/ggFHVNu6YYI5L9pCfOacjizRGt.jpg' },
        { id: 60059, name: 'Better Call Saul', posterPath: '/fC2HDm5t0kHl7mTm7jxMR31b7by.jpg' },
      ],
    });
  }),

  http.put(`${API_BASE_URL}/users/profile/series`, async ({ request }) => {
    const body = (await request.json()) as { seriesIds: number[] };

    return HttpResponse.json({
      message: 'Favorite series updated',
      seriesIds: body.seriesIds,
    });
  }),

  // Series endpoints
  http.get(`${API_BASE_URL}/series/search`, ({ request }) => {
    const url = new URL(request.url);
    const query = url.searchParams.get('query');

    const allSeries = [
      {
        id: 1396,
        name: 'Breaking Bad',
        overview: 'A high school chemistry teacher turned meth cook...',
        posterPath: '/ggFHVNu6YYI5L9pCfOacjizRGt.jpg',
        firstAirDate: '2008-01-20',
        voteAverage: 8.9,
        genreIds: [18, 80],
        originCountry: ['US'],
        originalLanguage: 'en',
      },
      {
        id: 60059,
        name: 'Better Call Saul',
        overview: 'Six years before Saul Goodman meets Walter White...',
        posterPath: '/fC2HDm5t0kHl7mTm7jxMR31b7by.jpg',
        firstAirDate: '2015-02-08',
        voteAverage: 8.8,
        genreIds: [18, 80],
        originCountry: ['US'],
        originalLanguage: 'en',
      },
    ];

    const filteredSeries = allSeries.filter((series) => series.name.toLowerCase().includes(query?.toLowerCase() || ''));

    return HttpResponse.json({
      data: filteredSeries,
      metadata: {
        page: 1,
        pageSize: filteredSeries.length,
        total: filteredSeries.length,
      },
    });
  }),

  http.get(`${API_BASE_URL}/series/batch/details`, ({ request }) => {
    const url = new URL(request.url);
    const idsParam = url.searchParams.get('ids');
    const ids = idsParam ? idsParam.split(',').map((id) => parseInt(id, 10)) : [];

    const seriesMap: Record<number, unknown> = {
      1: {
        id: 1,
        name: 'Breaking Bad',
        posterPath: '/poster1.jpg',
        overview: 'A chemistry teacher turned meth producer',
        firstAirDate: '2008-01-20',
        genres: ['Drama', 'Crime'],
        numberOfSeasons: 5,
        numberOfEpisodes: 62,
        backdropPath: '/backdrop1.jpg',
        status: 'Ended',
        voteAverage: 9.5,
        genreIds: [18, 80],
        originCountry: ['US'],
        originalLanguage: 'en',
      },
      2: {
        id: 2,
        name: 'Game of Thrones',
        posterPath: '/poster2.jpg',
        overview: 'Epic fantasy series',
        firstAirDate: '2011-04-17',
        genres: ['Fantasy', 'Drama'],
        numberOfSeasons: 8,
        numberOfEpisodes: 73,
        backdropPath: '/backdrop2.jpg',
        status: 'Ended',
        voteAverage: 9.2,
        genreIds: [10765, 18],
        originCountry: ['US'],
        originalLanguage: 'en',
      },
    };

    const seriesDetails = ids.map((id) => seriesMap[id] || {
      id,
      name: `Series ${id}`,
      posterPath: `/poster${id}.jpg`,
      overview: 'Test overview',
      firstAirDate: '2024-01-01',
      genres: ['Drama'],
      numberOfSeasons: 1,
      numberOfEpisodes: 10,
      backdropPath: null,
      status: 'Returning Series',
      voteAverage: 8.5,
      genreIds: [18],
      originCountry: ['US'],
      originalLanguage: 'en',
    });

    return HttpResponse.json({
      data: seriesDetails,
    });
  }),

  // WatchRoom endpoints
  http.post(`${API_BASE_URL}/watchrooms`, async ({ request }) => {
    const body = (await request.json()) as { name: string; description?: string };

    return HttpResponse.json(
      {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: body.name,
        description: body.description,
        inviteCode: 'abc123def456',
        ownerId: '123e4567-e89b-12d3-a456-426614174000',
        createdAt: new Date().toISOString(),
      },
      { status: 201 },
    );
  }),

  http.get(`${API_BASE_URL}/watchrooms/:id`, ({ params }) => {
    return HttpResponse.json({
      id: params.id,
      name: 'Test Watch Room',
      description: 'A test watch room',
      inviteCode: 'abc123def456',
      ownerId: '123e4567-e89b-12d3-a456-426614174000',
      participants: [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Test User',
          email: 'test@example.com',
          isOwner: true,
        },
      ],
      createdAt: new Date().toISOString(),
    });
  }),

  http.post(`${API_BASE_URL}/watchrooms/:inviteCode/join`, () => {
    return HttpResponse.json({
      message: 'Successfully joined watch room',
      watchRoomId: '550e8400-e29b-41d4-a716-446655440000',
    });
  }),

  http.post(`${API_BASE_URL}/watchrooms/:id/recommendations`, () => {
    return HttpResponse.json({
      recommendations: [
        {
          seriesId: 1438,
          title: 'The Wire',
          overview: 'Told from the points of view of both the Baltimore homicide and narcotics detectives...',
          posterPath: '/4lbclFySvugI51fwsyxBTOm4DqK.jpg',
          reasoning: 'Complex storytelling and character development similar to Breaking Bad',
          voteAverage: 9.3,
        },
        {
          seriesId: 1399,
          title: 'Game of Thrones',
          overview: 'Seven noble families fight for control of the mythical land of Westeros...',
          posterPath: '/u3bZgnGQ9T01sWNhyveQz0wH0Hl.jpg',
          reasoning: 'Epic scope and ensemble cast matching Better Call Saul style',
          voteAverage: 8.3,
        },
      ],
    });
  }),
];
