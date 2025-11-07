import { PromptSanitizer } from '../../../../common/sanitization/promptSanitizer.ts';

interface SeriesInfo {
  readonly tmdbId: number;
  readonly name: string;
  readonly overview: string;
  readonly genres: string[];
  readonly voteAverage: number;
  readonly firstAirDate: string | null;
}

interface ParticipantFavorites {
  readonly participantId: string;
  readonly lovedSeriesIds: number[];
  readonly likedSeriesIds: number[];
}

export class RecommendationPromptBuilder {
  public build(
    participantFavorites: ParticipantFavorites[],
    ignoredSeriesIds: number[],
    seriesInfoMap: Map<number, SeriesInfo>,
    watchroomName: string,
    watchroomDescription: string | undefined,
  ): string {
    const sections = [
      this.buildWatchroomSection(watchroomName, watchroomDescription),
      this.buildParticipantsSection(participantFavorites, seriesInfoMap),
      this.buildIgnoredSection(ignoredSeriesIds, seriesInfoMap),
      this.buildTaskSection(),
    ];

    return sections.filter(Boolean).join('\n');
  }

  private buildWatchroomSection(watchroomName: string, watchroomDescription: string | undefined): string {
    // Sanitize user input to prevent prompt injection
    const safeName = PromptSanitizer.sanitizeForPrompt(watchroomName);
    let section = `WATCH ROOM: "${safeName}"\n`;

    if (watchroomDescription) {
      const safeDescription = PromptSanitizer.sanitizeForPrompt(watchroomDescription);
      section += `Description: ${safeDescription}\n`;
      section += `Use this description to understand the group's overall vibe and preferences.\n`;
    }

    return section + `\n---\n`;
  }

  private buildParticipantsSection(
    participantFavorites: ParticipantFavorites[],
    seriesInfoMap: Map<number, SeriesInfo>,
  ): string {
    const participantsWithFavorites = participantFavorites.filter(
      (p) => p.lovedSeriesIds.length > 0 || p.likedSeriesIds.length > 0,
    );

    let section = `PARTICIPANTS AND THEIR SERIES PREFERENCES:\n`;
    section += `These series are ALREADY WATCHED. DO NOT recommend any of these.\n`;
    section += `Pay special attention to LOVED series - these represent the strongest preferences.\n\n`;

    participantsWithFavorites.forEach((participant, index) => {
      section += `Participant ${(index + 1).toString()}:\n\n`;

      if (participant.lovedSeriesIds.length > 0) {
        section += this.buildLovedSeriesSection(participant.lovedSeriesIds, seriesInfoMap);
      }

      if (participant.likedSeriesIds.length > 0) {
        section += this.buildLikedSeriesSection(participant.likedSeriesIds, seriesInfoMap);
      }

      section += '\n';
    });

    return section;
  }

  private buildLovedSeriesSection(lovedSeriesIds: number[], seriesInfoMap: Map<number, SeriesInfo>): string {
    let section = `  ❤️ LOVED (HIGHEST PRIORITY - Core preferences):\n`;

    lovedSeriesIds.forEach((tmdbId) => {
      const seriesInfo = seriesInfoMap.get(tmdbId);
      if (seriesInfo) {
        const summary = this.extractFirstSentence(seriesInfo.overview);
        section += `  - ${seriesInfo.name}\n`;
        section += `    Genres: ${seriesInfo.genres.join(', ')}\n`;
        section += `    Summary: ${summary}\n`;
        section += `    Rating: ${seriesInfo.voteAverage.toFixed(1)}/10\n`;
      }
    });

    return section + '\n';
  }

  private buildLikedSeriesSection(likedSeriesIds: number[], seriesInfoMap: Map<number, SeriesInfo>): string {
    let section = `  👍 LIKED (Secondary preferences):\n`;

    likedSeriesIds.forEach((tmdbId) => {
      const seriesInfo = seriesInfoMap.get(tmdbId);
      if (seriesInfo) {
        section += `  - ${seriesInfo.name} (${seriesInfo.genres.join(', ')})\n`;
      }
    });

    return section + '\n';
  }

  private buildIgnoredSection(ignoredSeriesIds: number[], seriesInfoMap: Map<number, SeriesInfo>): string {
    if (ignoredSeriesIds.length === 0) {
      return '';
    }

    const ignoredNames: string[] = [];
    for (const tmdbId of ignoredSeriesIds) {
      const seriesInfo = seriesInfoMap.get(tmdbId);
      if (seriesInfo) {
        ignoredNames.push(seriesInfo.name);
      }
    }

    if (ignoredNames.length === 0) {
      return '';
    }

    let section = `\n---\n`;
    section += `SERIES MARKED AS NOT INTERESTED:\n`;
    section += `These series are explicitly NOT wanted. DO NOT recommend any of these.\n`;
    section += `${ignoredNames.join(', ')}\n`;
    section += `\n---\n`;

    return section;
  }

  private buildTaskSection(): string {
    return (
      `TASK:\n` +
      `Recommend 5-10 BRAND NEW TV series that this group would likely enjoy watching together.\n` +
      `\n` +
      `CRITICAL REQUIREMENTS:\n` +
      `1. Do NOT include ANY series from the "FAVORITE SERIES" lists above\n` +
      `2. Do NOT include ANY series from the "NOT INTERESTED" list above\n` +
      `3. Only recommend series that are DIFFERENT from those already listed\n` +
      `4. Focus on finding series that reflect shared themes, genres, tones, or storytelling styles\n` +
      `5. Return the EXACT TITLE of each series as it appears in TMDB (The Movie Database)\n` +
      `6. Provide a brief justification for each recommendation explaining why it fits the group's taste\n` +
      `\n` +
      `RECOMMENDATION STRATEGY:\n` +
      `1. PRIORITIZE finding series similar to ❤️ LOVED series - these are the strongest signals\n` +
      `2. Use 👍 LIKED series as secondary signals to understand broader taste\n` +
      `3. Look for thematic overlaps in LOVED series across participants\n` +
      `4. When multiple participants LOVE similar genres/themes, that's a very strong signal\n` +
      `5. LIKED series help understand edge cases but shouldn't dominate recommendations\n` +
      `\n` +
      `Remember: The goal is to find NEW series, not to repeat what they already know or dislike.`
    );
  }

  private extractFirstSentence(text: string): string {
    const firstSentence = text.split(/[.!?]/)[0];
    return firstSentence ? firstSentence + '.' : '';
  }
}
