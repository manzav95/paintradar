import { DEFAULT_HOME } from '@/data/cities'
import { DEFAULT_WEIGHTS } from '@/lib/scoring'
import { uid } from '@/lib/format'
import type { AppSettings, NotificationPreferences, SavedSearch } from '@/types'
import { PROJECT_CATEGORIES } from '@/types'

export const DEFAULT_NOTIFICATIONS: NotificationPreferences = {
  newLead: true,
  hotLead: true,
  scoreAbove: 85,
  scoreAboveEnabled: true,
  withinMiles: 10,
  withinMilesEnabled: true,
  cabinetJob: true,
  interiorJob: true,
  exteriorJob: true,
  highValueJob: true,
  highValueThreshold: 5000,
  inApp: true,
  email: false,
  sms: false,
}

export function createDefaultSettings(partial?: Partial<AppSettings>): AppSettings {
  return {
    id: 'settings_local',
    ownerName: 'Manuel',
    companyName: 'Bayline Painting',
    homeCity: DEFAULT_HOME.name,
    homeState: DEFAULT_HOME.state,
    latitude: DEFAULT_HOME.latitude,
    longitude: DEFAULT_HOME.longitude,
    defaultRadius: 50,
    categories: [...PROJECT_CATEGORIES],
    scoringWeights: { ...DEFAULT_WEIGHTS },
    notificationPreferences: { ...DEFAULT_NOTIFICATIONS },
    theme: 'dark',
    onboarded: false,
    minimumLeadScore: 40,
    createdAt: new Date().toISOString(),
    ...partial,
  }
}

export function createStarterSearches(): SavedSearch[] {
  const now = new Date().toISOString()
  return [
    {
      id: uid('search'),
      name: 'Cabinet Painting',
      radius: 25,
      keywords: ['cabinet', 'refinish', 'paint kitchen cabinets'],
      excludedKeywords: ['diy'],
      categories: ['cabinets'],
      minimumScore: 70,
      enabled: true,
      notificationEnabled: true,
      createdAt: now,
    },
    {
      id: uid('search'),
      name: 'Interior Painting',
      radius: 50,
      keywords: ['interior', 'bedroom', 'living room'],
      excludedKeywords: [],
      categories: ['interior'],
      minimumScore: 60,
      enabled: true,
      notificationEnabled: true,
      createdAt: now,
    },
    {
      id: uid('search'),
      name: 'Urgent Jobs',
      radius: 20,
      keywords: ['asap', 'urgent', 'this week'],
      excludedKeywords: [],
      categories: [],
      minimumScore: 75,
      enabled: true,
      notificationEnabled: true,
      createdAt: now,
    },
  ]
}
