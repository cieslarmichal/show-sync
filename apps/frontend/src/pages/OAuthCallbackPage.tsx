import { useEffect, useContext } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Loader } from 'lucide-react';

export default function OAuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshUserData } = useContext(AuthContext);

  useEffect(() => {
    const handleCallback = async () => {
      const accessToken = searchParams.get('access_token');
      const error = searchParams.get('error');

      if (error) {
        navigate('/login?error=oauth_failed');
        return;
      }

      if (!accessToken) {
        navigate('/login');
        return;
      }

      // Store access token (will be stored in memory by AuthContext)
      // The refresh token is already set as HTTP-only cookie by backend

      // Refresh user data to populate AuthContext
      await refreshUserData();

      // Redirect to dashboard
      navigate('/dashboard');
    };

    handleCallback();
  }, [searchParams, navigate, refreshUserData]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <Loader className="h-8 w-8 animate-spin mx-auto text-foreground" />
        <p className="mt-4 text-lg text-muted-foreground">Completing sign in...</p>
      </div>
    </div>
  );
}
