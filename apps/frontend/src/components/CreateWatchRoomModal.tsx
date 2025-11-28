import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { z } from 'zod';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

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

interface CreateWatchRoomModalProps {
  onRoomCreated: () => void;
  disabled?: boolean;
  disabledReason?: string;
}

export function CreateWatchRoomModal({ onRoomCreated, disabled = false, disabledReason }: CreateWatchRoomModalProps) {
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
      name: '',
      description: '',
      seriesLengthPreference: 'all',
    },
  });

  async function onSubmit(values: FormValues) {
    try {
      await createWatchroom({
        name: values.name,
        description: values.description || undefined,
        seriesLengthPreference: values.seriesLengthPreference,
      });

      toast.success(t('watchroom.createSuccess'));
      setOpen(false);
      form.reset();
      onRoomCreated();
    } catch {
      toast.error(t('watchroom.createError'));
    }
  }

  const buttonElement = (
    <Button disabled={disabled}>
      <Plus className="w-4 h-4 mr-2" />
      {t('watchroom.createButton')}
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
          <DialogTitle>{t('watchroom.createTitle')}</DialogTitle>
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
                  <FormLabel htmlFor="create-room-name">{t('watchroom.name')}</FormLabel>
                  <FormControl>
                    <Input
                      id="create-room-name"
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
                    htmlFor="create-room-description"
                    className="text-base font-semibold"
                  >
                    {t('watchroom.descriptionLabel')}
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      id="create-room-description"
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
                {form.formState.isSubmitting ? t('watchroom.creating') : t('watchroom.create')}
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
