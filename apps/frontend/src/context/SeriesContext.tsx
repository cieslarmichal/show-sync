import { createContext } from 'react';

export type SeriesContextType = {
  lovedCount: number;
  likedCount: number;
  totalCount: number;
  refreshCounts: () => Promise<void>;
};

export const SeriesContext = createContext<SeriesContextType>({
  lovedCount: 0,
  likedCount: 0,
  totalCount: 0,
  refreshCounts: async () => {},
});
