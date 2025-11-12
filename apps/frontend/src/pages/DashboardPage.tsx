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
import { Heart, Tv, Check, Lock } from 'lucide-react';
import { config } from '../config';
import { useSEO } from '../hooks/useSEO';

export default function DashboardPage() {
  useSEO({
    title: 'Dashboard - ShowSync',
    description: 'Your personal ShowSync dashboard. View your show ratings and create watch rooms.',
    noindex: true, // Private page, don't index
  });

  const { userDataInitialized } = useContext(AuthContext);
  const { lovedCount, likedCount, totalCount } = useContext(SeriesContext);
  const navigate = useNavigate();
  const [lockedDialogOpen, setLockedDialogOpen] = useState(false);

  const canCreateRoom = totalCount >= config.series.minTotalForRoom && lovedCount >= config.series.minLovedForRoom;

  // Derived values used for display
  const toReachGoodAccuracy = Math.max(config.series.goodAccuracy - totalCount, 0);
  const toReachMaxAccuracy = Math.max(config.series.maxAccuracy - totalCount, 0);

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
              <div className="text-center">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-4 tracking-tight leading-[1.1]">
                  Your ShowSync Dashboard
                </h1>
                <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                  Rate shows to build your taste profile, then create watch rooms to get personalized recommendations
                </p>
              </div>

              {/* Main Actions Section */}
              {userDataInitialized ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                  {/* Card 1: Your Profile / Match Power */}
                  <Card className="flex flex-col h-full border-2 hover:border-primary/50 hover:shadow-lg transition-all duration-300">
                    <CardHeader>
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary/10 rounded-lg">
                          <Heart
                            className="h-6 w-6 text-primary"
                            aria-hidden="true"
                          />
                        </div>
                        <div>
                          <CardTitle className="text-xl font-semibold">Build Your Taste Profile</CardTitle>
                          <CardDescription className="text-sm">The more you rate, the better your recommendations</CardDescription>
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
                        <div
                          className="w-full rounded-full h-3 bg-gray-200 dark:bg-gray-700 border border-black/5 dark:border-white/10 overflow-hidden"
                          role="progressbar"
                          aria-label="Taste profile progress"
                          aria-valuemin={0}
                          aria-valuemax={config.series.maxAccuracy}
                          aria-valuenow={totalCount}
                        >
                          <div
                            className={`h-3 rounded-full transition-all duration-500 motion-reduce:transition-none ${
                              totalCount < config.series.goodAccuracy
                                ? 'bg-linear-to-r from-amber-500 to-amber-400'
                                : totalCount < config.series.maxAccuracy
                                  ? 'bg-linear-to-r from-violet-500 to-purple-400'
                                  : 'bg-linear-to-r from-emerald-500 to-emerald-400'
                            }`}
                            style={{
                              width: `${Math.min((totalCount / config.series.maxAccuracy) * 100, 100)}%`,
                            }}
                          />
                        </div>
                        <div className="flex items-center justify-center gap-1.5">
                          {totalCount < config.series.goodAccuracy ? (
                            <span className="text-xs text-muted-foreground">
                              Rate {toReachGoodAccuracy} more {toReachGoodAccuracy === 1 ? 'show' : 'shows'} for good recommendations
                            </span>
                          ) : totalCount < config.series.maxAccuracy ? (
                            <span className="text-xs text-violet-600 dark:text-violet-400 font-medium flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              Good recommendations • Rate {toReachMaxAccuracy} more for best results
                            </span>
                          ) : (
                            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              Best recommendations unlocked
                              {totalCount > config.series.maxAccuracy &&
                                ` • +${totalCount - config.series.maxAccuracy} extra`}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Setup Requirements */}
                      <div className="space-y-3">
                        <div className="text-sm font-medium text-foreground">Quick Start Checklist:</div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 transition-colors hover:bg-muted/50">
                            <div
                              className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                                lovedCount >= config.series.minLovedSetup
                                  ? 'bg-emerald-500 text-white'
                                  : 'bg-background text-muted-foreground border-2 border-border'
                              }`}
                            >
                              {lovedCount >= config.series.minLovedSetup ? <Check className="w-3.5 h-3.5" /> : '1'}
                            </div>
                            <div className="flex-1">
                              <div className="text-sm font-medium text-foreground">
                                Love {config.series.minLovedSetup} shows
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {Math.min(lovedCount, config.series.minLovedSetup)}/{config.series.minLovedSetup} completed
                              </div>
                            </div>
                            {lovedCount >= config.series.minLovedSetup && (
                              <span className="text-emerald-600 dark:text-emerald-400 text-xs font-semibold">✓ Done</span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 transition-colors hover:bg-muted/50">
                            <div
                              className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                                likedCount >= config.series.minLikedSetup
                                  ? 'bg-emerald-500 text-white'
                                  : 'bg-background text-muted-foreground border-2 border-border'
                              }`}
                            >
                              {likedCount >= config.series.minLikedSetup ? <Check className="w-3.5 h-3.5" /> : '2'}
                            </div>
                            <div className="flex-1">
                              <div className="text-sm font-medium text-foreground">
                                Like {config.series.minLikedSetup} shows
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {Math.min(likedCount, config.series.minLikedSetup)}/{config.series.minLikedSetup} completed
                              </div>
                            </div>
                            {likedCount >= config.series.minLikedSetup && (
                              <span className="text-emerald-600 dark:text-emerald-400 text-xs font-semibold">✓ Done</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button
                        className="w-full h-12 font-semibold hover:scale-[1.02] transition-all"
                        size="lg"
                        onClick={() => navigate('/series')}
                        data-testid="rate-more-series-button"
                      >
                        {totalCount === 0 ? 'Start Rating Shows' : 'Rate More Shows'}
                      </Button>
                    </CardFooter>
                  </Card>

                  {/* Card 2: Create a Watch Room */}
                  <Card className="flex flex-col h-full border-2 hover:border-primary/50 hover:shadow-lg transition-all duration-300">
                    <CardHeader>
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary/10 rounded-lg">
                          <Tv
                            className="h-6 w-6 text-primary"
                            aria-hidden="true"
                          />
                        </div>
                        <div>
                          <CardTitle className="text-xl font-semibold">Create a Watch Room</CardTitle>
                          <CardDescription className="text-sm">Get personalized recommendations for your group</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="grow space-y-6">
                      {/* Desktop: keep expanded */}
                      <div className="space-y-4 hidden sm:block">
                        <p className="text-sm font-medium text-foreground">How it works:</p>
                        <ul className="space-y-3 text-sm">
                          <li className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors">
                            <span className="shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary font-bold text-xs">
                              1
                            </span>
                            <div>
                              <p className="font-medium text-foreground">Create your room</p>
                              <p className="text-xs text-muted-foreground leading-relaxed">Get a shareable link instantly</p>
                            </div>
                          </li>
                          <li className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors">
                            <span className="shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary font-bold text-xs">
                              2
                            </span>
                            <div>
                              <p className="font-medium text-foreground">Invite friends</p>
                              <p className="text-xs text-muted-foreground leading-relaxed">They join and rate their favorite shows</p>
                            </div>
                          </li>
                          <li className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors">
                            <span className="shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary font-bold text-xs">
                              3
                            </span>
                            <div>
                              <p className="font-medium text-foreground">Get matched</p>
                              <p className="text-xs text-muted-foreground leading-relaxed">Discover shows everyone will love</p>
                            </div>
                          </li>
                        </ul>
                      </div>
                      {/* Mobile: collapsed disclosure */}
                      <details className="sm:hidden group">
                        <summary className="cursor-pointer text-sm font-medium text-foreground list-none flex items-center gap-2">
                          <span className="text-primary">→</span> How it works
                        </summary>
                        <ul className="mt-3 space-y-3 text-sm">
                          <li className="flex items-start gap-3 p-2 rounded-lg bg-muted/30">
                            <span className="shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary font-bold text-xs">
                              1
                            </span>
                            <div>
                              <p className="font-medium text-foreground">Create your room</p>
                              <p className="text-xs text-muted-foreground leading-relaxed">Get a shareable link instantly</p>
                            </div>
                          </li>
                          <li className="flex items-start gap-3 p-2 rounded-lg bg-muted/30">
                            <span className="shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary font-bold text-xs">
                              2
                            </span>
                            <div>
                              <p className="font-medium text-foreground">Invite friends</p>
                              <p className="text-xs text-muted-foreground leading-relaxed">They join and rate their favorite shows</p>
                            </div>
                          </li>
                          <li className="flex items-start gap-3 p-2 rounded-lg bg-muted/30">
                            <span className="shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary font-bold text-xs">
                              3
                            </span>
                            <div>
                              <p className="font-medium text-foreground">Get matched</p>
                              <p className="text-xs text-muted-foreground leading-relaxed">Discover shows everyone will love</p>
                            </div>
                          </li>
                        </ul>
                      </details>

                      <div className="pt-4 border-t border-border">
                        <p className="text-xs text-muted-foreground flex items-start gap-2 leading-relaxed">
                          <span className="text-base">💡</span>
                          <span><strong className="text-foreground">Pro tip:</strong> Create a room just for yourself—no sharing required!</span>
                        </p>
                      </div>
                    </CardContent>
                    <CardFooter className="flex flex-col items-start gap-3 w-full">
                      <div className="w-full">
                        <Button
                          className="w-full h-12 font-semibold hover:scale-[1.02] transition-all"
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
                            'Create Watch Room'
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
            <DialogTitle className="text-2xl">Almost there!</DialogTitle>
            <DialogDescription className="text-base">Rate a few more shows to unlock watch rooms and start getting recommendations.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
              <span
                className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  lovedCount >= config.series.minLovedForRoom
                    ? 'bg-emerald-500 text-white'
                    : 'bg-muted text-muted-foreground border-2 border-border'
                }`}
              >
                {lovedCount >= config.series.minLovedForRoom ? <Check className="w-3 h-3" /> : '1'}
              </span>
              <div className="flex-1">
                <div className="text-sm font-medium text-foreground">
                  Love {config.series.minLovedForRoom} shows
                </div>
                <div className="text-xs text-muted-foreground">
                  {Math.min(lovedCount, config.series.minLovedForRoom)}/{config.series.minLovedForRoom} completed
                </div>
              </div>
              {lovedCount >= config.series.minLovedForRoom && (
                <span className="text-emerald-600 dark:text-emerald-400 text-xs font-semibold">✓</span>
              )}
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
              <span
                className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  totalCount >= config.series.minTotalForRoom
                    ? 'bg-emerald-500 text-white'
                    : 'bg-muted text-muted-foreground border-2 border-border'
                }`}
              >
                {totalCount >= config.series.minTotalForRoom ? <Check className="w-3 h-3" /> : '2'}
              </span>
              <div className="flex-1">
                <div className="text-sm font-medium text-foreground">
                  Rate {config.series.minTotalForRoom} total shows
                </div>
                <div className="text-xs text-muted-foreground">
                  {Math.min(totalCount, config.series.minTotalForRoom)}/{config.series.minTotalForRoom} completed
                </div>
              </div>
              {totalCount >= config.series.minTotalForRoom && (
                <span className="text-emerald-600 dark:text-emerald-400 text-xs font-semibold">✓</span>
              )}
            </div>
            <div className="pt-3 border-t border-border">
              <p className="text-xs text-muted-foreground flex items-start gap-2 leading-relaxed">
                <span className="text-base">💡</span>
                <span><strong className="text-foreground">Pro tip:</strong> Rating {config.series.goodAccuracy}+ shows gives you the best recommendations!</span>
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
