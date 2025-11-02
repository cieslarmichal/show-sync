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

    expect(screen.getByPlaceholderText(/search for a tv series/i)).toBeInTheDocument();
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

    const searchInput = screen.getByPlaceholderText(/search for a tv series/i);
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

    const searchInput = screen.getByPlaceholderText(/search for a tv series/i);
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

    const searchInput = screen.getByPlaceholderText(/search for a tv series/i);
    await user.type(searchInput, 'Better Call Saul');

    await waitFor(
      () => {
        expect(screen.getByText('Better Call Saul')).toBeInTheDocument();
        expect(screen.queryByText('Breaking Bad')).not.toBeInTheDocument();
      },
      { timeout: 1000 },
    );
  });

  it('should show "Like" and "Not Interested" buttons for each result', async () => {
    const user = userEvent.setup();
    await renderWithProviders(
      <SearchSeries
        onAddToProfile={mockOnAddToProfile}
        onAddToIgnored={mockOnAddToIgnored}
        profileSeriesIds={mockProfileSeriesIds}
        ignoredSeriesIds={mockIgnoredSeriesIds}
      />,
    );

    const searchInput = screen.getByPlaceholderText(/search for a tv series/i);
    await user.type(searchInput, 'Breaking');

    await waitFor(
      () => {
        const likeButtons = screen.getAllByRole('button', { name: /^like$/i });
        const notInterestedButtons = screen.getAllByRole('button', { name: /^not interested$/i });
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

    const searchInput = screen.getByPlaceholderText(/search for a tv series/i);
    await user.type(searchInput, 'Breaking');

    await waitFor(
      () => {
        expect(screen.getByText('Breaking Bad')).toBeInTheDocument();
      },
      { timeout: 1000 },
    );

    const likeButton = screen.getAllByRole('button', { name: /^like$/i })[0];
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

  it('should clear search input after liking series', async () => {
    const user = userEvent.setup();
    await renderWithProviders(
      <SearchSeries
        onAddToProfile={mockOnAddToProfile}
        onAddToIgnored={mockOnAddToIgnored}
        profileSeriesIds={mockProfileSeriesIds}
        ignoredSeriesIds={mockIgnoredSeriesIds}
      />,
    );

    const searchInput = screen.getByPlaceholderText(/search for a tv series/i);
    await user.type(searchInput, 'Breaking');

    await waitFor(
      () => {
        expect(screen.getByText('Breaking Bad')).toBeInTheDocument();
      },
      { timeout: 1000 },
    );

    const likeButton = screen.getAllByRole('button', { name: /^like$/i })[0];
    await user.click(likeButton);

    await waitFor(() => {
      expect(searchInput).toHaveValue('');
    });
  });

  it('should show "Liked" for series already in profile', async () => {
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

    const searchInput = screen.getByPlaceholderText(/search for a tv series/i);
    await user.type(searchInput, 'Breaking');

    await waitFor(
      () => {
        const likeButton = screen.getByRole('button', { name: /^like$/i });
        expect(likeButton).toBeDisabled();
      },
      { timeout: 1000 },
    );
  });

  it('should disable like button for series already in profile', async () => {
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

    const searchInput = screen.getByPlaceholderText(/search for a tv series/i);
    await user.type(searchInput, 'Breaking');

    await waitFor(
      () => {
        const likeButton = screen.getByRole('button', { name: /^like$/i });
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

    const searchInput = screen.getByPlaceholderText(/search for a tv series/i);
    await user.type(searchInput, 'NonExistentSeries12345');

    await waitFor(
      () => {
        expect(screen.getByText(/no series found for "NonExistentSeries12345"/i)).toBeInTheDocument();
      },
      { timeout: 1000 },
    );
  });

  it('should display series rating', async () => {
    const user = userEvent.setup();
    await renderWithProviders(
      <SearchSeries
        onAddToProfile={mockOnAddToProfile}
        onAddToIgnored={mockOnAddToIgnored}
        profileSeriesIds={mockProfileSeriesIds}
        ignoredSeriesIds={mockIgnoredSeriesIds}
      />,
    );

    const searchInput = screen.getByPlaceholderText(/search for a tv series/i);
    await user.type(searchInput, 'Breaking');

    await waitFor(
      () => {
        expect(screen.getByText(/8\.9/)).toBeInTheDocument();
      },
      { timeout: 1000 },
    );
  });

  it('should display series year', async () => {
    const user = userEvent.setup();
    await renderWithProviders(
      <SearchSeries
        onAddToProfile={mockOnAddToProfile}
        onAddToIgnored={mockOnAddToIgnored}
        profileSeriesIds={mockProfileSeriesIds}
        ignoredSeriesIds={mockIgnoredSeriesIds}
      />,
    );

    const searchInput = screen.getByPlaceholderText(/search for a tv series/i);
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

    const searchInput = screen.getByPlaceholderText(/search for a tv series/i);
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

    const searchInput = screen.getByPlaceholderText(/search for a tv series/i);
    await user.type(searchInput, 'Breaking');

    await waitFor(
      () => {
        expect(screen.getByText('Breaking Bad')).toBeInTheDocument();
      },
      { timeout: 1000 },
    );

    const notInterestedButton = screen.getAllByRole('button', { name: /^not interested$/i })[0];
    await user.click(notInterestedButton);

    expect(mockOnAddToIgnored).toHaveBeenCalledTimes(1);
    expect(mockOnAddToIgnored).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 1396,
        name: 'Breaking Bad',
      }),
    );
  });

  it('should clear search input after marking series as not interested', async () => {
    const user = userEvent.setup();
    await renderWithProviders(
      <SearchSeries
        onAddToProfile={mockOnAddToProfile}
        onAddToIgnored={mockOnAddToIgnored}
        profileSeriesIds={mockProfileSeriesIds}
        ignoredSeriesIds={mockIgnoredSeriesIds}
      />,
    );

    const searchInput = screen.getByPlaceholderText(/search for a tv series/i);
    await user.type(searchInput, 'Breaking');

    await waitFor(
      () => {
        expect(screen.getByText('Breaking Bad')).toBeInTheDocument();
      },
      { timeout: 1000 },
    );

    const notInterestedButton = screen.getAllByRole('button', { name: /^not interested$/i })[0];
    await user.click(notInterestedButton);

    await waitFor(() => {
      expect(searchInput).toHaveValue('');
    });
  });

  it('should show "Ignored" for series already ignored', async () => {
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

    const searchInput = screen.getByPlaceholderText(/search for a tv series/i);
    await user.type(searchInput, 'Breaking');

    await waitFor(
      () => {
        expect(screen.getByRole('button', { name: /ignored/i })).toBeInTheDocument();
      },
      { timeout: 1000 },
    );
  });

  it('should disable not interested button for series already ignored', async () => {
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

    const searchInput = screen.getByPlaceholderText(/search for a tv series/i);
    await user.type(searchInput, 'Breaking');

    await waitFor(
      () => {
        const ignoredButton = screen.getByRole('button', { name: /ignored/i });
        expect(ignoredButton).toBeDisabled();
      },
      { timeout: 1000 },
    );
  });
});
