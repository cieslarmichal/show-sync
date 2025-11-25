import { useMemo } from 'react';

export interface NavSection {
  name: string;
  href: string;
  authHref?: string;
  requiresAuth?: boolean;
}

interface User {
  email: string;
}

const sections: NavSection[] = [
  { name: 'Home', href: '/', authHref: '/dashboard' },
  { name: 'TV Shows', href: '/series', requiresAuth: true },
  { name: 'Watchlist', href: '/watchlist', requiresAuth: true },
  { name: 'Watch Rooms', href: '/watchrooms', requiresAuth: true },
];

export const useNavigationSections = (userData: User | null) => {
  return useMemo(
    () =>
      sections
        .filter((section) => !section.requiresAuth || userData)
        .map((section) => ({
          ...section,
          href: userData && section.authHref ? section.authHref : section.href,
        })),
    [userData],
  );
};
