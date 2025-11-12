import { useState, useEffect, useContext } from 'react';
import { toast } from 'sonner';
import { Heart, ThumbsUp } from 'lucide-react';
import SearchSeries from '../components/SearchSeries.tsx';
import FavoriteSeriesList from '../components/FavoriteSeriesList.tsx';
import IgnoredSeriesList from '../components/IgnoredSeriesList.tsx';
import { getMyFavoriteSeries } from '../api/queries/getMyFavoriteSeries.ts';
import { addFavoriteSeries } from '../api/queries/addFavoriteSeries.ts';
import { removeFavoriteSeries } from '../api/queries/removeFavoriteSeries.ts';
import { updateFavoriteSeriesPreference } from '../api/queries/updateFavoriteSeriesPreference.ts';
import { getMyIgnoredSeries } from '../api/queries/getMyIgnoredSeries.ts';
import { addIgnoredSeries } from '../api/queries/addIgnoredSeries.ts';
import { removeIgnoredSeries } from '../api/queries/removeIgnoredSeries.ts';
import { Series, FavoriteSeries, IgnoredSeries, PreferenceLevel } from '../api/types/series.ts';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/Tabs';
import { SeriesContext } from '../context/SeriesContext';
import { useSEO } from '../hooks/useSEO';

export default function SeriesPage() {
  useSEO({
    title: 'Shows - ShowSync',
    description: 'Browse, rate, and manage your favorite TV shows. Tell us what you like to get better suggestions.',
    keywords: ['tv shows', 'rate shows', 'favorite shows', 'tv recommendations', 'show list'],
  });

  const { refreshCounts } = useContext(SeriesContext);
  const [profileSeriesIds, setProfileSeriesIds] = useState<Set<number>>(new Set());
  const [ignoredSeriesIds, setIgnoredSeriesIds] = useState<Set<number>>(new Set());
  const [mySeries, setMySeries] = useState<FavoriteSeries[]>([]);
  const [myIgnoredSeries, setMyIgnoredSeries] = useState<IgnoredSeries[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingIgnored, setIsLoadingIgnored] = useState(true);
  const [preferenceFilter, setPreferenceFilter] = useState<'all' | PreferenceLevel>('all');
  const [lovedCount, setLovedCount] = useState(0);
  const [likedCount, setLikedCount] = useState(0);

  useEffect(() => {
    const loadSeries = async () => {
      try {
        const response = await getMyFavoriteSeries();
        const series = response.data;
        setMySeries(series);
        setProfileSeriesIds(new Set(series.map((fav: FavoriteSeries) => fav.seriesTmdbId)));

        // Calculate counts
        const loved = series.filter((s: FavoriteSeries) => s.preferenceLevel === 'love').length;
        const liked = series.filter((s: FavoriteSeries) => s.preferenceLevel === 'like').length;
        setLovedCount(loved);
        setLikedCount(liked);
      } catch {
        toast.error('Could not load your shows. Please refresh the page.');
      } finally {
        setIsLoading(false);
      }
    };

    loadSeries();
  }, []);

  useEffect(() => {
    const loadIgnoredSeries = async () => {
      try {
        const response = await getMyIgnoredSeries();
        const ignored = response.data;
        setMyIgnoredSeries(ignored);
        setIgnoredSeriesIds(new Set(ignored.map((ign: IgnoredSeries) => ign.seriesTmdbId)));
      } catch {
        toast.error('Could not load your skipped shows. Please refresh the page.');
      } finally {
        setIsLoadingIgnored(false);
      }
    };

    loadIgnoredSeries();
  }, []);

  const handleAddToProfile = async (series: Series, preferenceLevel: PreferenceLevel = 'like') => {
    try {
      // If series is in ignored list, remove it first
      if (ignoredSeriesIds.has(series.id)) {
        await removeIgnoredSeries(series.id);
        setIgnoredSeriesIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(series.id);
          return newSet;
        });
        setMyIgnoredSeries((prev) => prev.filter((ignored) => ignored.seriesTmdbId !== series.id));
      }

      await addFavoriteSeries(series.id, preferenceLevel);
      setProfileSeriesIds((prev) => new Set(prev).add(series.id));
      // Add to series list
      const newSeries: FavoriteSeries = {
        seriesTmdbId: series.id,
        preferenceLevel: preferenceLevel,
      };
      setMySeries((prev) => [...prev, newSeries]);
      if (preferenceLevel === 'love') {
        setLovedCount((prev) => prev + 1);
      } else {
        setLikedCount((prev) => prev + 1);
      }
      await refreshCounts(); // Sync with context
      toast.success(`"${series.name}" added to your favorites!`);
    } catch {
      toast.error('Could not save your rating. Please check your connection and try again.');
    }
  };

  const handleRemoveSeries = async (seriesTmdbId: number): Promise<void> => {
    try {
      const removedSeries = mySeries.find((s) => s.seriesTmdbId === seriesTmdbId);
      await removeFavoriteSeries(seriesTmdbId);
      setProfileSeriesIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(seriesTmdbId);
        return newSet;
      });
      setMySeries((prev) => prev.filter((fav) => fav.seriesTmdbId !== seriesTmdbId));

      // Update counts
      if (removedSeries?.preferenceLevel === 'love') {
        setLovedCount((prev) => prev - 1);
      } else {
        setLikedCount((prev) => prev - 1);
      }

      await refreshCounts(); // Sync with context
      toast.success('Show removed from your favorites');
    } catch {
      toast.error('Could not remove show. Please try again.');
    }
  };

  const handleUpdatePreference = async (seriesTmdbId: number, preferenceLevel: PreferenceLevel): Promise<void> => {
    try {
      const oldSeries = mySeries.find((s) => s.seriesTmdbId === seriesTmdbId);
      const oldLevel = oldSeries?.preferenceLevel;

      await updateFavoriteSeriesPreference(seriesTmdbId, preferenceLevel);

      setMySeries((prev) => prev.map((fav) => (fav.seriesTmdbId === seriesTmdbId ? { ...fav, preferenceLevel } : fav)));

      // Update counts
      if (oldLevel === 'love' && preferenceLevel === 'like') {
        setLovedCount((prev) => prev - 1);
        setLikedCount((prev) => prev + 1);
      } else if (oldLevel === 'like' && preferenceLevel === 'love') {
        setLikedCount((prev) => prev - 1);
        setLovedCount((prev) => prev + 1);
      }

      await refreshCounts(); // Sync with context
      toast.success(`Preference updated to ${preferenceLevel === 'love' ? '❤️ Loved' : '👍 Liked'}`);
    } catch {
      toast.error('Could not update your rating. Please try again.');
    }
  };

  const handleRemoveIgnoredSeries = async (seriesTmdbId: number): Promise<void> => {
    try {
      await removeIgnoredSeries(seriesTmdbId);
      setIgnoredSeriesIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(seriesTmdbId);
        return newSet;
      });
      setMyIgnoredSeries((prev) => prev.filter((ignored) => ignored.seriesTmdbId !== seriesTmdbId));
      toast.success('Show removed from skipped list');
    } catch {
      toast.error('Could not restore show. Please try again.');
    }
  };

  const handleAddToIgnored = async (series: Series): Promise<void> => {
    try {
      // If series is in favorite list, remove it first
      if (profileSeriesIds.has(series.id)) {
        await removeFavoriteSeries(series.id);
        setProfileSeriesIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(series.id);
          return newSet;
        });
        setMySeries((prev) => prev.filter((fav) => fav.seriesTmdbId !== series.id));
      }

      await addIgnoredSeries(series.id);
      setIgnoredSeriesIds((prev) => new Set(prev).add(series.id));
      const newIgnored: IgnoredSeries = {
        seriesTmdbId: series.id,
      };
      setMyIgnoredSeries((prev) => [...prev, newIgnored]);
      toast.success(`"${series.name}" added to your ignored list`);
    } catch {
      toast.error('Could not skip show. Please try again.');
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
                Rate Your Shows
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Build your taste profile by rating shows. The more you rate, the better your recommendations.
              </p>
            </div>

            {/* Search Section */}
            <SearchSeries
              onAddToProfile={handleAddToProfile}
              onAddToIgnored={handleAddToIgnored}
              profileSeriesIds={profileSeriesIds}
              ignoredSeriesIds={ignoredSeriesIds}
            />

            {/* Series Section */}
            <div>
              <div className="flex items-center justify-between gap-3 mb-6">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground">
                  Your Ratings
                </h2>
                <span className="text-sm font-semibold text-muted-foreground px-3 py-1.5 bg-muted/50 rounded-full">
                  {mySeries.length} {mySeries.length === 1 ? 'show' : 'shows'}
                </span>
              </div>

              <Tabs
                value={preferenceFilter}
                onValueChange={(value: string) => setPreferenceFilter(value as 'all' | PreferenceLevel)}
                className="w-full"
              >
                <TabsList className="mb-8 bg-muted/50 p-1.5 rounded-xl inline-flex">
                  <TabsTrigger
                    value="all"
                    className="data-[state=active]:bg-background data-[state=active]:shadow-md rounded-lg px-5 py-2.5 font-semibold transition-all"
                  >
                    All ({mySeries.length})
                  </TabsTrigger>
                  <TabsTrigger
                    value="love"
                    className="data-[state=active]:bg-red-50 data-[state=active]:text-red-600 data-[state=active]:shadow-md dark:data-[state=active]:bg-red-950/30 dark:data-[state=active]:text-red-400 rounded-lg px-5 py-2.5 font-semibold transition-all"
                  >
                    <Heart className="w-4 h-4 mr-1.5 fill-current" />
                    Loved ({lovedCount})
                  </TabsTrigger>
                  <TabsTrigger
                    value="like"
                    className="data-[state=active]:bg-sky-50 data-[state=active]:text-sky-600 data-[state=active]:shadow-md dark:data-[state=active]:bg-sky-950/30 dark:data-[state=active]:text-sky-400 rounded-lg px-5 py-2.5 font-semibold transition-all"
                  >
                    <ThumbsUp className="w-4 h-4 mr-1.5" />
                    Liked ({likedCount})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="all">
                  <FavoriteSeriesList
                    favorites={mySeries}
                    onRemoveFavorite={handleRemoveSeries}
                    onUpdatePreference={handleUpdatePreference}
                    isLoading={isLoading}
                  />
                </TabsContent>

                <TabsContent value="love">
                  <FavoriteSeriesList
                    favorites={mySeries.filter((s) => s.preferenceLevel === 'love')}
                    onRemoveFavorite={handleRemoveSeries}
                    onUpdatePreference={handleUpdatePreference}
                    isLoading={isLoading}
                    emptyMessage="No loved shows yet"
                    emptySubMessage="Mark shows with ❤️ to see them here"
                  />
                </TabsContent>

                <TabsContent value="like">
                  <FavoriteSeriesList
                    favorites={mySeries.filter((s) => s.preferenceLevel === 'like')}
                    onRemoveFavorite={handleRemoveSeries}
                    onUpdatePreference={handleUpdatePreference}
                    isLoading={isLoading}
                    emptyMessage="No liked shows yet"
                    emptySubMessage="Search and rate shows above to get started"
                  />
                </TabsContent>
              </Tabs>
            </div>

            {/* Ignored Series Section */}
            <div>
              <div className="flex items-center justify-between gap-3 mb-6">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground">
                  Skipped Shows
                </h2>
                <span className="text-sm font-semibold text-muted-foreground px-3 py-1.5 bg-muted/50 rounded-full">
                  {myIgnoredSeries.length} {myIgnoredSeries.length === 1 ? 'show' : 'shows'}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                These shows won't appear in your recommendations. Remove them anytime to reconsider.
              </p>
              <IgnoredSeriesList
                ignoredSeries={myIgnoredSeries}
                onRemoveIgnored={handleRemoveIgnoredSeries}
                isLoading={isLoadingIgnored}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
