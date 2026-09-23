import { createClient, type SupabaseClient } from '@supabase/supabase-js'

function normalizeSupabaseUrl(value?: string) {
  if (!value) return undefined
  return value.replace(/\/+$/, '').replace(/\/rest\/v1$/i, '')
}

const url = normalizeSupabaseUrl(import.meta.env.VITE_SUPABASE_URL)
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const isSupabaseConfigured = Boolean(url && anonKey)

export const supabase: SupabaseClient | null =
  url && anonKey ? createClient(url, anonKey) : null
