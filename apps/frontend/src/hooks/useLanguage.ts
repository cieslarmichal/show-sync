import { useTranslation } from 'react-i18next';

export type Language = 'en' | 'pl';

export function useLanguage() {
  const { i18n } = useTranslation();

  const currentLanguage = i18n.language as Language;

  const changeLanguage = (lng: Language) => {
    i18n.changeLanguage(lng);
  };

  return {
    currentLanguage,
    changeLanguage,
  };
}
