import { Control } from 'react-hook-form';
import { FormControl, FormField, FormItem, FormLabel } from '@/components/ui/Form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/RadioGroup';
import { Label } from '@/components/ui/Label';

const SERIES_LENGTH_OPTIONS = [
  { value: 'all', label: 'All series', description: 'No restrictions on series length' },
  { value: 'excludeMiniSeries', label: 'No mini-series', description: 'Exclude single-season short series' },
  { value: 'onlyMiniSeries', label: 'Only mini-series', description: 'Only single-season limited series' },
] as const;

interface WatchroomFiltersSectionProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>;
}

export function WatchroomFiltersSection({ control }: WatchroomFiltersSectionProps) {
  return (
    <div className="space-y-6 border-t pt-4">
      {/* Series Length Preference */}
      <FormField
        control={control}
        name="seriesLengthPreference"
        render={({ field }) => (
          <FormItem className="space-y-3">
            <FormLabel className="text-sm">Series Length</FormLabel>
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
