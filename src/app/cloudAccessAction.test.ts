import { describe, expect, it } from 'vitest';
import { cloudAccessAction } from './cloudAccessAction';

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
});
