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
    description: 'Your personal ShowSync dashboard. View your series ratings and create watch rooms.',
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

          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
            <div className="animate-fade-in space-y-10">
              {/* Welcome Section */}
              <div className="text-center">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-4 tracking-tighter">
                  Never argue about what to watch again
                </h1>
                <p className="text-xl sm:text-2xl text-muted-foreground font-light tracking-tight max-w-4xl mx-auto">
                  Rate your favorite series, create watch rooms, and find the perfect TV series for your group
                </p>
              </div>

              {/* Main Actions Section */}
              {userDataInitialized ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                  {/* Card 1: Your Profile / Match Power */}
                  <Card className="flex flex-col h-full border-2 transition-shadow hover:shadow-lg hover:border-primary/30">
                    <CardHeader>
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary/10 rounded-full">
                          <Heart
                            className="h-6 w-6 text-primary"
                            aria-hidden="true"
                          />
                        </div>
                        <div>
                          <CardTitle className="text-xl">Build Your Taste Profile</CardTitle>
                          <CardDescription>Your recommendations get smarter as you rate more series.</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="grow space-y-6">
                      {/* Progress Bar Section */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-semibold text-foreground">Taste profile progress</div>
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
                              Rate {toReachGoodAccuracy} more series for good accuracy
                            </span>
                          ) : totalCount < config.series.maxAccuracy ? (
                            <span className="text-xs text-violet-600 dark:text-violet-400 font-medium flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              Good accuracy • Rate {toReachMaxAccuracy} more series for max
                            </span>
                          ) : (
                            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              Max accuracy unlocked
                              {totalCount > config.series.maxAccuracy &&
                                ` • +${totalCount - config.series.maxAccuracy} bonus`}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Setup Requirements */}
                      <div className="space-y-3 pt-2">
                        <div className="text-sm font-medium text-foreground">Complete your setup:</div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
                            <div
                              className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                lovedCount >= config.series.minLovedSetup
                                  ? 'bg-emerald-500 text-white'
                                  : 'bg-background text-muted-foreground border-2 border-border'
                              }`}
                            >
                              {lovedCount >= config.series.minLovedSetup ? <Check className="w-3.5 h-3.5" /> : '1'}
                            </div>
                            <div className="flex-1">
                              <div className="text-sm font-medium text-foreground">
                                Love {config.series.minLovedSetup} series
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {Math.min(lovedCount, config.series.minLovedSetup)}/{config.series.minLovedSetup}{' '}
                                completed
                              </div>
                            </div>
                            {lovedCount >= config.series.minLovedSetup && (
                              <span className="text-emerald-600 dark:text-emerald-400 text-xs font-medium">Done!</span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
                            <div
                              className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                likedCount >= config.series.minLikedSetup
                                  ? 'bg-emerald-500 text-white'
                                  : 'bg-background text-muted-foreground border-2 border-border'
                              }`}
                            >
                              {likedCount >= config.series.minLikedSetup ? <Check className="w-3.5 h-3.5" /> : '2'}
                            </div>
                            <div className="flex-1">
                              <div className="text-sm font-medium text-foreground">
                                Like {config.series.minLikedSetup} series
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {Math.min(likedCount, config.series.minLikedSetup)}/{config.series.minLikedSetup}{' '}
                                completed
                              </div>
                            </div>
                            {likedCount >= config.series.minLikedSetup && (
                              <span className="text-emerald-600 dark:text-emerald-400 text-xs font-medium">Done!</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button
                        className="w-full py-6"
                        size="lg"
                        onClick={() => navigate('/series')}
                        data-testid="rate-more-series-button"
                      >
                        {totalCount === 0 ? 'Start Rating Series' : 'Continue Rating'}
                      </Button>
                    </CardFooter>
                  </Card>

                  {/* Card 2: Create a Watch Room */}
                  <Card className="flex flex-col h-full border-2 transition-shadow hover:shadow-lg hover:border-primary/30">
                    <CardHeader>
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary/10 rounded-full">
                          <Tv
                            className="h-6 w-6 text-primary"
                            aria-hidden="true"
                          />
                        </div>
                        <div>
                          <CardTitle className="text-xl">Create a Watch Room</CardTitle>
                          <CardDescription>Combine favorites for shared picks.</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="grow space-y-6 mt-1">
                      {/* Desktop: keep expanded */}
                      <div className="space-y-4 hidden sm:block">
                        <p className="text-sm font-medium text-foreground">How it works:</p>
                        <ul className="space-y-4 text-sm text-muted-foreground">
                          <li className="flex items-start gap-3">
                            <span className="shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary font-bold text-xs">
                              1
                            </span>
                            <div>
                              <p className="font-medium text-foreground">Create a watch room</p>
                              <p className="text-xs text-muted-foreground">Get a unique shareable link</p>
                            </div>
                          </li>
                          <li className="flex items-start gap-3">
                            <span className="shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary font-bold text-xs">
                              2
                            </span>
                            <div>
                              <p className="font-medium text-foreground">Invite friends</p>
                              <p className="text-xs text-muted-foreground">Join together for shared recommendations</p>
                            </div>
                          </li>
                          <li className="flex items-start gap-3">
                            <span className="shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary font-bold text-xs">
                              3
                            </span>
                            <div>
                              <p className="font-medium text-foreground">Get recommendations</p>
                              <p className="text-xs text-muted-foreground">Based on everyone's favorite series</p>
                            </div>
                          </li>
                        </ul>
                      </div>
                      {/* Mobile: collapsed disclosure */}
                      <details className="sm:hidden">
                        <summary className="cursor-pointer text-sm font-medium text-foreground">How it works</summary>
                        <ul className="mt-2 space-y-3 text-sm text-muted-foreground">
                          <li className="flex items-start gap-3">
                            <span className="shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary font-bold text-xs">
                              1
                            </span>
                            <div>
                              <p className="font-medium text-foreground">Create a watch room</p>
                              <p className="text-xs text-muted-foreground">Get a unique shareable link</p>
                            </div>
                          </li>
                          <li className="flex items-start gap-3">
                            <span className="shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary font-bold text-xs">
                              2
                            </span>
                            <div>
                              <p className="font-medium text-foreground">Invite friends</p>
                              <p className="text-xs text-muted-foreground">Join together for shared recommendations</p>
                            </div>
                          </li>
                          <li className="flex items-start gap-3">
                            <span className="shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary font-bold text-xs">
                              3
                            </span>
                            <div>
                              <p className="font-medium text-foreground">Get recommendations</p>
                              <p className="text-xs text-muted-foreground">Based on everyone's favorite series</p>
                            </div>
                          </li>
                        </ul>
                      </details>

                      <div className="pt-3 border-t border-border">
                        <p className="text-xs text-muted-foreground/80 flex items-start gap-1.5">
                          <span className="text-primary">💡</span>
                          <span>You can also generate recommendations for yourself without inviting anyone!</span>
                        </p>
                      </div>
                    </CardContent>
                    <CardFooter className="flex flex-col items-start gap-3 w-full pt-2">
                      <div className="w-full">
                        <Button
                          className="w-full py-6"
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
                              Create a Watch Room
                            </span>
                          ) : (
                            'Create a Watch Room'
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
            <DialogTitle>Unlock Watch Rooms</DialogTitle>
            <DialogDescription>
              Complete these requirements to create watch rooms and get recommendations.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <span
                className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                  lovedCount >= config.series.minLovedForRoom
                    ? 'bg-emerald-500 text-white'
                    : 'bg-muted text-muted-foreground border border-border'
                }`}
              >
                {lovedCount >= config.series.minLovedForRoom ? <Check className="w-3 h-3" /> : '1'}
              </span>
              <span>
                Love {config.series.minLovedForRoom} series ({Math.min(lovedCount, config.series.minLovedForRoom)}/
                {config.series.minLovedForRoom})
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span
                className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                  totalCount >= config.series.minTotalForRoom
                    ? 'bg-emerald-500 text-white'
                    : 'bg-muted text-muted-foreground border border-border'
                }`}
              >
                {totalCount >= config.series.minTotalForRoom ? <Check className="w-3 h-3" /> : '2'}
              </span>
              <span>
                Rate {config.series.minTotalForRoom} total series ({Math.min(totalCount, config.series.minTotalForRoom)}
                /{config.series.minTotalForRoom})
              </span>
            </div>
            <div className="pt-2 border-t border-border">
              <p className="text-xs text-muted-foreground">
                💡 For better recommendations, aim for {config.series.goodAccuracy}+ rated series with{' '}
                {config.series.minLovedSetup} loved!
              </p>
            </div>
          </div>
          <DialogFooter className="sm:justify-between">
            <Button
              variant="secondary"
              onClick={() => setLockedDialogOpen(false)}
            >
              Not now
            </Button>
            <Button onClick={() => navigate('/series')}>Rate series</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
