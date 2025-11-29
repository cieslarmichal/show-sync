import { createContext } from 'react';

import type { Rating } from '../api/types/series';

export type SeriesContextType = {
  lovedCount: number;
  likedCount: number;
  totalCount: number;
  ratings: Map<number, Rating>;
  refreshCounts: () => Promise<void>;
};

export const SeriesContext = createContext<SeriesContextType>({
  lovedCount: 0,
  likedCount: 0,
  totalCount: 0,
  ratings: new Map(),
  refreshCounts: async () => {},
});
