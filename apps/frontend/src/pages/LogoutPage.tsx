import { useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function LogoutPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { clearUserData } = useContext(AuthContext);

  useEffect(() => {
    const handleLogout = async () => {
      await clearUserData();
      navigate('/');
    };

    handleLogout();
  }, [clearUserData, navigate]);

  return <div>{t('auth.logout.loggingOut')}</div>;
}
