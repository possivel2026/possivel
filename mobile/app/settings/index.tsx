import { Text } from 'react-native'; import { Card, Screen, Button, s } from '@/components/ui';
export default function Settings(){return <Screen><Card><Text style={s.title}>Configurações</Text><Button title="Exportar dados"/><Button title="Excluir conta" variant="danger"/></Card></Screen>}
