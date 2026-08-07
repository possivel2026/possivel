import { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { supabase } from '@/lib/supabase';
import { getProfile } from '@/services/app';
import { useAuthStore } from '@/stores/auth';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 15_000, retry: 1 }, mutations: { retry: 0 } },
});

function AuthBootstrap() {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);
  const setProfile = useAuthStore((state) => state.setProfile);
  const setInitialized = useAuthStore((state) => state.setInitialized);

  useEffect(() => {
    let active = true;
    async function applySession(session: Parameters<typeof setSession>[0]) {
      if (!active) return;
      setSession(session);
      if (session?.user.id) {
        try {
          setProfile(await getProfile(session.user.id));
        } catch {
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
      setInitialized(true);
    }

    void supabase.auth.getSession().then(({ data }) => applySession(data.session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      void applySession(session);
      if (event === 'PASSWORD_RECOVERY') router.replace('/(auth)/reset-password');
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [router, setInitialized, setProfile, setSession]);
  return null;
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="light" />
      <AuthBootstrap />
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />
    </QueryClientProvider>
  );
}
