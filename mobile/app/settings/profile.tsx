import { Text, TextInput } from 'react-native'; import { Card, Screen, Button, s } from '@/components/ui';
export default function EditProfile(){return <Screen><Card><Text style={s.title}>Editar perfil</Text><TextInput style={s.input} placeholder="Nome"/><TextInput style={s.input} placeholder="Bio"/><Button title="Salvar"/></Card></Screen>}
