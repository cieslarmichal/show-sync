import { useState } from 'react';
import { toast } from 'sonner';
import { Copy, Users, Trash2, Calendar } from 'lucide-react';

import { deleteWatchroom } from '../../api/queries/watchroom.ts';
import type { WatchroomDetails } from '../../api/types/watchroom.ts';
import { Card, CardDescription, CardHeader, CardTitle } from '../ui/Card.tsx';
import { Button } from '../ui/Button.tsx';
import { Badge } from '../ui/Badge.tsx';
import { EditWatchRoomModal } from '../EditWatchRoomModal.tsx';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/Dialog.tsx';

interface RoomHeaderProps {
  room: WatchroomDetails;
  isOwner: boolean;
  onCopyLink: () => void;
  onRoomUpdated: () => void;
  onRoomDeleted: () => void;
}

export function RoomHeader({ room, isOwner, onCopyLink, onRoomUpdated, onRoomDeleted }: RoomHeaderProps) {
  const [confirmDeleteDialog, setConfirmDeleteDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDeleteRoom = async () => {
    try {
      setIsProcessing(true);
      await deleteWatchroom(room.id);
      toast.success('Watch room deleted successfully!');
      onRoomDeleted();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete room.';

      if (errorMessage.includes('Too many requests') || errorMessage.includes('Rate limit')) {
        toast.error('Slow down!', {
          description: 'Wait a moment before trying again.',
        });
      } else {
        toast.error('Could not delete watch room. Please try again.');
      }
      setIsProcessing(false);
      setConfirmDeleteDialog(false);
    }
  };

  return (
    <>
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
                onClick={onCopyLink}
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
                    onRoomUpdated={onRoomUpdated}
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
    </>
  );
}
