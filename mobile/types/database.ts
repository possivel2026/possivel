export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];
export type Profile = { id:string; name:string; handle:string; avatar_url?:string|null; bio?:string|null };
export type Post = { id:number; author_id:string; body:string; kind:string; media_url?:string|null; media_type?:string|null; created_at:string; profiles?:Profile|null };
export type Listing = { id:number; seller_id:string; title:string; description:string; listing_type:'venda'|'troca'|'doacao'; price?:number|null; location:string; status:'active'|'reserved'|'completed'|'paused'|'sold'|'closed'; created_at:string; profiles?:Profile|null };
export type Entitlements = { plan:'free'|'pro'; limits: Record<string, number>; features: Record<string, boolean>; status:string };
