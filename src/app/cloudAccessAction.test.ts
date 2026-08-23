import { describe, expect, it, vi } from 'vitest';
import { cloudAccessAction, logoutCloudAccessAndReturn } from './cloudAccessAction';

describe('Cloudflare Access action', () => {
  it('offers login on the protected host when cloud authentication is required', () => {
    expect(cloudAccessAction('peterlingo.petergpt.dk', 'auth-required')).toBe('login');
  });

  it('offers logout on the protected host while the session is available', () => {
    expect(cloudAccessAction('peterlingo.petergpt.dk', 'synced')).toBe('logout');
  });

  it('does not show Cloudflare controls on local or preview hosts', () => {
    expect(cloudAccessAction('localhost', 'auth-required')).toBeNull();
    expect(cloudAccessAction('example.peterlingo.pages.dev', 'auth-required')).toBeNull();
  });

  it('logs out without leaving the user on Cloudflare’s technical response page', async () => {
    const request = vi.fn(async () => new Response());
    const navigate = vi.fn();

    await logoutCloudAccessAndReturn(request, navigate);

    expect(request).toHaveBeenCalledWith('/cdn-cgi/access/logout', {
      credentials: 'same-origin',
      cache: 'no-store',
    });
    expect(navigate).toHaveBeenCalledWith('/');
  });

  it('returns to the app even if the logout request cannot be read', async () => {
    const request = vi.fn(async () => {
      throw new Error('network');
    });
    const navigate = vi.fn();

    await expect(logoutCloudAccessAndReturn(request, navigate)).resolves.toBeUndefined();
    expect(navigate).toHaveBeenCalledWith('/');
  });
});
