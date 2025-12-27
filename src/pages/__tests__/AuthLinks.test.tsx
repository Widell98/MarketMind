import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import Auth from '../Auth';

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    loading: false,
    signIn: vi.fn(),
    signUp: vi.fn(),
    resetPassword: vi.fn(),
  }),
}));

describe('Auth page links', () => {
  it('renders terms and privacy links', () => {
    render(
      <MemoryRouter>
        <Auth />
      </MemoryRouter>
    );
    
    // Find links by href attribute instead of text content
    const termsLink = screen.getByRole('link', { name: /användarvillkor/i });
    expect(termsLink).toHaveAttribute('href', '/terms');
    
    const privacyLink = screen.getByRole('link', { name: /integritetspolicy/i });
    expect(privacyLink).toHaveAttribute('href', '/privacy');
  });
});
