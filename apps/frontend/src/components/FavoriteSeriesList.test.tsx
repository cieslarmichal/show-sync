import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FavoriteSeriesList from './FavoriteSeriesList';
import type { FavoriteSeries } from '../api/types/series';

// Mock the getSeriesDetailsBatch function
vi.mock('../api/queries/getSeriesDetailsBatch', () => ({
  getSeriesDetailsBatch: vi.fn(),
}));

import { getSeriesDetailsBatch } from '../api/queries/getSeriesDetailsBatch';

describe('FavoriteSeriesList', () => {
  const mockOnRemoveFavorite = vi.fn();
  const mockOnUpdatePreference = vi.fn();
  const mockGetSeriesDetailsBatch = vi.mocked(getSeriesDetailsBatch);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up any pending timers
    vi.clearAllTimers();
  });

  it('should render loading skeletons when isLoading is true', () => {
    render(
      <FavoriteSeriesList
        favorites={[]}
        onRemoveFavorite={mockOnRemoveFavorite}
        isLoading={true}
      />,
    );

    const skeletons = screen.getAllByTestId('skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should render empty state when no favorites', () => {
    render(
      <FavoriteSeriesList
        favorites={[]}
        onRemoveFavorite={mockOnRemoveFavorite}
        isLoading={false}
      />,
    );

    expect(screen.getByText('No favorite shows yet')).toBeInTheDocument();
    expect(screen.getByText(/Search for shows above/i)).toBeInTheDocument();
  });

  it('should render favorite shows with details', async () => {
    const mockFavorites: FavoriteSeries[] = [
      { seriesTmdbId: 1, preferenceLevel: 'like' },
      { seriesTmdbId: 2, preferenceLevel: 'love' },
    ];

    mockGetSeriesDetailsBatch.mockResolvedValue([
      {
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
      {
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
    ]);

    render(
      <FavoriteSeriesList
        favorites={mockFavorites}
        onRemoveFavorite={mockOnRemoveFavorite}
        isLoading={false}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('Breaking Bad')).toBeInTheDocument();
      expect(screen.getByText('Game of Thrones')).toBeInTheDocument();
    });

    expect(mockGetSeriesDetailsBatch).toHaveBeenCalledWith([1, 2]);
  });

  it('should render series image with correct src', async () => {
    const mockFavorites: FavoriteSeries[] = [{ seriesTmdbId: 1, preferenceLevel: 'like' }];

    mockGetSeriesDetailsBatch.mockResolvedValue([
      {
        id: 1,
        name: 'Breaking Bad',
        posterPath: '/poster1.jpg',
        overview: 'A chemistry teacher',
        firstAirDate: '2008-01-20',
        genres: ['Drama'],
        numberOfSeasons: 5,
        numberOfEpisodes: 62,
        backdropPath: '/backdrop1.jpg',
        status: 'Ended',
        voteAverage: 9.5,
        genreIds: [18],
        originCountry: ['US'],
        originalLanguage: 'en',
      },
    ]);

    render(
      <FavoriteSeriesList
        favorites={mockFavorites}
        onRemoveFavorite={mockOnRemoveFavorite}
        isLoading={false}
      />,
    );

    await waitFor(() => {
      const image = screen.getByAltText('Breaking Bad poster') as HTMLImageElement;
      expect(image.src).toContain('https://image.tmdb.org/t/p/w342/poster1.jpg');
    });
  });

  it('should show "No Image Available" when posterPath is missing', async () => {
    const mockFavorites: FavoriteSeries[] = [{ seriesTmdbId: 1, preferenceLevel: 'like' }];

    mockGetSeriesDetailsBatch.mockResolvedValue([
      {
        id: 1,
        name: 'Series Without Poster',
        posterPath: null,
        overview: 'Test series',
        firstAirDate: '2020-01-01',
        genres: ['Drama'],
        numberOfSeasons: 1,
        numberOfEpisodes: 10,
        backdropPath: null,
        status: 'Ended',
        voteAverage: 7.0,
        genreIds: [18],
        originCountry: ['US'],
        originalLanguage: 'en',
      },
    ]);

    render(
      <FavoriteSeriesList
        favorites={mockFavorites}
        onRemoveFavorite={mockOnRemoveFavorite}
        isLoading={false}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('No Image Available')).toBeInTheDocument();
    });
  });

  it('should call onRemoveFavorite when remove button is clicked', async () => {
    const mockFavorites: FavoriteSeries[] = [{ seriesTmdbId: 1, preferenceLevel: 'like' }];

    mockGetSeriesDetailsBatch.mockResolvedValue([
      {
        id: 1,
        name: 'Breaking Bad',
        posterPath: '/poster1.jpg',
        overview: 'A chemistry teacher',
        firstAirDate: '2008-01-20',
        genres: ['Drama'],
        numberOfSeasons: 5,
        numberOfEpisodes: 62,
        backdropPath: '/backdrop1.jpg',
        status: 'Ended',
        voteAverage: 9.5,
        genreIds: [18],
        originCountry: ['US'],
        originalLanguage: 'en',
      },
    ]);
    mockOnRemoveFavorite.mockResolvedValue(undefined);

    const { unmount } = render(
      <FavoriteSeriesList
        favorites={mockFavorites}
        onRemoveFavorite={mockOnRemoveFavorite}
        isLoading={false}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('Breaking Bad')).toBeInTheDocument();
    });

    const removeButton = screen.getByLabelText('Remove Breaking Bad from favorites');
    await userEvent.click(removeButton);

    expect(mockOnRemoveFavorite).toHaveBeenCalledWith(1);

    // Unmount component to trigger cleanup
    unmount();
  });

  it('should handle error when loading series details fails', async () => {
    const mockFavorites: FavoriteSeries[] = [
      { seriesTmdbId: 1, preferenceLevel: 'like' },
      { seriesTmdbId: 2, preferenceLevel: 'love' },
    ];

    // Mock returns empty array (simulating failed fetch)
    mockGetSeriesDetailsBatch.mockResolvedValue([]);

    render(
      <FavoriteSeriesList
        favorites={mockFavorites}
        onRemoveFavorite={mockOnRemoveFavorite}
        isLoading={false}
      />,
    );

    await waitFor(() => {
      // Should show fallback IDs when details fail to load
      expect(screen.getByText('Show 1')).toBeInTheDocument();
      expect(screen.getByText('Show 2')).toBeInTheDocument();
    });
  });

  it('should handle error when removing favorite fails', async () => {
    const mockFavorites: FavoriteSeries[] = [{ seriesTmdbId: 1, preferenceLevel: 'like' }];

    mockGetSeriesDetailsBatch.mockResolvedValue([
      {
        id: 1,
        name: 'Breaking Bad',
        posterPath: '/poster1.jpg',
        overview: 'A chemistry teacher',
        firstAirDate: '2008-01-20',
        genres: ['Drama'],
        numberOfSeasons: 5,
        numberOfEpisodes: 62,
        backdropPath: '/backdrop1.jpg',
        status: 'Ended',
        voteAverage: 9.5,
        genreIds: [18],
        originCountry: ['US'],
        originalLanguage: 'en',
      },
    ]);

    mockOnRemoveFavorite.mockRejectedValue(new Error('Failed to remove'));

    const { unmount } = render(
      <FavoriteSeriesList
        favorites={mockFavorites}
        onRemoveFavorite={mockOnRemoveFavorite}
        isLoading={false}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('Breaking Bad')).toBeInTheDocument();
    });

    const removeButton = screen.getByLabelText('Remove Breaking Bad from favorites');
    await userEvent.click(removeButton);

    expect(mockOnRemoveFavorite).toHaveBeenCalledWith(1);

    // Series should still be visible after failed removal
    await waitFor(() => {
      expect(screen.getByText('Breaking Bad')).toBeInTheDocument();
    });

    // Unmount component to trigger cleanup
    unmount();
  });

  it('should display fallback ID when series details are not loaded yet', () => {
    const mockFavorites: FavoriteSeries[] = [{ seriesTmdbId: 123, preferenceLevel: 'like' }];

    // Don't mock getSeriesDetailsBatch so it won't load immediately
    mockGetSeriesDetailsBatch.mockImplementation(() => new Promise(() => {}));

    render(
      <FavoriteSeriesList
        favorites={mockFavorites}
        onRemoveFavorite={mockOnRemoveFavorite}
        isLoading={false}
      />,
    );

    expect(screen.getByText('Show 123')).toBeInTheDocument();
  });

  it('should clear series details when favorites array becomes empty', async () => {
    const mockFavorites: FavoriteSeries[] = [{ seriesTmdbId: 1, preferenceLevel: 'like' }];

    mockGetSeriesDetailsBatch.mockResolvedValue([
      {
        id: 1,
        name: 'Breaking Bad',
        posterPath: '/poster1.jpg',
        overview: 'A chemistry teacher',
        firstAirDate: '2008-01-20',
        genres: ['Drama'],
        numberOfSeasons: 5,
        numberOfEpisodes: 62,
        backdropPath: '/backdrop1.jpg',
        status: 'Ended',
        voteAverage: 9.5,
        genreIds: [18],
        originCountry: ['US'],
        originalLanguage: 'en',
      },
    ]);

    const { rerender } = render(
      <FavoriteSeriesList
        favorites={mockFavorites}
        onRemoveFavorite={mockOnRemoveFavorite}
        isLoading={false}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('Breaking Bad')).toBeInTheDocument();
    });

    // Rerender with empty favorites
    rerender(
      <FavoriteSeriesList
        favorites={[]}
        onRemoveFavorite={mockOnRemoveFavorite}
        isLoading={false}
      />,
    );

    expect(screen.getByText('No favorite shows yet')).toBeInTheDocument();
    expect(screen.queryByText('Breaking Bad')).not.toBeInTheDocument();
  });

  it('should render preference toggle when onUpdatePreference is provided', async () => {
    const mockFavorites: FavoriteSeries[] = [{ seriesTmdbId: 1, preferenceLevel: 'like' }];

    mockGetSeriesDetailsBatch.mockResolvedValue([
      {
        id: 1,
        name: 'Breaking Bad',
        posterPath: '/poster1.jpg',
        overview: 'A chemistry teacher',
        firstAirDate: '2008-01-20',
        genres: ['Drama'],
        numberOfSeasons: 5,
        numberOfEpisodes: 62,
        backdropPath: '/backdrop1.jpg',
        status: 'Ended',
        voteAverage: 9.5,
        genreIds: [18],
        originCountry: ['US'],
        originalLanguage: 'en',
      },
    ]);

    render(
      <FavoriteSeriesList
        favorites={mockFavorites}
        onRemoveFavorite={mockOnRemoveFavorite}
        onUpdatePreference={mockOnUpdatePreference}
        isLoading={false}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('Breaking Bad')).toBeInTheDocument();
    });

    // Should render the preference toggle button
    const toggleButton = screen.getByRole('button', { name: /like.*click to set to loved/i });
    expect(toggleButton).toBeInTheDocument();
  });

  it('should not render preference toggle when onUpdatePreference is not provided', async () => {
    const mockFavorites: FavoriteSeries[] = [{ seriesTmdbId: 1, preferenceLevel: 'like' }];

    mockGetSeriesDetailsBatch.mockResolvedValue([
      {
        id: 1,
        name: 'Breaking Bad',
        posterPath: '/poster1.jpg',
        overview: 'A chemistry teacher',
        firstAirDate: '2008-01-20',
        genres: ['Drama'],
        numberOfSeasons: 5,
        numberOfEpisodes: 62,
        backdropPath: '/backdrop1.jpg',
        status: 'Ended',
        voteAverage: 9.5,
        genreIds: [18],
        originCountry: ['US'],
        originalLanguage: 'en',
      },
    ]);

    render(
      <FavoriteSeriesList
        favorites={mockFavorites}
        onRemoveFavorite={mockOnRemoveFavorite}
        isLoading={false}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('Breaking Bad')).toBeInTheDocument();
    });

    // Should not render the preference toggle button
    const toggleButton = screen.queryByRole('button', { name: /like.*click to set to loved/i });
    expect(toggleButton).not.toBeInTheDocument();
  });

  it('should call onUpdatePreference when preference toggle is clicked', async () => {
    const mockFavorites: FavoriteSeries[] = [{ seriesTmdbId: 1, preferenceLevel: 'like' }];

    mockGetSeriesDetailsBatch.mockResolvedValue([
      {
        id: 1,
        name: 'Breaking Bad',
        posterPath: '/poster1.jpg',
        overview: 'A chemistry teacher',
        firstAirDate: '2008-01-20',
        genres: ['Drama'],
        numberOfSeasons: 5,
        numberOfEpisodes: 62,
        backdropPath: '/backdrop1.jpg',
        status: 'Ended',
        voteAverage: 9.5,
        genreIds: [18],
        originCountry: ['US'],
        originalLanguage: 'en',
      },
    ]);

    mockOnUpdatePreference.mockResolvedValue(undefined);

    render(
      <FavoriteSeriesList
        favorites={mockFavorites}
        onRemoveFavorite={mockOnRemoveFavorite}
        onUpdatePreference={mockOnUpdatePreference}
        isLoading={false}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('Breaking Bad')).toBeInTheDocument();
    });

    const toggleButton = screen.getByRole('button', { name: /like.*click to set to loved/i });
    await userEvent.click(toggleButton);

    expect(mockOnUpdatePreference).toHaveBeenCalledWith(1, 'love');
  });

  it('should handle error when updating preference fails', async () => {
    const mockFavorites: FavoriteSeries[] = [{ seriesTmdbId: 1, preferenceLevel: 'like' }];

    mockGetSeriesDetailsBatch.mockResolvedValue([
      {
        id: 1,
        name: 'Breaking Bad',
        posterPath: '/poster1.jpg',
        overview: 'A chemistry teacher',
        firstAirDate: '2008-01-20',
        genres: ['Drama'],
        numberOfSeasons: 5,
        numberOfEpisodes: 62,
        backdropPath: '/backdrop1.jpg',
        status: 'Ended',
        voteAverage: 9.5,
        genreIds: [18],
        originCountry: ['US'],
        originalLanguage: 'en',
      },
    ]);

    mockOnUpdatePreference.mockRejectedValue(new Error('Failed to update'));

    render(
      <FavoriteSeriesList
        favorites={mockFavorites}
        onRemoveFavorite={mockOnRemoveFavorite}
        onUpdatePreference={mockOnUpdatePreference}
        isLoading={false}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('Breaking Bad')).toBeInTheDocument();
    });

    const toggleButton = screen.getByRole('button', { name: /like.*click to set to loved/i });
    await userEvent.click(toggleButton);

    expect(mockOnUpdatePreference).toHaveBeenCalledWith(1, 'love');
  });

  it('should disable preference toggle while updating', async () => {
    const mockFavorites: FavoriteSeries[] = [{ seriesTmdbId: 1, preferenceLevel: 'like' }];

    mockGetSeriesDetailsBatch.mockResolvedValue([
      {
        id: 1,
        name: 'Breaking Bad',
        posterPath: '/poster1.jpg',
        overview: 'A chemistry teacher',
        firstAirDate: '2008-01-20',
        genres: ['Drama'],
        numberOfSeasons: 5,
        numberOfEpisodes: 62,
        backdropPath: '/backdrop1.jpg',
        status: 'Ended',
        voteAverage: 9.5,
        genreIds: [18],
        originCountry: ['US'],
        originalLanguage: 'en',
      },
    ]);

    // Make the update slow so we can check disabled state
    let resolveUpdate: () => void;
    const updatePromise = new Promise<void>((resolve) => {
      resolveUpdate = resolve;
    });
    mockOnUpdatePreference.mockReturnValue(updatePromise);

    render(
      <FavoriteSeriesList
        favorites={mockFavorites}
        onRemoveFavorite={mockOnRemoveFavorite}
        onUpdatePreference={mockOnUpdatePreference}
        isLoading={false}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('Breaking Bad')).toBeInTheDocument();
    });

    const toggleButton = screen.getByRole('button', { name: /like.*click to set to loved/i });
    expect(toggleButton).not.toBeDisabled();

    await userEvent.click(toggleButton);

    // Button should be disabled during update
    await waitFor(() => {
      expect(toggleButton).toBeDisabled();
    });

    // Resolve the update
    resolveUpdate!();

    // Button should be enabled again
    await waitFor(() => {
      expect(toggleButton).not.toBeDisabled();
    });
  });
});
