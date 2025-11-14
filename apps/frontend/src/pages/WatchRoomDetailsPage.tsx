import { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';

import { AuthContext } from '../context/AuthContext.tsx';
import { getWatchroomDetails } from '../api/queries/watchroom.ts';
import type { WatchroomDetails } from '../api/types/watchroom.ts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card.tsx';
import { Button } from '../components/ui/Button.tsx';
import { RoomHeader } from '../components/watchroom/RoomHeader.tsx';
import { ParticipantsCard } from '../components/watchroom/ParticipantsCard.tsx';
import { RecommendationsSection } from '../components/watchroom/RecommendationsSection.tsx';

export default function WatchRoomDetailsPage() {
  const { watchroomId } = useParams<{ watchroomId: string }>();
  const [room, setRoom] = useState<WatchroomDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { userData } = useContext(AuthContext);
  const navigate = useNavigate();

  const fetchRoomDetails = async (id: string) => {
    try {
      setIsLoading(true);
      const fetchedRoom = await getWatchroomDetails(id);
      setRoom(fetchedRoom);
    } catch {
      toast.error('Could not load watch room. Please try again.');
      navigate('/watchrooms');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (watchroomId) {
      fetchRoomDetails(watchroomId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchroomId]);

  const handleCopyLink = () => {
    if (room) {
      const link = `${window.location.origin}/watchrooms/public/${room.publicLinkId}`;
      navigator.clipboard.writeText(link);
      toast.success('Room link copied to clipboard!');
    }
  };

  const handleRoomDeleted = () => {
    navigate('/watchrooms');
  };

  const handleLeaveRoom = () => {
    navigate('/watchrooms');
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
              Back to Watch Rooms
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isOwner = userData?.id === room.ownerId;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-5">
        <div className="space-y-3 sm:space-y-4">
          {/* Back Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/watchrooms')}
            className="group -ml-2 hover:bg-primary/5 transition-all text-xs sm:text-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 group-hover:-translate-x-1 transition-transform" />
            <span className="hidden sm:inline">Back to Watch Rooms</span>
            <span className="inline sm:hidden">Back</span>
          </Button>

          {/* Room Header Card */}
          <RoomHeader
            room={room}
            isOwner={isOwner}
            onCopyLink={handleCopyLink}
            onRoomUpdated={() => fetchRoomDetails(watchroomId!)}
            onRoomDeleted={handleRoomDeleted}
          />

          {/* Participants Card */}
          <ParticipantsCard
            room={room}
            isOwner={isOwner}
            currentUserId={userData?.id}
            onRoomUpdated={() => fetchRoomDetails(watchroomId!)}
            onLeaveRoom={handleLeaveRoom}
          />

          {/* Recommendations Section */}
          {watchroomId && (
            <RecommendationsSection
              watchroomId={watchroomId}
              isOwner={isOwner}
              participantCount={room.participants.length}
              onCopyLink={handleCopyLink}
            />
          )}
        </div>
      </div>
    </div>
  );
}
