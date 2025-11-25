import { useState, useEffect, useContext } from 'react';
import { toast } from 'sonner';
import { getMySeriesWatchlist } from '../api/queries/getMySeriesWatchlist.ts';
import { removeSeriesWatchlist } from '../api/queries/removeSeriesWatchlist.ts';
import { SeriesWatchlist } from '../api/types/series.ts';
import SeriesWatchlistList from '../components/SeriesWatchlistList.tsx';
import { SeriesContext } from '../context/SeriesContext';
import { useSEO } from '../hooks/useSEO';

export default function WatchlistPage() {
  useSEO({
    title: 'Watchlist - ShowSync',
    description: 'Manage your TV show watchlist. Track shows you want to watch.',
    keywords: ['watchlist', 'want to watch', 'tv shows', 'watch later'],
  });

  const { refreshCounts } = useContext(SeriesContext);
  const [myWatchlist, setMyWatchlist] = useState<SeriesWatchlist[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadWatchlist = async () => {
      try {
        const response = await getMySeriesWatchlist(1, 20, 'wantToWatch');
        setMyWatchlist(response.data);
      } catch {
        toast.error('Could not load your watchlist. Please refresh the page.');
      } finally {
        setIsLoading(false);
      }
    };

    loadWatchlist();
  }, []);

  const handleRemoveWatchlist = async (seriesTmdbId: number): Promise<void> => {
    try {
      await removeSeriesWatchlist(seriesTmdbId);

      setMyWatchlist((prev) => prev.filter((item) => item.seriesTmdbId !== seriesTmdbId));

      await refreshCounts();
      toast.success('Show removed from watchlist');
    } catch {
      toast.error('Could not remove show from watchlist. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="relative overflow-hidden">
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-size-[4rem_4rem]" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="space-y-12">
            {/* Header */}
            <div className="text-center">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.1] mb-4">
                Your Watchlist
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Track shows you want to watch and never lose sight of your next binge-worthy series.
              </p>
            </div>

            {/* Watchlist Section */}
            <div>
              <div className="flex items-center justify-between gap-3 mb-6">
                <h2 className="text-xl font-semibold tracking-tight text-foreground">Want to Watch</h2>
                <span className="text-sm font-semibold text-muted-foreground px-3 py-1.5 bg-muted/50 rounded-full">
                  {myWatchlist.length} {myWatchlist.length === 1 ? 'show' : 'shows'}
                </span>
              </div>

              <SeriesWatchlistList
                watchlist={myWatchlist}
                onRemoveWatchlist={handleRemoveWatchlist}
                isLoading={isLoading}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
