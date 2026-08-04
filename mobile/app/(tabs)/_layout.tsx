import { Tabs } from 'expo-router';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function TabsLayout() {
  return (
    <ProtectedRoute>
      <Tabs screenOptions={{ headerShown: true, tabBarActiveTintColor: '#6c4df6' }}>
        <Tabs.Screen name="index" options={{ title: 'Feed' }} />
        <Tabs.Screen name="search" options={{ title: 'Pesquisa' }} />
        <Tabs.Screen name="marketplace" options={{ title: 'Mercado' }} />
        <Tabs.Screen name="projects" options={{ title: 'Projetos' }} />
        <Tabs.Screen name="messages" options={{ title: 'Conversas' }} />
        <Tabs.Screen name="profile" options={{ title: 'Perfil' }} />
      </Tabs>
    </ProtectedRoute>
  );
}
