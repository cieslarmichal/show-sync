import { ReactNode, useState, useCallback, useEffect } from 'react';
import { SeriesContext } from './SeriesContext';
import { getMyFavoriteSeries } from '../api/queries/getMyFavoriteSeries';
import { FavoriteSeries } from '../api/types/series';
import { logger } from '../utils/logger';

export const SeriesContextProvider = ({ children }: { children: ReactNode }) => {
  const [lovedCount, setLovedCount] = useState(0);
  const [likedCount, setLikedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const refreshCounts = useCallback(async () => {
    try {
      const response = await getMyFavoriteSeries();
      const series = response.data;

      const loved = series.filter((s: FavoriteSeries) => s.preferenceLevel === 'love').length;
      const liked = series.filter((s: FavoriteSeries) => s.preferenceLevel === 'like').length;

      setLovedCount(loved);
      setLikedCount(liked);
      setTotalCount(series.length);
    } catch (error) {
      logger.error('Failed to load series counts:', error);
    }
  }, []);

  // Load counts on mount
  useEffect(() => {
    const loadCounts = async () => {
      try {
        const response = await getMyFavoriteSeries();
        const series = response.data;

        const loved = series.filter((s: FavoriteSeries) => s.preferenceLevel === 'love').length;
        const liked = series.filter((s: FavoriteSeries) => s.preferenceLevel === 'like').length;

        setLovedCount(loved);
        setLikedCount(liked);
        setTotalCount(series.length);
      } catch (error) {
        logger.error('Failed to load series counts:', error);
      }
    };

    loadCounts();
  }, []);

  return (
    <SeriesContext.Provider value={{ lovedCount, likedCount, totalCount, refreshCounts }}>
      {children}
    </SeriesContext.Provider>
  );
};
