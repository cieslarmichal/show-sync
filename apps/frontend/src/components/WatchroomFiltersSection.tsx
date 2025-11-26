import { Control } from 'react-hook-form';
import { FormControl, FormDescription, FormField, FormItem, FormLabel } from '@/components/ui/Form';
import { Checkbox } from '@/components/ui/Checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/RadioGroup';
import { Label } from '@/components/ui/Label';

const STREAMING_PLATFORMS = ['Netflix', 'HBO Max', 'Disney+', 'Amazon Prime Video', 'Apple TV+', 'Hulu'] as const;

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
      <div>
        <h3 className="text-sm font-medium mb-3">Filters (Optional)</h3>
        <p className="text-xs text-muted-foreground mb-4">
          These filters help narrow down recommendations to match your preferences.
        </p>
      </div>

      {/* Streaming Platforms */}
      <FormField
        control={control}
        name="availablePlatforms"
        render={() => (
          <FormItem>
            <FormLabel className="text-sm">Available Platforms</FormLabel>
            <FormDescription className="text-xs">Select the streaming services you have access to</FormDescription>
            <div className="grid grid-cols-2 gap-3 mt-2">
              {STREAMING_PLATFORMS.map((platform) => (
                <FormField
                  key={platform}
                  control={control}
                  name="availablePlatforms"
                  render={({ field }) => {
                    return (
                      <FormItem
                        key={platform}
                        className="flex flex-row items-center space-x-2 space-y-0"
                      >
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(platform)}
                            onCheckedChange={(checked) => {
                              const current = field.value || [];
                              if (checked) {
                                field.onChange([...current, platform]);
                              } else {
                                field.onChange(current.filter((val: string) => val !== platform));
                              }
                            }}
                          />
                        </FormControl>
                        <Label className="text-sm font-normal cursor-pointer">{platform}</Label>
                      </FormItem>
                    );
                  }}
                />
              ))}
            </div>
          </FormItem>
        )}
      />

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
