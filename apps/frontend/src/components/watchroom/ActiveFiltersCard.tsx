import { Filter, Film } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';

interface ActiveFiltersCardProps {
  seriesLengthPreference: 'all' | 'excludeMiniSeries' | 'onlyMiniSeries';
}

export function ActiveFiltersCard({ seriesLengthPreference }: ActiveFiltersCardProps) {
  const { t } = useTranslation();
  const hasActiveFilters = seriesLengthPreference !== 'all';

  const SERIES_LENGTH_LABELS = {
    all: t('watchroom.roomInfo.seriesLength.all'),
    excludeMiniSeries: t('watchroom.roomInfo.seriesLength.excludeMiniSeries'),
    onlyMiniSeries: t('watchroom.roomInfo.seriesLength.onlyMiniSeries'),
  };

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
          <CardTitle className="text-sm sm:text-base font-bold tracking-tight">
            {t('watchroom.activeFilters')}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {/* Series Length */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Film className="w-3.5 h-3.5" />
            <span className="font-medium">{t('watchroom.seriesLength')}</span>
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
