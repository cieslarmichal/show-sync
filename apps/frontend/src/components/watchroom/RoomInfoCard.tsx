import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Copy, Trash2, Calendar, Users, UserMinus, LogOut, Film } from 'lucide-react';

import { deleteWatchroom, removeParticipant, leaveWatchroom } from '../../api/queries/watchroom.ts';
import type { WatchroomDetails } from '../../api/types/watchroom.ts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card.tsx';
import { Button } from '../ui/Button.tsx';
import { Badge } from '../ui/Badge.tsx';
import { EditWatchRoomModal } from '../EditWatchRoomModal.tsx';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/Dialog.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/Tooltip.tsx';
import { config } from '../../config.ts';

interface RoomInfoCardProps {
  room: WatchroomDetails;
  isOwner: boolean;
  currentUserId?: string;
  onCopyLink: () => void;
  onRoomUpdated: () => void;
  onRoomDeleted: () => void;
  onLeaveRoom: () => void;
}

export function RoomInfoCard({
  room,
  isOwner,
  currentUserId,
  onCopyLink,
  onRoomUpdated,
  onRoomDeleted,
  onLeaveRoom,
}: RoomInfoCardProps) {
  const [confirmDeleteDialog, setConfirmDeleteDialog] = useState(false);
  const [confirmRemoveDialog, setConfirmRemoveDialog] = useState<{
    open: boolean;
    participantId?: string;
    participantName?: string;
  }>({ open: false });
  const [confirmLeaveDialog, setConfirmLeaveDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { t } = useTranslation();

  const SERIES_LENGTH_LABELS = {
    all: t('watchroom.roomInfo.seriesLength.all'),
    excludeMiniSeries: t('watchroom.roomInfo.seriesLength.excludeMiniSeries'),
    onlyMiniSeries: t('watchroom.roomInfo.seriesLength.onlyMiniSeries'),
  };

  const hasActiveFilters = room.seriesLengthPreference !== 'all';

  const handleDeleteRoom = async () => {
    try {
      setIsProcessing(true);
      await deleteWatchroom(room.id);
      toast.success(t('watchroom.roomInfo.toast.deleteSuccess'));
      onRoomDeleted();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete room.';

      if (errorMessage.includes('Too many requests') || errorMessage.includes('Rate limit')) {
        toast.error(t('watchroom.roomInfo.toast.slowDown'), {
          description: t('watchroom.roomInfo.toast.slowDownDesc'),
        });
      } else {
        toast.error(t('watchroom.roomInfo.toast.deleteError'));
      }
      setIsProcessing(false);
      setConfirmDeleteDialog(false);
    }
  };

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
      <div className="space-y-3 lg:space-y-4">
        {/* Room Header Card */}
        <Card className="border shadow-sm overflow-hidden">
          <CardHeader className="space-y-3 pb-3">
            {/* Room Title */}
            <CardTitle className="text-lg sm:text-xl font-bold tracking-tight wrap-break-word">{room.name}</CardTitle>

            {/* Description */}
            {room.description && (
              <CardDescription className="text-xs sm:text-sm leading-relaxed text-muted-foreground">
                {room.description}
              </CardDescription>
            )}

            {/* Active Filters */}
            {hasActiveFilters && (
              <div className="flex flex-wrap gap-x-4 gap-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
                    <Film className="w-3.5 h-3.5" />
                    <span className="font-medium">{t('watchroom.roomInfo.length')}</span>
                  </div>
                  <Badge
                    variant="secondary"
                    className="text-xs font-normal"
                  >
                    {SERIES_LENGTH_LABELS[room.seriesLengthPreference]}
                  </Badge>
                </div>
              </div>
            )}

            {/* Meta Info */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{t('watchroom.roomInfo.createdBy', { name: room.ownerName })}</span>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>
                  {new Date(room.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-1.5 pt-2 border-t border-border/40">
              <Button
                size="sm"
                variant="default"
                onClick={onCopyLink}
                className="shadow-sm hover:shadow-md transition-all h-8 text-xs"
                data-testid="copy-invite-link-button"
              >
                <Copy className="w-3 h-3 mr-1" />
                {t('watchroom.roomInfo.share')}
              </Button>
              {isOwner ? (
                <>
                  <EditWatchRoomModal
                    watchroomId={room.id}
                    currentName={room.name}
                    currentDescription={room.description}
                    currentSeriesLengthPreference={room.seriesLengthPreference}
                    onRoomUpdated={onRoomUpdated}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setConfirmDeleteDialog(true)}
                    className="shadow-sm hover:shadow-md hover:bg-destructive/10 hover:text-destructive hover:border-destructive transition-all h-8 text-xs"
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    {t('watchroom.roomInfo.delete')}
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50 transition-all h-8 text-xs"
                  onClick={() => setConfirmLeaveDialog(true)}
                  data-testid="leave-room-button"
                >
                  <LogOut className="w-3.5 h-3.5 mr-1.5" />
                  {t('watchroom.roomInfo.leave')}
                </Button>
              )}
            </div>
          </CardHeader>
        </Card>

        {/* Participants Card */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Users className="w-4 h-4 text-primary" />
                </div>
                <CardTitle className="text-sm sm:text-base font-bold tracking-tight">
                  {t('watchroom.roomInfo.participants')}
                </CardTitle>
              </div>
              <span className="text-xs text-muted-foreground">
                {room.participants.length}/{config.watchroom.maxParticipants}
              </span>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-1.5">
              {room.participants.map((participant) => (
                <div
                  key={participant.id}
                  className="group flex items-center justify-between p-2 rounded-lg border bg-card hover:border-primary/40 hover:bg-muted/30 transition-all duration-200"
                  data-testid="participants-list"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center ring-2 ring-background group-hover:ring-primary/20 transition-all">
                      <span className="text-xs font-bold text-primary">{participant.name.charAt(0).toUpperCase()}</span>
                    </div>
                    <span className="font-semibold text-xs text-foreground">{participant.name}</span>
                    {participant.id === room.ownerId && (
                      <Badge
                        variant="outline"
                        className="text-[10px] bg-primary/5 text-primary border-primary/30 font-medium px-1 py-0"
                      >
                        {t('watchroom.roomInfo.owner')}
                      </Badge>
                    )}
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
                          className="h-7 w-7 hover:bg-destructive/10 hover:text-destructive rounded-lg opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all"
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
          </CardContent>
        </Card>
      </div>

      {/* Delete Room Dialog */}
      <Dialog
        open={confirmDeleteDialog}
        onOpenChange={setConfirmDeleteDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-2xl mb-2">{t('watchroom.roomInfo.deleteDialog.title')}</DialogTitle>
            <DialogDescription className="text-base leading-relaxed">
              {t('watchroom.roomInfo.deleteDialog.description', { name: room.name })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setConfirmDeleteDialog(false)}
              disabled={isProcessing}
              className="w-full sm:w-auto"
            >
              {t('watchroom.roomInfo.deleteDialog.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteRoom}
              disabled={isProcessing}
              className="w-full sm:w-auto font-semibold"
            >
              {isProcessing
                ? t('watchroom.roomInfo.deleteDialog.deleting')
                : t('watchroom.roomInfo.deleteDialog.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Participant Dialog */}
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

      {/* Leave Room Dialog */}
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
