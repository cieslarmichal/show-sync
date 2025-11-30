import { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { SeriesContext } from '../context/SeriesContext';
import { Button } from '../components/ui/Button';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../components/ui/Card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/Dialog';
import { Skeleton } from '../components/ui/Skeleton';
import { Heart, Lock, Sparkles, Users, ThumbsUp } from 'lucide-react';
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
  const [lockedDialogOpen, setLockedDialogOpen] = useState(false);
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
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-size-[4rem_4rem]" />

          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
            <div className="animate-fade-in space-y-12">
              {/* Welcome Section */}
              <div className="text-center space-y-4">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-4 tracking-tight leading-[1.1]">
                  {t('dashboard.title')}
                </h1>
              </div>

              {/* Main Actions Section */}
              {userDataInitialized ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 mt-15">
                  {/* Card 1: Your Profile / Match Power */}
                  <Card className="flex flex-col h-full border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5">
                    <CardHeader>
                      <div className="flex items-center gap-4">
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
                      {/* Statistics Cards */}
                      {totalCount > 0 ? (
                        <div className="grid grid-cols-3 gap-3">
                          <button
                            onClick={() => navigate('/series')}
                            className="p-4 rounded-xl bg-muted/50 hover:bg-muted transition-all hover:scale-105 active:scale-95 cursor-pointer group border border-transparent hover:border-primary/20"
                          >
                            <div className="text-center space-y-1">
                              <div className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors">
                                {totalCount}
                              </div>
                              <div className="text-xs text-muted-foreground font-medium">
                                {t('dashboard.stats.rated')}
                              </div>
                            </div>
                          </button>
                          <button
                            onClick={() => navigate('/series?filter=love')}
                            className="p-4 rounded-xl bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/30 transition-all hover:scale-105 active:scale-95 cursor-pointer group border border-red-200/50 dark:border-red-900/50 hover:border-red-300 dark:hover:border-red-800"
                          >
                            <div className="text-center space-y-1">
                              <div className="flex items-center justify-center gap-1">
                                <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                                  {lovedCount}
                                </div>
                              </div>
                              <div className="text-xs text-red-600 dark:text-red-400 font-medium">
                                {t('dashboard.stats.loved')}
                              </div>
                            </div>
                          </button>
                          <button
                            onClick={() => navigate('/series?filter=like')}
                            className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 hover:bg-emerald-100 dark:hover:bg-emerald-950/30 transition-all hover:scale-105 active:scale-95 cursor-pointer group border border-emerald-200/50 dark:border-emerald-900/50 hover:border-emerald-300 dark:hover:border-emerald-800"
                          >
                            <div className="text-center space-y-1">
                              <div className="flex items-center justify-center gap-1">
                                <ThumbsUp className="w-4 h-4 text-emerald-500 fill-emerald-500" />
                                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                                  {likedCount}
                                </div>
                              </div>
                              <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                                {t('dashboard.stats.liked')}
                              </div>
                            </div>
                          </button>
                        </div>
                      ) : (
                        <div className="text-center py-8 space-y-3">
                          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
                            <Heart className="w-8 h-8 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground mb-1">
                              {t('dashboard.ratingProgress.startRating')}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {t('dashboard.ratingProgress.moreIsBetter')}
                            </p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="flex flex-col gap-2">
                      <Button
                        className="w-full h-12 font-semibold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md hover:shadow-lg"
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
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => setQuickStartOpen(true)}
                        >
                          <span className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4" />
                            {t('dashboard.quickStart.title')}
                          </span>
                        </Button>
                      )}
                    </CardFooter>
                  </Card>

                  {/* Card 2: Create a Watch Room */}
                  <Card className="flex flex-col h-full border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5">
                    <CardHeader>
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-linear-to-br from-primary/10 to-primary/5 rounded-xl shadow-sm">
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
                    <CardContent className="grow space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-start gap-3 group">
                          <div className="p-1.5 bg-primary/10 rounded-lg shrink-0 mt-0.5 group-hover:bg-primary/15 transition-colors">
                            <Sparkles className="w-4 h-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-foreground font-semibold leading-snug mb-1">
                              {t('dashboard.watchroom.feature1Title')}
                            </p>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              {t('dashboard.watchroom.feature1Desc')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 group">
                          <div className="p-1.5 bg-primary/10 rounded-lg shrink-0 mt-0.5 group-hover:bg-primary/15 transition-colors">
                            <Heart className="w-4 h-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-foreground font-semibold leading-snug mb-1">
                              {t('dashboard.watchroom.feature2Title')}
                            </p>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              {t('dashboard.watchroom.feature2Desc')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 group">
                          <div className="p-1.5 bg-primary/10 rounded-lg shrink-0 mt-0.5 group-hover:bg-primary/15 transition-colors">
                            <ThumbsUp className="w-4 h-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-foreground font-semibold leading-snug mb-1">
                              {t('dashboard.watchroom.feature3Title')}
                            </p>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              {t('dashboard.watchroom.feature3Desc')}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex flex-col items-start gap-3 w-full relative">
                      <div className="w-full">
                        <Button
                          className="w-full h-12 font-semibold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md hover:shadow-lg"
                          onClick={() => (canCreateRoom ? navigate('/watchrooms') : setLockedDialogOpen(true))}
                          size="lg"
                          data-testid="create-room-button"
                        >
                          {!canCreateRoom ? (
                            <span className="inline-flex items-center gap-2">
                              <Lock
                                className="w-4 h-4"
                                aria-hidden="true"
                              />
                              {t('dashboard.watchroom.createButton')}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-2">
                              <Sparkles className="w-4 h-4" />
                              {t('dashboard.watchroom.createButton')}
                            </span>
                          )}
                        </Button>
                      </div>
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

      {/* Locked dialog for guidance when watch room is gated */}
      <Dialog
        open={lockedDialogOpen}
        onOpenChange={setLockedDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Lock className="w-6 h-6 text-primary" />
              {t('dashboard.lockedDialog.title')}
            </DialogTitle>
            <DialogDescription className="text-base">{t('dashboard.lockedDialog.description')}</DialogDescription>
          </DialogHeader>
          <div className="text-center py-6">
            <p className="text-muted-foreground mb-3">
              {t('dashboard.lockedDialog.rateShowsMessage', { count: config.series.minRatedShowsToCreateWatchRoom })}
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-lg">
              <Heart className="w-4 h-4 text-primary" />
              <p className="text-2xl font-bold text-foreground">
                {totalCount}<span className="text-muted-foreground">/{config.series.minRatedShowsToCreateWatchRoom}</span>
              </p>
            </div>
          </div>
          <DialogFooter className="sm:justify-between gap-3">
            <Button
              variant="secondary"
              onClick={() => setLockedDialogOpen(false)}
              className="w-full sm:w-auto"
            >
              {t('dashboard.lockedDialog.later')}
            </Button>
            <Button
              onClick={() => navigate('/series')}
              className="w-full sm:w-auto"
            >
              {t('dashboard.lockedDialog.rateNow')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick Start Modal for onboarding */}
      <QuickStartModal
        open={quickStartOpen}
        onComplete={handleQuickStartComplete}
        onSkip={handleQuickStartSkip}
      />
    </>
  );
}
