import { beforeEach, describe, expect, it } from 'vitest';

import { RecommendationPromptBuilder } from './recommendationPromptBuilder.ts';

interface SeriesInfo {
  readonly tmdbId: number;
  readonly name: string;
  readonly overview: string;
  readonly genres: string[];
  readonly voteAverage: number;
  readonly firstAirDate: string | null;
}

describe('RecommendationPromptBuilder', () => {
  let promptBuilder: RecommendationPromptBuilder;

  beforeEach(() => {
    promptBuilder = new RecommendationPromptBuilder();
  });

  const createSeriesInfo = (
    tmdbId: number,
    name: string,
    overview: string,
    genres: string[],
    voteAverage: number,
    firstAirDate: string | null = '2020-01-01',
  ): SeriesInfo => ({
    tmdbId,
    name,
    overview,
    genres,
    voteAverage,
    firstAirDate,
  });

  describe('build', () => {
    it('builds a complete prompt with all sections', () => {
      const seriesInfoMap = new Map([
        [
          1,
          createSeriesInfo(
            1,
            'Breaking Bad',
            'A high school chemistry teacher turns to cooking meth.',
            ['Drama', 'Crime'],
            9.5,
          ),
        ],
        [2, createSeriesInfo(2, 'Better Call Saul', 'The story of lawyer Jimmy McGill.', ['Drama', 'Crime'], 8.9)],
        [
          3,
          createSeriesInfo(3, 'The Wire', 'Baltimore drug scene from multiple perspectives.', ['Drama', 'Crime'], 9.3),
        ],
        [4, createSeriesInfo(4, 'Game of Thrones', 'Noble families vie for control.', ['Fantasy', 'Drama'], 9.2)],
        [5, createSeriesInfo(5, 'The Big Bang Theory', 'Scientists and their lives.', ['Comedy'], 7.0)],
        [6, createSeriesInfo(6, 'Stranger Things', 'Kids fight supernatural forces.', ['Sci-Fi', 'Horror'], 8.7)],
      ]);

      const participantRatings = [
        {
          participantId: 'user1',
          lovedSeriesIds: [1, 2],
          likedSeriesIds: [3],
          dislikedSeriesIds: [5],
        },
        {
          participantId: 'user2',
          lovedSeriesIds: [4],
          likedSeriesIds: [],
          dislikedSeriesIds: [],
        },
      ];

      const notInterestedSeriesIds = [3];
      const dislikedSeriesIds = [5];
      const wantToWatchSeriesIds = [6];

      const result = promptBuilder.build(
        participantRatings,
        notInterestedSeriesIds,
        dislikedSeriesIds,
        wantToWatchSeriesIds,
        seriesInfoMap,
        'Crime Drama Fans',
        'A group for people who love intense crime dramas',
      );

      expect(result).toContain('WATCH ROOM: "Crime Drama Fans"');
      expect(result).toContain('Description: A group for people who love intense crime dramas');
      expect(result).toContain('PARTICIPANTS AND THEIR SERIES RATINGS:');
      expect(result).toContain('❤️ LOVED (HIGHEST PRIORITY - Core preferences):');
      expect(result).toContain('Breaking Bad');
      expect(result).toContain('Better Call Saul');
      expect(result).toContain('Game of Thrones');
      expect(result).toContain('👍 LIKED (Secondary preferences):');
      expect(result).toContain('The Wire');
      expect(result).toContain('👎 DISLIKED');
      expect(result).toContain('The Big Bang Theory');
      expect(result).toContain('SERIES MARKED AS NOT INTERESTED:');
      expect(result).toContain('DISLIKED SERIES:');
      expect(result).toContain('SERIES ON WATCHLIST (Want to Watch):');
      expect(result).toContain('Stranger Things');
      expect(result).toContain('TASK:');
      expect(result).toContain('Recommend 5-10 BRAND NEW TV series');
    });

    it('builds prompt without description when not provided', () => {
      const seriesInfoMap = new Map([
        [
          1,
          createSeriesInfo(
            1,
            'Breaking Bad',
            'A high school chemistry teacher turns to cooking meth.',
            ['Drama', 'Crime'],
            9.5,
          ),
        ],
      ]);

      const participantRatings = [
        {
          participantId: 'user1',
          lovedSeriesIds: [1],
          likedSeriesIds: [],
          dislikedSeriesIds: [],
        },
      ];

      const result = promptBuilder.build(participantRatings, [], [], [], seriesInfoMap, 'Test Room', undefined);

      expect(result).toContain('WATCH ROOM: "Test Room"');
      expect(result).not.toContain('Description:');
      expect(result).not.toContain('Use this description to understand');
    });

    it('includes loved series with full details', () => {
      const seriesInfoMap = new Map([
        [
          1,
          createSeriesInfo(
            1,
            'Breaking Bad',
            'A high school chemistry teacher turns to cooking meth. He partners with a former student.',
            ['Drama', 'Crime', 'Thriller'],
            9.5,
          ),
        ],
      ]);

      const participantRatings = [
        {
          participantId: 'user1',
          lovedSeriesIds: [1],
          likedSeriesIds: [],
          dislikedSeriesIds: [],
        },
      ];

      const result = promptBuilder.build(participantRatings, [], [], [], seriesInfoMap, 'Test Room', undefined);

      expect(result).toContain('❤️ LOVED (HIGHEST PRIORITY - Core preferences):');
      expect(result).toContain('- Breaking Bad');
      expect(result).toContain('Genres: Drama, Crime, Thriller');
      expect(result).toContain('Summary: A high school chemistry teacher turns to cooking meth.');
      expect(result).toContain('Rating: 9.5/10');
    });

    it('includes liked series with compact format', () => {
      const seriesInfoMap = new Map([
        [1, createSeriesInfo(1, 'The Office', 'A mockumentary on office life.', ['Comedy'], 8.9)],
        [2, createSeriesInfo(2, 'Parks and Recreation', 'Life in the Parks Department.', ['Comedy'], 8.6)],
      ]);

      const participantRatings = [
        {
          participantId: 'user1',
          lovedSeriesIds: [],
          likedSeriesIds: [1, 2],
          dislikedSeriesIds: [],
        },
      ];

      const result = promptBuilder.build(participantRatings, [], [], [], seriesInfoMap, 'Test Room', undefined);

      expect(result).toContain('👍 LIKED (Secondary preferences):');
      expect(result).toContain('- The Office (Comedy)');
      expect(result).toContain('- Parks and Recreation (Comedy)');
      expect(result).not.toContain('Summary:');
      expect(result).not.toContain('Rating:');
    });

    it('handles multiple participants correctly', () => {
      const seriesInfoMap = new Map([
        [1, createSeriesInfo(1, 'Breaking Bad', 'Chemistry teacher turns to cooking meth.', ['Drama'], 9.5)],
        [2, createSeriesInfo(2, 'Stranger Things', 'Kids fight supernatural forces.', ['Sci-Fi', 'Horror'], 8.7)],
        [3, createSeriesInfo(3, 'The Crown', 'The reign of Queen Elizabeth II.', ['Drama', 'History'], 8.6)],
      ]);

      const participantRatings = [
        {
          participantId: 'user1',
          lovedSeriesIds: [1],
          likedSeriesIds: [],
          dislikedSeriesIds: [],
        },
        {
          participantId: 'user2',
          lovedSeriesIds: [2],
          likedSeriesIds: [3],
          dislikedSeriesIds: [],
        },
      ];

      const result = promptBuilder.build(participantRatings, [], [], [], seriesInfoMap, 'Test Room', undefined);

      expect(result).toContain('Participant 1:');
      expect(result).toContain('Breaking Bad');
      expect(result).toContain('Participant 2:');
      expect(result).toContain('Stranger Things');
      expect(result).toContain('The Crown');
    });

    it('skips participants with no favorites', () => {
      const seriesInfoMap = new Map([
        [1, createSeriesInfo(1, 'Breaking Bad', 'Chemistry teacher turns to cooking meth.', ['Drama'], 9.5)],
      ]);

      const participantRatings = [
        {
          participantId: 'user1',
          lovedSeriesIds: [1],
          likedSeriesIds: [],
          dislikedSeriesIds: [],
        },
        {
          participantId: 'user2',
          lovedSeriesIds: [],
          likedSeriesIds: [],
          dislikedSeriesIds: [],
        },
        {
          participantId: 'user3',
          lovedSeriesIds: [],
          likedSeriesIds: [],
          dislikedSeriesIds: [],
        },
      ];

      const result = promptBuilder.build(participantRatings, [], [], [], seriesInfoMap, 'Test Room', undefined);

      expect(result).toContain('Participant 1:');
      expect(result).not.toContain('Participant 2:');
      expect(result).not.toContain('Participant 3:');
    });

    it('includes ignored series section when provided', () => {
      const seriesInfoMap = new Map([
        [1, createSeriesInfo(1, 'Breaking Bad', 'Chemistry teacher turns to cooking meth.', ['Drama'], 9.5)],
        [2, createSeriesInfo(2, 'Friends', 'Six friends living in New York.', ['Comedy'], 8.9)],
        [3, createSeriesInfo(3, 'Lost', 'Survivors on a mysterious island.', ['Mystery', 'Drama'], 8.3)],
      ]);

      const participantRatings = [
        {
          participantId: 'user1',
          lovedSeriesIds: [1],
          likedSeriesIds: [],
          dislikedSeriesIds: [],
        },
      ];

      const notInterestedSeriesIds = [2, 3];

      const result = promptBuilder.build(
        participantRatings,
        notInterestedSeriesIds,
        [],
        [],
        seriesInfoMap,
        'Test Room',
        undefined,
      );

      expect(result).toContain('SERIES MARKED AS NOT INTERESTED:');
      expect(result).toContain('These series are explicitly NOT wanted');
      expect(result).toContain('Friends, Lost');
    });

    it('omits ignored series section when empty', () => {
      const seriesInfoMap = new Map([
        [1, createSeriesInfo(1, 'Breaking Bad', 'Chemistry teacher turns to cooking meth.', ['Drama'], 9.5)],
      ]);

      const participantRatings = [
        {
          participantId: 'user1',
          lovedSeriesIds: [1],
          likedSeriesIds: [],
          dislikedSeriesIds: [],
        },
      ];

      const result = promptBuilder.build(participantRatings, [], [], [], seriesInfoMap, 'Test Room', undefined);

      expect(result).not.toContain('SERIES MARKED AS NOT INTERESTED:');
    });

    it('omits ignored series section when series info not found', () => {
      const seriesInfoMap = new Map([
        [1, createSeriesInfo(1, 'Breaking Bad', 'Chemistry teacher turns to cooking meth.', ['Drama'], 9.5)],
      ]);

      const participantRatings = [
        {
          participantId: 'user1',
          lovedSeriesIds: [1],
          likedSeriesIds: [],
          dislikedSeriesIds: [],
        },
      ];

      const notInterestedSeriesIds = [999, 888]; // Series not in map

      const result = promptBuilder.build(
        participantRatings,
        notInterestedSeriesIds,
        [],
        [],
        seriesInfoMap,
        'Test Room',
        undefined,
      );

      expect(result).not.toContain('SERIES MARKED AS NOT INTERESTED:');
    });

    it('always includes task section with all requirements', () => {
      const seriesInfoMap = new Map([
        [1, createSeriesInfo(1, 'Breaking Bad', 'Chemistry teacher turns to cooking meth.', ['Drama'], 9.5)],
      ]);

      const participantRatings = [
        {
          participantId: 'user1',
          lovedSeriesIds: [1],
          likedSeriesIds: [],
          dislikedSeriesIds: [],
        },
      ];

      const result = promptBuilder.build(participantRatings, [], [], [], seriesInfoMap, 'Test Room', undefined);

      expect(result).toContain('TASK:');
      expect(result).toContain('Recommend 5-10 BRAND NEW TV series');
      expect(result).toContain('CRITICAL REQUIREMENTS:');
      expect(result).toContain('Do NOT include ANY series from the "FAVORITE SERIES" lists');
      expect(result).toContain('Do NOT include ANY series from the "NOT INTERESTED" list');
      expect(result).toContain('RECOMMENDATION STRATEGY:');
      expect(result).toContain('PRIORITIZE finding series similar to ❤️ LOVED series');
    });

    it('extracts first sentence from series overview', () => {
      const seriesInfoMap = new Map([
        [
          1,
          createSeriesInfo(
            1,
            'Breaking Bad',
            'First sentence here. Second sentence here. Third sentence here.',
            ['Drama'],
            9.5,
          ),
        ],
      ]);

      const participantRatings = [
        {
          participantId: 'user1',
          lovedSeriesIds: [1],
          likedSeriesIds: [],
          dislikedSeriesIds: [],
        },
      ];

      const result = promptBuilder.build(participantRatings, [], [], [], seriesInfoMap, 'Test Room', undefined);

      expect(result).toContain('Summary: First sentence here.');
      expect(result).not.toContain('Second sentence here');
      expect(result).not.toContain('Third sentence here');
    });

    it('handles overview with exclamation mark as sentence ending', () => {
      const seriesInfoMap = new Map([
        [1, createSeriesInfo(1, 'Breaking Bad', 'Exciting first sentence! Another sentence here.', ['Drama'], 9.5)],
      ]);

      const participantRatings = [
        {
          participantId: 'user1',
          lovedSeriesIds: [1],
          likedSeriesIds: [],
          dislikedSeriesIds: [],
        },
      ];

      const result = promptBuilder.build(participantRatings, [], [], [], seriesInfoMap, 'Test Room', undefined);

      expect(result).toContain('Summary: Exciting first sentence.');
      expect(result).not.toContain('Another sentence here');
    });

    it('handles overview with question mark as sentence ending', () => {
      const seriesInfoMap = new Map([
        [1, createSeriesInfo(1, 'Breaking Bad', 'What will happen? We shall see.', ['Drama'], 9.5)],
      ]);

      const participantRatings = [
        {
          participantId: 'user1',
          lovedSeriesIds: [1],
          likedSeriesIds: [],
          dislikedSeriesIds: [],
        },
      ];

      const result = promptBuilder.build(participantRatings, [], [], [], seriesInfoMap, 'Test Room', undefined);

      expect(result).toContain('Summary: What will happen.');
      expect(result).not.toContain('We shall see');
    });

    it('handles empty overview gracefully', () => {
      const seriesInfoMap = new Map([[1, createSeriesInfo(1, 'Breaking Bad', '', ['Drama'], 9.5)]]);

      const participantRatings = [
        {
          participantId: 'user1',
          lovedSeriesIds: [1],
          likedSeriesIds: [],
          dislikedSeriesIds: [],
        },
      ];

      const result = promptBuilder.build(participantRatings, [], [], [], seriesInfoMap, 'Test Room', undefined);

      // When overview is empty, the summary will be just empty
      expect(result).toContain('Summary:');
      expect(result).toContain('Breaking Bad');
    });

    it('formats rating with one decimal place', () => {
      const seriesInfoMap = new Map([
        [1, createSeriesInfo(1, 'Breaking Bad', 'Great show.', ['Drama'], 9.5432)],
        [2, createSeriesInfo(2, 'The Wire', 'Another great show.', ['Drama'], 8.0)],
      ]);

      const participantRatings = [
        {
          participantId: 'user1',
          lovedSeriesIds: [1, 2],
          likedSeriesIds: [],
          dislikedSeriesIds: [],
        },
      ];

      const result = promptBuilder.build(participantRatings, [], [], [], seriesInfoMap, 'Test Room', undefined);

      expect(result).toContain('Rating: 9.5/10');
      expect(result).toContain('Rating: 8.0/10');
      expect(result).not.toContain('9.5432');
    });

    it('handles participant with only loved series', () => {
      const seriesInfoMap = new Map([[1, createSeriesInfo(1, 'Breaking Bad', 'Great show.', ['Drama'], 9.5)]]);

      const participantRatings = [
        {
          participantId: 'user1',
          lovedSeriesIds: [1],
          likedSeriesIds: [],
          dislikedSeriesIds: [],
        },
      ];

      const result = promptBuilder.build(participantRatings, [], [], [], seriesInfoMap, 'Test Room', undefined);

      expect(result).toContain('❤️ LOVED (HIGHEST PRIORITY - Core preferences):');
      expect(result).not.toContain('👍 LIKED (Secondary preferences):');
    });

    it('handles participant with only liked series', () => {
      const seriesInfoMap = new Map([[1, createSeriesInfo(1, 'The Office', 'Comedy show.', ['Comedy'], 8.9)]]);

      const participantRatings = [
        {
          participantId: 'user1',
          lovedSeriesIds: [],
          likedSeriesIds: [1],
          dislikedSeriesIds: [],
        },
      ];

      const result = promptBuilder.build(participantRatings, [], [], [], seriesInfoMap, 'Test Room', undefined);

      expect(result).not.toContain('❤️ LOVED (HIGHEST PRIORITY - Core preferences):');
      expect(result).toContain('👍 LIKED (Secondary preferences):');
    });

    it('skips series info that is not found in map', () => {
      const seriesInfoMap = new Map([[1, createSeriesInfo(1, 'Breaking Bad', 'Great show.', ['Drama'], 9.5)]]);

      const participantRatings = [
        {
          participantId: 'user1',
          lovedSeriesIds: [1, 999], // 999 not in map
          likedSeriesIds: [888], // 888 not in map
          dislikedSeriesIds: [],
        },
      ];

      const result = promptBuilder.build(participantRatings, [], [], [], seriesInfoMap, 'Test Room', undefined);

      expect(result).toContain('Breaking Bad');
      expect(result).not.toContain('999');
      expect(result).not.toContain('888');
    });

    it('maintains proper section order', () => {
      const seriesInfoMap = new Map([
        [1, createSeriesInfo(1, 'Breaking Bad', 'Great show.', ['Drama'], 9.5)],
        [2, createSeriesInfo(2, 'Friends', 'Comedy show.', ['Comedy'], 8.9)],
      ]);

      const participantRatings = [
        {
          participantId: 'user1',
          lovedSeriesIds: [1],
          likedSeriesIds: [],
          dislikedSeriesIds: [],
        },
      ];

      const result = promptBuilder.build(participantRatings, [2], [], [], seriesInfoMap, 'Test Room', 'A description');

      const watchRoomIndex = result.indexOf('WATCH ROOM:');
      const participantsIndex = result.indexOf('PARTICIPANTS AND THEIR SERIES PREFERENCES:');
      const ignoredIndex = result.indexOf('SERIES MARKED AS NOT INTERESTED:');
      const taskIndex = result.indexOf('TASK:');

      expect(watchRoomIndex).toBeLessThan(participantsIndex);
      expect(participantsIndex).toBeLessThan(ignoredIndex);
      expect(ignoredIndex).toBeLessThan(taskIndex);
    });
  });
});
