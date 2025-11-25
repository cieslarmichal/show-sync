import { useState, useEffect, useContext } from 'react';
import { toast } from 'sonner';
import { Heart, ThumbsUp, ThumbsDown } from 'lucide-react';
import SearchSeries from '../components/SearchSeries.tsx';
import SeriesRatingList from '../components/SeriesRatingList.tsx';
import { getMySeriesRatings } from '../api/queries/getMySeriesRatings.ts';
import { addSeriesRating } from '../api/queries/addSeriesRating.ts';
import { removeSeriesRating } from '../api/queries/removeSeriesRating.ts';
import { updateSeriesRating } from '../api/queries/updateSeriesRating.ts';
import { getMySeriesWatchlist } from '../api/queries/getMySeriesWatchlist.ts';
import { addSeriesWatchlist } from '../api/queries/addSeriesWatchlist.ts';
import { removeSeriesWatchlist } from '../api/queries/removeSeriesWatchlist.ts';
import { Series, SeriesRating, Rating, WatchlistType } from '../api/types/series.ts';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/Tabs';
import { SeriesContext } from '../context/SeriesContext';
import { useSEO } from '../hooks/useSEO';

export default function SeriesPage() {
  useSEO({
    title: 'Shows - ShowSync',
    description: 'Browse, rate, and manage your TV shows. Tell us what you like to get better suggestions.',
    keywords: ['tv shows', 'rate shows', 'rated shows', 'tv recommendations', 'show list'],
  });

  const { refreshCounts } = useContext(SeriesContext);
  const [ratedSeriesIds, setRatedSeriesIds] = useState<Set<number>>(new Set());
  const [watchlistSeriesIds, setWatchlistSeriesIds] = useState<Set<number>>(new Set());
  const [myRatings, setMyRatings] = useState<SeriesRating[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [ratingFilter, setRatingFilter] = useState<'all' | Rating>('all');
  const [lovedCount, setLovedCount] = useState(0);
  const [likedCount, setLikedCount] = useState(0);
  const [dislikedCount, setDislikedCount] = useState(0);

  useEffect(() => {
    const loadRatings = async () => {
      try {
        const response = await getMySeriesRatings();
        const ratings = response.data;
        setMyRatings(ratings);
        setRatedSeriesIds(new Set(ratings.map((rating: SeriesRating) => rating.seriesTmdbId)));

        // Calculate counts
        const loved = ratings.filter((s: SeriesRating) => s.rating === 'love').length;
        const liked = ratings.filter((s: SeriesRating) => s.rating === 'like').length;
        const disliked = ratings.filter((s: SeriesRating) => s.rating === 'dislike').length;
        setLovedCount(loved);
        setLikedCount(liked);
        setDislikedCount(disliked);
      } catch {
        toast.error('Could not load your ratings. Please refresh the page.');
      } finally {
        setIsLoading(false);
      }
    };

    loadRatings();
  }, []);

  useEffect(() => {
    const loadWatchlist = async () => {
      try {
        const response = await getMySeriesWatchlist();
        const watchlist = response.data;
        setWatchlistSeriesIds(new Set(watchlist.map((item) => item.seriesTmdbId)));
      } catch {
        // Silently fail - watchlist is now optional for this page
      }
    };

    loadWatchlist();
  }, []);

  const handleAddRating = async (series: Series, rating: Rating) => {
    try {
      // If series is in watchlist, remove it first
      if (watchlistSeriesIds.has(series.id)) {
        await removeSeriesWatchlist(series.id);
        setWatchlistSeriesIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(series.id);
          return newSet;
        });
      }

      await addSeriesRating(series.id, rating);
      setRatedSeriesIds((prev) => new Set(prev).add(series.id));

      // Add to ratings list
      const newRating: SeriesRating = {
        seriesTmdbId: series.id,
        rating: rating,
      };
      setMyRatings((prev) => [...prev, newRating]);

      // Update counts
      if (rating === 'love') {
        setLovedCount((prev) => prev + 1);
      } else if (rating === 'like') {
        setLikedCount((prev) => prev + 1);
      } else {
        setDislikedCount((prev) => prev + 1);
      }

      await refreshCounts(); // Sync with context

      const ratingEmoji = rating === 'love' ? '❤️' : rating === 'like' ? '👍' : '👎';
      toast.success(`"${series.name}" rated as ${ratingEmoji}`);
    } catch {
      toast.error('Could not save your rating. Please check your connection and try again.');
    }
  };

  const handleRemoveRating = async (seriesTmdbId: number): Promise<void> => {
    try {
      const removedRating = myRatings.find((s) => s.seriesTmdbId === seriesTmdbId);
      await removeSeriesRating(seriesTmdbId);
      setRatedSeriesIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(seriesTmdbId);
        return newSet;
      });
      setMyRatings((prev) => prev.filter((rating) => rating.seriesTmdbId !== seriesTmdbId));

      // Update counts
      if (removedRating?.rating === 'love') {
        setLovedCount((prev) => prev - 1);
      } else if (removedRating?.rating === 'like') {
        setLikedCount((prev) => prev - 1);
      } else if (removedRating?.rating === 'dislike') {
        setDislikedCount((prev) => prev - 1);
      }

      await refreshCounts(); // Sync with context
      toast.success('Rating removed');
    } catch {
      toast.error('Could not remove rating. Please try again.');
    }
  };

  const handleUpdateRating = async (seriesTmdbId: number, rating: Rating): Promise<void> => {
    try {
      const oldRating = myRatings.find((s) => s.seriesTmdbId === seriesTmdbId);
      const oldRatingValue = oldRating?.rating;

      await updateSeriesRating(seriesTmdbId, rating);

      setMyRatings((prev) => prev.map((r) => (r.seriesTmdbId === seriesTmdbId ? { ...r, rating } : r)));

      // Update counts
      if (oldRatingValue === 'love') setLovedCount((prev) => prev - 1);
      else if (oldRatingValue === 'like') setLikedCount((prev) => prev - 1);
      else if (oldRatingValue === 'dislike') setDislikedCount((prev) => prev - 1);

      if (rating === 'love') setLovedCount((prev) => prev + 1);
      else if (rating === 'like') setLikedCount((prev) => prev + 1);
      else if (rating === 'dislike') setDislikedCount((prev) => prev + 1);

      await refreshCounts(); // Sync with context

      const ratingEmoji = rating === 'love' ? '❤️' : rating === 'like' ? '👍' : '👎';
      toast.success(`Rating updated to ${ratingEmoji}`);
    } catch {
      toast.error('Could not update your rating. Please try again.');
    }
  };

  const handleAddToWatchlist = async (series: Series, type: WatchlistType): Promise<void> => {
    try {
      // If series is in ratings list, remove it first
      if (ratedSeriesIds.has(series.id)) {
        await removeSeriesRating(series.id);
        const removedRating = myRatings.find((s) => s.seriesTmdbId === series.id);
        setRatedSeriesIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(series.id);
          return newSet;
        });
        setMyRatings((prev) => prev.filter((rating) => rating.seriesTmdbId !== series.id));

        // Update counts
        if (removedRating?.rating === 'love') setLovedCount((prev) => prev - 1);
        else if (removedRating?.rating === 'like') setLikedCount((prev) => prev - 1);
        else if (removedRating?.rating === 'dislike') setDislikedCount((prev) => prev - 1);
      }

      await addSeriesWatchlist(series.id, type);
      setWatchlistSeriesIds((prev) => new Set(prev).add(series.id));

      await refreshCounts();

      const typeLabel = type === 'notInterested' ? 'Not Interested' : 'Want to Watch';
      toast.success(`"${series.name}" added to watchlist as ${typeLabel}`);
    } catch {
      toast.error('Could not add to watchlist. Please try again.');
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
              onAddRating={handleAddRating}
              onAddToWatchlist={handleAddToWatchlist}
              ratedSeriesIds={ratedSeriesIds}
              watchlistSeriesIds={watchlistSeriesIds}
            />

            {/* Ratings Section */}
            <div>
              <div className="flex items-center justify-between gap-3 mb-6">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground">
                  Your Ratings
                </h2>
                <span className="text-sm font-semibold text-muted-foreground px-3 py-1.5 bg-muted/50 rounded-full">
                  {myRatings.length} {myRatings.length === 1 ? 'show' : 'shows'}
                </span>
              </div>

              <Tabs
                value={ratingFilter}
                onValueChange={(value: string) => setRatingFilter(value as 'all' | Rating)}
                className="w-full"
              >
                <TabsList className="mb-8 bg-muted/50 p-1.5 rounded-xl inline-flex">
                  <TabsTrigger
                    value="all"
                    className="data-[state=active]:bg-background data-[state=active]:shadow-md rounded-lg px-5 py-2.5 font-semibold transition-all"
                  >
                    All ({myRatings.length})
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
                    className="data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-600 data-[state=active]:shadow-md dark:data-[state=active]:bg-emerald-950/30 dark:data-[state=active]:text-emerald-400 rounded-lg px-5 py-2.5 font-semibold transition-all"
                  >
                    <ThumbsUp className="w-4 h-4 mr-1.5 fill-current" />
                    Liked ({likedCount})
                  </TabsTrigger>
                  <TabsTrigger
                    value="dislike"
                    className="data-[state=active]:bg-orange-50 data-[state=active]:text-orange-600 data-[state=active]:shadow-md dark:data-[state=active]:bg-orange-950/30 dark:data-[state=active]:text-orange-400 rounded-lg px-5 py-2.5 font-semibold transition-all"
                  >
                    <ThumbsDown className="w-4 h-4 mr-1.5 fill-current" />
                    Dislike ({dislikedCount})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="all">
                  <SeriesRatingList
                    ratings={myRatings}
                    onRemoveRating={handleRemoveRating}
                    onUpdateRating={handleUpdateRating}
                    isLoading={isLoading}
                  />
                </TabsContent>

                <TabsContent value="love">
                  <SeriesRatingList
                    ratings={myRatings.filter((s) => s.rating === 'love')}
                    onRemoveRating={handleRemoveRating}
                    onUpdateRating={handleUpdateRating}
                    isLoading={isLoading}
                    emptyMessage="No loved shows yet"
                    emptySubMessage="Mark shows with ❤️ to see them here"
                  />
                </TabsContent>

                <TabsContent value="like">
                  <SeriesRatingList
                    ratings={myRatings.filter((s) => s.rating === 'like')}
                    onRemoveRating={handleRemoveRating}
                    onUpdateRating={handleUpdateRating}
                    isLoading={isLoading}
                    emptyMessage="No liked shows yet"
                    emptySubMessage="Search and rate shows above to get started"
                  />
                </TabsContent>

                <TabsContent value="dislike">
                  <SeriesRatingList
                    ratings={myRatings.filter((s) => s.rating === 'dislike')}
                    onRemoveRating={handleRemoveRating}
                    onUpdateRating={handleUpdateRating}
                    isLoading={isLoading}
                    emptyMessage="Not for you yet"
                    emptySubMessage="Mark shows you don't like to see them here"
                  />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
