import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders, userEvent } from '@/tests/testUtils';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ResetPasswordPage from './ResetPasswordPage';
import * as validateOneTimeTokenModule from '@/api/queries/validateOneTimeToken';
import * as resetPasswordModule from '@/api/queries/resetPassword';

vi.mock('@/api/queries/validateOneTimeToken');
vi.mock('@/api/queries/resetPassword');

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('ResetPasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show validating state initially', async () => {
    vi.spyOn(validateOneTimeTokenModule, 'validateOneTimeToken').mockImplementation(
      () => new Promise(() => {}), // Never resolves
    );

    await renderWithProviders(
      <MemoryRouter initialEntries={['/reset-password?token=valid-token']}>
        <Routes>
          <Route
            path="/reset-password"
            element={<ResetPasswordPage />}
          />
        </Routes>
      </MemoryRouter>,
      { withRouter: false },
    );

    expect(screen.getByText('Validating Reset Link')).toBeInTheDocument();
    expect(screen.getByText('Please wait while we verify your reset link...')).toBeInTheDocument();
  });

  it('should show invalid token state when token is missing', async () => {
    await renderWithProviders(
      <MemoryRouter initialEntries={['/reset-password']}>
        <Routes>
          <Route
            path="/reset-password"
            element={<ResetPasswordPage />}
          />
        </Routes>
      </MemoryRouter>,
      { withRouter: false },
    );

    await waitFor(() => {
      expect(screen.getByText('Link Expired')).toBeInTheDocument();
    });

    expect(screen.getByText(/This password reset link is invalid or has expired/)).toBeInTheDocument();
    expect(screen.getByTestId('request-new-link-button')).toBeInTheDocument();
    expect(screen.getByTestId('back-to-login-button')).toBeInTheDocument();
  });

  it('should show invalid token state when validation fails', async () => {
    vi.spyOn(validateOneTimeTokenModule, 'validateOneTimeToken').mockResolvedValue({ valid: false });

    await renderWithProviders(
      <MemoryRouter initialEntries={['/reset-password?token=invalid-token']}>
        <Routes>
          <Route
            path="/reset-password"
            element={<ResetPasswordPage />}
          />
        </Routes>
      </MemoryRouter>,
      { withRouter: false },
    );

    await waitFor(() => {
      expect(screen.getByText('Link Expired')).toBeInTheDocument();
    });
  });

  it('should show reset password form when token is valid', async () => {
    vi.spyOn(validateOneTimeTokenModule, 'validateOneTimeToken').mockResolvedValue({ valid: true });

    await renderWithProviders(
      <MemoryRouter initialEntries={['/reset-password?token=valid-token']}>
        <Routes>
          <Route
            path="/reset-password"
            element={<ResetPasswordPage />}
          />
        </Routes>
      </MemoryRouter>,
      { withRouter: false },
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Reset Password' })).toBeInTheDocument();
    });

    expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByTestId('reset-password-button')).toBeInTheDocument();
  });

  it('should validate password requirements', async () => {
    vi.spyOn(validateOneTimeTokenModule, 'validateOneTimeToken').mockResolvedValue({ valid: true });

    const user = userEvent.setup();

    await renderWithProviders(
      <MemoryRouter initialEntries={['/reset-password?token=valid-token']}>
        <Routes>
          <Route
            path="/reset-password"
            element={<ResetPasswordPage />}
          />
        </Routes>
      </MemoryRouter>,
      { withRouter: false },
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Reset Password' })).toBeInTheDocument();
    });

    const newPasswordInput = screen.getByLabelText(/new password/i);

    // Test too short password
    await user.type(newPasswordInput, 'Short1');
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText(/Password must be at least 8 characters/)).toBeInTheDocument();
    });

    // Clear and test password without uppercase
    await user.clear(newPasswordInput);
    await user.type(newPasswordInput, 'lowercase123');
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText(/Password must contain at least one uppercase letter/)).toBeInTheDocument();
    });
  });

  it('should validate passwords match', async () => {
    vi.spyOn(validateOneTimeTokenModule, 'validateOneTimeToken').mockResolvedValue({ valid: true });

    const user = userEvent.setup();

    await renderWithProviders(
      <MemoryRouter initialEntries={['/reset-password?token=valid-token']}>
        <Routes>
          <Route
            path="/reset-password"
            element={<ResetPasswordPage />}
          />
        </Routes>
      </MemoryRouter>,
      { withRouter: false },
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Reset Password' })).toBeInTheDocument();
    });

    const newPasswordInput = screen.getByLabelText(/new password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

    await user.type(newPasswordInput, 'ValidPassword123!');
    await user.type(confirmPasswordInput, 'DifferentPassword123');
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });
  });

  it('should enable submit button when form is valid', async () => {
    vi.spyOn(validateOneTimeTokenModule, 'validateOneTimeToken').mockResolvedValue({ valid: true });

    const user = userEvent.setup();

    await renderWithProviders(
      <MemoryRouter initialEntries={['/reset-password?token=valid-token']}>
        <Routes>
          <Route
            path="/reset-password"
            element={<ResetPasswordPage />}
          />
        </Routes>
      </MemoryRouter>,
      { withRouter: false },
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Reset Password' })).toBeInTheDocument();
    });

    const newPasswordInput = screen.getByLabelText('New Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    const submitButton = screen.getByTestId('reset-password-button');

    await user.type(newPasswordInput, 'ValidPassword123!');
    await user.type(confirmPasswordInput, 'ValidPassword123!');

    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });
  });

  it('should successfully reset password', async () => {
    vi.spyOn(validateOneTimeTokenModule, 'validateOneTimeToken').mockResolvedValue({ valid: true });
    const resetPasswordSpy = vi.spyOn(resetPasswordModule, 'resetPassword').mockResolvedValue();

    const user = userEvent.setup();

    await renderWithProviders(
      <MemoryRouter initialEntries={['/reset-password?token=valid-token']}>
        <Routes>
          <Route
            path="/reset-password"
            element={<ResetPasswordPage />}
          />
        </Routes>
      </MemoryRouter>,
      { withRouter: false },
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Reset Password' })).toBeInTheDocument();
    });

    const newPasswordInput = screen.getByLabelText(/new password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByTestId('reset-password-button');

    await user.type(newPasswordInput, 'ValidPassword123!');
    await user.type(confirmPasswordInput, 'ValidPassword123!');

    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });

    await user.click(submitButton);

    await waitFor(() => {
      expect(resetPasswordSpy).toHaveBeenCalledWith({
        token: 'valid-token',
        newPassword: 'ValidPassword123!',
      });
    });

    await waitFor(() => {
      expect(screen.getByText('Password Reset Successful!')).toBeInTheDocument();
    });
  });

  it('should show error when password reset fails', async () => {
    vi.spyOn(validateOneTimeTokenModule, 'validateOneTimeToken').mockResolvedValue({ valid: true });
    vi.spyOn(resetPasswordModule, 'resetPassword').mockRejectedValue(new Error('Network error'));

    const user = userEvent.setup();

    await renderWithProviders(
      <MemoryRouter initialEntries={['/reset-password?token=valid-token']}>
        <Routes>
          <Route
            path="/reset-password"
            element={<ResetPasswordPage />}
          />
        </Routes>
      </MemoryRouter>,
      { withRouter: false },
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Reset Password' })).toBeInTheDocument();
    });

    const newPasswordInput = screen.getByLabelText(/new password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByTestId('reset-password-button');

    await user.type(newPasswordInput, 'ValidPassword123!');
    await user.type(confirmPasswordInput, 'ValidPassword123!');

    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });

    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Network error/)).toBeInTheDocument();
    });
  });
});
