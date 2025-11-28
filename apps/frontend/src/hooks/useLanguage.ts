import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { updateUserLanguage } from '../api/queries/updateUserLanguage';

export type Language = 'en' | 'pl';

export function useLanguage() {
  const { i18n } = useTranslation();
  const { userData } = useAuth();

  const currentLanguage = i18n.language as Language;

  const changeLanguage = async (lng: Language) => {
    i18n.changeLanguage(lng);

    // Update backend if user is authenticated
    if (userData) {
      try {
        await updateUserLanguage({ language: lng });
      } catch (error) {
        console.error('Failed to update user language preference:', error);
      }
    }
  };

  return {
    currentLanguage,
    changeLanguage,
  };
}
