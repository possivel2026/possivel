import { z } from 'zod'; import { supabase } from '@/lib/supabase';
export const loginSchema=z.object({email:z.string().email('E-mail inválido'),password:z.string().min(6,'Senha muito curta')});
export const signupSchema=loginSchema.extend({name:z.string().min(2),handle:z.string().regex(/^[A-Za-z0-9_]+$/)});
export async function signIn(input:z.infer<typeof loginSchema>){const {error}=await supabase.auth.signInWithPassword(input); if(error) throw error;}
export async function signUp(input:z.infer<typeof signupSchema>){const {error}=await supabase.auth.signUp({email:input.email,password:input.password,options:{data:{name:input.name,handle:input.handle.toLowerCase()}}}); if(error) throw error;}
export async function resetPassword(email:string){const {error}=await supabase.auth.resetPasswordForEmail(email,{redirectTo:`${process.env.EXPO_PUBLIC_APP_URL ?? 'possivel://'}settings`}); if(error) throw error;}
export async function signOut(){const {error}=await supabase.auth.signOut(); if(error) throw error;}
