/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
  readonly VITE_SALES_WORKSPACE_ID?: string
  readonly VITE_AI_API_KEY?: string
  readonly VITE_REDDIT_CLIENT_ID?: string
  readonly VITE_REDDIT_CLIENT_SECRET?: string
  readonly VITE_GEOCODING_API_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
