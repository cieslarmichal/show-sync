import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { StrictMode, lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { AuthContextProvider } from './context/AuthContextProvider.tsx';
import { SeriesContextProvider } from './context/SeriesContextProvider.tsx';
import { ThemeContextProvider } from './context/ThemeContextProvider.tsx';
import { useStructuredData } from './hooks/useSEO.ts';

import Root from './pages/Root';
import { CookiesProvider } from 'react-cookie';
import { TooltipProvider } from './components/ui/Tooltip.tsx';
import PrivateRoute from './auth/privateRoute.tsx';

// Lazy load pages for code splitting
const HomePage = lazy(() => import('./pages/HomePage.tsx'));
const DashboardPage = lazy(() => import('./pages/DashboardPage.tsx'));
const LogoutPage = lazy(() => import('./pages/LogoutPage.tsx'));
const LoginPage = lazy(() => import('./pages/LoginPage.tsx'));
const RegisterPage = lazy(() => import('./pages/RegisterPage.tsx'));
const OAuthCallbackPage = lazy(() => import('./pages/OAuthCallbackPage.tsx'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage.tsx'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage.tsx'));
const VerifyEmailPage = lazy(() => import('./pages/VerifyEmailPage.tsx'));
const SeriesPage = lazy(() => import('./pages/SeriesPage.tsx'));
const WatchlistPage = lazy(() => import('./pages/WatchlistPage.tsx'));
const WatchRoomsPage = lazy(() => import('./pages/WatchRoomsPage.tsx'));
const ProfilePage = lazy(() => import('./pages/ProfilePage.tsx'));
const JoinWatchRoomPage = lazy(() => import('./pages/JoinWatchRoomPage.tsx'));
const WatchRoomDetailsPage = lazy(() => import('./pages/WatchRoomDetailsPage.tsx'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage.tsx'));

// Loading fallback component
const PageLoader = () => {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-lg text-muted-foreground">{t('common.loading')}</div>
    </div>
  );
};

const router = createBrowserRouter([
  {
    path: '/',
    element: <Root />,
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<PageLoader />}>
            <HomePage />
          </Suspense>
        ),
      },
      {
        path: '/dashboard',
        element: (
          <Suspense fallback={<PageLoader />}>
            <PrivateRoute>
              <DashboardPage />
            </PrivateRoute>
          </Suspense>
        ),
      },
      {
        path: '/login',
        element: (
          <Suspense fallback={<PageLoader />}>
            <LoginPage />
          </Suspense>
        ),
      },
      {
        path: '/register',
        element: (
          <Suspense fallback={<PageLoader />}>
            <RegisterPage />
          </Suspense>
        ),
      },
      {
        path: '/auth/callback',
        element: (
          <Suspense fallback={<PageLoader />}>
            <OAuthCallbackPage />
          </Suspense>
        ),
      },
      {
        path: '/forgot-password',
        element: (
          <Suspense fallback={<PageLoader />}>
            <ForgotPasswordPage />
          </Suspense>
        ),
      },
      {
        path: '/new-password',
        element: (
          <Suspense fallback={<PageLoader />}>
            <ResetPasswordPage />
          </Suspense>
        ),
      },
      {
        path: '/verify-email',
        element: (
          <Suspense fallback={<PageLoader />}>
            <VerifyEmailPage />
          </Suspense>
        ),
      },
      {
        path: '/logout',
        element: (
          <Suspense fallback={<PageLoader />}>
            <PrivateRoute>
              <LogoutPage />
            </PrivateRoute>
          </Suspense>
        ),
      },
      {
        path: '/series',
        element: (
          <Suspense fallback={<PageLoader />}>
            <PrivateRoute>
              <SeriesPage />
            </PrivateRoute>
          </Suspense>
        ),
      },
      {
        path: '/watchlist',
        element: (
          <Suspense fallback={<PageLoader />}>
            <PrivateRoute>
              <WatchlistPage />
            </PrivateRoute>
          </Suspense>
        ),
      },
      {
        path: '/watchrooms',
        element: (
          <Suspense fallback={<PageLoader />}>
            <PrivateRoute>
              <WatchRoomsPage />
            </PrivateRoute>
          </Suspense>
        ),
      },
      {
        path: '/watchrooms/:watchroomId',
        element: (
          <Suspense fallback={<PageLoader />}>
            <PrivateRoute>
              <WatchRoomDetailsPage />
            </PrivateRoute>
          </Suspense>
        ),
      },
      {
        path: '/watchrooms/public/:publicLinkId',
        element: (
          <Suspense fallback={<PageLoader />}>
            <JoinWatchRoomPage />
          </Suspense>
        ),
      },
      {
        path: '/my-profile',
        element: (
          <Suspense fallback={<PageLoader />}>
            <PrivateRoute>
              <ProfilePage />
            </PrivateRoute>
          </Suspense>
        ),
      },
      {
        path: '*',
        element: (
          <Suspense fallback={<PageLoader />}>
            <NotFoundPage />
          </Suspense>
        ),
      },
    ],
  },
]);

function AppContent() {
  useStructuredData();

  return (
    <StrictMode>
      <ThemeContextProvider>
        <CookiesProvider>
          <AuthContextProvider>
            <SeriesContextProvider>
              <TooltipProvider>
                <RouterProvider router={router} />
              </TooltipProvider>
            </SeriesContextProvider>
          </AuthContextProvider>
        </CookiesProvider>
      </ThemeContextProvider>
    </StrictMode>
  );
}

function App() {
  return <AppContent />;
}

export default App;
