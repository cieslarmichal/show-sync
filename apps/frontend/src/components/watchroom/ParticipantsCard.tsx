import { useState } from 'react';
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

  const handleRemoveParticipant = async () => {
    if (!confirmRemoveDialog.participantId) {
      return;
    }

    try {
      setIsProcessing(true);
      await removeParticipant(room.id, confirmRemoveDialog.participantId);
      toast.success('Participant removed successfully!');
      setConfirmRemoveDialog({ open: false });
      onRoomUpdated();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to remove participant.';

      if (errorMessage.includes('Too many requests') || errorMessage.includes('Rate limit')) {
        toast.error('Slow down!', {
          description: 'Wait a moment before trying again.',
        });
      } else {
        toast.error('Could not remove participant. Please try again.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLeaveRoom = async () => {
    try {
      setIsProcessing(true);
      await leaveWatchroom(room.id);
      toast.success('You have left the room.');
      onLeaveRoom();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to leave the room.';

      if (errorMessage.includes('Too many requests') || errorMessage.includes('Rate limit')) {
        toast.error('Slow down!', {
          description: 'Wait a moment before trying again.',
        });
      } else {
        toast.error('Could not leave watch room. Please try again.');
      }
      setIsProcessing(false);
    }
  };

  return (
    <>
      <Card className="border-2 shadow-sm hover:shadow-md transition-all duration-300">
        <CardHeader className="pb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold tracking-tight">Participants</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {room.participants.length} / {config.watchroom.maxParticipants}{' '}
                {room.participants.length === 1 ? 'member' : 'members'}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3">
            {room.participants.map((participant) => (
              <div
                key={participant.id}
                className="group flex items-center justify-between p-4 rounded-lg border bg-card hover:border-primary/40 hover:bg-muted/30 transition-all duration-200"
                data-testid="participants-list"
              >
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center ring-2 ring-background group-hover:ring-primary/20 transition-all">
                      <span className="text-lg font-bold text-primary">{participant.name.charAt(0).toUpperCase()}</span>
                    </div>
                    {participant.id === room.ownerId && (
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center ring-2 ring-background">
                        <Users className="w-3 h-3 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="font-semibold text-foreground">{participant.name}</span>
                    {participant.id === room.ownerId && (
                      <Badge
                        variant="outline"
                        className="text-xs w-fit bg-primary/5 text-primary border-primary/30 font-medium"
                      >
                        Room Owner
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
                        className="h-10 w-10 hover:bg-destructive/10 hover:text-destructive rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <UserMinus className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p>Remove {participant.name} from room</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            ))}
          </div>
          {!isOwner && (
            <div className="pt-4">
              <Button
                variant="outline"
                className="w-full hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50 transition-all font-semibold"
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

      {/* Remove Participant Confirmation Dialog */}
      <Dialog
        open={confirmRemoveDialog.open}
        onOpenChange={(open) => setConfirmRemoveDialog({ open })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-2xl mb-2">Remove Participant?</DialogTitle>
            <DialogDescription className="text-base leading-relaxed">
              Are you sure you want to remove{' '}
              <span className="font-semibold text-foreground">{confirmRemoveDialog.participantName}</span> from this
              room? They can rejoin using the invite link.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setConfirmRemoveDialog({ open: false })}
              disabled={isProcessing}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemoveParticipant}
              disabled={isProcessing}
              className="w-full sm:w-auto font-semibold"
            >
              {isProcessing ? 'Removing...' : 'Remove Participant'}
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
            <DialogTitle className="text-2xl mb-2">Leave Room?</DialogTitle>
            <DialogDescription className="text-base leading-relaxed">
              Are you sure you want to leave this room? You can rejoin anytime using the invite link.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setConfirmLeaveDialog(false)}
              disabled={isProcessing}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleLeaveRoom}
              disabled={isProcessing}
              className="w-full sm:w-auto font-semibold"
            >
              {isProcessing ? 'Leaving...' : 'Leave Room'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
