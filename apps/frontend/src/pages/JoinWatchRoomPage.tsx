import { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Users, UserPlus, Sparkles } from 'lucide-react';

import { AuthContext } from '../context/AuthContext.tsx';
import { getPublicWatchroomDetails, joinWatchroom } from '../api/queries/watchroom.ts';
import type { Watchroom } from '../api/types/watchroom.ts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card.tsx';
import { Button } from '../components/ui/Button.tsx';
import { config } from '../config.ts';

export default function JoinWatchRoomPage() {
  const { publicLinkId } = useParams<{ publicLinkId: string }>();
  const [room, setRoom] = useState<Watchroom | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const { userData } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (publicLinkId) {
      fetchRoomDetails(publicLinkId);
    }
  }, [publicLinkId]);

  const fetchRoomDetails = async (id: string) => {
    try {
      setIsLoading(true);
      const fetchedRoom = await getPublicWatchroomDetails(id);
      setRoom(fetchedRoom);
    } catch {
      toast.error('Failed to load watch room details.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!publicLinkId) {
      return;
    }

    if (!userData) {
      navigate(`/login?redirect=/watchrooms/public/${publicLinkId}`);
      return;
    }

    try {
      setIsJoining(true);
      const watchroom = await joinWatchroom(publicLinkId);
      toast.success('Successfully joined the watch room!');
      navigate(`/watchrooms/${watchroom.id}`);
    } catch (error) {
      // Check if user is already a participant (409 conflict)
      if (error instanceof Error && error.message.includes('HTTP 409')) {
        toast.info('You are already a member of this room!', {
          description: 'Redirecting to the room...',
        });
        // Navigate to the room since they're already in it
        if (room) {
          setTimeout(() => navigate(`/watchrooms/${room.id}`), 1000);
        }
      } else if (error instanceof Error && error.message.includes('HTTP 400')) {
        // Room is full
        toast.error('Cannot join room', {
          description: 'This watch room has reached its maximum capacity.',
        });
      } else {
        toast.error('Failed to join the watch room.');
      }
    } finally {
      setIsJoining(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-size-[4rem_4rem]" />
          <div className="relative flex items-start justify-center p-4 py-12 md:py-16">
            <p className="text-muted-foreground">Loading room details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-background">
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-size-[4rem_4rem]" />
          <div className="relative flex items-start justify-center p-4 py-12 md:py-16">
            <Card className="w-full max-w-md border-2 shadow-md">
              <CardHeader>
                <CardTitle>Room Not Found</CardTitle>
                <CardDescription>The watch room you're looking for doesn't exist.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => navigate('/')}
                  className="w-full"
                >
                  Go Home
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  const ownerParticipant = room.participants.find((p) => p.id === room.ownerId);
  const ownerName = ownerParticipant?.name || 'Unknown';
  const participantCount = room.participants.length;
  const isAlreadyParticipant = userData ? room.participants.some((p) => p.id === userData.id) : false;
  const isRoomFull = participantCount >= config.watchroom.maxParticipants;

  return (
    <div className="min-h-screen bg-background">
      <div className="relative overflow-hidden">
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-size-[4rem_4rem]" />

        <div className="relative flex items-start justify-center p-4 py-12 md:py-16 lg:py-20">
          <Card className="w-full max-w-lg border-2 shadow-lg hover:shadow-xl transition-all bg-card">
            <CardHeader className="text-center pb-6 space-y-4">
              <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center mx-auto shadow-md">
                <UserPlus className="w-10 h-10 text-primary-foreground" />
              </div>
              <div className="space-y-2">
                <CardTitle className="text-3xl font-bold tracking-tight text-foreground">Join {room.name}</CardTitle>
                <CardDescription className="text-base mt-3 leading-relaxed text-foreground/80">
                  You've been invited by <span className="font-semibold text-foreground">{ownerName}</span> to join this
                  watch room
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {room.description && (
                <div className="p-4 rounded-lg bg-foreground/5 border-2 border-foreground/10">
                  <p className="text-xs font-semibold uppercase tracking-wider mb-2 text-foreground/60">
                    About This Room
                  </p>
                  <p className="text-sm leading-relaxed text-foreground">{room.description}</p>
                </div>
              )}

              <div className="flex items-center justify-center gap-4 p-5 rounded-lg bg-foreground/5 border-2 border-foreground/10">
                <div className="w-10 h-10 rounded-full bg-foreground flex items-center justify-center">
                  <Users className="w-5 h-5 text-background shrink-0" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-foreground">{participantCount}</span>
                  <span className="text-sm text-foreground/60">of {config.watchroom.maxParticipants} members</span>
                </div>
              </div>

              <div className="pt-2">
                {isRoomFull && !isAlreadyParticipant && (
                  <div className="mb-4 p-4 rounded-lg bg-destructive/10 border-2 border-destructive">
                    <p className="text-sm text-center text-destructive font-semibold">
                      Room is at capacity ({config.watchroom.maxParticipants} members)
                    </p>
                  </div>
                )}
                {isAlreadyParticipant && (
                  <div className="mb-4 p-4 rounded-lg bg-primary/10 border-2 border-primary/30">
                    <p className="text-sm text-center text-primary font-semibold">
                      ✓ You're already a member of this room
                    </p>
                  </div>
                )}
                <Button
                  onClick={handleJoin}
                  className="w-full h-12 text-base font-semibold shadow-md hover:shadow-lg transition-all"
                  size="lg"
                  disabled={isJoining || isAlreadyParticipant || isRoomFull}
                >
                  {isJoining ? (
                    <>
                      <Sparkles className="w-5 h-5 mr-2 animate-pulse" />
                      Joining Room...
                    </>
                  ) : userData ? (
                    <>
                      <UserPlus className="w-5 h-5 mr-2" />
                      Join Watch Room
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-5 h-5 mr-2" />
                      Sign In to Join
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
