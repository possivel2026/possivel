import { Text, TextInput } from 'react-native'; import { Card, Screen, Button, s } from '@/components/ui';
export default function Donate(){return <Screen><Card><Text style={s.title}>Doação</Text><TextInput style={s.input} placeholder="Valor"/><Text>O pagamento será processado por provedor seguro no backend.</Text><Button title="Continuar"/></Card></Screen>}
