import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Footer from './Footer';
import { AuthContext } from '../context/AuthContext';
import { BrowserRouter } from 'react-router-dom';
import type { User } from '../api/types/user';
import { ThemeContextProvider } from '../context/ThemeContextProvider';

describe('Footer', () => {
  const renderFooter = (userData: User | null = null) => {
    return render(
      <ThemeContextProvider>
        <BrowserRouter>
          <AuthContext.Provider
            value={{
              userData,
              userDataInitialized: true,
              clearUserData: vi.fn(),
              refreshUserData: vi.fn(),
              accessToken: null,
            }}
          >
            <Footer />
          </AuthContext.Provider>
        </BrowserRouter>
      </ThemeContextProvider>,
    );
  };

  it('should render logo and app name', () => {
    renderFooter();

    // ShowSync appears twice: mobile and desktop versions
    const showSyncElements = screen.getAllByText('ShowSync');
    expect(showSyncElements.length).toBe(2);

    // Logo has aria-hidden, so we just check it exists in the DOM
    const logos = document.querySelectorAll('img[alt=""][aria-hidden="true"]');
    expect(logos.length).toBeGreaterThanOrEqual(1);
  });

  it('should render app description', () => {
    renderFooter();

    expect(screen.getByText(/Discover Your Next Favorite Series/i)).toBeInTheDocument();
  });

  it('should render contact section', () => {
    renderFooter();

    // Email appears in both mobile and desktop versions
    const emailLinks = screen.getAllByText('contact@show-sync.com');
    expect(emailLinks.length).toBeGreaterThanOrEqual(1);

    // Full contact section only on desktop
    expect(screen.getByText('Contact')).toBeInTheDocument();
    expect(screen.getByText('+48 795 252 322')).toBeInTheDocument();
    expect(screen.getByText('Cracow, Poland')).toBeInTheDocument();
  });

  it('should have responsive padding classes', () => {
    renderFooter();

    const footer = screen.getByRole('contentinfo');
    expect(footer).toHaveClass('py-8', 'sm:py-16');
  });

  it('should have responsive grid layout on desktop', () => {
    renderFooter();

    const footer = screen.getByRole('contentinfo');
    const gridContainer = footer.querySelector('.grid');
    expect(gridContainer).toHaveClass('grid-cols-2', 'lg:grid-cols-3');
  });

  it('should render contact email as mailto link', () => {
    renderFooter();

    // Email appears twice: mobile and desktop versions
    const emailLinks = screen.getAllByText('contact@show-sync.com');
    expect(emailLinks.length).toBe(2);

    // All email links should have mailto href
    emailLinks.forEach((emailLink) => {
      expect(emailLink.closest('a')).toHaveAttribute('href', 'mailto:contact@show-sync.com');
    });
  });

  it('should render phone number as tel link', () => {
    renderFooter();

    const phoneLink = screen.getByText('+48 795 252 322');
    expect(phoneLink.closest('a')).toHaveAttribute('href', 'tel:+48792448282');
  });

  it('should render location as google maps link', () => {
    renderFooter();

    const locationLink = screen.getByText('Cracow, Poland');
    expect(locationLink.closest('a')).toHaveAttribute('href', 'https://maps.google.com/?q=Cracow,Poland');
    expect(locationLink.closest('a')).toHaveAttribute('target', '_blank');
    expect(locationLink.closest('a')).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('should render copyright notice', () => {
    renderFooter();

    expect(screen.getByText(/© 2025 ShowSync/i)).toBeInTheDocument();
  });

  it('should show navigation section when authenticated (desktop only)', () => {
    const userData: User = {
      id: '123',
      email: 'test@example.com',
      name: 'Test User',
      createdAt: new Date().toISOString(),
      isEmailVerified: true,
      language: 'en' as const,
    };
    renderFooter(userData);

    // Navigation section is hidden on mobile (sm:hidden class not tested here, but visible in DOM)
    expect(screen.getByText('Navigation')).toBeInTheDocument();
    expect(screen.getByText('TV Shows')).toBeInTheDocument();
    expect(screen.getByText('Watchlist')).toBeInTheDocument();
    expect(screen.getByText('Watch Rooms')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
  });

  it('should not show navigation section when not authenticated', () => {
    renderFooter(null);

    expect(screen.queryByText('Navigation')).not.toBeInTheDocument();
    expect(screen.queryByText('TV Shows')).not.toBeInTheDocument();
    expect(screen.queryByText('Watchlist')).not.toBeInTheDocument();
    expect(screen.queryByText('Watch Rooms')).not.toBeInTheDocument();
    expect(screen.queryByText('Profile')).not.toBeInTheDocument();
  });

  it('should render compact mobile footer', () => {
    renderFooter();

    const footer = screen.getByRole('contentinfo');
    const mobileSection = footer.querySelector('.sm\\:hidden');
    expect(mobileSection).toBeInTheDocument();
    expect(mobileSection).toHaveClass('sm:hidden');
  });

  it('should render full desktop footer', () => {
    renderFooter();

    const footer = screen.getByRole('contentinfo');
    const desktopSection = footer.querySelector('.sm\\:block');
    expect(desktopSection).toBeInTheDocument();
    expect(desktopSection).toHaveClass('hidden', 'sm:block');
  });

  it('should render TV Shows link when authenticated', () => {
    const userData: User = {
      id: '123',
      email: 'test@example.com',
      name: 'Test User',
      createdAt: new Date().toISOString(),
      isEmailVerified: true,
      language: 'en' as const,
    };
    renderFooter(userData);

    const myShowsLink = screen.getByText('TV Shows');
    expect(myShowsLink.closest('a')).toHaveAttribute('href', '/series');
  });

  it('should render Watchlist link when authenticated', () => {
    const userData: User = {
      id: '123',
      email: 'test@example.com',
      name: 'Test User',
      createdAt: new Date().toISOString(),
      isEmailVerified: true,
      language: 'en' as const,
    };
    renderFooter(userData);

    const watchlistLink = screen.getByText('Watchlist');
    expect(watchlistLink.closest('a')).toHaveAttribute('href', '/watchlist');
  });

  it('should render Watch Rooms link when authenticated', () => {
    const userData: User = {
      id: '123',
      email: 'test@example.com',
      name: 'Test User',
      createdAt: new Date().toISOString(),
      isEmailVerified: true,
      language: 'en' as const,
    };
    renderFooter(userData);

    const watchRoomsLink = screen.getByText('Watch Rooms');
    expect(watchRoomsLink.closest('a')).toHaveAttribute('href', '/watchrooms');
  });

  it('should render Profile link when authenticated', () => {
    const userData: User = {
      id: '123',
      email: 'test@example.com',
      name: 'Test User',
      createdAt: new Date().toISOString(),
      isEmailVerified: true,
      language: 'en' as const,
    };
    renderFooter(userData);

    const profileLink = screen.getByText('Profile');
    expect(profileLink.closest('a')).toHaveAttribute('href', '/my-profile');
  });

  it('should have accessible footer landmark', () => {
    renderFooter();

    const footer = screen.getByRole('contentinfo');
    expect(footer).toBeInTheDocument();
  });
});
