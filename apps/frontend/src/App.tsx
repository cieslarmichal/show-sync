import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { StrictMode } from 'react';
import { AuthContextProvider } from './context/AuthContextProvider.tsx';
import { SeriesContextProvider } from './context/SeriesContextProvider.tsx';
import { useStructuredData } from './hooks/useSEO.ts';

import Root from './pages/Root';
import { CookiesProvider } from 'react-cookie';
import HomePage from './pages/HomePage.tsx';
import DashboardPage from './pages/DashboardPage.tsx';
import { TooltipProvider } from './components/ui/Tooltip.tsx';
import PrivateRoute from './auth/privateRoute.tsx';
import LogoutPage from './pages/LogoutPage.tsx';
import LoginPage from './pages/LoginPage.tsx';
import RegisterPage from './pages/RegisterPage.tsx';
import ForgotPasswordPage from './pages/ForgotPasswordPage.tsx';
import ResetPasswordPage from './pages/ResetPasswordPage.tsx';
import SeriesPage from './pages/SeriesPage.tsx';
import WatchRoomsPage from './pages/WatchRoomsPage.tsx';
import ProfilePage from './pages/ProfilePage.tsx';
import JoinWatchRoomPage from './pages/JoinWatchRoomPage.tsx';
import WatchRoomDetailsPage from './pages/WatchRoomDetailsPage.tsx';
import NotFoundPage from './pages/NotFoundPage.tsx';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Root />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: '/dashboard',
        element: (
          <PrivateRoute>
            <DashboardPage />
          </PrivateRoute>
        ),
      },
      {
        path: '/login',
        element: <LoginPage />,
      },
      {
        path: '/register',
        element: <RegisterPage />,
      },
      {
        path: '/forgot-password',
        element: <ForgotPasswordPage />,
      },
      {
        path: '/new-password',
        element: <ResetPasswordPage />,
      },
      {
        path: '/logout',
        element: (
          <PrivateRoute>
            <LogoutPage />
          </PrivateRoute>
        ),
      },
      {
        path: '/series',
        element: (
          <PrivateRoute>
            <SeriesPage />
          </PrivateRoute>
        ),
      },
      {
        path: '/watchrooms',
        element: (
          <PrivateRoute>
            <WatchRoomsPage />
          </PrivateRoute>
        ),
      },
      {
        path: '/watchrooms/:watchroomId',
        element: (
          <PrivateRoute>
            <WatchRoomDetailsPage />
          </PrivateRoute>
        ),
      },
      {
        path: '/watchrooms/public/:publicLinkId',
        element: <JoinWatchRoomPage />,
      },
      {
        path: '/my-profile',
        element: (
          <PrivateRoute>
            <ProfilePage />
          </PrivateRoute>
        ),
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
]);

function AppContent() {
  // Inject structured data for SEO
  useStructuredData();

  return (
    <StrictMode>
      <CookiesProvider>
        <AuthContextProvider>
          <SeriesContextProvider>
            <TooltipProvider>
              <RouterProvider router={router} />
            </TooltipProvider>
          </SeriesContextProvider>
        </AuthContextProvider>
      </CookiesProvider>
    </StrictMode>
  );
}

function App() {
  return <AppContent />;
}

export default App;
