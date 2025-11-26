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
import { WatchroomFiltersSection } from './WatchroomFiltersSection';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required').max(64, 'Name must be at most 64 characters'),
  description: z.string().max(256, 'Description must be at most 256 characters').optional(),
  availablePlatforms: z.array(z.string()).optional(),
  seriesLengthPreference: z.enum(['all', 'excludeMiniSeries', 'onlyMiniSeries']).optional(),
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
      availablePlatforms: [],
      seriesLengthPreference: 'all',
    },
  });

  async function onSubmit(values: FormValues) {
    try {
      await createWatchroom({
        name: values.name,
        description: values.description || undefined,
        availablePlatforms: values.availablePlatforms,
        seriesLengthPreference: values.seriesLengthPreference,
      });

      toast.success('Watch room created successfully!');
      setOpen(false);
      form.reset();
      onRoomCreated();
    } catch {
      toast.error('Could not create watch room. Try a different name or try again later.');
    }
  }

  const buttonElement = (
    <Button disabled={disabled}>
      <Plus className="w-4 h-4 mr-2" />
      Create Watch Room
    </Button>
  );

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
    >
      {disabled && disabledReason ? (
        <div className="inline-flex flex-col gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="inline-block">{buttonElement}</div>
            </TooltipTrigger>
            <TooltipContent
              side="bottom"
              className="hidden sm:block"
            >
              <p>{disabledReason}</p>
            </TooltipContent>
          </Tooltip>
          <p className="text-xs text-muted-foreground sm:hidden">{disabledReason}</p>
        </div>
      ) : (
        <DialogTrigger asChild>{buttonElement}</DialogTrigger>
      )}
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Watch Room</DialogTitle>
        </DialogHeader>
        <DialogDescription>Get TV show suggestions based on what you like.</DialogDescription>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-5"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel htmlFor="create-room-name">Room Name</FormLabel>
                  <FormControl>
                    <Input
                      id="create-room-name"
                      placeholder="Family Movie Night"
                      aria-invalid={!!fieldState.error}
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
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel htmlFor="create-room-description">Description (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      id="create-room-description"
                      placeholder="Tell us what kind of shows you're looking for..."
                      aria-invalid={!!fieldState.error}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <WatchroomFiltersSection control={form.control} />
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
                {form.formState.isSubmitting ? 'Creating...' : 'Create Watch Room'}
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
