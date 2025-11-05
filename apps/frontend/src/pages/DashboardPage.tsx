import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { SeriesContext } from '../context/SeriesContext';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../components/ui/Card';
import { Tooltip, TooltipTrigger, TooltipContent } from '../components/ui/Tooltip';
import { Heart, Tv, Check, ThumbsUp } from 'lucide-react';

export default function DashboardPage() {
  const { userDataInitialized } = useContext(AuthContext);
  const { lovedCount, likedCount, totalCount } = useContext(SeriesContext);
  const navigate = useNavigate();

  const MINIMUM_FAVORITE_SERIES = 5;

  const canCreateRoom = totalCount >= MINIMUM_FAVORITE_SERIES;
  const disabledReason = !canCreateRoom
    ? `You need to rate at least ${MINIMUM_FAVORITE_SERIES} series before creating a watch room.`
    : undefined;

  if (!userDataInitialized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="relative overflow-hidden">
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-size-[4rem_4rem]" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="animate-fade-in space-y-12">
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              {/* Card 1: Your Profile / Match Power */}
              <Card className="flex flex-col h-full border-2 transition-shadow hover:shadow-lg hover:border-primary/30">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-full">
                      <Heart className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Build Your Taste Profile</CardTitle>
                      <CardDescription>Your match power grows with every series you rate.</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="grow space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">Match Power</span>
                      <span className="text-sm text-muted-foreground">{totalCount}/10 rated</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                      <div
                        className={`h-2.5 rounded-full transition-all duration-500 ${
                          totalCount < 5 ? 'bg-amber-400' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min((totalCount / 10) * 100, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="space-y-2 pt-2">
                    <p className="text-sm font-medium text-foreground">Next Steps</p>
                    <div className="space-y-3">
                      {/* Step 1: Love 2 series */}
                      <div className="flex items-center gap-3 text-sm">
                        <div
                          className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs transition-all ${
                            lovedCount >= 2
                              ? 'bg-emerald-500 text-white'
                              : 'bg-muted text-muted-foreground border border-border'
                          }`}
                        >
                          {lovedCount >= 2 ? <Check className="w-3 h-3" /> : '1'}
                        </div>
                        <div className="flex-1 min-w-0 flex items-baseline gap-2">
                          <p className={lovedCount >= 2 ? 'text-muted-foreground' : 'text-foreground'}>
                            <Heart className="w-3.5 h-3.5 inline mr-1.5 text-red-500" />
                            Love 2 series
                          </p>
                          <span className="text-xs text-muted-foreground/70">· Your core taste</span>
                        </div>
                      </div>

                      {/* Step 2: Like 3 series */}
                      <div className="flex items-center gap-3 text-sm">
                        <div
                          className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs transition-all ${
                            likedCount >= 3
                              ? 'bg-emerald-500 text-white'
                              : 'bg-muted text-muted-foreground border border-border'
                          }`}
                        >
                          {likedCount >= 3 ? <Check className="w-3 h-3" /> : '2'}
                        </div>
                        <div className="flex-1 min-w-0 flex items-baseline gap-2">
                          <p className={likedCount >= 3 ? 'text-muted-foreground' : 'text-foreground'}>
                            <ThumbsUp className="w-3.5 h-3.5 inline mr-1.5 text-blue-500" />
                            Like 3 series
                          </p>
                          <span className="text-xs text-muted-foreground/70">· Expand preferences</span>
                        </div>
                      </div>

                      {/* Step 3: Rate 10 total */}
                      <div className="flex items-center gap-3 text-sm">
                        <div
                          className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs transition-all ${
                            totalCount >= 10
                              ? 'bg-emerald-500 text-white'
                              : 'bg-muted text-muted-foreground border border-border'
                          }`}
                        >
                          {totalCount >= 10 ? <Check className="w-3 h-3" /> : '3'}
                        </div>
                        <div className="flex-1 min-w-0 flex items-baseline gap-2">
                          <p className={totalCount >= 10 ? 'text-muted-foreground' : 'text-foreground'}>
                            Rate 10 total
                          </p>
                          <span className="text-xs text-muted-foreground/70">· Maximize AI accuracy</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={() => navigate('/series')}
                    data-testid="rate-more-series-button"
                  >
                    {totalCount === 0 ? 'Start Rating' : 'Rate Series'}
                  </Button>
                </CardFooter>
              </Card>

              {/* Card 2: Create a Watch Room */}
              <Card className="flex flex-col h-full border-2 transition-shadow hover:shadow-lg hover:border-primary/30">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-full">
                      <Tv className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Create a Watch Room</CardTitle>
                      <CardDescription>Get AI-powered recommendations together.</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="grow space-y-6">
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-foreground">How it works:</p>
                    <ul className="space-y-3 text-sm text-muted-foreground">
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
                          <p className="font-medium text-foreground">Get AI matches</p>
                          <p className="text-xs text-muted-foreground">Based on everyone's favorite series</p>
                        </div>
                      </li>
                    </ul>
                  </div>

                  <div className="pt-3 border-t border-border">
                    <p className="text-xs text-muted-foreground/80 flex items-start gap-1.5">
                      <span className="text-primary">💡</span>
                      <span>You can also generate recommendations for yourself without inviting anyone!</span>
                    </p>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col items-start gap-2 w-full">
                  {!canCreateRoom && disabledReason ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="w-full">
                          <Button
                            className="w-full"
                            onClick={() => navigate('/watchrooms')}
                            disabled={true}
                            size="lg"
                            data-testid="create-room-button"
                          >
                            Create a Watch Room
                          </Button>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p>{disabledReason}</p>
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <Button
                      className="w-full"
                      onClick={() => navigate('/watchrooms')}
                      disabled={false}
                      size="lg"
                      data-testid="create-room-button"
                    >
                      Create a Watch Room
                    </Button>
                  )}
                </CardFooter>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
