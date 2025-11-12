import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { useState, useEffect } from 'react';
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

const formSchema = z.object({
  rating: z.number().min(1).max(5),
  foundSomething: z.enum(['true', 'false']),
  comment: z.string().max(1000, 'Comment must be at most 1000 characters').optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface RecommendationFeedbackFormProps {
  watchroomId: string;
  recommendationRequestId: string;
}

export function RecommendationFeedbackForm({ watchroomId, recommendationRequestId }: RecommendationFeedbackFormProps) {
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [feedbackExists, setFeedbackExists] = useState(false);

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
      toast.success('Thank you for your feedback!');
    } catch (error: unknown) {
      if (error instanceof Error && 'status' in error && (error as { status: number }).status === 409) {
        toast.error('You have already submitted feedback for these recommendations.');
        setFeedbackExists(true);
      } else {
        toast.error('Failed to submit feedback. Please try again.');
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
    <Card>
      <CardHeader>
        <CardTitle>📊 How would you rate these recommendations?</CardTitle>
        <CardDescription>Your feedback helps us improve our recommendation algorithm</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6"
          >
            {/* Star Rating */}
            <FormField
              control={form.control}
              name="rating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rating</FormLabel>
                  <FormControl>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          className="focus:outline-none focus:ring-2 focus:ring-primary rounded cursor-pointer"
                          onClick={() => field.onChange(star)}
                          onMouseEnter={() => setHoveredStar(star)}
                          onMouseLeave={() => setHoveredStar(null)}
                        >
                          <Star
                            className={`w-8 h-8 transition-colors ${
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
                <FormItem>
                  <FormLabel>Did you find something to watch?</FormLabel>
                  <FormControl>
                    <RadioGroup
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem
                          value="true"
                          id="found-yes"
                        />
                        <Label
                          htmlFor="found-yes"
                          className="cursor-pointer"
                        >
                          Yes
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem
                          value="false"
                          id="found-no"
                        />
                        <Label
                          htmlFor="found-no"
                          className="cursor-pointer"
                        >
                          No
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
                <FormItem>
                  <FormLabel>Tell us more (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="What did you like or dislike about these recommendations?"
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
              className="w-full"
            >
              {form.formState.isSubmitting ? 'Submitting...' : 'Submit Feedback'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
