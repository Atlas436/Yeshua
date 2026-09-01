import { createClient } from '@supabase/supabase-js';

// Chave "publishable" — segura pra usar no navegador. O acesso real é
// controlado pelas políticas de RLS (Row Level Security) no Supabase:
// visitante só consegue criar pedido, nunca ler ou editar.
const SUPABASE_URL = 'https://clxrwmuemqrngefcizkr.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_ngHpVsD3T9Fbinv-Wb-Mjg_rpcpDZme';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
