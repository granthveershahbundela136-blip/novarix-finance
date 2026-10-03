import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/** False when env vars are missing; the UI uses this to explain setup instead of crashing. */
export const isSupabaseConfigured = Boolean(url && anonKey)

if (!isSupabaseConfigured && import.meta.env.DEV) {
  console.warn('[novarix] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are not set. Copy .env.example to .env.')
}

export const supabase = createClient(url ?? 'http://localhost:54321', anonKey ?? 'supabase-not-configured', {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
})
