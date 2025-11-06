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
import { SERIES_THRESHOLDS } from '../config/seriesThresholds';

export default function DashboardPage() {
  const { userDataInitialized } = useContext(AuthContext);
  const { lovedCount, likedCount, totalCount } = useContext(SeriesContext);
  const navigate = useNavigate();
  const [lockedDialogOpen, setLockedDialogOpen] = useState(false);

  const canCreateRoom =
    totalCount >= SERIES_THRESHOLDS.MIN_TOTAL_FOR_ROOM && lovedCount >= SERIES_THRESHOLDS.MIN_LOVED_FOR_ROOM;

  // Derived values used for display
  const toReachGoodAccuracy = Math.max(SERIES_THRESHOLDS.GOOD_ACCURACY - totalCount, 0);
  const toReachMaxAccuracy = Math.max(SERIES_THRESHOLDS.MAX_ACCURACY - totalCount, 0);

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
                            {totalCount}/{SERIES_THRESHOLDS.MAX_ACCURACY}
                          </div>
                        </div>
                        <div
                          className="w-full rounded-full h-3 bg-gray-200 dark:bg-gray-700 border border-black/5 dark:border-white/10 overflow-hidden"
                          role="progressbar"
                          aria-label="Taste profile progress"
                          aria-valuemin={0}
                          aria-valuemax={SERIES_THRESHOLDS.MAX_ACCURACY}
                          aria-valuenow={totalCount}
                        >
                          <div
                            className={`h-3 rounded-full transition-all duration-500 motion-reduce:transition-none ${
                              totalCount < SERIES_THRESHOLDS.GOOD_ACCURACY
                                ? 'bg-linear-to-r from-amber-500 to-amber-400'
                                : totalCount < SERIES_THRESHOLDS.MAX_ACCURACY
                                  ? 'bg-linear-to-r from-violet-500 to-purple-400'
                                  : 'bg-linear-to-r from-emerald-500 to-emerald-400'
                            }`}
                            style={{
                              width: `${Math.min((totalCount / SERIES_THRESHOLDS.MAX_ACCURACY) * 100, 100)}%`,
                            }}
                          />
                        </div>
                        <div className="flex items-center justify-center gap-1.5">
                          {totalCount < SERIES_THRESHOLDS.GOOD_ACCURACY ? (
                            <span className="text-xs text-muted-foreground">
                              Rate {toReachGoodAccuracy} more series for good accuracy
                            </span>
                          ) : totalCount < SERIES_THRESHOLDS.MAX_ACCURACY ? (
                            <span className="text-xs text-violet-600 dark:text-violet-400 font-medium flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              Good accuracy • Rate {toReachMaxAccuracy} more series for max
                            </span>
                          ) : (
                            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              Max accuracy unlocked
                              {totalCount > SERIES_THRESHOLDS.MAX_ACCURACY &&
                                ` • +${totalCount - SERIES_THRESHOLDS.MAX_ACCURACY} bonus`}
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
                                lovedCount >= SERIES_THRESHOLDS.MIN_LOVED_SETUP
                                  ? 'bg-emerald-500 text-white'
                                  : 'bg-background text-muted-foreground border-2 border-border'
                              }`}
                            >
                              {lovedCount >= SERIES_THRESHOLDS.MIN_LOVED_SETUP ? (
                                <Check className="w-3.5 h-3.5" />
                              ) : (
                                '1'
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="text-sm font-medium text-foreground">
                                Love {SERIES_THRESHOLDS.MIN_LOVED_SETUP} series
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {Math.min(lovedCount, SERIES_THRESHOLDS.MIN_LOVED_SETUP)}/
                                {SERIES_THRESHOLDS.MIN_LOVED_SETUP} completed
                              </div>
                            </div>
                            {lovedCount >= SERIES_THRESHOLDS.MIN_LOVED_SETUP && (
                              <span className="text-emerald-600 dark:text-emerald-400 text-xs font-medium">Done!</span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
                            <div
                              className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                likedCount >= SERIES_THRESHOLDS.MIN_LIKED_SETUP
                                  ? 'bg-emerald-500 text-white'
                                  : 'bg-background text-muted-foreground border-2 border-border'
                              }`}
                            >
                              {likedCount >= SERIES_THRESHOLDS.MIN_LIKED_SETUP ? (
                                <Check className="w-3.5 h-3.5" />
                              ) : (
                                '2'
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="text-sm font-medium text-foreground">
                                Like {SERIES_THRESHOLDS.MIN_LIKED_SETUP} series
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {Math.min(likedCount, SERIES_THRESHOLDS.MIN_LIKED_SETUP)}/
                                {SERIES_THRESHOLDS.MIN_LIKED_SETUP} completed
                              </div>
                            </div>
                            {likedCount >= SERIES_THRESHOLDS.MIN_LIKED_SETUP && (
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
                  lovedCount >= SERIES_THRESHOLDS.MIN_LOVED_FOR_ROOM
                    ? 'bg-emerald-500 text-white'
                    : 'bg-muted text-muted-foreground border border-border'
                }`}
              >
                {lovedCount >= SERIES_THRESHOLDS.MIN_LOVED_FOR_ROOM ? <Check className="w-3 h-3" /> : '1'}
              </span>
              <span>
                Love {SERIES_THRESHOLDS.MIN_LOVED_FOR_ROOM} series (
                {Math.min(lovedCount, SERIES_THRESHOLDS.MIN_LOVED_FOR_ROOM)}/{SERIES_THRESHOLDS.MIN_LOVED_FOR_ROOM})
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span
                className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                  totalCount >= SERIES_THRESHOLDS.MIN_TOTAL_FOR_ROOM
                    ? 'bg-emerald-500 text-white'
                    : 'bg-muted text-muted-foreground border border-border'
                }`}
              >
                {totalCount >= SERIES_THRESHOLDS.MIN_TOTAL_FOR_ROOM ? <Check className="w-3 h-3" /> : '2'}
              </span>
              <span>
                Rate {SERIES_THRESHOLDS.MIN_TOTAL_FOR_ROOM} total series (
                {Math.min(totalCount, SERIES_THRESHOLDS.MIN_TOTAL_FOR_ROOM)}/{SERIES_THRESHOLDS.MIN_TOTAL_FOR_ROOM})
              </span>
            </div>
            <div className="pt-2 border-t border-border">
              <p className="text-xs text-muted-foreground">
                💡 For better recommendations, aim for {SERIES_THRESHOLDS.GOOD_ACCURACY}+ rated series with{' '}
                {SERIES_THRESHOLDS.MIN_LOVED_SETUP} loved!
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
