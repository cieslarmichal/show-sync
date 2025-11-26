import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { Star } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/Form';
import { Textarea } from '@/components/ui/Textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/RadioGroup';
import { Label } from '@/components/ui/Label';
import { submitRecommendationFeedback } from '../api/queries/submitRecommendationFeedback';
import { checkRecommendationFeedback } from '../api/queries/checkRecommendationFeedback';

interface RecommendationFeedbackFormProps {
  watchroomId: string;
  recommendationRequestId: string;
}

export function RecommendationFeedbackForm({ watchroomId, recommendationRequestId }: RecommendationFeedbackFormProps) {
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [feedbackExists, setFeedbackExists] = useState(false);
  const { t } = useTranslation();

  const formSchema = z.object({
    rating: z.number().min(1).max(5),
    foundSomething: z.enum(['true', 'false']),
    comment: z.string().max(1000, t('validation.commentMaxLength')).optional(),
  });

  type FormValues = z.infer<typeof formSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: 'onTouched',
    defaultValues: {
      rating: 0,
      foundSomething: undefined,
      comment: '',
    },
  });

  const rating = useWatch({
    control: form.control,
    name: 'rating',
    defaultValue: 0,
  });

  const foundSomething = useWatch({
    control: form.control,
    name: 'foundSomething',
  });

  useEffect(() => {
    const checkFeedback = async () => {
      try {
        const result = await checkRecommendationFeedback(watchroomId, recommendationRequestId);
        setFeedbackExists(result.exists);
      } catch {
        // Silently fail - not critical
      } finally {
        setIsLoading(false);
      }
    };

    checkFeedback();
  }, [watchroomId, recommendationRequestId]);

  async function onSubmit(values: FormValues) {
    try {
      await submitRecommendationFeedback(watchroomId, {
        recommendationRequestId,
        rating: values.rating,
        foundSomething: values.foundSomething === 'true',
        comment: values.comment || undefined,
      });

      setFeedbackExists(true);
      toast.success(t('watchroom.feedback.toast.success'));
    } catch (error: unknown) {
      if (error instanceof Error && 'status' in error && (error as { status: number }).status === 409) {
        toast.error(t('watchroom.feedback.toast.alreadySubmitted'));
        setFeedbackExists(true);
      } else {
        toast.error(t('watchroom.feedback.toast.error'));
      }
    }
  }

  // Don't render if feedback already exists
  if (isLoading) {
    return null;
  }

  if (feedbackExists) {
    return null;
  }

  return (
    <Card className="border-muted bg-muted/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-1.5">
          <span>📊</span>
          <span>{t('watchroom.feedback.title')}</span>
        </CardTitle>
        <CardDescription className="text-[11px]">{t('watchroom.feedback.description')}</CardDescription>
      </CardHeader>
      <CardContent className="pt-2">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-2.5"
          >
            {/* Star Rating */}
            <FormField
              control={form.control}
              name="rating"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="text-xs">{t('watchroom.feedback.ratingLabel')}</FormLabel>
                  <FormControl>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          className="focus:outline-none focus:ring-2 focus:ring-primary rounded cursor-pointer transition-transform active:scale-90"
                          onClick={() => field.onChange(star)}
                          onMouseEnter={() => setHoveredStar(star)}
                          onMouseLeave={() => setHoveredStar(null)}
                        >
                          <Star
                            className={`w-6 h-6 transition-colors ${
                              star <= (hoveredStar ?? field.value)
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300 dark:text-gray-600'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Found Something */}
            <FormField
              control={form.control}
              name="foundSomething"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="text-xs">{t('watchroom.feedback.foundLabel')}</FormLabel>
                  <FormControl>
                    <RadioGroup
                      value={field.value}
                      onValueChange={field.onChange}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-1.5">
                        <RadioGroupItem
                          value="true"
                          id="found-yes"
                        />
                        <Label
                          htmlFor="found-yes"
                          className="cursor-pointer text-xs"
                        >
                          {t('watchroom.feedback.yes')}
                        </Label>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <RadioGroupItem
                          value="false"
                          id="found-no"
                        />
                        <Label
                          htmlFor="found-no"
                          className="cursor-pointer text-xs"
                        >
                          {t('watchroom.feedback.no')}
                        </Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Optional Comment */}
            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="text-xs">{t('watchroom.feedback.commentLabel')}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t('watchroom.feedback.commentPlaceholder')}
                      className="text-xs min-h-16 resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              disabled={form.formState.isSubmitting || !rating || !foundSomething}
              className="w-full h-8 text-xs font-semibold"
            >
              {form.formState.isSubmitting ? t('watchroom.feedback.submitting') : t('watchroom.feedback.submit')}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
