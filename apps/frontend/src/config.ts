import { z } from 'zod';
import { logger } from './utils/logger';

const rawEnv = import.meta.env.MODE;

const backendUrl = rawEnv === 'production' ? 'https://api.show-sync.com' : 'http://localhost:5000';

const appConfig = {
  backendUrl: import.meta.env.VITE_BACKEND_URL || backendUrl,
  watchroom: {
    maxParticipants: 6,
  },
  series: {
    minRatedShowsToCreateWatchRoom: 3,
    // Accuracy tiers for recommendations
    basicAccuracy: 3, // Minimum to get recommendations
    goodAccuracy: 8, // Good quality matches
    maxAccuracy: 15, // Best possible matches
  },
};

const configSchema = z.object({
  backendUrl: z.string().min(1),
  watchroom: z.object({
    maxParticipants: z.number().min(1).max(100),
  }),
  series: z.object({
    minRatedShowsToCreateWatchRoom: z.number().min(1),
    basicAccuracy: z.number().min(1),
    goodAccuracy: z.number().min(1),
    maxAccuracy: z.number().min(1),
  }),
});

export type Config = z.infer<typeof configSchema>;

export function createConfig(): Config {
  const parsedConfig = configSchema.safeParse(appConfig);

  if (!parsedConfig.success) {
    logger.error(parsedConfig.error);
    throw new Error('Configuration error');
  }

  return parsedConfig.data;
}

export const config = createConfig();
