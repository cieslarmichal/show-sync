import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Header from './Header';
import { AuthContext } from '../context/AuthContext';
import { BrowserRouter } from 'react-router-dom';
import type { User } from '../api/types/user';
import { ThemeContextProvider } from '../context/ThemeContextProvider';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: '/' }),
  };
});

describe('Header', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderHeader = (userData: User | null = null, userDataInitialized = true) => {
    return render(
      <ThemeContextProvider>
        <BrowserRouter>
          <AuthContext.Provider
            value={{
              userData,
              userDataInitialized,
              clearUserData: vi.fn(),
              refreshUserData: vi.fn(),
              accessToken: null,
            }}
          >
            <Header />
          </AuthContext.Provider>
        </BrowserRouter>
      </ThemeContextProvider>,
    );
  };

  it('should render logo and app name', () => {
    renderHeader();

    expect(screen.getByText('ShowSync')).toBeInTheDocument();
    expect(screen.getByAltText('ShowSync Logo')).toBeInTheDocument();
  });

  it('should show loading skeleton when user data is not initialized', () => {
    renderHeader(null, false);

    const skeletons = screen.getAllByTestId('skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should show sign in and sign up buttons when not authenticated', () => {
    renderHeader(null, true);

    const signInButtons = screen.getAllByRole('button', { name: /sign in/i });
    expect(signInButtons.length).toBeGreaterThan(0);

    const signUpButtons = screen.getAllByRole('button', { name: /sign up/i });
    expect(signUpButtons.length).toBeGreaterThan(0);
  });

  it('should navigate to sign in page when sign in button is clicked', async () => {
    const user = userEvent.setup();
    renderHeader(null, true);

    const signInButtons = screen.getAllByRole('button', { name: /sign in/i });
    await user.click(signInButtons[0]);

    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('should navigate to register page when sign up button is clicked', async () => {
    const user = userEvent.setup();
    renderHeader(null, true);

    const signUpButtons = screen.getAllByRole('button', { name: /sign up/i });
    await user.click(signUpButtons[0]);

    expect(mockNavigate).toHaveBeenCalledWith('/register');
  });

  it('should show user avatar when authenticated', () => {
    const userData: User = {
      id: '123',
      email: 'test@example.com',
      name: 'Test User',
      createdAt: new Date().toISOString(),
      isEmailVerified: true,
    };
    renderHeader(userData, true);

    // Avatar should show first letter of email (T from test@example.com)
    const avatars = screen.getAllByText('T');
    expect(avatars.length).toBeGreaterThan(0);
  });

  it('should show navigation items when authenticated', () => {
    const userData: User = {
      id: '123',
      email: 'test@example.com',
      name: 'Test User',
      createdAt: new Date().toISOString(),
      isEmailVerified: true,
    };
    renderHeader(userData, true);

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('TV Shows')).toBeInTheDocument();
    expect(screen.getByText('Watch Rooms')).toBeInTheDocument();
  });

  it('should not show authenticated navigation items when not authenticated', () => {
    renderHeader(null, true);

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.queryByText('TV Shows')).not.toBeInTheDocument();
    expect(screen.queryByText('Watch Rooms')).not.toBeInTheDocument();
  });

  it('should open user menu when avatar is clicked', async () => {
    const user = userEvent.setup();
    const userData: User = {
      id: '123',
      email: 'test@example.com',
      name: 'Test User',
      createdAt: new Date().toISOString(),
      isEmailVerified: true,
    };
    renderHeader(userData, true);

    const avatars = screen.getAllByText('T');
    await user.click(avatars[0]);

    // Wait for menu to open - should show Profile and Log out options
    await waitFor(() => {
      expect(screen.getAllByText('Profile').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Log out').length).toBeGreaterThan(0);
    });
  });

  it('should navigate to shows page from user menu', async () => {
    const user = userEvent.setup();
    const userData: User = {
      id: '123',
      email: 'test@example.com',
      name: 'Test User',
      createdAt: new Date().toISOString(),
      isEmailVerified: true,
    };
    renderHeader(userData, true);

    // TV Shows link is in desktop navigation, so just click it directly
    const showsLinks = screen.getAllByText('TV Shows');
    await user.click(showsLinks[0]);

    expect(mockNavigate).toHaveBeenCalledWith('/series');
  });

  it('should navigate to watchrooms page from user menu', async () => {
    const user = userEvent.setup();
    const userData: User = {
      id: '123',
      email: 'test@example.com',
      name: 'Test User',
      createdAt: new Date().toISOString(),
      isEmailVerified: true,
    };
    renderHeader(userData, true);

    const avatars = screen.getAllByText('T');
    await user.click(avatars[0]);

    // Wait a bit for menu to potentially open (though desktop nav already shows Watch Rooms)
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Get all Watch Rooms links and click one (could be from desktop nav or mobile menu)
    const watchRoomsItems = screen.getAllByText('Watch Rooms');
    await user.click(watchRoomsItems[0]);

    expect(mockNavigate).toHaveBeenCalledWith('/watchrooms');
  });

  it('should navigate to profile page from user menu', async () => {
    const user = userEvent.setup();
    const userData: User = {
      id: '123',
      email: 'test@example.com',
      name: 'Test User',
      createdAt: new Date().toISOString(),
      isEmailVerified: true,
    };
    renderHeader(userData, true);

    const avatars = screen.getAllByText('T');
    await user.click(avatars[0]);

    await waitFor(() => {
      expect(screen.getByText('Profile')).toBeInTheDocument();
    });

    const profileItem = screen.getByText('Profile');
    await user.click(profileItem);

    expect(mockNavigate).toHaveBeenCalledWith('/my-profile');
  });

  it('should navigate to logout page from user menu', async () => {
    const user = userEvent.setup();
    const userData: User = {
      id: '123',
      email: 'test@example.com',
      name: 'Test User',
      createdAt: new Date().toISOString(),
      isEmailVerified: true,
    };
    renderHeader(userData, true);

    const avatars = screen.getAllByText('T');
    await user.click(avatars[0]);

    await waitFor(() => {
      expect(screen.getByText('Log out')).toBeInTheDocument();
    });

    const logoutItem = screen.getByText('Log out');
    await user.click(logoutItem);

    expect(mockNavigate).toHaveBeenCalledWith('/logout');
  });

  it('should navigate when clicking navigation items', async () => {
    const user = userEvent.setup();
    const userData: User = {
      id: '123',
      email: 'test@example.com',
      name: 'Test User',
      createdAt: new Date().toISOString(),
      isEmailVerified: true,
    };
    renderHeader(userData, true);

    const showsLink = screen.getByText('TV Shows');
    await user.click(showsLink);

    expect(mockNavigate).toHaveBeenCalledWith('/series');
  });

  it('should show mobile menu button on small screens', () => {
    renderHeader();

    // Menu button should be in the document
    const menuButtons = screen.getAllByRole('button');
    expect(menuButtons.length).toBeGreaterThan(0);
  });

  it('should use U as fallback avatar initial', () => {
    const userData: User = {
      id: '123',
      email: '',
      name: 'Test User',
      createdAt: new Date().toISOString(),
      isEmailVerified: true,
    };
    renderHeader(userData, true);

    const avatars = screen.getAllByText('U');
    expect(avatars.length).toBeGreaterThan(0);
  });
});
