import { Text, TextInput } from 'react-native'; import { Card, Screen, s } from '@/components/ui';
export default function Search(){return <Screen><Card><Text style={s.title}>Pesquisa</Text><TextInput style={s.input} placeholder="Buscar perfis, posts, anúncios e projetos"/><Text>Filtros salvos são um recurso Possível Pro.</Text></Card></Screen>}
