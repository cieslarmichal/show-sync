const ONBOARDING_STORAGE_KEY = 'showsync_onboarding';

interface OnboardingState {
  hasSeenQuickStart: boolean;
  hasCompletedQuickStart: boolean;
  completedAt?: string;
}

export const onboardingStorage = {
  get(): OnboardingState {
    try {
      const stored = localStorage.getItem(ONBOARDING_STORAGE_KEY);
      if (!stored) {
        return {
          hasSeenQuickStart: false,
          hasCompletedQuickStart: false,
        };
      }
      return JSON.parse(stored) as OnboardingState;
    } catch {
      return {
        hasSeenQuickStart: false,
        hasCompletedQuickStart: false,
      };
    }
  },

  markAseen(): void {
    const current = this.get();
    const updated: OnboardingState = {
      ...current,
      hasSeenQuickStart: true,
    };
    localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(updated));
  },

  markAsCompleted(): void {
    const updated: OnboardingState = {
      hasSeenQuickStart: true,
      hasCompletedQuickStart: true,
      completedAt: new Date().toISOString(),
    };
    localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(updated));
  },

  reset(): void {
    localStorage.removeItem(ONBOARDING_STORAGE_KEY);
  },

  shouldShowQuickStart(totalRatings: number): boolean {
    const state = this.get();
    // Show if: not completed AND not seen AND has very few ratings
    return !state.hasCompletedQuickStart && !state.hasSeenQuickStart && totalRatings <= 4;
  },
};
