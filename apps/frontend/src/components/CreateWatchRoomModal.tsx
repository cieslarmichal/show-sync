import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { z } from 'zod';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/Button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/Dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/Form';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/Tooltip';
import { createWatchroom } from '../api/queries/watchroom';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required').max(64, 'Name must be at most 64 characters'),
  description: z.string().max(256, 'Description must be at most 256 characters').optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface CreateWatchRoomModalProps {
  onRoomCreated: () => void;
  disabled?: boolean;
  disabledReason?: string;
}

export function CreateWatchRoomModal({ onRoomCreated, disabled = false, disabledReason }: CreateWatchRoomModalProps) {
  const [open, setOpen] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: 'onTouched',
    defaultValues: {
      name: '',
      description: '',
    },
  });

  async function onSubmit(values: FormValues) {
    try {
      await createWatchroom({
        name: values.name,
        description: values.description || undefined,
      });

      toast.success('Watch room created successfully!');
      setOpen(false);
      form.reset();
      onRoomCreated();
    } catch {
      toast.error('Failed to create watch room. Please try again.');
    }
  }

  const buttonElement = (
    <Button disabled={disabled}>
      <Plus className="w-4 h-4 mr-2" />
      Create Room
    </Button>
  );

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
    >
      {disabled && disabledReason ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="inline-block">{buttonElement}</div>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>{disabledReason}</p>
          </TooltipContent>
        </Tooltip>
      ) : (
        <DialogTrigger asChild>{buttonElement}</DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Watch Room</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          Create a new watch room to discover your next favorite series. Use the description to tell the AI what you're
          looking for!
        </DialogDescription>
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
                  <FormLabel htmlFor="create-room-name">Room Name</FormLabel>
                  <FormControl>
                    <Input
                      id="create-room-name"
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
                  <FormLabel htmlFor="create-room-description">AI Prompt (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      id="create-room-description"
                      placeholder="I'm looking for something light and funny, maybe a comedy series with strong character development..."
                      {...field}
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground mt-1">
                    💡 Describe your preferences, mood, or what you're looking for. The AI will use this to recommend
                    series that match your interests.
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
                {form.formState.isSubmitting ? 'Creating...' : 'Create Room'}
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
