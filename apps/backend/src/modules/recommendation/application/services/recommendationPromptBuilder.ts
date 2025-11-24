import { PromptSanitizer } from '../../../../common/sanitization/promptSanitizer.ts';

interface SeriesInfo {
  readonly tmdbId: number;
  readonly name: string;
  readonly overview: string;
  readonly genres: string[];
  readonly voteAverage: number;
  readonly firstAirDate: string | null;
}

interface ParticipantRatings {
  readonly participantId: string;
  readonly lovedSeriesIds: number[];
  readonly likedSeriesIds: number[];
  readonly dislikedSeriesIds: number[];
}

export class RecommendationPromptBuilder {
  public build(
    participantRatings: ParticipantRatings[],
    notInterestedSeriesIds: number[],
    dislikedSeriesIds: number[],
    wantToWatchSeriesIds: number[],
    seriesInfoMap: Map<number, SeriesInfo>,
    watchroomName: string,
    watchroomDescription: string | undefined,
  ): string {
    const sections = [
      this.buildWatchroomSection(watchroomName, watchroomDescription),
      this.buildParticipantsSection(participantRatings, seriesInfoMap),
      this.buildNotInterestedSection(notInterestedSeriesIds, seriesInfoMap),
      this.buildDislikedSection(dislikedSeriesIds, seriesInfoMap),
      this.buildWantToWatchSection(wantToWatchSeriesIds, seriesInfoMap),
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
    participantRatings: ParticipantRatings[],
    seriesInfoMap: Map<number, SeriesInfo>,
  ): string {
    const participantsWithRatings = participantRatings.filter(
      (p) => p.lovedSeriesIds.length > 0 || p.likedSeriesIds.length > 0 || p.dislikedSeriesIds.length > 0,
    );

    let section = `PARTICIPANTS AND THEIR SERIES RATINGS:\n`;
    section += `These series are ALREADY WATCHED. DO NOT recommend any of these.\n`;
    section += `Pay special attention to LOVED series - these represent the strongest positive preferences.\n`;
    section += `DISLIKED series show what participants definitely don't enjoy.\n\n`;

    participantsWithRatings.forEach((participant, index) => {
      section += `Participant ${(index + 1).toString()}:\n\n`;

      if (participant.lovedSeriesIds.length > 0) {
        section += this.buildLovedSeriesSection(participant.lovedSeriesIds, seriesInfoMap);
      }

      if (participant.likedSeriesIds.length > 0) {
        section += this.buildLikedSeriesSection(participant.likedSeriesIds, seriesInfoMap);
      }

      if (participant.dislikedSeriesIds.length > 0) {
        section += this.buildDislikedSeriesSection(participant.dislikedSeriesIds, seriesInfoMap);
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

  private buildDislikedSeriesSection(dislikedSeriesIds: number[], seriesInfoMap: Map<number, SeriesInfo>): string {
    let section = `  👎 DISLIKED (Negative preferences - avoid similar themes/styles):\n`;

    dislikedSeriesIds.forEach((tmdbId) => {
      const seriesInfo = seriesInfoMap.get(tmdbId);
      if (seriesInfo) {
        section += `  - ${seriesInfo.name} (${seriesInfo.genres.join(', ')})\n`;
      }
    });

    return section + '\n';
  }

  private buildNotInterestedSection(notInterestedSeriesIds: number[], seriesInfoMap: Map<number, SeriesInfo>): string {
    if (notInterestedSeriesIds.length === 0) {
      return '';
    }

    const notInterestedNames: string[] = [];
    for (const tmdbId of notInterestedSeriesIds) {
      const seriesInfo = seriesInfoMap.get(tmdbId);
      if (seriesInfo) {
        notInterestedNames.push(seriesInfo.name);
      }
    }

    if (notInterestedNames.length === 0) {
      return '';
    }

    let section = `\n---\n`;
    section += `SERIES MARKED AS NOT INTERESTED:\n`;
    section += `These series are explicitly NOT wanted. DO NOT recommend any of these.\n`;
    section += `${notInterestedNames.join(', ')}\n`;

    return section;
  }

  private buildDislikedSection(dislikedSeriesIds: number[], seriesInfoMap: Map<number, SeriesInfo>): string {
    if (dislikedSeriesIds.length === 0) {
      return '';
    }

    const dislikedNames: string[] = [];
    for (const tmdbId of dislikedSeriesIds) {
      const seriesInfo = seriesInfoMap.get(tmdbId);
      if (seriesInfo) {
        dislikedNames.push(seriesInfo.name);
      }
    }

    if (dislikedNames.length === 0) {
      return '';
    }

    let section = `\n---\n`;
    section += `DISLIKED SERIES:\n`;
    section += `These series were actively disliked. DO NOT recommend these or series with similar themes/styles.\n`;
    section += `${dislikedNames.join(', ')}\n`;

    return section;
  }

  private buildWantToWatchSection(wantToWatchSeriesIds: number[], seriesInfoMap: Map<number, SeriesInfo>): string {
    if (wantToWatchSeriesIds.length === 0) {
      return '';
    }

    const wantToWatchNames: string[] = [];
    for (const tmdbId of wantToWatchSeriesIds) {
      const seriesInfo = seriesInfoMap.get(tmdbId);
      if (seriesInfo) {
        wantToWatchNames.push(seriesInfo.name);
      }
    }

    if (wantToWatchNames.length === 0) {
      return '';
    }

    let section = `\n---\n`;
    section += `SERIES ON WATCHLIST (Want to Watch):\n`;
    section += `These series are already on the watchlist to watch. DO NOT recommend these.\n`;
    section += `However, these indicate interest and can help understand preferences.\n`;
    section += `${wantToWatchNames.join(', ')}\n`;

    return section;
  }

  private buildTaskSection(): string {
    return (
      `\n---\n\n` +
      `TASK:\n` +
      `Recommend 5-10 BRAND NEW TV series that this group would likely enjoy watching together.\n` +
      `\n` +
      `CRITICAL REQUIREMENTS:\n` +
      `1. Do NOT include ANY series from the "SERIES RATINGS" lists above\n` +
      `2. Do NOT include ANY series from the "NOT INTERESTED" list above\n` +
      `3. Do NOT include ANY series from the "DISLIKED SERIES" list above\n` +
      `4. Do NOT include ANY series from the "WATCHLIST (Want to Watch)" list above\n` +
      `5. Only recommend series that are DIFFERENT from those already listed\n` +
      `6. Focus on finding series that reflect shared themes, genres, tones, or storytelling styles\n` +
      `7. Return the EXACT TITLE of each series as it appears in TMDB (The Movie Database)\n` +
      `8. Provide a brief justification for each recommendation explaining why it fits the group's taste\n` +
      `\n` +
      `RECOMMENDATION STRATEGY:\n` +
      `1. PRIORITIZE finding series similar to ❤️ LOVED series - these are the strongest positive signals\n` +
      `2. Use 👍 LIKED series as secondary positive signals to understand broader taste\n` +
      `3. AVOID themes/styles/genres similar to 👎 DISLIKED series - these are strong negative signals\n` +
      `4. Consider NOT INTERESTED list as hard exclusions\n` +
      `5. Look for thematic overlaps in LOVED series across participants\n` +
      `6. When multiple participants LOVE similar genres/themes, that's a very strong signal\n` +
      `7. If multiple participants DISLIKE similar content, that's a strong signal to avoid\n` +
      `8. Watchlist items show interest direction but shouldn't be recommended (they're already planned)\n` +
      `\n` +
      `Remember: The goal is to find NEW series that match LOVED preferences while avoiding DISLIKED content.`
    );
  }

  private extractFirstSentence(text: string): string {
    const firstSentence = text.split(/[.!?]/)[0];
    return firstSentence ? firstSentence + '.' : '';
  }
}
