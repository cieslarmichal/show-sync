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
        toast.error('Rate limit exceeded', {
          description: 'Please wait a moment before trying again.',
        });
      } else {
        toast.error('Failed to remove participant.');
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
        toast.error('Rate limit exceeded', {
          description: 'Please wait a moment before trying again.',
        });
      } else {
        toast.error('Failed to leave the room.');
      }
      setIsProcessing(false);
    }
  };

  return (
    <>
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
                        className="h-10 w-10 hover:bg-destructive/10 hover:text-destructive rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
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
    </>
  );
}
