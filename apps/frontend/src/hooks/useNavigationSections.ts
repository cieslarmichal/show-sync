import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

export interface NavSection {
  name: string;
  href: string;
  authHref?: string;
  requiresAuth?: boolean;
}

interface User {
  email: string;
}

export const useNavigationSections = (userData: User | null) => {
  const { t } = useTranslation();

  const sections: NavSection[] = useMemo(
    () => [
      { name: t('nav.home'), href: '/', authHref: '/dashboard' },
      { name: t('nav.tvShows'), href: '/series', requiresAuth: true },
      { name: t('nav.watchlist'), href: '/watchlist', requiresAuth: true },
      { name: t('nav.watchRooms'), href: '/watchrooms', requiresAuth: true },
    ],
    [t],
  );

  return useMemo(
    () =>
      sections
        .filter((section) => !section.requiresAuth || userData)
        .map((section) => ({
          ...section,
          href: userData && section.authHref ? section.authHref : section.href,
        })),
    [userData, sections],
  );
};
