/**
 * SEO utility functions for managing meta tags, Open Graph, and Twitter Cards
 */

export interface SEOConfig {
  title: string;
  description: string;
  keywords?: string | string[];
  ogImage?: string;
  ogType?: 'website' | 'article';
  canonical?: string;
  noindex?: boolean;
  nofollow?: boolean;
  locale?: string;
}

const DEFAULT_SEO: SEOConfig = {
  title: 'ShowSync - Rekomendacje Seriali AI dla Ciebie i Grup',
  description:
    'Odkryj swój kolejny ulubiony serial dzięki rekomendacjom AI. Idealne do samotnego oglądania lub wspólnych seansów. Przestań przewijać i zacznij oglądać.',
  keywords: [
    'rekomendacje seriali',
    'rekomendacje ai',
    'personalizowane rekomendacje',
    'wspólne oglądanie',
    'rekomendacje grupowe',
    'dopasowanie seriali',
    'seriale tv',
    'oglądanie razem',
    'rekomendacje streamingu',
    'co obejrzeć',
    'oglądanie solo',
    'indywidualne rekomendacje',
  ],
  ogType: 'website',
  locale: 'pl_PL',
};

/**
 * Updates document meta tags for SEO
 */
export function updateMetaTags(config: Partial<SEOConfig>): void {
  const seo = { ...DEFAULT_SEO, ...config };

  // Update title
  document.title = seo.title;

  // Update html lang attribute
  if (seo.locale) {
    const lang = seo.locale.split('_')[0];
    document.documentElement.lang = lang;
  }

  // Update or create meta tags
  updateMetaTag('name', 'description', seo.description);

  if (seo.keywords) {
    const keywordsString = Array.isArray(seo.keywords) ? seo.keywords.join(', ') : seo.keywords;
    updateMetaTag('name', 'keywords', keywordsString);
  }

  // Robots meta
  const robotsContent = [];
  if (seo.noindex) robotsContent.push('noindex');
  if (seo.nofollow) robotsContent.push('nofollow');
  if (robotsContent.length > 0) {
    updateMetaTag('name', 'robots', robotsContent.join(', '));
  } else {
    updateMetaTag('name', 'robots', 'index, follow');
  }

  // Open Graph tags
  updateMetaTag('property', 'og:title', seo.title);
  updateMetaTag('property', 'og:description', seo.description);
  updateMetaTag('property', 'og:type', seo.ogType || 'website');
  updateMetaTag('property', 'og:url', seo.canonical || window.location.href);
  updateMetaTag('property', 'og:locale', seo.locale || 'en_US');

  if (seo.ogImage) {
    updateMetaTag('property', 'og:image', seo.ogImage);
  }

  // Twitter Card tags
  updateMetaTag('name', 'twitter:card', 'summary_large_image');
  updateMetaTag('name', 'twitter:title', seo.title);
  updateMetaTag('name', 'twitter:description', seo.description);

  if (seo.ogImage) {
    updateMetaTag('name', 'twitter:image', seo.ogImage);
  }

  // Canonical URL
  updateCanonicalLink(seo.canonical || window.location.href);
}

/**
 * Helper to update or create a meta tag
 */
function updateMetaTag(attribute: 'name' | 'property', key: string, content: string): void {
  let element = document.querySelector(`meta[${attribute}="${key}"]`);

  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }

  element.setAttribute('content', content);
}

/**
 * Update or create canonical link
 */
function updateCanonicalLink(url: string): void {
  let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;

  if (!canonical) {
    canonical = document.createElement('link');
    canonical.rel = 'canonical';
    document.head.appendChild(canonical);
  }

  canonical.href = url;
}

/**
 * Generate structured data (JSON-LD) for rich snippets
 */
export function generateStructuredData(type: 'WebSite' | 'Organization' | 'WebApplication'): string {
  const baseUrl = window.location.origin;

  const schemas: Record<string, unknown> = {
    WebSite: {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'ShowSync',
      description: 'Rekomendacje seriali AI dla grup',
      url: baseUrl,
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${baseUrl}/series?q={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
    },
    Organization: {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'ShowSync',
      description: 'Znajdź idealny serial dla Twojej grupy',
      url: baseUrl,
      logo: `${baseUrl}/logo.svg`,
      contactPoint: {
        '@type': 'ContactPoint',
        email: 'contact@show-sync.com',
        telephone: '+48-795-252-322',
        contactType: 'Customer Service',
        areaServed: 'Worldwide',
        availableLanguage: ['Polish', 'English'],
      },
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Cracow',
        addressCountry: 'PL',
      },
    },
    WebApplication: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'ShowSync',
      description: 'Rekomendacje seriali AI dla grup i wspólnych seansów',
      url: baseUrl,
      applicationCategory: 'Entertainment',
      operatingSystem: 'Web',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
    },
  };

  return JSON.stringify(schemas[type]);
}

/**
 * Inject structured data into the document
 */
export function injectStructuredData(type: 'WebSite' | 'Organization' | 'WebApplication'): void {
  const id = `structured-data-${type.toLowerCase()}`;
  let script = document.getElementById(id) as HTMLScriptElement;

  if (!script) {
    script = document.createElement('script');
    script.id = id;
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }

  script.textContent = generateStructuredData(type);
}
