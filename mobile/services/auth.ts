import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types/database';

export async function signIn(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
  if (error) throw error;
}

export async function signUp(input: { name: string; handle: string; email: string; password: string }) {
  const handle = input.handle.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
  if (input.name.trim().length < 2) throw new Error('Informe seu nome.');
  if (handle.length < 3) throw new Error('O @usuário precisa ter pelo menos 3 caracteres.');
  if (input.password.length < 6) throw new Error('A senha precisa ter pelo menos 6 caracteres.');
  const { error } = await supabase.auth.signUp({
    email: input.email.trim().toLowerCase(),
    password: input.password,
    options: { data: { name: input.name.trim(), handle }, emailRedirectTo: 'possivel://login' },
  });
  if (error) throw error;
}

export async function requestPasswordReset(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
    redirectTo: 'possivel://reset-password',
  });
  if (error) throw error;
}

export async function updatePassword(password: string) {
  if (password.length < 6) throw new Error('A senha precisa ter pelo menos 6 caracteres.');
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getProfile(userId: string) {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
  if (error) throw error;
  return data as Profile;
}

export async function updateProfile(userId: string, input: Pick<Profile, 'name' | 'handle' | 'bio'> & { avatar_url?: string | null }) {
  const payload = {
    name: input.name.trim(),
    handle: input.handle.trim().toLowerCase().replace(/[^a-z0-9_]/g, ''),
    bio: input.bio.trim(),
    ...(input.avatar_url !== undefined ? { avatar_url: input.avatar_url } : {}),
  };
  const { data, error } = await supabase.from('profiles').update(payload).eq('id', userId).select('*').single();
  if (error) throw error;
  return data as Profile;
}
