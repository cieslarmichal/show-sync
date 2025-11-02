import { useState, useEffect } from 'react';
import { toast } from 'sonner';
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

export default function SeriesPage() {
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
      } catch (error) {
        console.error('Failed to load series:', error);
        toast.error('Failed to load your series');
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
      } catch (error) {
        console.error('Failed to load ignored series:', error);
        toast.error('Failed to load your ignored series');
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
      toast.success(`"${series.name}" added to your favorites!`);
    } catch (error) {
      console.error('Failed to add to favorites:', error);
      toast.error('Failed to add series to your favorites');
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

      toast.success('Series removed from your profile');
    } catch (error) {
      console.error('Failed to remove series:', error);
      toast.error('Failed to remove series from your profile');
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

      toast.success(`Preference updated to ${preferenceLevel === 'love' ? '❤️ Loved' : '👍 Liked'}`);
    } catch (error) {
      console.error('Failed to update preference:', error);
      toast.error('Failed to update preference');
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
      toast.success('Series removed from ignored list');
    } catch (error) {
      console.error('Failed to remove ignored series:', error);
      toast.error('Failed to remove series from ignored list');
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
    } catch (error) {
      console.error('Failed to add to ignored:', error);
      toast.error('Failed to add series to ignored list');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="relative overflow-hidden">
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-size-[4rem_4rem]" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="space-y-12">
            {/* Header */}
            <div className="text-center">
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground">My Series</h1>
              <p className="text-xl text-muted-foreground mt-3 max-w-2xl mx-auto">
                Build your taste profile by adding shows you love. The more you add, the better your group
                recommendations will be.
              </p>
            </div>

            {/* Search Section */}
            <SearchSeries
              onAddToProfile={handleAddToProfile}
              onAddToIgnored={handleAddToIgnored}
              profileSeriesIds={profileSeriesIds}
              ignoredSeriesIds={ignoredSeriesIds}
            />

            {/* My Series Section */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                  Your Favorite Shows ({mySeries.length})
                </h2>
              </div>

              <Tabs
                value={preferenceFilter}
                onValueChange={(value: string) => setPreferenceFilter(value as 'all' | PreferenceLevel)}
                className="w-full"
              >
                <TabsList className="mb-6">
                  <TabsTrigger value="all">All ({mySeries.length})</TabsTrigger>
                  <TabsTrigger value="love">❤️ Loved ({lovedCount})</TabsTrigger>
                  <TabsTrigger value="like">👍 Liked ({likedCount})</TabsTrigger>
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
                  />
                </TabsContent>

                <TabsContent value="like">
                  <FavoriteSeriesList
                    favorites={mySeries.filter((s) => s.preferenceLevel === 'like')}
                    onRemoveFavorite={handleRemoveSeries}
                    onUpdatePreference={handleUpdatePreference}
                    isLoading={isLoading}
                  />
                </TabsContent>
              </Tabs>
            </div>

            {/* Ignored Series Section */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                  Ignored Shows ({myIgnoredSeries.length})
                </h2>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                These shows won't appear in your watch room recommendations. You can remove them anytime to reconsider.
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
