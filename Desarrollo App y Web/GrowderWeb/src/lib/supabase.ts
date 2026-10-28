import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Tipamos globalThis de forma segura para no perder la inferencia de TypeScript
const globalForSupabase = globalThis as unknown as {
    supabase: SupabaseClient | undefined;
};

// Si ya existe la instancia, la reutiliza. Si no, crea una nueva con tus variables.
export const supabase =
    globalForSupabase.supabase ??
    createClient(supabaseUrl, supabaseAnonKey);

// Solo guarda la instancia globalmente si estamos en desarrollo (evita el warning en la terminal)
if (process.env.NODE_ENV !== 'production') {
    globalForSupabase.supabase = supabase;
}