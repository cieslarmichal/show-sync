import { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { getMyFavoriteSeries } from '../api/queries/getMyFavoriteSeries';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../components/ui/Card';
import { Tooltip, TooltipTrigger, TooltipContent } from '../components/ui/Tooltip';
import { Heart, Users } from 'lucide-react';

export default function DashboardPage() {
  const { userData, userDataInitialized } = useContext(AuthContext);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const navigate = useNavigate();

  const MINIMUM_FAVORITE_SERIES = 5;

  useEffect(() => {
    const loadFavoritesCount = async () => {
      if (!userData) return;

      try {
        const result = await getMyFavoriteSeries(1, 1);
        setFavoritesCount(result.metadata.total);
      } catch (error) {
        console.error('Failed to load favorites count:', error);
      }
    };

    loadFavoritesCount();
  }, [userData]);

  const canCreateRoom = favoritesCount >= MINIMUM_FAVORITE_SERIES;
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
                Rate your favorite series, create watch rooms, and let AI find the perfect series for your group
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
                      <CardDescription>Your match power grows with every show you rate.</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="grow space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">Match Power</span>
                      <span className="text-sm text-muted-foreground">{favoritesCount}/10 rated</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                      <div
                        className={`h-2.5 rounded-full transition-all duration-500 ${
                          favoritesCount < 5 ? 'bg-amber-400' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min((favoritesCount / 10) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground pt-2">
                    <p>
                      Rate at least <strong>10 series</strong> to unlock the full potential of our AI recommendations.
                    </p>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={() => navigate('/series')}
                    data-testid="rate-more-series-button"
                  >
                    Rate More Series
                  </Button>
                </CardFooter>
              </Card>

              {/* Card 2: Create a Room */}
              <Card className="flex flex-col h-full border-2 transition-shadow hover:shadow-lg hover:border-primary/30">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-full">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Create a Watch Room</CardTitle>
                      <CardDescription>Get AI-powered recommendations for your group.</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="grow space-y-3">
                  <p className="text-sm font-medium text-foreground">How it works:</p>
                  <ul className="space-y-2 text-sm text-muted-foreground list-inside">
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-primary">1.</span>
                      <span>
                        <strong>Create a room</strong> and get a unique shareable link.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-primary">2.</span>
                      <span>
                        <strong>Invite friends</strong> to join with their taste profiles.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-primary">3.</span>
                      <span>
                        <strong>Get AI matches</strong> based on everyone's favorite series.
                      </span>
                    </li>
                  </ul>
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
                            Create a Room
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
                      Create a Room
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
