import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import IgnoredSeriesList from './IgnoredSeriesList';
import { IgnoredSeries } from '../api/types/series';
import * as getSeriesDetailsBatchModule from '../api/queries/getSeriesDetailsBatch';

vi.mock('../api/queries/getSeriesDetailsBatch');

const mockGetSeriesDetailsBatch = vi.spyOn(getSeriesDetailsBatchModule, 'getSeriesDetailsBatch');

describe('IgnoredSeriesList', () => {
  const mockIgnoredSeries: IgnoredSeries[] = [
    {
      seriesTmdbId: 1,
    },
    {
      seriesTmdbId: 2,
    },
  ];

  const mockOnRemoveIgnored = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSeriesDetailsBatch.mockResolvedValue([
      {
        id: 1,
        name: 'Breaking Bad',
        posterPath: '/poster1.jpg',
        backdropPath: null,
        overview: 'Test overview',
        firstAirDate: '2024-01-01',
        genres: ['Drama'],
        numberOfSeasons: 1,
        numberOfEpisodes: 10,
        status: 'Returning Series',
        voteAverage: 8.5,
        genreIds: [18],
        originCountry: ['US'],
        originalLanguage: 'en',
      },
      {
        id: 2,
        name: 'Game of Thrones',
        posterPath: '/poster2.jpg',
        backdropPath: null,
        overview: 'Test overview',
        firstAirDate: '2024-01-01',
        genres: ['Drama'],
        numberOfSeasons: 1,
        numberOfEpisodes: 10,
        status: 'Returning Series',
        voteAverage: 8.5,
        genreIds: [18],
        originCountry: ['US'],
        originalLanguage: 'en',
      },
    ]);
  });

  it('should render loading state', () => {
    render(
      <IgnoredSeriesList
        ignoredSeries={[]}
        onRemoveIgnored={mockOnRemoveIgnored}
        isLoading={true}
      />,
    );

    expect(screen.getAllByTestId('skeleton')).toHaveLength(12); // 12 skeleton placeholders
  });

  it('should render empty state when no ignored shows', () => {
    render(
      <IgnoredSeriesList
        ignoredSeries={[]}
        onRemoveIgnored={mockOnRemoveIgnored}
        isLoading={false}
      />,
    );

    expect(screen.getByText('No skipped shows yet')).toBeInTheDocument();
    expect(screen.getByText('Shows you "Skip" will appear here and won\'t be suggested to you.')).toBeInTheDocument();
  });

  it('should render ignored shows list', async () => {
    render(
      <IgnoredSeriesList
        ignoredSeries={mockIgnoredSeries}
        onRemoveIgnored={mockOnRemoveIgnored}
        isLoading={false}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('Breaking Bad')).toBeInTheDocument();
      expect(screen.getByText('Game of Thrones')).toBeInTheDocument();
    });

    expect(mockGetSeriesDetailsBatch).toHaveBeenCalledTimes(1);
    expect(mockGetSeriesDetailsBatch).toHaveBeenCalledWith([1, 2]);
  });

  it('should call onRemoveIgnored when remove button is clicked', async () => {
    const user = userEvent.setup();

    render(
      <IgnoredSeriesList
        ignoredSeries={mockIgnoredSeries}
        onRemoveIgnored={mockOnRemoveIgnored}
        isLoading={false}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('Breaking Bad')).toBeInTheDocument();
    });

    const removeButtons = screen.getAllByRole('button', { name: /remove.*from skipped list/i });
    await user.click(removeButtons[0]);

    expect(mockOnRemoveIgnored).toHaveBeenCalledWith(1);
  });

  it('should display series with grayscale and opacity', async () => {
    render(
      <IgnoredSeriesList
        ignoredSeries={mockIgnoredSeries}
        onRemoveIgnored={mockOnRemoveIgnored}
        isLoading={false}
      />,
    );

    await waitFor(() => {
      expect(screen.getByAltText('Breaking Bad poster')).toBeInTheDocument();
    });

    const poster = screen.getByAltText('Breaking Bad poster');
    expect(poster).toHaveClass('opacity-60', 'grayscale');
  });

  it('should handle series details fetch error gracefully', async () => {
    // Return array with one null result (failed fetch)
    mockGetSeriesDetailsBatch.mockResolvedValueOnce([]);

    render(
      <IgnoredSeriesList
        ignoredSeries={[mockIgnoredSeries[0]]}
        onRemoveIgnored={mockOnRemoveIgnored}
        isLoading={false}
      />,
    );

    await waitFor(() => {
      // Should show fallback name with series ID
      expect(screen.getByText('Show 1')).toBeInTheDocument();
    });

    // Should render "No Image Available" when series details fail to load
    expect(screen.getByText('No Image Available')).toBeInTheDocument();
  });
});
