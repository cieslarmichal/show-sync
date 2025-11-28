import { useEffect, useState, useContext, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Users, UserPlus, Sparkles } from 'lucide-react';

import { AuthContext } from '../context/AuthContext.tsx';
import { getPublicWatchroomDetails, joinWatchroom } from '../api/queries/watchroom.ts';
import type { Watchroom } from '../api/types/watchroom.ts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card.tsx';
import { Button } from '../components/ui/Button.tsx';
import { config } from '../config.ts';
import { useTranslation } from 'react-i18next';

export default function JoinWatchRoomPage() {
  const { t } = useTranslation();
  const { publicLinkId } = useParams<{ publicLinkId: string }>();
  const [room, setRoom] = useState<Watchroom | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const { userData } = useContext(AuthContext);
  const navigate = useNavigate();

  const fetchRoomDetails = useCallback(
    async (id: string) => {
      try {
        setIsLoading(true);
        const fetchedRoom = await getPublicWatchroomDetails(id);
        setRoom(fetchedRoom);
      } catch {
        toast.error(t('watchroom.loadError'));
      } finally {
        setIsLoading(false);
      }
    },
    [t],
  );

  useEffect(() => {
    if (publicLinkId) {
      fetchRoomDetails(publicLinkId);
    }
  }, [publicLinkId, fetchRoomDetails]);

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
      toast.success(t('watchroom.joinSuccess'));
      navigate(`/watchrooms/${watchroom.id}`);
    } catch (error) {
      // Check if user is already a participant (409 conflict)
      if (error instanceof Error && error.message.includes('HTTP 409')) {
        toast.info(t('watchroom.alreadyMember'), {
          description: t('watchroom.redirecting'),
        });
        // Navigate to the room since they're already in it
        if (room) {
          setTimeout(() => navigate(`/watchrooms/${room.id}`), 1000);
        }
      } else if (error instanceof Error && error.message.includes('HTTP 400')) {
        // Room is full
        toast.error(t('watchroom.cannotJoin'), {
          description: t('watchroom.roomFull'),
        });
      } else {
        toast.error(t('watchroom.joinError'));
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
            <p className="text-muted-foreground">{t('watchroom.loadingDetails')}</p>
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
                <CardTitle>{t('watchroom.notFoundTitle')}</CardTitle>
                <CardDescription>{t('watchroom.notFound')}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => navigate('/')}
                  className="w-full"
                >
                  {t('common.goHome')}
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
                <CardTitle className="text-3xl font-bold tracking-tight text-foreground">
                  {t('watchroom.joinTitle')} {room.name}
                </CardTitle>
                <CardDescription className="text-base mt-3 leading-relaxed text-foreground/80">
                  {t('watchroom.invitedBy', { name: ownerName })}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {room.description && (
                <div className="p-4 rounded-lg bg-foreground/5 border-2 border-foreground/10">
                  <p className="text-xs font-semibold uppercase tracking-wider mb-2 text-foreground/60">
                    {t('watchroom.aboutThisRoom')}
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
                  <span className="text-sm text-foreground/60">
                    {t('watchroom.ofMembers', { max: config.watchroom.maxParticipants })}
                  </span>
                </div>
              </div>

              <div className="pt-2">
                {isRoomFull && !isAlreadyParticipant && (
                  <div className="mb-4 p-4 rounded-lg bg-destructive/10 border-2 border-destructive">
                    <p className="text-sm text-center text-destructive font-semibold">
                      {t('watchroom.roomAtCapacity', { max: config.watchroom.maxParticipants })}
                    </p>
                  </div>
                )}
                {isAlreadyParticipant && (
                  <div className="mb-4 p-4 rounded-lg bg-primary/10 border-2 border-primary/30">
                    <p className="text-sm text-center text-primary font-semibold">✓ {t('watchroom.alreadyMember')}</p>
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
                      {t('watchroom.joining')}
                    </>
                  ) : userData ? (
                    <>
                      <UserPlus className="w-5 h-5 mr-2" />
                      {t('watchroom.join')}
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-5 h-5 mr-2" />
                      {t('watchroom.signInToJoin')}
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
