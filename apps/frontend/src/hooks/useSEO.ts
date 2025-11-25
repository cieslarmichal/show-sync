import { useEffect } from 'react';
import { updateMetaTags, injectStructuredData, type SEOConfig } from '../utils/seo';

/**
 * Custom hook to manage SEO meta tags for a page
 *
 * @example
 * useSEO({
 *   title: 'Shows - ShowSync',
 *   description: 'Browse and rate TV shows',
 * });
 */
export function useSEO(config: Partial<SEOConfig>): void {
  useEffect(() => {
    updateMetaTags(config);

    // Cleanup: restore defaults when component unmounts
    return () => {
      updateMetaTags({});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.title, config.description, config.canonical]);
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
