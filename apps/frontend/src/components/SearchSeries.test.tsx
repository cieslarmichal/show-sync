import { screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders, userEvent } from '@/tests/testUtils';
import SearchSeries from './SearchSeries';

describe('SearchSeries', () => {
  const mockOnAddToProfile = vi.fn();
  const mockOnAddToIgnored = vi.fn();
  const mockProfileSeriesIds = new Set<number>();
  const mockIgnoredSeriesIds = new Set<number>();

  beforeEach(() => {
    mockOnAddToProfile.mockClear();
    mockOnAddToIgnored.mockClear();
  });

  it('should render search input', async () => {
    await renderWithProviders(
      <SearchSeries
        onAddToProfile={mockOnAddToProfile}
        onAddToIgnored={mockOnAddToIgnored}
        profileSeriesIds={mockProfileSeriesIds}
        ignoredSeriesIds={mockIgnoredSeriesIds}
      />,
    );

    expect(screen.getByPlaceholderText(/search for a tv show/i)).toBeInTheDocument();
  });

  it('should show search results', async () => {
    const user = userEvent.setup();
    await renderWithProviders(
      <SearchSeries
        onAddToProfile={mockOnAddToProfile}
        onAddToIgnored={mockOnAddToIgnored}
        profileSeriesIds={mockProfileSeriesIds}
        ignoredSeriesIds={mockIgnoredSeriesIds}
      />,
    );

    const searchInput = screen.getByPlaceholderText(/search for a tv show/i);
    await user.type(searchInput, 'Breaking Bad');

    // Loading skeletons might appear briefly but results will definitely show
    await waitFor(
      () => {
        expect(screen.getByText('Breaking Bad')).toBeInTheDocument();
      },
      { timeout: 1000 },
    );
  });

  it('should display search results after typing', async () => {
    const user = userEvent.setup();
    await renderWithProviders(
      <SearchSeries
        onAddToProfile={mockOnAddToProfile}
        onAddToIgnored={mockOnAddToIgnored}
        profileSeriesIds={mockProfileSeriesIds}
        ignoredSeriesIds={mockIgnoredSeriesIds}
      />,
    );

    const searchInput = screen.getByPlaceholderText(/search for a tv show/i);
    await user.type(searchInput, 'Breaking');

    // Wait for debounce and API call
    await waitFor(
      () => {
        expect(screen.getByText('Breaking Bad')).toBeInTheDocument();
      },
      { timeout: 1000 },
    );
  });

  it('should filter results based on search query', async () => {
    const user = userEvent.setup();
    await renderWithProviders(
      <SearchSeries
        onAddToProfile={mockOnAddToProfile}
        onAddToIgnored={mockOnAddToIgnored}
        profileSeriesIds={mockProfileSeriesIds}
        ignoredSeriesIds={mockIgnoredSeriesIds}
      />,
    );

    const searchInput = screen.getByPlaceholderText(/search for a tv show/i);
    await user.type(searchInput, 'Better Call Saul');

    await waitFor(
      () => {
        expect(screen.getByText('Better Call Saul')).toBeInTheDocument();
        expect(screen.queryByText('Breaking Bad')).not.toBeInTheDocument();
      },
      { timeout: 1000 },
    );
  });

  it('should show "Like" and "Skip" buttons for each result', async () => {
    const user = userEvent.setup();
    await renderWithProviders(
      <SearchSeries
        onAddToProfile={mockOnAddToProfile}
        onAddToIgnored={mockOnAddToIgnored}
        profileSeriesIds={mockProfileSeriesIds}
        ignoredSeriesIds={mockIgnoredSeriesIds}
      />,
    );

    const searchInput = screen.getByPlaceholderText(/search for a tv show/i);
    await user.type(searchInput, 'Breaking');

    await waitFor(
      () => {
        const likeButtons = screen.getAllByRole('button', { name: /mark as liked/i });
        const notInterestedButtons = screen.getAllByRole('button', { name: /mark as not interested/i });
        expect(likeButtons.length).toBeGreaterThan(0);
        expect(notInterestedButtons.length).toBeGreaterThan(0);
      },
      { timeout: 1000 },
    );
  });

  it('should call onAddToProfile when clicking like button', async () => {
    const user = userEvent.setup();
    await renderWithProviders(
      <SearchSeries
        onAddToProfile={mockOnAddToProfile}
        onAddToIgnored={mockOnAddToIgnored}
        profileSeriesIds={mockProfileSeriesIds}
        ignoredSeriesIds={mockIgnoredSeriesIds}
      />,
    );

    const searchInput = screen.getByPlaceholderText(/search for a tv show/i);
    await user.type(searchInput, 'Breaking');

    await waitFor(
      () => {
        expect(screen.getByText('Breaking Bad')).toBeInTheDocument();
      },
      { timeout: 1000 },
    );

    const likeButton = screen.getAllByRole('button', { name: /mark as liked/i })[0];
    await user.click(likeButton);

    expect(mockOnAddToProfile).toHaveBeenCalledTimes(1);
    expect(mockOnAddToProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 1396,
        name: 'Breaking Bad',
      }),
      'like',
    );
  });

  it('should clear search input after liking show', async () => {
    const user = userEvent.setup();
    await renderWithProviders(
      <SearchSeries
        onAddToProfile={mockOnAddToProfile}
        onAddToIgnored={mockOnAddToIgnored}
        profileSeriesIds={mockProfileSeriesIds}
        ignoredSeriesIds={mockIgnoredSeriesIds}
      />,
    );

    const searchInput = screen.getByPlaceholderText(/search for a tv show/i);
    await user.type(searchInput, 'Breaking');

    await waitFor(
      () => {
        expect(screen.getByText('Breaking Bad')).toBeInTheDocument();
      },
      { timeout: 1000 },
    );

    const likeButton = screen.getAllByRole('button', { name: /mark as liked/i })[0];
    await user.click(likeButton);

    await waitFor(() => {
      expect(searchInput).toHaveValue('');
    });
  });

  it('should show "Liked" for show already in profile', async () => {
    const profileWithSeries = new Set<number>([1396]);
    const user = userEvent.setup();

    await renderWithProviders(
      <SearchSeries
        onAddToProfile={mockOnAddToProfile}
        onAddToIgnored={mockOnAddToIgnored}
        profileSeriesIds={profileWithSeries}
        ignoredSeriesIds={mockIgnoredSeriesIds}
      />,
    );

    const searchInput = screen.getByPlaceholderText(/search for a tv show/i);
    await user.type(searchInput, 'Breaking');

    await waitFor(
      () => {
        const likeButton = screen.getByRole('button', { name: /mark as liked/i });
        expect(likeButton).toBeDisabled();
      },
      { timeout: 1000 },
    );
  });

  it('should disable like button for show already in profile', async () => {
    const profileWithSeries = new Set<number>([1396]);
    const user = userEvent.setup();

    await renderWithProviders(
      <SearchSeries
        onAddToProfile={mockOnAddToProfile}
        onAddToIgnored={mockOnAddToIgnored}
        profileSeriesIds={profileWithSeries}
        ignoredSeriesIds={mockIgnoredSeriesIds}
      />,
    );

    const searchInput = screen.getByPlaceholderText(/search for a tv show/i);
    await user.type(searchInput, 'Breaking');

    await waitFor(
      () => {
        const likeButton = screen.getByRole('button', { name: /mark as liked/i });
        expect(likeButton).toBeDisabled();
      },
      { timeout: 1000 },
    );
  });

  it('should show "no results" message for empty results', async () => {
    const user = userEvent.setup();
    await renderWithProviders(
      <SearchSeries
        onAddToProfile={mockOnAddToProfile}
        onAddToIgnored={mockOnAddToIgnored}
        profileSeriesIds={mockProfileSeriesIds}
        ignoredSeriesIds={mockIgnoredSeriesIds}
      />,
    );

    const searchInput = screen.getByPlaceholderText(/search for a tv show/i);
    await user.type(searchInput, 'NonExistentSeries12345');

    await waitFor(
      () => {
        expect(screen.getByText(/no shows found for "NonExistentSeries12345"/i)).toBeInTheDocument();
      },
      { timeout: 1000 },
    );
  });

  it('should display show rating', async () => {
    const user = userEvent.setup();
    await renderWithProviders(
      <SearchSeries
        onAddToProfile={mockOnAddToProfile}
        onAddToIgnored={mockOnAddToIgnored}
        profileSeriesIds={mockProfileSeriesIds}
        ignoredSeriesIds={mockIgnoredSeriesIds}
      />,
    );

    const searchInput = screen.getByPlaceholderText(/search for a tv show/i);
    await user.type(searchInput, 'Breaking');

    await waitFor(
      () => {
        expect(screen.getByText(/8\.9/)).toBeInTheDocument();
      },
      { timeout: 1000 },
    );
  });

  it('should display show year', async () => {
    const user = userEvent.setup();
    await renderWithProviders(
      <SearchSeries
        onAddToProfile={mockOnAddToProfile}
        onAddToIgnored={mockOnAddToIgnored}
        profileSeriesIds={mockProfileSeriesIds}
        ignoredSeriesIds={mockIgnoredSeriesIds}
      />,
    );

    const searchInput = screen.getByPlaceholderText(/search for a tv show/i);
    await user.type(searchInput, 'Breaking');

    await waitFor(
      () => {
        expect(screen.getByText('2008')).toBeInTheDocument();
      },
      { timeout: 1000 },
    );
  });

  it('should clear results when search input is cleared', async () => {
    const user = userEvent.setup();
    await renderWithProviders(
      <SearchSeries
        onAddToProfile={mockOnAddToProfile}
        onAddToIgnored={mockOnAddToIgnored}
        profileSeriesIds={mockProfileSeriesIds}
        ignoredSeriesIds={mockIgnoredSeriesIds}
      />,
    );

    const searchInput = screen.getByPlaceholderText(/search for a tv show/i);
    await user.type(searchInput, 'Breaking');

    await waitFor(
      () => {
        expect(screen.getByText('Breaking Bad')).toBeInTheDocument();
      },
      { timeout: 1000 },
    );

    await user.clear(searchInput);

    await waitFor(
      () => {
        expect(screen.queryByText('Breaking Bad')).not.toBeInTheDocument();
      },
      { timeout: 1000 },
    );
  });

  it('should call onAddToIgnored when clicking not interested button', async () => {
    const user = userEvent.setup();
    await renderWithProviders(
      <SearchSeries
        onAddToProfile={mockOnAddToProfile}
        onAddToIgnored={mockOnAddToIgnored}
        profileSeriesIds={mockProfileSeriesIds}
        ignoredSeriesIds={mockIgnoredSeriesIds}
      />,
    );

    const searchInput = screen.getByPlaceholderText(/search for a tv show/i);
    await user.type(searchInput, 'Breaking');

    await waitFor(
      () => {
        expect(screen.getByText('Breaking Bad')).toBeInTheDocument();
      },
      { timeout: 1000 },
    );

    const skipButton = screen.getAllByRole('button', { name: /^mark as not interested$/i })[0];
    await user.click(skipButton);

    expect(mockOnAddToIgnored).toHaveBeenCalledTimes(1);
    expect(mockOnAddToIgnored).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 1396,
        name: 'Breaking Bad',
      }),
    );
  });

  it('should clear search input after marking show as not interested', async () => {
    const user = userEvent.setup();
    await renderWithProviders(
      <SearchSeries
        onAddToProfile={mockOnAddToProfile}
        onAddToIgnored={mockOnAddToIgnored}
        profileSeriesIds={mockProfileSeriesIds}
        ignoredSeriesIds={mockIgnoredSeriesIds}
      />,
    );

    const searchInput = screen.getByPlaceholderText(/search for a tv show/i);
    await user.type(searchInput, 'Breaking');

    await waitFor(
      () => {
        expect(screen.getByText('Breaking Bad')).toBeInTheDocument();
      },
      { timeout: 1000 },
    );

    const skipButton = screen.getAllByRole('button', { name: /^mark as not interested$/i })[0];
    await user.click(skipButton);

    await waitFor(() => {
      expect(searchInput).toHaveValue('');
    });
  });

  it('should show "Skipped" for show already ignored', async () => {
    const ignoredWithSeries = new Set<number>([1396]);
    const user = userEvent.setup();

    await renderWithProviders(
      <SearchSeries
        onAddToProfile={mockOnAddToProfile}
        onAddToIgnored={mockOnAddToIgnored}
        profileSeriesIds={mockProfileSeriesIds}
        ignoredSeriesIds={ignoredWithSeries}
      />,
    );

    const searchInput = screen.getByPlaceholderText(/search for a tv show/i);
    await user.type(searchInput, 'Breaking');

    await waitFor(
      () => {
        expect(screen.getByText('Skipped')).toBeInTheDocument();
      },
      { timeout: 1000 },
    );
  });

  it('should disable not interested button for show already ignored', async () => {
    const ignoredWithSeries = new Set<number>([1396]);
    const user = userEvent.setup();

    await renderWithProviders(
      <SearchSeries
        onAddToProfile={mockOnAddToProfile}
        onAddToIgnored={mockOnAddToIgnored}
        profileSeriesIds={mockProfileSeriesIds}
        ignoredSeriesIds={ignoredWithSeries}
      />,
    );

    const searchInput = screen.getByPlaceholderText(/search for a tv show/i);
    await user.type(searchInput, 'Breaking');

    await waitFor(
      () => {
        const skippedButton = screen.getByRole('button', { name: /mark as not interested/i });
        expect(skippedButton).toBeDisabled();
      },
      { timeout: 1000 },
    );
  });
});
