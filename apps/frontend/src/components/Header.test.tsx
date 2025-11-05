import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Header from './Header';
import { AuthContext } from '../context/AuthContext';
import { BrowserRouter } from 'react-router-dom';
import type { User } from '../api/types/user';

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
      </BrowserRouter>,
    );
  };

  it('should render logo and app name', () => {
    renderHeader();

    expect(screen.getByText('10x Series Matcher')).toBeInTheDocument();
    expect(screen.getByText('SM')).toBeInTheDocument();
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

    expect(mockNavigate).toHaveBeenCalledWith('/login?tab=register');
  });

  it('should show user avatar when authenticated', () => {
    const userData: User = {
      id: '123',
      email: 'test@example.com',
      name: 'Test User',
      createdAt: new Date().toISOString(),
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
    };
    renderHeader(userData, true);

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Series')).toBeInTheDocument();
    expect(screen.getByText('Watch Rooms')).toBeInTheDocument();
  });

  it('should not show authenticated navigation items when not authenticated', () => {
    renderHeader(null, true);

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.queryByText('Series')).not.toBeInTheDocument();
    expect(screen.queryByText('Watch Rooms')).not.toBeInTheDocument();
  });

  it('should open user menu when avatar is clicked', async () => {
    const user = userEvent.setup();
    const userData: User = {
      id: '123',
      email: 'test@example.com',
      name: 'Test User',
      createdAt: new Date().toISOString(),
    };
    renderHeader(userData, true);

    const avatars = screen.getAllByText('T');
    await user.click(avatars[0]);

    await waitFor(() => {
      expect(screen.getByText('Series')).toBeInTheDocument();
      expect(screen.getByText('Watch Rooms')).toBeInTheDocument();
      expect(screen.getByText('Profile')).toBeInTheDocument();
      expect(screen.getByText('Log out')).toBeInTheDocument();
    });
  });

  it('should navigate to series page from user menu', async () => {
    const user = userEvent.setup();
    const userData: User = {
      id: '123',
      email: 'test@example.com',
      name: 'Test User',
      createdAt: new Date().toISOString(),
    };
    renderHeader(userData, true);

    const avatars = screen.getAllByText('T');
    await user.click(avatars[0]);

    await waitFor(() => {
      expect(screen.getByText('Series')).toBeInTheDocument();
    });

    const mySeriesItem = screen.getByText('Series');
    await user.click(mySeriesItem);

    expect(mockNavigate).toHaveBeenCalledWith('/series');
  });

  it('should navigate to watchrooms page from user menu', async () => {
    const user = userEvent.setup();
    const userData: User = {
      id: '123',
      email: 'test@example.com',
      name: 'Test User',
      createdAt: new Date().toISOString(),
    };
    renderHeader(userData, true);

    const avatars = screen.getAllByText('T');
    await user.click(avatars[0]);

    await waitFor(() => {
      expect(screen.getByText('Watch Rooms')).toBeInTheDocument();
    });

    const watchRoomsItem = screen.getByText('Watch Rooms');
    await user.click(watchRoomsItem);

    expect(mockNavigate).toHaveBeenCalledWith('/watchrooms');
  });

  it('should navigate to profile page from user menu', async () => {
    const user = userEvent.setup();
    const userData: User = {
      id: '123',
      email: 'test@example.com',
      name: 'Test User',
      createdAt: new Date().toISOString(),
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
    };
    renderHeader(userData, true);

    const seriesLink = screen.getByText('Series');
    await user.click(seriesLink);

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
    };
    renderHeader(userData, true);

    const avatars = screen.getAllByText('U');
    expect(avatars.length).toBeGreaterThan(0);
  });
});
