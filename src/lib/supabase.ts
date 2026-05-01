import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('ERRO CRÍTICO: Variáveis de ambiente do Supabase (URL ou Anon Key) não encontradas! Verifique o arquivo .env ou as configurações no Vercel.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
