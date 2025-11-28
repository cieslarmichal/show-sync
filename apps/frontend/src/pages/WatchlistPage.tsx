import { useState, useEffect, useContext } from 'react';
import { toast } from 'sonner';
import { getMySeriesWatchlist } from '../api/queries/getMySeriesWatchlist.ts';
import { removeSeriesWatchlist } from '../api/queries/removeSeriesWatchlist.ts';
import { SeriesWatchlist } from '../api/types/series.ts';
import SeriesWatchlistList from '../components/SeriesWatchlistList.tsx';
import { SeriesContext } from '../context/SeriesContext';
import { useSEO } from '../hooks/useSEO';
import { useTranslation } from 'react-i18next';

export default function WatchlistPage() {
  const { t } = useTranslation();

  useSEO('watchlist');

  const { refreshCounts } = useContext(SeriesContext);
  const [myWatchlist, setMyWatchlist] = useState<SeriesWatchlist[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadWatchlist = async () => {
      try {
        const response = await getMySeriesWatchlist(1, 20, 'wantToWatch');
        setMyWatchlist(response.data);
      } catch {
        toast.error(t('watchlist.loadError'));
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
      toast.success(t('watchlist.removeSuccess'));
    } catch {
      toast.error(t('watchlist.removeError'));
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
                {t('watchlist.title')}
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                {t('watchlist.subtitle')}
              </p>
            </div>

            {/* Watchlist Section */}
            <div>
              <div className="flex items-center justify-between gap-3 mb-6">
                <h2 className="text-xl font-semibold tracking-tight text-foreground">{t('watchlist.wantToWatch')}</h2>
                <span className="text-sm font-semibold text-muted-foreground px-3 py-1.5 bg-muted/50 rounded-full">
                  {t('watchlist.showsCount', { count: myWatchlist.length })}
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
