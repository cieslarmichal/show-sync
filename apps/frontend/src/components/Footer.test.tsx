import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Footer from './Footer';
import { AuthContext } from '../context/AuthContext';
import { BrowserRouter } from 'react-router-dom';
import type { User } from '../api/types/user';

describe('Footer', () => {
  const renderFooter = (userData: User | null = null) => {
    return render(
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
      </BrowserRouter>,
    );
  };

  it('should render logo and app name', () => {
    renderFooter();

    expect(screen.getByText('10x Series Matcher')).toBeInTheDocument();
    expect(screen.getByText('SM')).toBeInTheDocument();
  });

  it('should render app description', () => {
    renderFooter();

    expect(screen.getByText(/Find the perfect series for your group/i)).toBeInTheDocument();
  });

  it('should render contact section', () => {
    renderFooter();

    expect(screen.getByText('Contact')).toBeInTheDocument();
    expect(screen.getByText('contact@10x-series-matcher.com')).toBeInTheDocument();
    expect(screen.getByText('+48 792 448 282')).toBeInTheDocument();
    expect(screen.getByText('Cracow, Poland')).toBeInTheDocument();
  });

  it('should render contact email as mailto link', () => {
    renderFooter();

    const emailLink = screen.getByText('contact@10x-series-matcher.com');
    expect(emailLink.closest('a')).toHaveAttribute('href', 'mailto:contact@10x-series-matcher.com');
  });

  it('should render phone number as tel link', () => {
    renderFooter();

    const phoneLink = screen.getByText('+48 792 448 282');
    expect(phoneLink.closest('a')).toHaveAttribute('href', 'tel:+48792448282');
  });

  it('should render location as google maps link', () => {
    renderFooter();

    const locationLink = screen.getByText('Cracow, Poland');
    expect(locationLink.closest('a')).toHaveAttribute('href', 'https://maps.google.com/?q=Cracow, Poland');
    expect(locationLink.closest('a')).toHaveAttribute('target', '_blank');
    expect(locationLink.closest('a')).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('should render copyright notice', () => {
    renderFooter();

    expect(screen.getByText(/© 2025 10x Series Matcher/i)).toBeInTheDocument();
  });

  it('should show user account section when authenticated', () => {
    const userData: User = {
      id: '123',
      email: 'test@example.com',
      name: 'Test User',
      createdAt: new Date().toISOString(),
    };
    renderFooter(userData);

    expect(screen.getByText('Your Account')).toBeInTheDocument();
    expect(screen.getByText('My Series')).toBeInTheDocument();
    expect(screen.getByText('My Watch Rooms')).toBeInTheDocument();
  });

  it('should not show user account section when not authenticated', () => {
    renderFooter(null);

    expect(screen.queryByText('Your Account')).not.toBeInTheDocument();
    expect(screen.queryByText('My Series')).not.toBeInTheDocument();
    expect(screen.queryByText('My Watch Rooms')).not.toBeInTheDocument();
  });

  it('should render My Series link when authenticated', () => {
    const userData: User = {
      id: '123',
      email: 'test@example.com',
      name: 'Test User',
      createdAt: new Date().toISOString(),
    };
    renderFooter(userData);

    const mySeriesLink = screen.getByText('My Series');
    expect(mySeriesLink.closest('a')).toHaveAttribute('href', '/series');
  });

  it('should render My Watch Rooms link when authenticated', () => {
    const userData: User = {
      id: '123',
      email: 'test@example.com',
      name: 'Test User',
      createdAt: new Date().toISOString(),
    };
    renderFooter(userData);

    const watchRoomsLink = screen.getByText('My Watch Rooms');
    expect(watchRoomsLink.closest('a')).toHaveAttribute('href', '/watchrooms');
  });

  it('should have accessible footer landmark', () => {
    renderFooter();

    const footer = screen.getByRole('contentinfo');
    expect(footer).toBeInTheDocument();
  });
});
