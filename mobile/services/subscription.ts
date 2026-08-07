import { supabase } from '@/lib/supabase'; import type { Entitlements } from '@/types/database';
export async function getEntitlements(){const {data,error}=await supabase.functions.invoke<Entitlements>('get-entitlements'); if(error) throw error; return data!;}
export async function createCheckout(){const {data,error}=await supabase.functions.invoke<{checkoutUrl:string}>('create-subscription-checkout',{body:{plan:'pro'}}); if(error) throw error; return data!;}
export async function getSubscription(){const {data,error}=await supabase.functions.invoke('get-subscription'); if(error) throw error; return data;}
export async function cancelSubscription(){const {data,error}=await supabase.functions.invoke('cancel-subscription',{body:{}}); if(error) throw error; return data;}
