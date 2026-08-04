import { Text } from 'react-native'; import { Button, Card, Screen, s } from '@/components/ui';
export default function Call(){return <Screen><Card><Text style={s.title}>Chamadas</Text><Text>Tokens LiveKit devem ser gerados por Edge Function protegida. Limites aplicados por plano.</Text><Button title="Iniciar áudio"/><Button title="Iniciar vídeo" variant="secondary"/></Card></Screen>}
