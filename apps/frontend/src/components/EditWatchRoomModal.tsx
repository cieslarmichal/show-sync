import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useState, useEffect } from 'react';
import { z } from 'zod';
import { Pencil } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/Dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/Form';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { updateWatchroom } from '../api/queries/watchroom';
import { DialogDescription } from '@radix-ui/react-dialog';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required').max(64, 'Name must be at most 64 characters'),
  description: z.string().max(256, 'Description must be at most 256 characters').optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface EditWatchRoomModalProps {
  watchroomId: string;
  currentName: string;
  currentDescription?: string;
  onRoomUpdated: () => void;
}

export function EditWatchRoomModal({
  watchroomId,
  currentName,
  currentDescription,
  onRoomUpdated,
}: EditWatchRoomModalProps) {
  const [open, setOpen] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: 'onTouched',
    defaultValues: {
      name: currentName,
      description: currentDescription || '',
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: currentName,
        description: currentDescription || '',
      });
    }
  }, [open, currentName, currentDescription, form]);

  async function onSubmit(values: FormValues) {
    try {
      await updateWatchroom(watchroomId, {
        name: values.name,
        description: values.description || undefined,
      });

      toast.success('Watch room updated successfully!');
      setOpen(false);
      onRoomUpdated();
    } catch {
      toast.error('Failed to update watch room. Please try again.');
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
    >
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="sm:self-start shadow-md hover:shadow-lg transition-all"
        >
          <Pencil className="w-4 h-4 mr-2" />
          Edit Room
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Watch Room</DialogTitle>
        </DialogHeader>
        <DialogDescription>Update details of your watch room.</DialogDescription>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-5"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="edit-room-name">Room Name</FormLabel>
                  <FormControl>
                    <Input
                      id="edit-room-name"
                      placeholder="Weekend Movie Night"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="edit-room-description">Description (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      id="edit-room-description"
                      placeholder="Looking for a great series to watch together..."
                      {...field}
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground mt-1">
                    Tip: Add preferences for AI recommendations (e.g., "something light and funny" or "dark thriller
                    series")
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Form>
        {form.formState.errors.root && (
          <div className="text-destructive text-sm mt-4 text-center bg-destructive/10 border border-destructive/20 rounded-md p-3">
            {form.formState.errors.root.message}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
