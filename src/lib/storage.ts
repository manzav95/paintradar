import type { AppNotification, AppSettings, Lead, LeadActivity, LeadNote, MaterialGroup, SavedSearch } from '@/types'

export const STORAGE_KEY = 'paintradar.v1'

export interface PersistedState {
  settings: AppSettings
  leads: Lead[]
  notes: LeadNote[]
  activity: LeadActivity[]
  searches: SavedSearch[]
  notifications: AppNotification[]
  materialGroups?: MaterialGroup[]
}

export function loadPersistedState(): PersistedState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as PersistedState
  } catch {
    return null
  }
}

export function savePersistedState(state: PersistedState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}
