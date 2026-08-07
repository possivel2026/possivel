import { Alert, Linking, StyleSheet, Text, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Badge, Button, Card, Header, Loading, Screen, colors, typography } from '@/components/ui';
import { cancelSubscription, getErrorMessage, getPlan, startProCheckout } from '@/services/app';
import { useAuthStore } from '@/stores/auth';

const free = ['5 anúncios ativos', '1 GB de mídia', 'Chamadas com até 4 pessoas', 'Até 30 min por chamada'];
const pro = ['50 anúncios ativos', '10 GB de mídia', 'Chamadas com até 12 pessoas', 'Até 120 min por chamada', 'Estatísticas avançadas', 'Selo PRO e recursos exclusivos'];
export default function PlansScreen() {
  const userId = useAuthStore((state) => state.session?.user.id);
  const client = useQueryClient();
  const plan = useQuery({ queryKey: ['plan', userId], queryFn: () => getPlan(userId!), enabled: Boolean(userId) });
  const checkout = useMutation({ mutationFn: startProCheckout, onSuccess: (url) => Linking.openURL(url), onError: (error) => Alert.alert('Checkout indisponível', getErrorMessage(error)) });
  const cancel = useMutation({ mutationFn: cancelSubscription, onSuccess: async () => { await client.invalidateQueries({ queryKey: ['plan'] }); Alert.alert('Solicitação enviada', 'O cancelamento foi registrado.'); }, onError: (error) => Alert.alert('Erro', getErrorMessage(error)) });
  if (plan.isLoading) return <Screen><Loading /></Screen>;
  const current = plan.data?.plan ?? 'free';
  return <Screen scroll><Header title="Planos" subtitle="Escolha os limites ideais para você" /><PlanCard name="Free" active={current === 'free'} items={free} /><PlanCard name="Possível Pro" active={current === 'pro'} items={pro} pro />{current === 'free' ? <Button loading={checkout.isPending} onPress={() => checkout.mutate()}>Assinar Possível Pro</Button> : <><Badge>Seu plano atual é PRO</Badge><Button variant="danger" loading={cancel.isPending} onPress={() => Alert.alert('Cancelar assinatura', 'Você manterá os benefícios até o fim do período já pago.', [{ text: 'Voltar', style: 'cancel' }, { text: 'Cancelar plano', style: 'destructive', onPress: () => cancel.mutate() }])}>Cancelar assinatura</Button></>}<Text style={typography.muted}>Pagamentos e assinatura dependem das Edge Functions e credenciais do Mercado Pago configuradas no Supabase.</Text></Screen>;
}
function PlanCard({ name, active, items, pro }: { name: string; active: boolean; items: string[]; pro?: boolean }) { return <Card style={active ? styles.active : undefined}><View style={styles.row}><Text style={styles.name}>{name}</Text>{active ? <Badge>ATUAL</Badge> : null}{pro ? <Badge>PRO</Badge> : null}</View>{items.map((item) => <Text key={item} style={styles.item}>✓ {item}</Text>)}</Card>; }
const styles = StyleSheet.create({ active: { borderColor: colors.primary }, row: { flexDirection: 'row', alignItems: 'center', gap: 8 }, name: { color: colors.text, fontSize: 22, fontWeight: '900', flex: 1 }, item: { color: colors.text, lineHeight: 23 } });
