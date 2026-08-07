import { describe, expect, it } from 'vitest';
import { getInitialAuthDestination, shouldRedirectPrivateRoute } from '../lib/auth-routing';

describe('auth routing', () => {
  it('keeps deep-linked private routes blocked until auth is initialized', () => {
    expect(shouldRedirectPrivateRoute(false, false)).toBe(false);
  });

  it('redirects unauthenticated deep links to login after initialization', () => {
    expect(shouldRedirectPrivateRoute(true, false)).toBe(true);
  });

  it('restores an authenticated session to the tab app', () => {
    expect(getInitialAuthDestination(true, true)).toBe('/(tabs)');
  });

  it('waits for session restoration before redirecting from index', () => {
    expect(getInitialAuthDestination(false, false)).toBeNull();
  });
});
