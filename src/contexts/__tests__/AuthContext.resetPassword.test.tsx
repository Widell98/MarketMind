import { ReactNode, useEffect } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { render, waitFor, cleanup } from '@testing-library/react';

import { AuthProvider, useAuth } from '../AuthContext';

// Create mock functions using vi.fn() directly in the mock
const toastMock = vi.fn();

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: toastMock }),
}));

// Use factory function that returns vi.fn() directly
vi.mock('@/integrations/supabase/client', () => {
  return {
    supabase: {
      auth: {
        onAuthStateChange: vi.fn(),
        getSession: vi.fn(),
        signUp: vi.fn(),
        signIn: vi.fn(),
        signOut: vi.fn(),
        resetPasswordForEmail: vi.fn(),
        updateUser: vi.fn(),
        exchangeCodeForSession: vi.fn(),
        setSession: vi.fn(),
      },
      rpc: vi.fn(),
    },
  };
});

// Import after mock to get the mocked version
import { supabase } from '@/integrations/supabase/client';

// Get the mocked functions - they are already vi.fn() from the mock
const mockResetPasswordForEmail = supabase.auth.resetPasswordForEmail as ReturnType<typeof vi.fn>;
const mockOnAuthStateChange = supabase.auth.onAuthStateChange as ReturnType<typeof vi.fn>;
const mockGetSession = supabase.auth.getSession as ReturnType<typeof vi.fn>;

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
  // Mock window.location.origin for consistent URL testing
  Object.defineProperty(window, 'location', {
    value: {
      origin: 'http://localhost',
    },
    writable: true,
  });

  mockResetPasswordForEmail.mockResolvedValue({ data: {}, error: null });
  const unsubscribe = vi.fn();
  mockOnAuthStateChange.mockReturnValue({
    data: { subscription: { unsubscribe } },
  });
  mockGetSession.mockResolvedValue({ data: { session: null } });
  toastMock.mockClear();
  mockResetPasswordForEmail.mockClear();
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('resetPassword', () => {
  it('trims email and sends password reset request', async () => {
    const onComplete = vi.fn();

    render(
      wrapper({
        children: <ResetPasswordInvoker email="  user@example.com  " onComplete={onComplete} />,
      })
    );

    await waitFor(() => {
      expect(mockResetPasswordForEmail).toHaveBeenCalled();
    });

    expect(mockResetPasswordForEmail).toHaveBeenCalledWith('user@example.com', {
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
        expect(mockResetPasswordForEmail).toHaveBeenCalled();
      });

      expect(mockResetPasswordForEmail).toHaveBeenCalledWith('user@example.com', {
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
      expect(toastMock).toHaveBeenCalled();
    });

    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        variant: 'destructive',
      })
    );

    expect(mockResetPasswordForEmail).not.toHaveBeenCalled();
  });
});
