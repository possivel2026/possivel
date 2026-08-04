import { Redirect } from 'expo-router';
import { Loading } from '@/components/ui';
import { getInitialAuthDestination } from '@/lib/auth-routing';
import { useAuthStore } from '@/stores/auth';

export default function Index() {
  const { initialized, session } = useAuthStore();
  const destination = getInitialAuthDestination(initialized, Boolean(session));

  if (!destination) return <Loading />;

  return <Redirect href={destination} />;
}
