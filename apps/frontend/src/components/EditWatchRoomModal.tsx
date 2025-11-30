import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useState, useEffect } from 'react';
import { z } from 'zod';
import { Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/Dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/Form';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { updateWatchroom } from '../api/queries/watchroom';
import { DialogDescription } from '@radix-ui/react-dialog';
import { WatchroomFiltersSection } from './WatchroomFiltersSection';

interface EditWatchRoomModalProps {
  watchroomId: string;
  currentName: string;
  currentDescription?: string;
  currentSeriesLengthPreference?: 'all' | 'excludeMiniSeries' | 'onlyMiniSeries';
  onRoomUpdated: () => void;
}

export function EditWatchRoomModal({
  watchroomId,
  currentName,
  currentDescription,
  currentSeriesLengthPreference,
  onRoomUpdated,
}: EditWatchRoomModalProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const formSchema = z.object({
    name: z.string().min(1, t('validation.roomNameRequired')).max(64, t('validation.nameMaxLength')),
    description: z.string().max(256, t('validation.descriptionMaxLength')).optional(),
    seriesLengthPreference: z.enum(['all', 'excludeMiniSeries', 'onlyMiniSeries']).optional(),
  });

  type FormValues = z.infer<typeof formSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: 'onTouched',
    defaultValues: {
      name: currentName,
      description: currentDescription || '',
      seriesLengthPreference: currentSeriesLengthPreference || 'all',
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: currentName,
        description: currentDescription || '',
        seriesLengthPreference: currentSeriesLengthPreference || 'all',
      });
    }
  }, [open, currentName, currentDescription, currentSeriesLengthPreference, form]);

  async function onSubmit(values: FormValues) {
    try {
      const updates: Partial<FormValues> = {};

      if (values.name !== currentName) {
        updates.name = values.name;
      }

      if (values.description !== (currentDescription || '')) {
        updates.description = values.description;
      }

      if (values.seriesLengthPreference !== (currentSeriesLengthPreference || 'all')) {
        updates.seriesLengthPreference = values.seriesLengthPreference;
      }

      if (Object.keys(updates).length === 0) {
        toast.info(t('watchroom.noChanges'));
        setOpen(false);
        return;
      }

      await updateWatchroom(watchroomId, updates);

      toast.success(t('watchroom.updateSuccess'));
      setOpen(false);
      onRoomUpdated();
    } catch {
      toast.error(t('watchroom.updateError'));
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
    >
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="shadow-sm hover:shadow-md transition-all h-8 text-xs"
        >
          <Pencil className="w-3 h-3 mr-1" />
          <span className="hidden sm:inline">{t('watchroom.editRoom')}</span>
          <span className="inline sm:hidden">{t('common.edit')}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('watchroom.editTitle')}</DialogTitle>
        </DialogHeader>
        <DialogDescription>{t('watchroom.createDescription')}</DialogDescription>
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
                  <FormLabel htmlFor="edit-room-name">{t('watchroom.name')}</FormLabel>
                  <FormControl>
                    <Input
                      id="edit-room-name"
                      placeholder={t('watchroom.namePlaceholder')}
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
                  <FormLabel
                    htmlFor="edit-room-description"
                    className="text-base font-semibold"
                  >
                    {t('watchroom.descriptionLabel')}
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      id="edit-room-description"
                      placeholder={t('watchroom.descriptionPlaceholder')}
                      aria-invalid={!!fieldState.error}
                      rows={4}
                      className="resize-none focus:ring-2 focus:ring-primary/20"
                      {...field}
                    />
                  </FormControl>
                  <div className="bg-primary/5 border border-primary/20 rounded-md p-3 mt-2">
                    <p className="text-xs text-foreground leading-relaxed">
                      <span className="font-medium">💡 {t('watchroom.descriptionHintTitle')}</span>
                      <br />
                      {t('watchroom.descriptionHint')}
                    </p>
                  </div>
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
                {t('common.cancel')}
              </Button>
              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? t('watchroom.saving') : t('watchroom.saveChanges')}
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
