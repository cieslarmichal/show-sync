import { Globe } from 'lucide-react';
import { Button } from './ui/Button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/DropdownMenu';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../hooks/useLanguage';

export function LanguageToggle() {
  const { t } = useTranslation();
  const { currentLanguage, changeLanguage } = useLanguage();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 hover:bg-accent transition-colors"
          aria-label={t('language.toggle')}
        >
          <Globe className="h-[18px] w-[18px]" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => changeLanguage('en')}
          className="cursor-pointer"
        >
          <span className="mr-2">🇬🇧</span>
          <span>{t('language.en')}</span>
          {currentLanguage === 'en' && <span className="ml-auto">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => changeLanguage('pl')}
          className="cursor-pointer"
        >
          <span className="mr-2">🇵🇱</span>
          <span>{t('language.pl')}</span>
          {currentLanguage === 'pl' && <span className="ml-auto">✓</span>}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
