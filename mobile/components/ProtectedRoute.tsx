import { ReactNode } from 'react';
import { Redirect } from 'expo-router';
import { Loading } from '@/components/ui';
import { shouldRedirectPrivateRoute } from '@/lib/auth-routing';
import { useAuthStore } from '@/stores/auth';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { initialized, session } = useAuthStore();

  if (!initialized) return <Loading />;
  if (shouldRedirectPrivateRoute(initialized, Boolean(session))) return <Redirect href="/(auth)/login" />;

  return children;
}
