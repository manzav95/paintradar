import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import { normalizeSalesState, type SalesState } from '@/lib/salesStorage'

export const SALES_WORKSPACE_ID = import.meta.env.VITE_SALES_WORKSPACE_ID || 'bayline'

export function isSalesCloudConfigured() {
  return isSupabaseConfigured && Boolean(supabase)
}

export async function loadSalesCloud(): Promise<SalesState | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('sales_workspaces')
    .select('payload')
    .eq('id', SALES_WORKSPACE_ID)
    .maybeSingle()
  if (error) throw error
  if (!data?.payload) return null
  return normalizeSalesState(data.payload as SalesState)
}

export async function saveSalesCloud(state: SalesState) {
  if (!supabase) return
  const { error } = await supabase.from('sales_workspaces').upsert({
    id: SALES_WORKSPACE_ID,
    payload: state,
    updated_at: new Date().toISOString(),
  })
  if (error) throw error
}
