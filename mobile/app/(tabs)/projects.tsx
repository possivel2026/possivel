import { Text } from 'react-native'; import { router } from 'expo-router'; import { Button, Card, Screen, s } from '@/components/ui';
export default function Projects(){return <Screen><Card><Text style={s.title}>Projetos de impacto</Text><Text>Participe de campanhas, doe e acompanhe impacto.</Text><Button title="Ver projeto exemplo" onPress={()=>router.push('/project/1')}/></Card></Screen>}
