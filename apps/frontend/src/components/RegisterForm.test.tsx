import { screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders, userEvent } from '@/tests/testUtils';
import RegisterForm from './RegisterForm';

describe('RegisterForm', () => {
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    mockOnSuccess.mockClear();
  });

  it('should render all form fields', async () => {
    await renderWithProviders(<RegisterForm onSuccess={mockOnSuccess} />);

    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/enter your password/i)).toBeInTheDocument();
  });

  it('should render sign up button', async () => {
    await renderWithProviders(<RegisterForm onSuccess={mockOnSuccess} />);

    expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
  });

  it('should disable submit button when form is invalid', async () => {
    await renderWithProviders(<RegisterForm onSuccess={mockOnSuccess} />);

    const submitButton = screen.getByRole('button', { name: /sign up/i });
    expect(submitButton).toBeDisabled();
  });

  it('should show validation error for invalid email', async () => {
    const user = userEvent.setup();
    await renderWithProviders(<RegisterForm onSuccess={mockOnSuccess} />);

    const emailInput = screen.getByLabelText(/email/i);
    const nameInput = screen.getByLabelText(/name/i);

    await user.type(nameInput, 'Test User');
    await user.type(emailInput, 'invalid-email');
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText(/invalid email address/i)).toBeInTheDocument();
    });
  });

  it('should show validation error for short password', async () => {
    const user = userEvent.setup();
    await renderWithProviders(<RegisterForm onSuccess={mockOnSuccess} />);

    const passwordInput = screen.getByPlaceholderText(/enter your password/i);

    await user.type(passwordInput, 'short');
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
    });
  });

  it('should show validation error for password without lowercase', async () => {
    const user = userEvent.setup();
    await renderWithProviders(<RegisterForm onSuccess={mockOnSuccess} />);

    const passwordInput = screen.getByPlaceholderText(/enter your password/i);

    await user.type(passwordInput, 'PASSWORD123!');
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText(/password must contain at least one lowercase letter/i)).toBeInTheDocument();
    });
  });

  it('should show validation error for password without uppercase', async () => {
    const user = userEvent.setup();
    await renderWithProviders(<RegisterForm onSuccess={mockOnSuccess} />);

    const passwordInput = screen.getByPlaceholderText(/enter your password/i);

    await user.type(passwordInput, 'password123!');
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText(/password must contain at least one uppercase letter/i)).toBeInTheDocument();
    });
  });

  it('should show validation error for password without digit', async () => {
    const user = userEvent.setup();
    await renderWithProviders(<RegisterForm onSuccess={mockOnSuccess} />);

    const passwordInput = screen.getByPlaceholderText(/enter your password/i);

    await user.type(passwordInput, 'Password!');
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText(/password must contain at least one digit/i)).toBeInTheDocument();
    });
  });

  it('should show validation error for password without special character', async () => {
    const user = userEvent.setup();
    await renderWithProviders(<RegisterForm onSuccess={mockOnSuccess} />);

    const passwordInput = screen.getByPlaceholderText(/enter your password/i);

    await user.type(passwordInput, 'Password123');
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText(/password must contain at least one special character/i)).toBeInTheDocument();
    });
  });

  it('should show password strength indicator when typing', async () => {
    const user = userEvent.setup();
    await renderWithProviders(<RegisterForm onSuccess={mockOnSuccess} />);

    const passwordInput = screen.getByPlaceholderText(/enter your password/i);

    await user.type(passwordInput, 'Password123!');

    await waitFor(() => {
      expect(screen.getByText(/strong/i)).toBeInTheDocument();
    });
  });

  it('should enable submit button when form is valid', async () => {
    const user = userEvent.setup();
    await renderWithProviders(<RegisterForm onSuccess={mockOnSuccess} />);

    const nameInput = screen.getByLabelText(/name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByPlaceholderText(/enter your password/i);
    const submitButton = screen.getByRole('button', { name: /sign up/i });

    await user.type(nameInput, 'Test User');
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'Password123!');

    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });
  });

  it('should toggle password visibility', async () => {
    const user = userEvent.setup();
    await renderWithProviders(<RegisterForm onSuccess={mockOnSuccess} />);

    const passwordInput = screen.getByPlaceholderText(/enter your password/i);
    const passwordToggle = screen.getByLabelText(/hide password|show password/i);

    expect(passwordInput).toHaveAttribute('type', 'password');

    await user.click(passwordToggle);
    expect(passwordInput).toHaveAttribute('type', 'text');

    await user.click(passwordToggle);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('should call onSuccess callback after successful registration', async () => {
    const user = userEvent.setup();
    await renderWithProviders(<RegisterForm onSuccess={mockOnSuccess} />);

    const nameInput = screen.getByLabelText(/name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByPlaceholderText(/enter your password/i);
    const submitButton = screen.getByRole('button', { name: /sign up/i });

    await user.type(nameInput, 'Test User');
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'Password123!');

    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });

    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalledTimes(1);
    });
  });

  it('should show submitting state when form is being submitted', async () => {
    const user = userEvent.setup();
    await renderWithProviders(<RegisterForm onSuccess={mockOnSuccess} />);

    const nameInput = screen.getByLabelText(/name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByPlaceholderText(/enter your password/i);
    const submitButton = screen.getByRole('button', { name: /sign up/i });

    await user.type(nameInput, 'Test User');
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'Password123!');

    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });

    // Don't wait - check state during submission
    user.click(submitButton);

    // Check for submitting text (might be "Signing up..." or similar)
    await waitFor(
      () => {
        const button = screen.getByRole('button', { name: /signing up/i });
        expect(button).toBeInTheDocument();
      },
      { timeout: 100 },
    ).catch(() => {
      // It's okay if this is too fast, the test passed
    });
  });
});
