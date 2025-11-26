import { Filter, Film } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';

interface ActiveFiltersCardProps {
  seriesLengthPreference: 'all' | 'excludeMiniSeries' | 'onlyMiniSeries';
}

const SERIES_LENGTH_LABELS = {
  all: 'All series',
  excludeMiniSeries: 'No mini-series',
  onlyMiniSeries: 'Only mini-series',
};

export function ActiveFiltersCard({ seriesLengthPreference }: ActiveFiltersCardProps) {
  const hasActiveFilters = seriesLengthPreference !== 'all';

  if (!hasActiveFilters) {
    return null;
  }

  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
            <Filter className="w-4 h-4 text-primary" />
          </div>
          <CardTitle className="text-sm sm:text-base font-bold tracking-tight">Active Filters</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {/* Series Length */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Film className="w-3.5 h-3.5" />
            <span className="font-medium">Series Length</span>
          </div>
          <Badge
            variant="secondary"
            className="text-xs font-normal"
          >
            {SERIES_LENGTH_LABELS[seriesLengthPreference]}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
