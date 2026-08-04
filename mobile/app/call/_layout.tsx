import { Stack } from 'expo-router';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function PrivateStackLayout() {
  return (
    <ProtectedRoute>
      <Stack />
    </ProtectedRoute>
  );
}
