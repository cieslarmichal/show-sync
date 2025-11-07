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
      <div className="min-h-screen bg-background flex items-start justify-center p-4 py-12 md:py-16">
        <p className="text-muted-foreground">Loading room details...</p>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-background flex items-start justify-center p-4 py-12 md:py-16">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Room Not Found</CardTitle>
            <CardDescription>The watch room you are looking for does not exist.</CardDescription>
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
    );
  }

  const ownerParticipant = room.participants.find((p) => p.id === room.ownerId);
  const ownerName = ownerParticipant?.name || 'Unknown';
  const participantCount = room.participants.length;
  const isAlreadyParticipant = userData ? room.participants.some((p) => p.id === userData.id) : false;
  const isRoomFull = participantCount >= config.watchroom.maxParticipants;

  return (
    <div className="min-h-screen bg-background flex items-start justify-center p-4 py-12 md:py-16">
      <Card className="w-full max-w-lg border-2 shadow-lg">
        <CardHeader className="text-center pb-6">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <UserPlus className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Join {room.name}</CardTitle>
          <CardDescription className="text-base mt-2">
            You have been invited by <span className="font-semibold text-foreground">{ownerName}</span> to join this
            watch room.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {room.description && (
            <div className="p-4 rounded-lg bg-muted/50 border">
              <p className="text-sm font-medium mb-1 text-muted-foreground">Room Description</p>
              <p className="text-sm">{room.description}</p>
            </div>
          )}

          <div className="flex items-center justify-center gap-3 p-4 rounded-lg bg-secondary/50">
            <Users className="w-5 h-5 text-muted-foreground shrink-0" />
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold">{participantCount}</span>
              <span className="text-sm text-muted-foreground">/ {config.watchroom.maxParticipants}</span>
            </div>
          </div>

          <div className="pt-2">
            {isRoomFull && !isAlreadyParticipant && (
              <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <p className="text-sm text-center text-destructive font-medium">
                  This watch room is full (maximum {config.watchroom.maxParticipants} participants)
                </p>
              </div>
            )}
            {isAlreadyParticipant && (
              <div className="mb-4 p-3 rounded-lg bg-primary/10 border border-primary/20">
                <p className="text-sm text-center text-primary font-medium">
                  You are already a member of this watch room
                </p>
              </div>
            )}
            <Button
              onClick={handleJoin}
              className="w-full h-12 text-base font-semibold"
              size="lg"
              disabled={isJoining || isAlreadyParticipant || isRoomFull}
            >
              {isJoining ? (
                <>
                  <Sparkles className="w-5 h-5 mr-2 animate-pulse" />
                  Joining...
                </>
              ) : userData ? (
                <>
                  <UserPlus className="w-5 h-5 mr-2" />
                  Join Watch Room
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5 mr-2" />
                  Login to Join
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
