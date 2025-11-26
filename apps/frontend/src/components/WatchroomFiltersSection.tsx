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
    <div className="space-y-6 border-t pt-4">
      {/* Series Length Preference */}
      <FormField
        control={control}
        name="seriesLengthPreference"
        render={({ field }) => (
          <FormItem className="space-y-3">
            <FormLabel className="text-sm">{t('watchroom.seriesLength')}</FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                defaultValue={field.value}
                className="space-y-2"
              >
                {SERIES_LENGTH_OPTIONS.map((option) => (
                  <div
                    key={option.value}
                    className="flex items-start space-x-2"
                  >
                    <RadioGroupItem
                      value={option.value}
                      id={`length-${option.value}`}
                      className="mt-0.5"
                    />
                    <div className="flex-1">
                      <Label
                        htmlFor={`length-${option.value}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {option.label}
                      </Label>
                      <p className="text-xs text-muted-foreground mt-0.5">{option.description}</p>
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
