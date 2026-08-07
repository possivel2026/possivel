import { Text, TextInput } from 'react-native';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Button, Card, Screen, s } from '@/components/ui';

export default function Report() {
  return (
    <ProtectedRoute>
      <Screen>
        <Card>
          <Text style={s.title}>Denunciar conteúdo</Text>
          <TextInput style={s.input} placeholder="Motivo" />
          <TextInput style={s.input} placeholder="Detalhes" />
          <Button title="Enviar denúncia" variant="danger" />
        </Card>
      </Screen>
    </ProtectedRoute>
  );
}
