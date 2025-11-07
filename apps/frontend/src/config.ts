import { z } from 'zod';

const appConfig = {
  backendUrl: import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000',
  watchroom: {
    maxParticipants: 6,
  },
  series: {
    // Minimum requirements to create a watch room
    minTotalForRoom: 5,
    minLovedForRoom: 2,
    // Accuracy tiers for recommendations
    basicAccuracy: 5, // Minimum to get recommendations
    goodAccuracy: 8, // Good quality matches
    maxAccuracy: 15, // Best possible matches
    // Setup requirements (shown in onboarding flow)
    minLovedSetup: 3, // Required loved series
    minLikedSetup: 5, // Required liked series
  },
};

const configSchema = z.object({
  backendUrl: z.string().min(1),
  watchroom: z.object({
    maxParticipants: z.number().min(1).max(100),
  }),
  series: z.object({
    minTotalForRoom: z.number().min(1),
    minLovedForRoom: z.number().min(1),
    basicAccuracy: z.number().min(1),
    goodAccuracy: z.number().min(1),
    maxAccuracy: z.number().min(1),
    minLovedSetup: z.number().min(1),
    minLikedSetup: z.number().min(1),
  }),
});

export type Config = z.infer<typeof configSchema>;

export function createConfig(): Config {
  const parsedConfig = configSchema.safeParse(appConfig);

  if (!parsedConfig.success) {
    console.error(parsedConfig.error);
    throw new Error('Configuration error');
  }

  return parsedConfig.data;
}

export const config = createConfig();
