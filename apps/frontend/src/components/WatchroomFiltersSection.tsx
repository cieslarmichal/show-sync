import { Control } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { FormControl, FormField, FormItem, FormLabel } from '@/components/ui/Form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/RadioGroup';
import { Label } from '@/components/ui/Label';

interface WatchroomFiltersSectionProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>;
}

export function WatchroomFiltersSection({ control }: WatchroomFiltersSectionProps) {
  const { t } = useTranslation();

  const SERIES_LENGTH_OPTIONS = [
    {
      value: 'all',
      label: t('watchroom.roomInfo.seriesLength.all'),
      description: t('watchroom.filters.allDescription'),
    },
    {
      value: 'excludeMiniSeries',
      label: t('watchroom.roomInfo.seriesLength.excludeMiniSeries'),
      description: t('watchroom.filters.excludeDescription'),
    },
    {
      value: 'onlyMiniSeries',
      label: t('watchroom.roomInfo.seriesLength.onlyMiniSeries'),
      description: t('watchroom.filters.onlyDescription'),
    },
  ] as const;

  return (
    <div className="space-y-4 border-t pt-5">
      {/* Series Length Preference */}
      <FormField
        control={control}
        name="seriesLengthPreference"
        render={({ field }) => (
          <FormItem className="space-y-3">
            <FormLabel className="text-sm font-semibold">{t('watchroom.seriesLength')}</FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                defaultValue={field.value}
                className="space-y-2"
              >
                {SERIES_LENGTH_OPTIONS.map((option) => (
                  <div
                    key={option.value}
                    className="flex items-start space-x-3 p-3 rounded-lg border border-border hover:bg-accent/50 hover:border-primary/30 transition-all cursor-pointer"
                    onClick={() => field.onChange(option.value)}
                  >
                    <RadioGroupItem
                      value={option.value}
                      id={`length-${option.value}`}
                      className="mt-0.5 cursor-pointer"
                    />
                    <div className="flex-1">
                      <Label
                        htmlFor={`length-${option.value}`}
                        className="text-sm font-medium cursor-pointer block"
                      >
                        {option.label}
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{option.description}</p>
                    </div>
                  </div>
                ))}
              </RadioGroup>
            </FormControl>
          </FormItem>
        )}
      />
    </div>
  );
}
