import { supabase } from '@/lib/supabase';

export type PossivelAIMode = 'path' | 'post' | 'listing' | 'cause' | 'safety';

export type PossivelAIResult = {
  answer: string;
  source: 'provider' | 'local';
  remaining: number;
  plan: 'free' | 'pro';
};

export async function askPossivelAI(message: string, mode: PossivelAIMode = 'path') {
  const prompt = message.replace(/\s+/g, ' ').trim();
  if (prompt.length < 3) throw new Error('Conte um pouco mais sobre o que você quer tornar possível.');
  if (prompt.length > 2000) throw new Error('A mensagem deve ter no máximo 2.000 caracteres.');

  const { data, error } = await supabase.functions.invoke('possivel-ai', {
    body: { message: prompt, mode },
  });

  if (error) throw error;
  if (data?.error) throw new Error(String(data.error));
  if (!data?.answer) throw new Error('A Possível IA não retornou uma resposta.');

  return {
    answer: String(data.answer),
    source: data.source === 'provider' ? 'provider' : 'local',
    remaining: Number(data.remaining ?? 0),
    plan: data.plan === 'pro' ? 'pro' : 'free',
  } satisfies PossivelAIResult;
}
