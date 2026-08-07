export type AuthDestination = '/(tabs)' | '/(auth)/onboarding' | null;

export function getInitialAuthDestination(initialized: boolean, hasSession: boolean): AuthDestination {
  if (!initialized) return null;
  return hasSession ? '/(tabs)' : '/(auth)/onboarding';
}

export function shouldRedirectPrivateRoute(initialized: boolean, hasSession: boolean): boolean {
  return initialized && !hasSession;
}
