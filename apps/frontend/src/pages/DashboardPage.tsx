import { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { SeriesContext } from '../context/SeriesContext';
import { Button } from '../components/ui/Button';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../components/ui/Card';
import { Skeleton } from '../components/ui/Skeleton';
import { Heart, Sparkles, Users, ThumbsUp } from 'lucide-react';
import { config } from '../config';
import { useSEO } from '../hooks/useSEO';
import { QuickStartModal } from '../components/onboarding/QuickStartModal';
import { onboardingStorage } from '../utils/onboardingStorage';

export default function DashboardPage() {
  const { t } = useTranslation();

  useSEO('dashboard');

  const { userData, userDataInitialized } = useContext(AuthContext);
  const { totalCount, lovedCount, likedCount } = useContext(SeriesContext);
  const navigate = useNavigate();
  const [quickStartOpen, setQuickStartOpen] = useState(false);

  // Show QuickStart modal when appropriate
  useEffect(() => {
    if (userDataInitialized && userData && onboardingStorage.shouldShowQuickStart(userData.id, totalCount)) {
      // Small delay for better UX
      const timer = setTimeout(() => {
        setQuickStartOpen(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [userDataInitialized, userData, totalCount]);

  const handleQuickStartComplete = () => {
    if (userData) {
      onboardingStorage.markAsCompleted(userData.id);
    }
    setQuickStartOpen(false);
  };

  const handleQuickStartSkip = () => {
    if (userData) {
      onboardingStorage.markAsCompleted(userData.id);
    }
    setQuickStartOpen(false);
  };

  const canCreateRoom = totalCount >= config.series.minRatedShowsToCreateWatchRoom;

  // Lightweight, card-level skeletons while data initializes (keeps layout stable)
  const renderSkeletons = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
      <Card className="flex flex-col h-full border-2">
        <CardHeader>
          <div className="flex items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-72" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-2.5 w-full" />
          <div className="space-y-3 pt-2">
            <Skeleton className="h-4 w-56" />
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
        </CardContent>
        <CardFooter>
          <Skeleton className="h-10 w-full rounded-md" />
        </CardFooter>
      </Card>

      <Card className="flex flex-col h-full border-2">
        <CardHeader>
          <div className="flex items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-44" />
              <Skeleton className="h-3 w-64" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-4 w-10/12" />
          </div>
          <Skeleton className="h-3 w-full" />
        </CardContent>
        <CardFooter>
          <Skeleton className="h-10 w-full rounded-md" />
        </CardFooter>
      </Card>
    </div>
  );

  return (
    <>
      <div className="min-h-screen bg-background">
        <div className="relative overflow-hidden">
          {/* Subtle grid background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808002_1px,transparent_1px),linear-gradient(to_bottom,#80808002_1px,transparent_1px)] bg-size-[4rem_4rem]" />

          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
            <div className="animate-fade-in space-y-8">
              {/* Welcome Header */}
              {userDataInitialized && userData && (
                <div className="text-center">
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground tracking-tight">
                    {t('dashboard.welcome.greeting', { name: userData.name })}
                  </h1>
                </div>
              )}

              {/* Main Actions Section */}
              {userDataInitialized ? (
                <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                  {/* Card 1: Your Profile / Match Power */}
                  <Card className="flex flex-col h-full border border-border shadow-sm">
                    <CardHeader>
                      <div className="flex items-center gap-4 pb-2">
                        <div className="p-3 bg-primary/10 rounded-lg">
                          <Heart
                            className="h-6 w-6 text-primary"
                            aria-hidden="true"
                          />
                        </div>
                        <div>
                          <CardTitle className="text-xl font-semibold">{t('dashboard.ratingProgress.title')}</CardTitle>
                          <CardDescription className="text-sm">
                            {t('dashboard.ratingProgress.description')}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="grow space-y-6">
                      {totalCount > 0 ? (
                        totalCount < config.series.goodAccuracy ? (
                          /* Progress to good quality */
                          <div className="p-4 rounded-xl bg-muted/30 border border-border">
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold text-foreground">
                                  {t('dashboard.profileQuality.progress')}
                                </span>
                                <span className="text-lg font-bold text-primary">
                                  {totalCount}/{config.series.goodAccuracy}
                                </span>
                              </div>
                              <div className="w-full bg-muted/50 rounded-full h-3 overflow-hidden shadow-inner">
                                <div
                                  className="h-full bg-linear-to-r from-primary to-primary/80 transition-all duration-700 ease-out rounded-full shadow-sm"
                                  style={{ width: `${(totalCount / config.series.goodAccuracy) * 100}%` }}
                                />
                              </div>
                              <p className="text-xs text-muted-foreground text-center">
                                {t('dashboard.profileQuality.motivation', {
                                  count: config.series.goodAccuracy - totalCount,
                                })}
                              </p>
                            </div>
                          </div>
                        ) : (
                          /* Achievement unlocked - elegant stats display */
                          <div className="p-4 rounded-xl bg-muted/30 border border-primary/20">
                            <div className="flex flex-wrap items-center gap-4">
                              <div className="flex items-center gap-2 text-sm">
                                <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                                <span className="font-semibold text-foreground">
                                  {lovedCount} {t('dashboard.stats.loved').toLowerCase()}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <ThumbsUp className="w-4 h-4 text-emerald-500 fill-emerald-500" />
                                <span className="font-semibold text-foreground">
                                  {likedCount} {t('dashboard.stats.liked').toLowerCase()}
                                </span>
                              </div>
                              <div className="px-3 py-0.5 rounded-full bg-primary/10">
                                <span className="flex items-center gap-1.5 text-sm font-semibold text-primary">
                                  <Sparkles className="w-4 h-4" />
                                  {t('dashboard.profileQuality.excellent')}
                                </span>
                              </div>
                            </div>
                          </div>
                        )
                      ) : (
                        <div className="p-6 rounded-xl bg-muted/30 border border-border text-center flex items-center justify-center min-h-[120px]">
                          <p className="text-sm text-foreground font-medium leading-relaxed">
                            {t('dashboard.ratingProgress.emptyDescription', {
                              count: config.series.minRatedShowsToCreateWatchRoom,
                            })}
                          </p>
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="flex flex-col sm:flex-row gap-2">
                      <Button
                        className="flex-1 h-12 font-semibold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md hover:shadow-lg"
                        size="lg"
                        onClick={() => navigate('/series')}
                        data-testid="rate-more-series-button"
                      >
                        {totalCount === 0 ? (
                          <span className="flex items-center gap-2">
                            <Heart className="w-4 h-4" />
                            {t('dashboard.ratingProgress.startButton')}
                          </span>
                        ) : (
                          t('dashboard.ratingProgress.rateMoreButton')
                        )}
                      </Button>
                      {totalCount < config.series.minRatedShowsToCreateWatchRoom && (
                        <button
                          onClick={() => setQuickStartOpen(true)}
                          className="text-sm text-muted-foreground hover:text-foreground hover:underline transition-all flex items-center justify-center gap-1.5 mt-2 cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          {t('dashboard.quickStart.linkSimple')}
                        </button>
                      )}
                    </CardFooter>
                  </Card>

                  {/* Card 2: Create a Watch Room */}
                  <Card className="flex flex-col h-full border border-border shadow-sm">
                    <CardHeader>
                      <div className="flex items-center gap-4 pb-2">
                        <div className="p-3 bg-primary/10 rounded-lg">
                          <Users
                            className="h-6 w-6 text-primary"
                            aria-hidden="true"
                          />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-xl font-semibold">{t('dashboard.watchroom.title')}</CardTitle>
                          <CardDescription className="text-sm">{t('dashboard.watchroom.description')}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="grow space-y-6">
                      {!canCreateRoom && totalCount > 0 && (
                        <div className="p-4 rounded-xl bg-muted/30 border border-border space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-foreground">
                              {t('dashboard.watchroom.progress')}
                            </span>
                            <span className="text-lg font-bold text-primary">
                              {totalCount}/{config.series.minRatedShowsToCreateWatchRoom}
                            </span>
                          </div>
                          <div className="w-full bg-muted/50 rounded-full h-3 overflow-hidden shadow-inner">
                            <div
                              className="h-full bg-linear-to-r from-primary to-primary/80 transition-all duration-700 ease-out rounded-full shadow-sm"
                              style={{ width: `${(totalCount / config.series.minRatedShowsToCreateWatchRoom) * 100}%` }}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground text-center">
                            {t('dashboard.watchroom.unlockHint', {
                              count: config.series.minRatedShowsToCreateWatchRoom - totalCount,
                            })}
                          </p>
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="w-full">
                      <Button
                        className={`w-full h-12 font-semibold transition-all shadow-md ${
                          !canCreateRoom
                            ? 'cursor-not-allowed opacity-60'
                            : 'hover:scale-[1.02] active:scale-[0.98] hover:shadow-lg'
                        }`}
                        onClick={() => navigate('/watchrooms')}
                        size="lg"
                        data-testid="create-room-button"
                        disabled={!canCreateRoom}
                      >
                        <span className="inline-flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          {t('dashboard.watchroom.createButton')}
                        </span>
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
              ) : (
                renderSkeletons()
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Start Modal for onboarding */}
      <QuickStartModal
        open={quickStartOpen}
        onComplete={handleQuickStartComplete}
        onSkip={handleQuickStartSkip}
      />
    </>
  );
}
