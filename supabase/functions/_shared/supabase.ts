import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
export function admin(){return createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)}
export async function userClient(req:Request){const auth=req.headers.get('Authorization')??''; return createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_ANON_KEY')!,{global:{headers:{Authorization:auth}}})}
