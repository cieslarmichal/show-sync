import { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { SeriesContext } from '../context/SeriesContext';
import { Button } from '../components/ui/Button';
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
import { Progress } from '../components/ui/Progress';
import { ChecklistItem } from '../components/ui/ChecklistItem';
import { Heart, Lock, Sparkles, Users, ArrowRight, Lightbulb, UserPlus } from 'lucide-react';
import { config } from '../config';
import { useSEO } from '../hooks/useSEO';

export default function DashboardPage() {
  useSEO({
    title: 'Dashboard - ShowSync',
    description: 'Your personal ShowSync dashboard. View your show ratings and create watch rooms.',
    noindex: true, // Private page, don't index
  });

  const { userDataInitialized } = useContext(AuthContext);
  const { totalCount } = useContext(SeriesContext);
  const navigate = useNavigate();
  const [lockedDialogOpen, setLockedDialogOpen] = useState(false);

  const canCreateRoom = totalCount >= config.series.minRatedShowsToCreateWatchRoom;

  // Derived values used for display
  const toReachGoodAccuracy = Math.max(config.series.goodAccuracy - totalCount, 0);
  const toReachMaxAccuracy = Math.max(config.series.maxAccuracy - totalCount, 0);

  // Progress milestones for visual markers
  const progressMilestones = [
    {
      value: config.series.goodAccuracy,
      label: 'Good',
      color: 'bg-gradient-to-r from-violet-500 to-purple-400',
    },
    {
      value: config.series.maxAccuracy,
      label: 'Best',
      color: 'bg-gradient-to-r from-emerald-500 to-emerald-400',
    },
  ];

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
                  Your ShowSync Dashboard
                </h1>

                {/* Visual flow indicator - Desktop */}
                <div className="hidden md:flex items-center justify-center gap-3 pt-10">
                  <button
                    onClick={() => navigate('/series')}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 transition-all hover:bg-primary/15 hover:scale-105 cursor-pointer"
                  >
                    <Heart className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">Rate Shows</span>
                  </button>
                  <ArrowRight className="w-5 h-5 text-muted-foreground animate-pulse" />
                  <button
                    onClick={() => (canCreateRoom ? navigate('/watchrooms') : setLockedDialogOpen(true))}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 transition-all hover:bg-primary/15 hover:scale-105 cursor-pointer"
                  >
                    <Users className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">Create Watch Room</span>
                  </button>
                  <ArrowRight className="w-5 h-5 text-muted-foreground animate-pulse" />
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
                    <UserPlus className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">Invite Friends (or not)</span>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground animate-pulse" />
                  <button
                    onClick={() => (canCreateRoom ? navigate('/watchrooms') : setLockedDialogOpen(true))}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-linear-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/30 shadow-sm transition-all hover:shadow-md hover:scale-105 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                    <span className="text-sm font-medium text-violet-700 dark:text-violet-300">
                      Get Recommendations
                    </span>
                  </button>
                </div>

                {/* Visual flow indicator - Mobile (vertical) */}
                <div className="flex md:hidden flex-col items-center gap-2 pt-2">
                  <button
                    onClick={() => navigate('/series')}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 cursor-pointer transition-all hover:bg-primary/15 hover:scale-105"
                  >
                    <Heart className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">Rate Shows</span>
                  </button>
                  <ArrowRight className="w-4 h-4 text-muted-foreground rotate-90 animate-pulse" />
                  <button
                    onClick={() => (canCreateRoom ? navigate('/watchrooms') : setLockedDialogOpen(true))}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 cursor-pointer transition-all hover:bg-primary/15 hover:scale-105"
                  >
                    <Users className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">Create Watch Room</span>
                  </button>
                  <ArrowRight className="w-4 h-4 text-muted-foreground rotate-90 animate-pulse" />
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
                    <UserPlus className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">Invite Friends (or not)</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground rotate-90 animate-pulse" />
                  <button
                    onClick={() => (canCreateRoom ? navigate('/watchrooms') : setLockedDialogOpen(true))}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-linear-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/30 shadow-sm cursor-pointer transition-all hover:shadow-md hover:scale-105"
                  >
                    <Sparkles className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                    <span className="text-sm font-medium text-violet-700 dark:text-violet-300">
                      Get Recommendations
                    </span>
                  </button>
                </div>
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
                          <CardTitle className="text-xl font-semibold">Build Your Profile</CardTitle>
                          <CardDescription className="text-sm">
                            Rate shows you love to get better recommendations
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="grow space-y-6">
                      {/* Progress Bar Section */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-semibold text-foreground">Your Progress</div>
                          <div className="text-sm font-bold text-primary">
                            {totalCount}/{config.series.maxAccuracy}
                          </div>
                        </div>
                        <Progress
                          value={totalCount}
                          max={config.series.maxAccuracy}
                          milestones={progressMilestones}
                          showMilestones={true}
                          className="my-2"
                        />
                        <div className="flex items-center justify-center gap-1.5 pt-2">
                          {totalCount === 0 ? (
                            <div className="text-center space-y-2 py-2">
                              <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
                                <Lightbulb className="w-4 h-4 text-amber-500" />
                                <span className="font-medium text-foreground">Start by rating your first show!</span>
                              </p>
                              <p className="text-xs text-muted-foreground">
                                The more shows you rate, the better your recommendations will be
                              </p>
                            </div>
                          ) : totalCount < config.series.goodAccuracy ? (
                            <span className="text-xs text-muted-foreground">
                              Rate {toReachGoodAccuracy} more {toReachGoodAccuracy === 1 ? 'show' : 'shows'} for good
                              recommendations
                            </span>
                          ) : totalCount < config.series.maxAccuracy ? (
                            <span className="text-xs text-violet-600 dark:text-violet-400 font-medium flex items-center gap-1.5">
                              <Sparkles className="w-3 h-3 animate-pulse" />
                              Good recommendations unlocked • Rate {toReachMaxAccuracy} more for best results
                            </span>
                          ) : (
                            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5">
                              <Sparkles className="w-3 h-3" />
                              Best recommendations unlocked!
                              {totalCount > config.series.maxAccuracy &&
                                ` • +${totalCount - config.series.maxAccuracy} extra`}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Setup Requirements */}
                      <div className="space-y-3">
                        <div className="text-sm font-medium text-foreground">To unlock watch rooms:</div>
                        <ChecklistItem
                          number={1}
                          title={`Rate ${config.series.minRatedShowsToCreateWatchRoom} shows`}
                          subtitle={`${Math.min(totalCount, config.series.minRatedShowsToCreateWatchRoom)}/${config.series.minRatedShowsToCreateWatchRoom} completed`}
                          completed={totalCount >= config.series.minRatedShowsToCreateWatchRoom}
                          onClick={() => navigate('/series')}
                        />
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button
                        className="w-full h-12 font-semibold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md hover:shadow-lg"
                        size="lg"
                        onClick={() => navigate('/series')}
                        data-testid="rate-more-series-button"
                      >
                        {totalCount === 0 ? (
                          <span className="flex items-center gap-2">
                            <Heart className="w-4 h-4" />
                            Start Rating Shows
                          </span>
                        ) : (
                          'Rate More Shows'
                        )}
                      </Button>
                    </CardFooter>
                  </Card>

                  {/* Card 2: Create a Watch Room */}
                  <Card className="flex flex-col h-full border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 relative overflow-hidden">
                    {/* Subtle badge for "recommendations happen here" */}
                    <div className="absolute top-4 right-4 z-10">
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-500/10 dark:bg-violet-400/10 border border-violet-500/20 dark:border-violet-400/20 text-violet-700 dark:text-violet-300 shadow-sm text-xs font-medium animate-fade-in backdrop-blur-sm">
                        <Sparkles className="w-3 h-3" />
                        AI-Powered
                      </div>
                    </div>

                    <CardHeader className="relative pb-3">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-linear-to-br from-primary/10 to-primary/5 rounded-xl shadow-sm">
                          <Users
                            className="h-6 w-6 text-primary"
                            aria-hidden="true"
                          />
                        </div>
                        <div className="flex-1 pr-20">
                          <CardTitle className="text-xl font-semibold">Create a Watch Room</CardTitle>
                          <CardDescription className="text-sm">Find shows everyone will love</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="grow relative pt-1 pb-6">
                      {/* Feature highlights with icons */}
                      <div className="space-y-3.5">
                        <div className="flex items-start gap-3 group">
                          <div className="p-1.5 bg-primary/10 rounded-lg shrink-0 mt-0.5 group-hover:bg-primary/15 transition-colors">
                            <Sparkles className="w-4 h-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-foreground font-semibold leading-snug mb-1">
                              Solo or Group Recommendations
                            </p>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              Generate suggestions for yourself or invite friends
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 group">
                          <div className="p-1.5 bg-primary/10 rounded-lg shrink-0 mt-0.5 group-hover:bg-primary/15 transition-colors">
                            <Heart className="w-4 h-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-foreground font-semibold leading-snug mb-1">
                              Personalized Results
                            </p>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              Skip shows you're not interested in to improve future recommendations
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 group">
                          <div className="p-1.5 bg-primary/10 rounded-lg shrink-0 mt-0.5 group-hover:bg-primary/15 transition-colors">
                            <Lightbulb className="w-4 h-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-foreground font-semibold leading-snug mb-1">
                              Smart Customization
                            </p>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              Adjust room descriptions to get more targeted suggestions
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
                              Create Watch Room
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-2">
                              <Sparkles className="w-4 h-4" />
                              Create Watch Room
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
              <Sparkles className="w-6 h-6 text-primary" />
              Almost there!
            </DialogTitle>
            <DialogDescription className="text-base">
              Just rate a few shows to unlock watch rooms and get AI-powered recommendations!
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <ChecklistItem
              number={1}
              title={`Rate ${config.series.minRatedShowsToCreateWatchRoom} shows`}
              subtitle={`${Math.min(totalCount, config.series.minRatedShowsToCreateWatchRoom)}/${config.series.minRatedShowsToCreateWatchRoom} completed`}
              completed={totalCount >= config.series.minRatedShowsToCreateWatchRoom}
            />
            <div className="pt-3 border-t border-border">
              <p className="text-xs text-muted-foreground flex items-start gap-2 leading-relaxed">
                <span className="text-base">💡</span>
                <span>
                  <strong className="text-foreground">Tip:</strong> Rate {config.series.goodAccuracy}+ shows for even
                  better recommendations!
                </span>
              </p>
            </div>
          </div>
          <DialogFooter className="sm:justify-between gap-3">
            <Button
              variant="secondary"
              onClick={() => setLockedDialogOpen(false)}
              className="w-full sm:w-auto"
            >
              Maybe Later
            </Button>
            <Button
              onClick={() => navigate('/series')}
              className="w-full sm:w-auto"
            >
              Rate Shows Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
