import { ReactNode, useEffect } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { render, waitFor, cleanup } from '@testing-library/react';

import { AuthProvider, useAuth } from '../AuthContext';

const toastMock = vi.fn();
const resetPasswordForEmailMock = vi.fn();
const onAuthStateChangeMock = vi.fn();
const getSessionMock = vi.fn();
const rpcMock = vi.fn();
const signUpMock = vi.fn();
const signInMock = vi.fn();
const signOutMock = vi.fn();
const updateUserMock = vi.fn();
const exchangeCodeForSessionMock = vi.fn();
const setSessionMock = vi.fn();

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: toastMock }),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      onAuthStateChange: onAuthStateChangeMock,
      getSession: getSessionMock,
      signUp: signUpMock,
      signIn: signInMock,
      signOut: signOutMock,
      resetPasswordForEmail: resetPasswordForEmailMock,
      updateUser: updateUserMock,
      exchangeCodeForSession: exchangeCodeForSessionMock,
      setSession: setSessionMock,
    },
    rpc: rpcMock,
  },
}));

const wrapper = ({ children }: { children: ReactNode }) => (
  <MemoryRouter>
    <AuthProvider>{children}</AuthProvider>
  </MemoryRouter>
);

const ResetPasswordInvoker = ({ email, onComplete }: { email: string; onComplete: (result: any) => void }) => {
  const { resetPassword } = useAuth();

  useEffect(() => {
    resetPassword(email).then(onComplete);
  }, [email, onComplete, resetPassword]);

  return null;
};

beforeEach(() => {
  resetPasswordForEmailMock.mockResolvedValue({ data: {}, error: null });
  const unsubscribe = vi.fn();
  onAuthStateChangeMock.mockReturnValue({
    data: { subscription: { unsubscribe } },
  });
  getSessionMock.mockResolvedValue({ data: { session: null } });
  toastMock.mockClear();
  resetPasswordForEmailMock.mockClear();
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('resetPassword', () => {
  it('trims the email and sends redirect URL', async () => {
    const onComplete = vi.fn();

    render(
      wrapper({
        children: <ResetPasswordInvoker email="  user@example.com  " onComplete={onComplete} />,
      })
    );

    await waitFor(() => {
      expect(resetPasswordForEmailMock).toHaveBeenCalled();
    });

    expect(resetPasswordForEmailMock).toHaveBeenCalledWith('user@example.com', {
      redirectTo: 'http://localhost/auth/reset-password',
    });

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalled();
    });

    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Password reset email sent',
      })
    );
  });

  it('uses custom redirect path when configured', async () => {
    const env = import.meta.env as Record<string, string | undefined>;
    const originalResetPath = env.VITE_PASSWORD_RESET_REDIRECT_PATH;
    env.VITE_PASSWORD_RESET_REDIRECT_PATH = '/reset-password';

    try {
      const onComplete = vi.fn();

      render(
        wrapper({
          children: <ResetPasswordInvoker email="user@example.com" onComplete={onComplete} />,
        })
      );

      await waitFor(() => {
        expect(resetPasswordForEmailMock).toHaveBeenCalled();
      });

      expect(resetPasswordForEmailMock).toHaveBeenCalledWith('user@example.com', {
        redirectTo: 'http://localhost/reset-password',
      });
    } finally {
      env.VITE_PASSWORD_RESET_REDIRECT_PATH = originalResetPath;
    }
  });

  it('shows an error when email is blank', async () => {
    const onComplete = vi.fn();

    render(
      wrapper({
        children: <ResetPasswordInvoker email="   " onComplete={onComplete} />,
      })
    );

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalled();
    });

    expect(resetPasswordForEmailMock).not.toHaveBeenCalled();

    const result = onComplete.mock.calls[0][0];
    expect(result?.error).toBeInstanceOf(Error);
    expect(result?.error?.message).toBe('Please enter a valid email address.');

    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Password reset failed',
      })
    );
  });
});
