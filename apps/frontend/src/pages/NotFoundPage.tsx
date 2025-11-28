import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { useTranslation } from 'react-i18next';
import { useSEO } from '../hooks/useSEO';

export default function NotFoundPage() {
  const { t } = useTranslation();
  
  useSEO('notFound');

  return (
    <div className="flex min-h-[calc(100vh-80px)] flex-col items-center justify-center px-4">
      <div className="text-center">
        <h1 className="mb-2 text-9xl font-bold text-primary">404</h1>
        <h2 className="mb-4 text-3xl font-semibold text-foreground">{t('notFound.title')}</h2>
        <p className="mb-8 text-lg text-muted-foreground">{t('notFound.description')}</p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link to="/">
            <Button
              variant="default"
              size="lg"
            >
              {t('notFound.goHome')}
            </Button>
          </Link>
          <Link to="/dashboard">
            <Button
              variant="outline"
              size="lg"
            >
              {t('notFound.goDashboard')}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
