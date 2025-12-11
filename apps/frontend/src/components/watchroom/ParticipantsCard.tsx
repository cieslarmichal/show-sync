import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Users, UserMinus, LogOut } from 'lucide-react';

import { removeParticipant, leaveWatchroom } from '../../api/queries/watchroom.ts';
import type { WatchroomDetails } from '../../api/types/watchroom.ts';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card.tsx';
import { Button } from '../ui/Button.tsx';
import { Badge } from '../ui/Badge.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/Tooltip.tsx';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/Dialog.tsx';
import { config } from '../../config.ts';

interface ParticipantsCardProps {
  room: WatchroomDetails;
  isOwner: boolean;
  currentUserId?: string;
  onRoomUpdated: () => void;
  onLeaveRoom: () => void;
}

export function ParticipantsCard({ room, isOwner, currentUserId, onRoomUpdated, onLeaveRoom }: ParticipantsCardProps) {
  const [confirmRemoveDialog, setConfirmRemoveDialog] = useState<{
    open: boolean;
    participantId?: string;
    participantName?: string;
  }>({ open: false });
  const [confirmLeaveDialog, setConfirmLeaveDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { t } = useTranslation();

  const handleRemoveParticipant = async () => {
    if (!confirmRemoveDialog.participantId) {
      return;
    }

    try {
      setIsProcessing(true);
      await removeParticipant(room.id, confirmRemoveDialog.participantId);
      toast.success(t('watchroom.roomInfo.toast.removeSuccess'));
      setConfirmRemoveDialog({ open: false });
      onRoomUpdated();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to remove participant.';

      if (errorMessage.includes('Too many requests') || errorMessage.includes('Rate limit')) {
        toast.error(t('watchroom.roomInfo.toast.slowDown'), {
          description: t('watchroom.roomInfo.toast.slowDownDesc'),
        });
      } else {
        toast.error(t('watchroom.roomInfo.toast.removeError'));
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLeaveRoom = async () => {
    try {
      setIsProcessing(true);
      await leaveWatchroom(room.id);
      toast.success(t('watchroom.roomInfo.toast.leaveSuccess'));
      onLeaveRoom();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to leave the room.';

      if (errorMessage.includes('Too many requests') || errorMessage.includes('Rate limit')) {
        toast.error(t('watchroom.roomInfo.toast.slowDown'), {
          description: t('watchroom.roomInfo.toast.slowDownDesc'),
        });
      } else {
        toast.error(t('watchroom.roomInfo.toast.leaveError'));
      }
      setIsProcessing(false);
    }
  };

  return (
    <>
      <Card className="border shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="w-4 h-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-sm sm:text-base font-bold tracking-tight">
                {t('watchroom.participants.title')}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {room.participants.length} / {config.watchroom.maxParticipants}{' '}
                {t('watchroom.participants.member', { count: room.participants.length })}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-0">
          <div className="grid gap-1.5">
            {room.participants.map((participant) => (
              <div
                key={participant.id}
                className="group flex items-center justify-between p-2 rounded-lg border bg-card hover:border-primary/40 hover:bg-muted/30 transition-all duration-200"
                data-testid="participants-list"
              >
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center ring-2 ring-background group-hover:ring-primary/20 transition-all">
                      <span className="text-xs font-bold text-primary">{participant.name.charAt(0).toUpperCase()}</span>
                    </div>
                    {participant.id === room.ownerId && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-primary flex items-center justify-center ring-2 ring-background">
                        <Users className="w-1.5 h-1.5 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold text-xs text-foreground">{participant.name}</span>
                    {participant.id === room.ownerId && (
                      <Badge
                        variant="outline"
                        className="text-[10px] w-fit bg-primary/5 text-primary border-primary/30 font-medium px-1 py-0"
                      >
                        {t('watchroom.participants.owner')}
                      </Badge>
                    )}
                  </div>
                </div>
                {isOwner && participant.id !== currentUserId && (
                  <Tooltip>
                    <TooltipTrigger asChild>
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
                        className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive rounded-lg opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all"
                        aria-label={`Remove ${participant.name} from room`}
                      >
                        <UserMinus className="w-3.5 h-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent
                      side="bottom"
                      className="hidden sm:block"
                    >
                      <p>{t('watchroom.participants.remove', { name: participant.name })}</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            ))}
          </div>
          {!isOwner && (
            <div className="pt-3">
              <Button
                variant="outline"
                size="sm"
                className="w-full hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50 transition-all font-semibold text-xs"
                onClick={() => setConfirmLeaveDialog(true)}
                data-testid="leave-room-button"
              >
                <LogOut className="w-3.5 h-3.5 mr-1.5" />
                {t('watchroom.participants.leaveRoom')}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Remove Participant Confirmation Dialog */}
      <Dialog
        open={confirmRemoveDialog.open}
        onOpenChange={(open) => setConfirmRemoveDialog({ open })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-2xl mb-2">{t('watchroom.roomInfo.removeDialog.title')}</DialogTitle>
            <DialogDescription className="text-base leading-relaxed">
              {t('watchroom.roomInfo.removeDialog.description', { name: confirmRemoveDialog.participantName })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setConfirmRemoveDialog({ open: false })}
              disabled={isProcessing}
              className="w-full sm:w-auto"
            >
              {t('watchroom.roomInfo.removeDialog.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemoveParticipant}
              disabled={isProcessing}
              className="w-full sm:w-auto font-semibold"
            >
              {isProcessing
                ? t('watchroom.roomInfo.removeDialog.removing')
                : t('watchroom.roomInfo.removeDialog.confirm')}
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
            <DialogTitle className="text-2xl mb-2">{t('watchroom.roomInfo.leaveDialog.title')}</DialogTitle>
            <DialogDescription className="text-base leading-relaxed">
              {t('watchroom.roomInfo.leaveDialog.description')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setConfirmLeaveDialog(false)}
              disabled={isProcessing}
              className="w-full sm:w-auto"
            >
              {t('watchroom.roomInfo.leaveDialog.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleLeaveRoom}
              disabled={isProcessing}
              className="w-full sm:w-auto font-semibold"
            >
              {isProcessing ? t('watchroom.roomInfo.leaveDialog.leaving') : t('watchroom.roomInfo.leaveDialog.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
