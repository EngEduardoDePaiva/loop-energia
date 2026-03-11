import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

let supabaseInstance: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient => {
  if (!supabaseInstance) {
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Supabase credentials missing.');
      try {
        return createClient('https://placeholder.supabase.co', 'placeholder');
      } catch (e) {
        console.error('Failed to create placeholder Supabase client:', e);
        return {} as any;
      }
    }
    try {
      supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
    } catch (e) {
      console.error('Failed to create Supabase client:', e);
      return {} as any;
    }
  }
  return supabaseInstance!;
};

// Exportamos a instância diretamente para compatibilidade, mas com tratamento de erro
export const supabase = getSupabase();
