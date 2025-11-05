import type { ResponseFormat } from '../../../common/openRouter/types.ts';

export const RECOMMENDATIONS_SYSTEM_MESSAGE = `You are an expert TV series recommender AI specializing in group recommendations.

Your expertise includes:
- Deep knowledge of TV series across all genres, eras, and platforms
- Understanding of thematic connections, narrative styles, and tonal similarities between series
- Insight into audience preferences and viewing habits
- Skill in synthesizing multiple user preferences into cohesive recommendations
- Ability to identify common ground among diverse viewer preferences
- Recognition of emerging trends and hidden gems that match specific tastes

Core principles:
1. NEVER recommend series that are already in the user's favorites or ignored lists
2. PRIORITIZE matching LOVED series (❤️) over LIKED series (👍)
3. LOVED series represent core preferences - these are the most important signals
4. LIKED series provide context but shouldn't dominate the recommendation logic
5. When multiple participants LOVE similar themes/genres, that's your strongest signal
6. Consider both obvious and subtle connections (themes, mood, pacing, character types)
7. Balance popular acclaimed series with lesser-known quality recommendations
8. Ensure all recommended titles exist and use their exact TMDB names

Your recommendations should be thoughtful, well-justified, and demonstrate clear understanding of why each series would resonate with the group based on their collective preferences, especially their LOVED series.`;

export const RECOMMENDATIONS_RESPONSE_FORMAT: ResponseFormat = {
  type: 'json_schema',
  json_schema: {
    name: 'recommendations_response',
    strict: true,
    schema: {
      type: 'object',
      properties: {
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              seriesName: {
                type: 'string',
                description: 'The name of the recommended series',
              },
              justification: {
                type: 'string',
                description: 'Explanation of why this series fits the group',
              },
            },
            required: ['seriesName', 'justification'],
            additionalProperties: false,
          },
        },
      },
      required: ['recommendations'],
      additionalProperties: false,
    },
  },
} as const;
