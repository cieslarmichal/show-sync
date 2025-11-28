import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { updateMetaTags, injectStructuredData, type SEOConfig } from '../utils/seo';

/**
 * Custom hook to manage SEO meta tags for a page
 *
 * @example
 * // Use with translation key
 * useSEO('home');
 *
 * // Use with custom config (overrides translations)
 * useSEO({
 *   title: 'Shows - ShowSync',
 *   description: 'Browse and rate TV shows',
 * });
 */
export function useSEO(configOrKey: Partial<SEOConfig> | string): void {
  const { t, i18n } = useTranslation();

  useEffect(() => {
    let config: Partial<SEOConfig>;

    // If a string is passed, use it as a translation key
    if (typeof configOrKey === 'string') {
      const translationKey = `seo.${configOrKey}`;

      config = {
        title: t(`${translationKey}.title`),
        description: t(`${translationKey}.description`),
        keywords: t(`${translationKey}.keywords`, ''),
        noindex: t(`${translationKey}.noindex`, { defaultValue: false }) as unknown as boolean,
        locale: i18n.language === 'pl' ? 'pl_PL' : 'en_US',
      };
    } else {
      // Use the provided config object
      config = {
        ...configOrKey,
        locale: i18n.language === 'pl' ? 'pl_PL' : 'en_US',
      };
    }

    updateMetaTags(config);

    // Cleanup: restore defaults when component unmounts
    return () => {
      updateMetaTags({});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeof configOrKey === 'string' ? configOrKey : JSON.stringify(configOrKey), i18n.language]);
}

/**
 * Hook to inject structured data once on app mount
 */
export function useStructuredData(): void {
  useEffect(() => {
    injectStructuredData('WebSite');
    injectStructuredData('Organization');
    injectStructuredData('WebApplication');
  }, []);
}
