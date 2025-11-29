import { ReactNode, useState, useCallback, useEffect, useContext } from 'react';
import { SeriesContext } from './SeriesContext';
import { getMySeriesRatings } from '../api/queries/getMySeriesRatings';
import { SeriesRating } from '../api/types/series';
import { logger } from '../utils/logger';
import { AuthContext } from './AuthContext';

export const SeriesContextProvider = ({ children }: { children: ReactNode }) => {
  const { userData, userDataInitialized } = useContext(AuthContext);
  const [lovedCount, setLovedCount] = useState(0);
  const [likedCount, setLikedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [ratings, setRatings] = useState<Map<number, import('../api/types/series').Rating>>(new Map());

  const refreshCounts = useCallback(async () => {
    // Only fetch if user is authenticated
    if (!userData) {
      return;
    }

    try {
      const response = await getMySeriesRatings();
      const series = response.data;

      const loved = series.filter((s: SeriesRating) => s.rating === 'love').length;
      const liked = series.filter((s: SeriesRating) => s.rating === 'like').length;

      // Build ratings map
      const ratingsMap = new Map<number, import('../api/types/series').Rating>();
      series.forEach((s: SeriesRating) => {
        ratingsMap.set(s.seriesTmdbId, s.rating);
      });

      setLovedCount(loved);
      setLikedCount(liked);
      setTotalCount(series.length);
      setRatings(ratingsMap);
    } catch (error) {
      logger.error('Failed to load series counts:', error);
    }
  }, [userData]);

  // Load counts on mount only if user is authenticated
  useEffect(() => {
    // Wait until auth is initialized and user is authenticated
    if (!userDataInitialized || !userData) {
      return;
    }

    const loadCounts = async () => {
      try {
        const response = await getMySeriesRatings();
        const series = response.data;

        const loved = series.filter((s: SeriesRating) => s.rating === 'love').length;
        const liked = series.filter((s: SeriesRating) => s.rating === 'like').length;

        // Build ratings map
        const ratingsMap = new Map<number, import('../api/types/series').Rating>();
        series.forEach((s: SeriesRating) => {
          ratingsMap.set(s.seriesTmdbId, s.rating);
        });

        setLovedCount(loved);
        setLikedCount(liked);
        setTotalCount(series.length);
        setRatings(ratingsMap);
      } catch (error) {
        logger.error('Failed to load series counts:', error);
      }
    };

    loadCounts();
  }, [userData, userDataInitialized]);

  return (
    <SeriesContext.Provider value={{ lovedCount, likedCount, totalCount, ratings, refreshCounts }}>
      {children}
    </SeriesContext.Provider>
  );
};
