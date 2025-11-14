import { useState } from 'react';
import { toast } from 'sonner';
import { Copy, Trash2, Calendar, Users } from 'lucide-react';

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
      <Card className="border-2 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
        <CardHeader className="relative space-y-3 pb-5">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-2xl sm:text-3xl font-bold tracking-tight wrap-break-word flex-1 min-w-0 pr-2">
                {room.name}
              </CardTitle>
              {isOwner && (
                <Badge className="hidden sm:inline-flex shrink-0 bg-primary/10 text-primary border border-primary/20 font-medium whitespace-nowrap">
                  <Users className="w-3 h-3 mr-1" />
                  Owner
                </Badge>
              )}
            </div>

            {room.description && (
              <CardDescription className="text-sm sm:text-base leading-relaxed text-muted-foreground">
                {room.description}
              </CardDescription>
            )}

            <div className="flex items-center text-xs sm:text-sm text-muted-foreground">
              <Calendar className="w-3.5 h-3.5 mr-1.5" />
              <span>
                Created{' '}
                {new Date(room.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-2 border-t border-border/40">
            <Button
              size="sm"
              variant="default"
              onClick={onCopyLink}
              className="shadow-sm hover:shadow-md transition-all h-9"
              data-testid="copy-invite-link-button"
            >
              <Copy className="w-3 h-3 mr-1" />
              <span className="hidden xs:inline">Copy Link</span>
              <span className="inline xs:hidden">Share</span>
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
                  size="sm"
                  variant="outline"
                  onClick={() => setConfirmDeleteDialog(true)}
                  className="shadow-sm hover:shadow-md hover:bg-destructive/10 hover:text-destructive hover:border-destructive transition-all h-9"
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  <span className="hidden xs:inline">Delete Room</span>
                  <span className="inline xs:hidden">Delete</span>
                </Button>
              </>
            )}
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
            <DialogTitle className="text-2xl mb-2">Delete Watch Room?</DialogTitle>
            <DialogDescription className="text-base leading-relaxed">
              Are you sure you want to delete <span className="font-semibold text-foreground">"{room.name}"</span>? This
              will remove all participants and recommendations. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setConfirmDeleteDialog(false)}
              disabled={isProcessing}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteRoom}
              disabled={isProcessing}
              className="w-full sm:w-auto font-semibold"
            >
              {isProcessing ? 'Deleting...' : 'Delete Room'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
