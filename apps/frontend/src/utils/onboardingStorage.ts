const ONBOARDING_STORAGE_KEY_PREFIX = 'showsync_onboarding';

interface OnboardingState {
  hasCompletedQuickStart: boolean;
  completedAt?: string;
}

function getStorageKey(userId: string): string {
  return `${ONBOARDING_STORAGE_KEY_PREFIX}_${userId}`;
}

export const onboardingStorage = {
  get(userId: string): OnboardingState {
    try {
      const stored = localStorage.getItem(getStorageKey(userId));
      if (!stored) {
        return {
          hasCompletedQuickStart: false,
        };
      }
      return JSON.parse(stored) as OnboardingState;
    } catch {
      return {
        hasCompletedQuickStart: false,
      };
    }
  },

  markAsCompleted(userId: string): void {
    const updated: OnboardingState = {
      hasCompletedQuickStart: true,
      completedAt: new Date().toISOString(),
    };
    localStorage.setItem(getStorageKey(userId), JSON.stringify(updated));
  },

  reset(userId: string): void {
    localStorage.removeItem(getStorageKey(userId));
  },

  shouldShowQuickStart(userId: string, totalRatings: number): boolean {
    const state = this.get(userId);

    return !state.hasCompletedQuickStart && totalRatings <= 4;
  },
};
