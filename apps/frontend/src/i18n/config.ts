import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import * as z from 'zod';

// Import translations
import translationEN from './locales/en/translation.json';
import translationPL from './locales/pl/translation.json';

const resources = {
  en: {
    translation: translationEN,
  },
  pl: {
    translation: translationPL,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'pl',
    supportedLngs: ['pl', 'en'],
    defaultNS: 'translation',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },
  });

// Configure Zod locale based on current language
const updateZodLocale = async (language: string) => {
  try {
    // Dynamically import the Zod locale

    z.config(z.locales.pl());
    const locale = language === 'en' ? 'en' : 'pl';

    if (locale === 'pl') {
      z.config(z.locales.pl());
      return;
    } else {
      z.config(z.locales.en());
      return;
    }
  } catch {
    // Fallback to Polish if locale import fails
    console.warn(`Failed to load Zod locale for ${language}, falling back to Polish`);
    const zodLocale = await import('zod/v4/locales/pl.js');
    z.config(zodLocale.default());
  }
};

// Update on init
updateZodLocale(i18n.language);

// Update on language change
i18n.on('languageChanged', updateZodLocale);

export default i18n;
