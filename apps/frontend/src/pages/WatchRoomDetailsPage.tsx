import { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { AuthContext } from '../context/AuthContext.tsx';
import { getWatchroomDetails } from '../api/queries/watchroom.ts';
import type { WatchroomDetails } from '../api/types/watchroom.ts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card.tsx';
import { Button } from '../components/ui/Button.tsx';
import { RoomInfoCard } from '../components/watchroom/RoomInfoCard.tsx';
import { RecommendationsSection } from '../components/watchroom/RecommendationsSection.tsx';
import { useSEO } from '../hooks/useSEO';

export default function WatchRoomDetailsPage() {
  const { t } = useTranslation();
  useSEO('watchRoomDetails');
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
      toast.error(t('watchroom.loadError'));
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
      toast.success(t('watchroom.linkCopied'));
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
        <p className="text-muted-foreground">{t('watchroom.loadingDetails')}</p>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>{t('watchroom.notFoundTitle')}</CardTitle>
            <CardDescription>{t('watchroom.notFoundMessage')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => navigate('/watchrooms')}
              className="w-full"
            >
              {t('watchroom.backToRooms')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isOwner = userData?.id === room.ownerId;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-5">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/watchrooms')}
          className="group -ml-2 hover:bg-primary/5 transition-all text-xs sm:text-sm mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 group-hover:-translate-x-1 transition-transform" />
          <span className="hidden sm:inline">{t('watchroom.backToRooms')}</span>
          <span className="inline sm:hidden">{t('common.back')}</span>
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-[420px,1fr] gap-5 lg:gap-8">
          {/* Left Sidebar - Room Info & Participants */}
          <div className="space-y-4 lg:space-y-5">
            <RoomInfoCard
              room={room}
              isOwner={isOwner}
              currentUserId={userData?.id}
              onCopyLink={handleCopyLink}
              onRoomUpdated={() => fetchRoomDetails(watchroomId!)}
              onRoomDeleted={handleRoomDeleted}
              onLeaveRoom={handleLeaveRoom}
            />
          </div>

          {/* Right Main Area - Recommendations */}
          {watchroomId && (
            <div className="lg:min-h-[calc(100vh-8rem)]">
              <RecommendationsSection
                watchroomId={watchroomId}
                isOwner={isOwner}
                participantCount={room.participants.length}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
