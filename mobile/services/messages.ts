import { supabase } from '@/lib/supabase';
export async function fetchRecipients(userId:string){const {data,error}=await supabase.from('profiles').select('id,name,handle,avatar_url').neq('id',userId).order('name').limit(50); if(error) throw error; return data;}
export async function fetchThread(userId:string,otherId:string){const {data,error}=await supabase.from('messages').select('id,sender_id,receiver_id,body,created_at,read_at').or(`and(sender_id.eq.${userId},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${userId})`).order('created_at'); if(error) throw error; return data;}
export async function sendMessage(sender_id:string,receiver_id:string,body:string){const {error}=await supabase.from('messages').insert({sender_id,receiver_id,body}); if(error) throw error;}
export function subscribeMessages(onChange:()=>void){return supabase.channel('mobile-messages').on('postgres_changes',{event:'INSERT',schema:'public',table:'messages'},onChange).subscribe();}
