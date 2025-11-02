import { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Copy,
  Users,
  ArrowLeft,
  UserMinus,
  LogOut,
  Sparkles,
  TvMinimalPlay,
  Trash2,
  Calendar,
  EyeOff,
  ThumbsUp,
  Heart,
  Star,
  ExternalLink,
} from 'lucide-react';

import { AuthContext } from '../context/AuthContext.tsx';
import {
  getWatchroomDetails,
  removeParticipant,
  leaveWatchroom,
  deleteWatchroom,
  generateRecommendations,
  checkRecommendationStatus,
  getRecommendations,
} from '../api/queries/watchroom.ts';
import { getSeriesDetails } from '../api/queries/getSeriesDetails.ts';
import { getSeriesExternalIds } from '../api/queries/getSeriesExternalIds.ts';
import { addIgnoredSeries } from '../api/queries/addIgnoredSeries.ts';
import { getMyIgnoredSeries } from '../api/queries/getMyIgnoredSeries.ts';
import { addFavoriteSeries } from '../api/queries/addFavoriteSeries.ts';
import { getMyFavoriteSeries } from '../api/queries/getMyFavoriteSeries.ts';
import type { WatchroomDetails } from '../api/types/watchroom.ts';
import type { Recommendation } from '../api/types/recommendation.ts';
import type { SeriesDetails } from '../api/types/series.ts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card.tsx';
import { Button } from '../components/ui/Button.tsx';
import { Badge } from '../components/ui/Badge.tsx';
import { Skeleton } from '../components/ui/Skeleton.tsx';
import { EditWatchRoomModal } from '../components/EditWatchRoomModal.tsx';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/Dialog.tsx';

interface RecommendationWithDetails extends Recommendation {
  seriesDetails?: SeriesDetails;
}

export default function WatchRoomDetailsPage() {
  const { watchroomId } = useParams<{ watchroomId: string }>();
  const [room, setRoom] = useState<WatchroomDetails | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [ignoredSeriesIds, setIgnoredSeriesIds] = useState<Set<number>>(new Set());
  const [profileSeriesIds, setProfileSeriesIds] = useState<Set<number>>(new Set());
  const [fadingOutCards, setFadingOutCards] = useState<Set<string>>(new Set());
  const [imageLoadingStates, setImageLoadingStates] = useState<Map<number, boolean>>(new Map());
  const [confirmRemoveDialog, setConfirmRemoveDialog] = useState<{
    open: boolean;
    participantId?: string;
    participantName?: string;
  }>({ open: false });
  const [confirmLeaveDialog, setConfirmLeaveDialog] = useState(false);
  const [confirmDeleteDialog, setConfirmDeleteDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const { userData } = useContext(AuthContext);
  const navigate = useNavigate();

  const fetchRoomDetails = async (id: string) => {
    try {
      setIsLoading(true);
      const fetchedRoom = await getWatchroomDetails(id);
      setRoom(fetchedRoom);
    } catch {
      toast.error('Failed to load watch room details.');
      navigate('/watchrooms');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRecommendations = async (id: string) => {
    try {
      setIsLoadingRecommendations(true);
      const fetchedRecommendations = await getRecommendations(id);

      // Fetch series details for each recommendation
      const recommendationsWithDetails = await Promise.all(
        fetchedRecommendations.map(async (rec) => {
          try {
            const seriesDetails = await getSeriesDetails(rec.seriesTmdbId);
            return { ...rec, seriesDetails };
          } catch {
            // If fetching series details fails, return recommendation without details
            return rec;
          }
        }),
      );

      setRecommendations(recommendationsWithDetails);
    } catch {
      // Silently fail - recommendations might not exist yet
      setRecommendations([]);
    } finally {
      setIsLoadingRecommendations(false);
    }
  };

  useEffect(() => {
    if (watchroomId) {
      fetchRoomDetails(watchroomId);
      fetchRecommendations(watchroomId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchroomId]);

  useEffect(() => {
    const loadIgnoredSeries = async () => {
      try {
        const response = await getMyIgnoredSeries();
        const ignoredIds = new Set(response.data.map((item) => item.seriesTmdbId));
        setIgnoredSeriesIds(ignoredIds);
      } catch (error) {
        console.error('Failed to load ignored series:', error);
      }
    };

    loadIgnoredSeries();
  }, []);

  useEffect(() => {
    const loadFavoriteSeries = async () => {
      try {
        const response = await getMyFavoriteSeries();
        const favoriteIds = new Set(response.data.map((item) => item.seriesTmdbId));
        setProfileSeriesIds(favoriteIds);
      } catch (error) {
        console.error('Failed to load favorite series:', error);
      }
    };

    loadFavoriteSeries();
  }, []);

  const handleCopyLink = () => {
    if (room) {
      const link = `${window.location.origin}/watchrooms/public/${room.publicLinkId}`;
      navigator.clipboard.writeText(link);
      toast.success('Room link copied to clipboard!');
    }
  };

  const handleRemoveParticipant = async () => {
    if (!watchroomId || !confirmRemoveDialog.participantId) {
      return;
    }

    try {
      setIsProcessing(true);
      await removeParticipant(watchroomId, confirmRemoveDialog.participantId);
      toast.success('Participant removed successfully!');
      setConfirmRemoveDialog({ open: false });
      fetchRoomDetails(watchroomId);
    } catch {
      toast.error('Failed to remove participant.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLeaveRoom = async () => {
    if (!watchroomId) {
      return;
    }

    try {
      setIsProcessing(true);
      await leaveWatchroom(watchroomId);
      toast.success('You have left the room.');
      navigate('/watchrooms');
    } catch {
      toast.error('Failed to leave the room.');
      setIsProcessing(false);
    }
  };

  const handleDeleteRoom = async () => {
    if (!watchroomId) {
      return;
    }

    try {
      setIsProcessing(true);
      await deleteWatchroom(watchroomId);
      toast.success('Watch room deleted successfully!');
      navigate('/watchrooms');
    } catch {
      toast.error('Failed to delete room.');
      setIsProcessing(false);
      setConfirmDeleteDialog(false);
    }
  };

  const handleGenerateRecommendations = async () => {
    if (!watchroomId) {
      return;
    }

    try {
      setIsGenerating(true);

      // Start generation and get requestId
      const { requestId, message } = await generateRecommendations(watchroomId);

      toast.success('Generating recommendations...', {
        description: message,
      });

      // Poll for status using requestId every 2 seconds, max 30 attempts (60 seconds total)
      let attempts = 0;
      const maxAttempts = 30;
      const pollInterval = 2000;

      const pollForStatus = async (): Promise<void> => {
        attempts++;

        try {
          const statusResult = await checkRecommendationStatus(watchroomId, requestId);

          if (statusResult.status === 'completed') {
            // Fetch the actual recommendations with series details
            await fetchRecommendations(watchroomId);

            toast.success('Recommendations ready!', {
              description: `Found ${statusResult.count} series for your group.`,
            });
            setIsGenerating(false);
            return;
          }
        } catch (error) {
          // If status check fails, log but continue polling
          console.error('Status check failed:', error);
        }

        if (attempts >= maxAttempts) {
          toast.error('Generation taking longer than expected', {
            description: 'Please refresh the page in a moment.',
          });
          setIsGenerating(false);
          return;
        }

        // Continue polling
        setTimeout(() => pollForStatus(), pollInterval);
      };

      // Start polling after initial delay
      setTimeout(() => pollForStatus(), pollInterval);
    } catch (error) {
      console.error('Failed to generate recommendations:', error);
      toast.error('Failed to generate recommendations.');
      setIsGenerating(false);
    }
  };

  const handleIgnoreSeries = async (seriesTmdbId: number, seriesName: string, recommendationId: string) => {
    try {
      // Start fade-out animation
      setFadingOutCards((prev) => new Set(prev).add(recommendationId));

      await addIgnoredSeries(seriesTmdbId);
      setIgnoredSeriesIds((prev) => new Set(prev).add(seriesTmdbId));
      toast.success(`"${seriesName}" added to your ignored list`, {
        description: "You won't see this series in future recommendations.",
      });

      // Clear fade-out after animation (card will be hidden via filter)
      setTimeout(() => {
        setFadingOutCards((prev) => {
          const newSet = new Set(prev);
          newSet.delete(recommendationId);
          return newSet;
        });
      }, 300);
    } catch (error) {
      console.error('Failed to ignore series:', error);
      toast.error('Failed to ignore series');
      // Remove from fading set if error occurs
      setFadingOutCards((prev) => {
        const newSet = new Set(prev);
        newSet.delete(recommendationId);
        return newSet;
      });
    }
  };

  const handleLikeSeries = async (
    seriesTmdbId: number,
    seriesName: string,
    recommendationId: string,
    preferenceLevel: 'like' | 'love' = 'like',
  ) => {
    try {
      setFadingOutCards((prev) => new Set(prev).add(recommendationId));

      await addFavoriteSeries(seriesTmdbId, preferenceLevel);
      setProfileSeriesIds((prev) => new Set(prev).add(seriesTmdbId));
      toast.success(`"${seriesName}" added to your favorites!`, {
        description: "You won't see this series in future recommendations.",
      });

      setTimeout(() => {
        setFadingOutCards((prev) => {
          const newSet = new Set(prev);
          newSet.delete(recommendationId);
          return newSet;
        });
      }, 300);
    } catch (error) {
      console.error('Failed to add to favorites:', error);
      toast.error('Failed to add to favorites');
      setFadingOutCards((prev) => {
        const newSet = new Set(prev);
        newSet.delete(recommendationId);
        return newSet;
      });
    }
  };

  const handleOpenImdb = async (seriesTmdbId: number, event?: React.MouseEvent) => {
    // Only handle left-click (button 0) and middle-click (button 1)
    if (event && event.button !== 0 && event.button !== 1) {
      return;
    }

    try {
      const externalIds = await getSeriesExternalIds(seriesTmdbId);

      if (externalIds.imdbId) {
        window.open(`https://www.imdb.com/title/${externalIds.imdbId}`);
      } else {
        toast.error('IMDb ID not available for this series');
      }
    } catch {
      toast.error('Failed to get IMDb link');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading room details...</p>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Room Not Found</CardTitle>
            <CardDescription>The watch room you are looking for does not exist.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => navigate('/watchrooms')}
              className="w-full"
            >
              Back to Rooms
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isOwner = userData?.id === room.ownerId;

  return (
    <div className="min-h-screen bg-linear-to-br from-background via-background to-primary/5">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <div className="space-y-8">
          {/* Back Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/watchrooms')}
            className="group -ml-2 hover:bg-primary/5"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Back to Rooms
          </Button>

          {/* Room Header Card */}
          <Card className="border shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
            <div className="absolute inset-0 bg-linear-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
            <CardHeader className="relative pb-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1 min-w-0 space-y-3">
                  <div className="flex items-center flex-wrap gap-3">
                    <CardTitle className="text-3xl sm:text-4xl font-bold bg-linear-to-br from-foreground to-foreground/70 bg-clip-text">
                      {room.name}
                    </CardTitle>
                    {isOwner && (
                      <Badge className="bg-linear-to-r from-primary to-primary/80 text-primary-foreground border-0 shadow-sm">
                        <Users className="w-3 h-3 mr-1" />
                        Owner
                      </Badge>
                    )}
                  </div>
                  {room.description && (
                    <CardDescription className="text-base leading-relaxed">{room.description}</CardDescription>
                  )}
                  <p className="text-sm text-muted-foreground">
                    <Calendar className="w-3 h-3 inline mr-1" />
                    Created{' '}
                    {new Date(room.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="default"
                    onClick={handleCopyLink}
                    className="sm:self-start shadow-md hover:shadow-lg transition-all"
                    data-testid="copy-invite-link-button"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Link
                  </Button>
                  {isOwner && (
                    <>
                      <EditWatchRoomModal
                        watchroomId={room.id}
                        currentName={room.name}
                        currentDescription={room.description}
                        onRoomUpdated={() => fetchRoomDetails(watchroomId!)}
                      />
                      <Button
                        variant="outline"
                        onClick={() => setConfirmDeleteDialog(true)}
                        className="sm:self-start hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Room
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Participants Card */}
          <Card className="border shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="pb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-linear-to-br from-primary to-primary/70 flex items-center justify-center shadow-md">
                  <Users className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Participants</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {room.participants.length} {room.participants.length === 1 ? 'member' : 'members'}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3">
                {room.participants.map((participant) => (
                  <div
                    key={participant.id}
                    className="group flex items-center justify-between p-4 rounded-xl border bg-card hover:border-primary/40 hover:bg-primary/5 hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full bg-linear-to-br from-primary via-primary to-primary/70 flex items-center justify-center shadow-md ring-2 ring-background group-hover:ring-primary/20 transition-all">
                          <span className="text-lg font-bold text-primary-foreground">
                            {participant.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        {participant.id === room.ownerId && (
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-linear-to-br from-primary to-primary/80 flex items-center justify-center shadow-sm ring-2 ring-background">
                            <Users className="w-3 h-3 text-primary-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="font-semibold text-foreground">{participant.name}</span>
                        {participant.id === room.ownerId && (
                          <Badge
                            variant="outline"
                            className="text-xs w-fit bg-primary/5 text-primary border-primary/30"
                          >
                            Room Owner
                          </Badge>
                        )}
                      </div>
                    </div>
                    {isOwner && participant.id !== userData?.id && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          setConfirmRemoveDialog({
                            open: true,
                            participantId: participant.id,
                            participantName: participant.name,
                          })
                        }
                        className="h-10 w-10 hover:bg-destructive/10 hover:text-destructive rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <UserMinus className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              {!isOwner && (
                <div className="pt-4">
                  <Button
                    variant="outline"
                    className="w-full hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50 rounded-lg shadow-sm"
                    onClick={() => setConfirmLeaveDialog(true)}
                    data-testid="leave-room-button"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Leave Room
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Recommendations Card */}
          <Card className="border shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
            <div className="absolute inset-0 bg-linear-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
            <CardHeader className="relative pb-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-linear-to-br from-primary to-primary/70 flex items-center justify-center shadow-md">
                      <Sparkles className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <CardTitle className="text-2xl">AI Recommendations</CardTitle>
                  </div>
                  <CardDescription className="text-base">
                    Get personalized series recommendations based on everyone's preferences.
                    {isOwner && (
                      <span className="block text-xs mt-1.5 text-muted-foreground/80">
                        Each generation creates fresh recommendations based on current preferences.
                      </span>
                    )}
                  </CardDescription>
                </div>
                {isOwner && (
                  <Button
                    onClick={handleGenerateRecommendations}
                    // disabled={isGenerating || room.participants.length < 2}
                    className="sm:self-start shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                    data-testid="generate-recommendations-button"
                  >
                    {isGenerating ? (
                      <>
                        <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingRecommendations ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground px-1">Loading recommendations...</p>
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="rounded-xl border bg-card p-5"
                    >
                      <div className="flex flex-col sm:flex-row gap-4">
                        <Skeleton className="h-36 w-full sm:w-24 shrink-0 rounded-lg" />
                        <div className="flex-1 space-y-3">
                          <Skeleton className="h-6 w-3/4" />
                          <div className="flex gap-2">
                            <Skeleton className="h-5 w-16" />
                            <Skeleton className="h-5 w-12" />
                            <Skeleton className="h-5 w-16" />
                          </div>
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-2/3" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : recommendations.length === 0 ? (
                <div className="text-center py-16 px-6">
                  <div className="w-24 h-24 rounded-2xl bg-linear-to-br from-primary/20 via-primary/10 to-primary/5 mx-auto mb-8 flex items-center justify-center shadow-inner">
                    <TvMinimalPlay className="w-12 h-12 text-primary animate-pulse" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3">No recommendations yet</h3>
                  <p className="text-muted-foreground max-w-lg mx-auto leading-relaxed">
                    {isOwner ? (
                      room.participants.length < 2 ? (
                        <>
                          Invite at least one more person to generate recommendations.{' '}
                          <Button
                            variant="link"
                            onClick={handleCopyLink}
                            className="text-primary hover:text-primary/80 underline underline-offset-2 font-semibold p-0 h-auto"
                          >
                            Copy invite link
                          </Button>
                        </>
                      ) : (
                        'Click the "Generate" button above to get AI-powered series recommendations for your group!'
                      )
                    ) : (
                      'The room owner will generate recommendations when everyone has joined.'
                    )}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Instructions Callout */}
                  <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
                    <p className="text-sm text-muted-foreground flex items-center gap-2 flex-wrap">
                      <ThumbsUp className="w-4 h-4 text-primary" />
                      <span>Like or</span>
                      <Heart className="w-4 h-4 text-pink-600" />
                      <span>Love the shows you enjoy</span>
                      <span className="text-muted-foreground/50">•</span>
                      <EyeOff className="w-4 h-4 text-muted-foreground" />
                      <span>Skip to exclude them from AI recommendations</span>
                    </p>
                  </div>

                  {/* Recommendations Count Badge */}
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className="text-sm font-semibold"
                    >
                      {
                        recommendations.filter(
                          (rec) => !ignoredSeriesIds.has(rec.seriesTmdbId) && !profileSeriesIds.has(rec.seriesTmdbId),
                        ).length
                      }{' '}
                      {recommendations.filter(
                        (rec) => !ignoredSeriesIds.has(rec.seriesTmdbId) && !profileSeriesIds.has(rec.seriesTmdbId),
                      ).length === 1
                        ? 'recommendation'
                        : 'recommendations'}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      showing{' '}
                      {
                        recommendations.filter(
                          (rec) => !ignoredSeriesIds.has(rec.seriesTmdbId) && !profileSeriesIds.has(rec.seriesTmdbId),
                        ).length
                      }{' '}
                      of {recommendations.length} total
                    </span>
                  </div>

                  <div className="grid gap-8">
                    {recommendations
                      .filter(
                        (rec) => !ignoredSeriesIds.has(rec.seriesTmdbId) && !profileSeriesIds.has(rec.seriesTmdbId),
                      )
                      .map((recommendation) => {
                        const isFadingOut = fadingOutCards.has(recommendation.id);
                        const isImageLoading = imageLoadingStates.get(recommendation.seriesTmdbId) ?? true;

                        return (
                          <div
                            key={recommendation.id}
                            className={`group relative rounded-xl border bg-card hover:border-primary/40 hover:shadow-xl transition-all duration-300 overflow-hidden ${
                              isFadingOut ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
                            }`}
                          >
                            <div className="flex flex-col sm:flex-row gap-8 p-6">
                              {/* Series Poster */}
                              <button
                                onMouseDown={(e) => handleOpenImdb(recommendation.seriesTmdbId, e)}
                                className="relative shrink-0 w-full sm:w-40 h-auto p-0 rounded-xl overflow-hidden group/poster focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 cursor-pointer"
                              >
                                {isImageLoading && <Skeleton className="absolute inset-0 h-60 w-full sm:w-40" />}
                                {recommendation.seriesDetails?.posterPath ? (
                                  <img
                                    src={`https://image.tmdb.org/t/p/w300${recommendation.seriesDetails.posterPath}`}
                                    alt={`${recommendation.seriesDetails.name} poster`}
                                    className="h-60 w-full sm:w-40 object-cover rounded-xl shadow-md group-hover/poster:shadow-xl transition-shadow"
                                    onLoad={() => {
                                      setImageLoadingStates((prev) => {
                                        const newMap = new Map(prev);
                                        newMap.set(recommendation.seriesTmdbId, false);
                                        return newMap;
                                      });
                                    }}
                                    style={{ display: isImageLoading ? 'none' : 'block' }}
                                  />
                                ) : (
                                  <div className="h-60 w-full sm:w-40 rounded-xl bg-linear-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                                    <TvMinimalPlay className="w-8 h-8 text-primary" />
                                  </div>
                                )}
                              </button>

                              {/* Series Details */}
                              <div className="flex-1 min-w-0 space-y-4">
                                <div className="space-y-3">
                                  <button
                                    onMouseDown={(e) => handleOpenImdb(recommendation.seriesTmdbId, e)}
                                    className="group/title h-auto p-0 hover:bg-transparent justify-start text-left focus:outline-none focus:underline cursor-pointer"
                                  >
                                    <h4 className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors flex items-center gap-2">
                                      {recommendation.seriesDetails?.name || 'Loading...'}
                                      <ExternalLink className="w-4 h-4 opacity-0 group-hover/title:opacity-100 transition-opacity" />
                                    </h4>
                                  </button>
                                  {recommendation.seriesDetails && (
                                    <div className="space-y-2">
                                      {/* Primary metadata: Year + Rating */}
                                      <div className="flex flex-wrap items-center gap-2">
                                        {recommendation.seriesDetails.firstAirDate && (
                                          <Badge
                                            variant="secondary"
                                            className="text-xs"
                                          >
                                            {new Date(recommendation.seriesDetails.firstAirDate).getFullYear()}
                                          </Badge>
                                        )}
                                        <div className="flex items-center gap-1 text-foreground">
                                          <Star className="w-4 h-4 fill-current" />
                                          <span className="text-sm font-semibold">
                                            {recommendation.seriesDetails.voteAverage.toFixed(1)}
                                          </span>
                                          <span className="text-xs text-muted-foreground">/10</span>
                                        </div>
                                      </div>
                                      {/* Secondary metadata: Seasons + Status */}
                                      <div className="flex flex-wrap items-center gap-2">
                                        {recommendation.seriesDetails.numberOfSeasons > 0 && (
                                          <Badge
                                            variant="outline"
                                            className="text-xs"
                                          >
                                            {recommendation.seriesDetails.numberOfSeasons}{' '}
                                            {recommendation.seriesDetails.numberOfSeasons === 1 ? 'Season' : 'Seasons'}
                                          </Badge>
                                        )}
                                        {recommendation.seriesDetails.status && (
                                          <Badge
                                            variant="outline"
                                            className={`text-xs ${
                                              recommendation.seriesDetails.status === 'Ended'
                                                ? 'border-muted-foreground/30 text-muted-foreground'
                                                : recommendation.seriesDetails.status === 'Canceled' ||
                                                    recommendation.seriesDetails.status === 'Cancelled'
                                                  ? 'border-red-500/30 text-red-600 dark:text-red-400'
                                                  : 'border-green-500/30 text-green-600 dark:text-green-400'
                                            }`}
                                          >
                                            {recommendation.seriesDetails.status}
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                  {recommendation.seriesDetails?.genres &&
                                    recommendation.seriesDetails.genres.length > 0 && (
                                      <div className="flex flex-wrap gap-2">
                                        {recommendation.seriesDetails.genres.slice(0, 4).map((genre) => (
                                          <Badge
                                            key={genre}
                                            variant="secondary"
                                            className="text-xs font-normal bg-muted/50 text-muted-foreground border-0 hover:bg-muted transition-colors"
                                          >
                                            {genre}
                                          </Badge>
                                        ))}
                                      </div>
                                    )}
                                </div>

                                {/* AI Justification */}
                                <div className="rounded-lg bg-primary/5 border-l-4 border-primary p-4 space-y-2 shadow-sm">
                                  <p className="text-xs font-semibold text-primary flex items-center gap-1.5">
                                    <Sparkles className="w-3.5 h-3.5" />
                                    Why we recommend this:
                                  </p>
                                  <p className="text-sm text-foreground/80 leading-relaxed">
                                    {recommendation.justification}
                                  </p>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-2">
                                  {/* Love Button - Primary Action */}
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className={`flex-1 min-h-11 shadow-sm hover:shadow-md active:scale-95 transition-all duration-300 group ${
                                      profileSeriesIds.has(recommendation.seriesTmdbId)
                                        ? 'bg-linear-to-br from-pink-400 to-pink-500 text-white border-pink-400 hover:from-pink-500 hover:to-pink-600'
                                        : 'bg-pink-50 border-pink-200 hover:bg-pink-100 hover:border-pink-400 dark:bg-pink-950/20 dark:border-pink-900/50 dark:hover:bg-pink-900/30 dark:hover:border-pink-700'
                                    }`}
                                    onClick={() =>
                                      handleLikeSeries(
                                        recommendation.seriesTmdbId,
                                        recommendation.seriesDetails?.name || 'this series',
                                        recommendation.id,
                                        'love',
                                      )
                                    }
                                    disabled={
                                      profileSeriesIds.has(recommendation.seriesTmdbId) ||
                                      ignoredSeriesIds.has(recommendation.seriesTmdbId) ||
                                      isFadingOut
                                    }
                                    aria-label="Mark as loved"
                                    aria-pressed={profileSeriesIds.has(recommendation.seriesTmdbId)}
                                  >
                                    <Heart
                                      className={`w-4 h-4 mr-1.5 transition-all duration-300 text-pink-500 dark:text-pink-400 ${
                                        profileSeriesIds.has(recommendation.seriesTmdbId)
                                          ? 'fill-current text-white!'
                                          : 'group-hover:scale-110 group-hover:text-pink-600 dark:group-hover:text-pink-300'
                                      }`}
                                    />
                                    Love
                                  </Button>

                                  {/* Like Button - Secondary Action */}
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className={`flex-1 min-h-11 shadow-sm hover:shadow-md active:scale-95 transition-all duration-300 group ${
                                      profileSeriesIds.has(recommendation.seriesTmdbId)
                                        ? 'bg-linear-to-br from-sky-400 to-sky-500 text-white border-sky-400 hover:from-sky-500 hover:to-sky-600'
                                        : 'bg-sky-50 border-sky-200 hover:bg-sky-100 hover:border-sky-400 dark:bg-sky-950/20 dark:border-sky-900/50 dark:hover:bg-sky-900/30 dark:hover:border-sky-700'
                                    }`}
                                    onClick={() =>
                                      handleLikeSeries(
                                        recommendation.seriesTmdbId,
                                        recommendation.seriesDetails?.name || 'this series',
                                        recommendation.id,
                                        'like',
                                      )
                                    }
                                    disabled={
                                      profileSeriesIds.has(recommendation.seriesTmdbId) ||
                                      ignoredSeriesIds.has(recommendation.seriesTmdbId) ||
                                      isFadingOut
                                    }
                                    aria-label="Mark as liked"
                                    aria-pressed={profileSeriesIds.has(recommendation.seriesTmdbId)}
                                  >
                                    <ThumbsUp
                                      className={`w-4 h-4 mr-1.5 transition-all duration-300 text-sky-500 dark:text-sky-400 ${
                                        profileSeriesIds.has(recommendation.seriesTmdbId)
                                          ? 'text-white!'
                                          : 'group-hover:scale-110 group-hover:text-sky-600 dark:group-hover:text-sky-300'
                                      }`}
                                    />
                                    Like
                                  </Button>

                                  {/* Skip Button - Neutral Action */}
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className={`flex-1 min-h-11 shadow-sm hover:shadow-md active:scale-95 transition-all duration-300 group ${
                                      ignoredSeriesIds.has(recommendation.seriesTmdbId)
                                        ? 'bg-muted text-muted-foreground border-muted-foreground/50'
                                        : 'bg-muted/30 hover:bg-muted/60 hover:border-muted-foreground/40'
                                    }`}
                                    onClick={() =>
                                      handleIgnoreSeries(
                                        recommendation.seriesTmdbId,
                                        recommendation.seriesDetails?.name || 'this series',
                                        recommendation.id,
                                      )
                                    }
                                    disabled={
                                      ignoredSeriesIds.has(recommendation.seriesTmdbId) ||
                                      profileSeriesIds.has(recommendation.seriesTmdbId) ||
                                      isFadingOut
                                    }
                                    aria-label="Mark as not interested"
                                    aria-pressed={ignoredSeriesIds.has(recommendation.seriesTmdbId)}
                                  >
                                    <EyeOff
                                      className={`w-4 h-4 mr-1.5 transition-all duration-300 ${
                                        ignoredSeriesIds.has(recommendation.seriesTmdbId) ? 'opacity-50' : ''
                                      }`}
                                    />
                                    {ignoredSeriesIds.has(recommendation.seriesTmdbId) ? 'Skipped' : 'Skip'}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Remove Participant Confirmation Dialog */}
      <Dialog
        open={confirmRemoveDialog.open}
        onOpenChange={(open) => setConfirmRemoveDialog({ open })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Participant</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove {confirmRemoveDialog.participantName} from this room? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmRemoveDialog({ open: false })}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemoveParticipant}
              disabled={isProcessing}
            >
              {isProcessing ? 'Removing...' : 'Remove'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Leave Room Confirmation Dialog */}
      <Dialog
        open={confirmLeaveDialog}
        onOpenChange={setConfirmLeaveDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leave Room</DialogTitle>
            <DialogDescription>
              Are you sure you want to leave this room? You can rejoin later using the invite link.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmLeaveDialog(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleLeaveRoom}
              disabled={isProcessing}
            >
              {isProcessing ? 'Leaving...' : 'Leave Room'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Room Confirmation Dialog */}
      <Dialog
        open={confirmDeleteDialog}
        onOpenChange={setConfirmDeleteDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="pb-4">Delete Watch Room</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <span className="font-semibold text-foreground">{room.name}</span>? This
              will remove all participants and cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDeleteDialog(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteRoom}
              disabled={isProcessing}
            >
              {isProcessing ? 'Deleting...' : 'Delete Room'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
