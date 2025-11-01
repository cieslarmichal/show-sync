import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import IgnoredSeriesList from './IgnoredSeriesList';
import { IgnoredSeries } from '../api/types/series';
import * as getSeriesDetailsModule from '../api/queries/getSeriesDetails';

vi.mock('../api/queries/getSeriesDetails');

const mockGetSeriesDetails = vi.spyOn(getSeriesDetailsModule, 'getSeriesDetails');

describe('IgnoredSeriesList', () => {
  const mockIgnoredSeries: IgnoredSeries[] = [
    {
      seriesTmdbId: 1,
      ignoredAt: '2024-01-01T00:00:00.000Z',
    },
    {
      seriesTmdbId: 2,
      ignoredAt: '2024-01-02T00:00:00.000Z',
    },
  ];

  const mockOnRemoveIgnored = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSeriesDetails.mockImplementation(async (id: number) => ({
      id,
      name: `Series ${id}`,
      posterPath: `/poster${id}.jpg`,
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
    }));
  });

  it('should render loading state', () => {
    render(
      <IgnoredSeriesList
        ignoredSeries={[]}
        onRemoveIgnored={mockOnRemoveIgnored}
        isLoading={true}
      />,
    );

    expect(screen.getAllByTestId('skeleton')).toHaveLength(24); // 12 skeleton placeholders x 2 (image + text)
  });

  it('should render empty state when no ignored series', () => {
    render(
      <IgnoredSeriesList
        ignoredSeries={[]}
        onRemoveIgnored={mockOnRemoveIgnored}
        isLoading={false}
      />,
    );

    expect(screen.getByText('No ignored series yet.')).toBeInTheDocument();
    expect(
      screen.getByText('Series you mark as "Not Interested" will appear here and be excluded from AI recommendations.'),
    ).toBeInTheDocument();
  });

  it('should render ignored series list', async () => {
    render(
      <IgnoredSeriesList
        ignoredSeries={mockIgnoredSeries}
        onRemoveIgnored={mockOnRemoveIgnored}
        isLoading={false}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('Series 1')).toBeInTheDocument();
      expect(screen.getByText('Series 2')).toBeInTheDocument();
    });

    expect(mockGetSeriesDetails).toHaveBeenCalledTimes(2);
    expect(mockGetSeriesDetails).toHaveBeenCalledWith(1);
    expect(mockGetSeriesDetails).toHaveBeenCalledWith(2);
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
      expect(screen.getByText('Series 1')).toBeInTheDocument();
    });

    const removeButtons = screen.getAllByRole('button', { name: /remove.*from ignored list/i });
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
      expect(screen.getByAltText('Series 1 poster')).toBeInTheDocument();
    });

    const poster = screen.getByAltText('Series 1 poster');
    expect(poster).toHaveClass('opacity-60', 'grayscale');
  });

  it('should handle series details fetch error gracefully', async () => {
    mockGetSeriesDetails.mockRejectedValueOnce(new Error('Failed to fetch'));

    render(
      <IgnoredSeriesList
        ignoredSeries={[mockIgnoredSeries[0]]}
        onRemoveIgnored={mockOnRemoveIgnored}
        isLoading={false}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('Series 1')).toBeInTheDocument();
    });

    // Should render "No Image Available" when series details fail to load
    expect(screen.getByText('No Image Available')).toBeInTheDocument();
  });
});
