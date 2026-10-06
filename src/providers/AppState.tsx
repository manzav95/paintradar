import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { contactFor } from '@/data/contacts'
import { createDefaultMaterialGroups } from '@/data/materials'
import { createDefaultSettings } from '@/data/defaults'
import { findCity } from '@/data/cities'
import { applyLeadFilters, DEFAULT_FILTERS } from '@/lib/filters'
import { uid } from '@/lib/format'
import { loadPersistedState, savePersistedState } from '@/lib/storage'
import { analyzeLead, normalizeRawLead, rescoreLead } from '@/lib/scoring'
import { createLeadSourceRegistry, sourceHealth } from '@/services/leadSources'
import { processLead } from '@/services/leads/processLead'
import { fetchRemoteLeads, saveLead } from '@/services/leads/saveLead'
import { toDashboardLead } from '@/services/leads/toDashboardLead'
import { createPipelineSources, scanAllSources } from '@/services/scan/scanAllSources'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import { CATEGORY_LABELS } from '@/types'
import type {
  AppNotification,
  AppSettings,
  Lead,
  LeadActivity,
  LeadFilters,
  LeadNote,
  LeadQuote,
  LeadStatus,
  MaterialGroup,
  MaterialItem,
  RawLead,
  SavedSearch,
  ScanStatus,
  ToastMessage,
} from '@/types'
import type { ProcessContext, ProcessResult, RawLead as PipelineRawLead, ScanReport, SourceScanStat } from '@/types/lead'

const SCAN_INTERVAL_MS = 5 * 60 * 1000

interface AppStateValue {
  settings: AppSettings
  leads: Lead[]
  notes: LeadNote[]
  activity: LeadActivity[]
  searches: SavedSearch[]
  notifications: AppNotification[]
  toasts: ToastMessage[]
  scan: ScanStatus
  filters: LeadFilters
  radius: number
  highlightedIds: string[]
  selectedLeadId: string | null
  addLeadOpen: boolean
  commandOpen: boolean
  mobileNavOpen: boolean
  hydrated: boolean
  visibleLeads: Lead[]
  selectedLead: Lead | null
  materialGroups: MaterialGroup[]
  sources: ReturnType<typeof sourceHealth>
  sourceStats: SourceScanStat[]
  lastScanReport: ScanReport | null
  unreadCount: number
  setFilters: (next: Partial<LeadFilters>) => void
  setRadius: (radius: number) => void
  setSelectedLeadId: (id: string | null) => void
  setAddLeadOpen: (open: boolean) => void
  setCommandOpen: (open: boolean) => void
  setMobileNavOpen: (open: boolean) => void
  updateSettings: (next: Partial<AppSettings>) => void
  completeOnboarding: (next: Partial<AppSettings>) => void
  addManualLead: (raw: RawLead, extras?: { note?: string; quote?: LeadQuote }) => Lead
  analyzePipelineLead: (raw: PipelineRawLead, extra?: Partial<ProcessContext>) => Promise<ProcessResult>
  saveProcessedLead: (result: ProcessResult) => Promise<Lead>
  updateLead: (id: string, patch: Partial<Lead>) => void
  addMaterialGroup: (group: Omit<MaterialGroup, 'id' | 'createdAt' | 'items'> & { items?: MaterialItem[] }) => void
  updateMaterialGroup: (id: string, patch: Partial<MaterialGroup>) => void
  deleteMaterialGroup: (id: string) => void
  addMaterialItem: (groupId: string, item: Omit<MaterialItem, 'id'>) => void
  updateMaterialItem: (groupId: string, itemId: string, patch: Partial<MaterialItem>) => void
  deleteMaterialItem: (groupId: string, itemId: string) => void
  setLeadStatus: (id: string, status: LeadStatus) => void
  toggleSaved: (id: string) => void
  dismissLead: (id: string) => void
  addNote: (leadId: string, note: string) => void
  addSearch: (search: Omit<SavedSearch, 'id' | 'createdAt'>) => void
  updateSearch: (id: string, patch: Partial<SavedSearch>) => void
  deleteSearch: (id: string) => void
  markNotificationsRead: () => void
  dismissToast: (id: string) => void
  runScan: () => Promise<void>
  notesFor: (leadId: string) => LeadNote[]
  activityFor: (leadId: string) => LeadActivity[]
}

const AppStateContext = createContext<AppStateValue | null>(null)

function createActivity(action: string, leadId: string | null, metadata?: LeadActivity['metadata']): LeadActivity {
  return {
    id: uid('act'),
    leadId,
    action,
    metadata,
    createdAt: new Date().toISOString(),
  }
}

function shouldNotify(lead: Lead, settings: AppSettings) {
  const prefs = settings.notificationPreferences
  if (prefs.hotLead && (lead.urgency === 'hot' || lead.score >= 90)) return true
  if (prefs.newLead) return true
  if (prefs.scoreAboveEnabled && lead.score >= prefs.scoreAbove) return true
  if (prefs.withinMilesEnabled && lead.distanceMiles <= prefs.withinMiles) return true
  if (prefs.cabinetJob && lead.category === 'cabinets') return true
  if (prefs.interiorJob && lead.category === 'interior') return true
  if (prefs.exteriorJob && lead.category === 'exterior') return true
  if (prefs.highValueJob && lead.estimatedValueHigh >= prefs.highValueThreshold) return true
  return false
}

function readPersisted() {
  return loadPersistedState()
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const persisted = useMemo(() => readPersisted(), [])
  const [settings, setSettings] = useState<AppSettings>(() =>
    createDefaultSettings({
      ...persisted?.settings,
      showLeadIntel: persisted?.settings?.showLeadIntel ?? false,
    }),
  )
  const [leads, setLeads] = useState<Lead[]>(() =>
    (persisted?.leads ?? [])
      .filter((lead) => lead.source !== 'demo')
      .map((lead) => {
        const known = contactFor(lead.customerName)
        if (!known) return lead
        return {
          ...lead,
          phone: lead.phone || known.phone,
          email: lead.email || known.email,
        }
      }),
  )
  const [materialGroups, setMaterialGroups] = useState<MaterialGroup[]>(
    () => (persisted?.materialGroups?.length ? persisted.materialGroups : createDefaultMaterialGroups()),
  )
  const [notes, setNotes] = useState<LeadNote[]>(() => persisted?.notes ?? [])
  const [activity, setActivity] = useState<LeadActivity[]>(() => persisted?.activity ?? [])
  const [searches, setSearches] = useState<SavedSearch[]>(() => persisted?.searches ?? [])
  const [notifications, setNotifications] = useState<AppNotification[]>(() => persisted?.notifications ?? [])
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const [lastScanReport, setLastScanReport] = useState<ScanReport | null>(null)
  const [sourceStats, setSourceStats] = useState<SourceScanStat[]>(() =>
    createPipelineSources().map((source) => ({
      name: source.label,
      status: source.status,
      lastScan: null,
      postsChecked: 0,
      qualifiedLeads: 0,
    })),
  )
  const [scan, setScan] = useState<ScanStatus>({
    scanning: false,
    lastScanAt: new Date().toISOString(),
    nextScanAt: new Date(Date.now() + SCAN_INTERVAL_MS).toISOString(),
    lastSource: 'demo',
  })
  const [filters, setFiltersState] = useState<LeadFilters>(DEFAULT_FILTERS)
  const [radius, setRadius] = useState<number>(persisted?.settings.defaultRadius ?? 50)
  const [highlightedIds, setHighlightedIds] = useState<string[]>([])
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null)
  const [addLeadOpen, setAddLeadOpen] = useState(false)
  const [commandOpen, setCommandOpen] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const hydrated = true
  const persistReady = useRef(true)

  const home = useMemo(
    () => ({ latitude: settings.latitude, longitude: settings.longitude }),
    [settings.latitude, settings.longitude],
  )

  const providers = useMemo(() => createLeadSourceRegistry(home), [home])

  const pushToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = uid('toast')
    setToasts((current) => [...current.slice(-4), { ...toast, id }])
    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id))
    }, 5200)
  }, [])

  const highlight = useCallback((id: string) => {
    setHighlightedIds((current) => [...current, id])
    window.setTimeout(() => {
      setHighlightedIds((current) => current.filter((item) => item !== id))
    }, 4200)
  }, [])

  const announceLeads = useCallback(
    (incoming: Lead[]) => {
      if (!incoming.length) return
      setActivity((current) => [
        ...incoming.map((lead) =>
          createActivity(`New ${lead.title.toLowerCase()} detected`, lead.id, {
            city: lead.city,
            score: lead.score,
          }),
        ),
        ...current,
      ])
      incoming.forEach((lead) => {
        highlight(lead.id)
        if (shouldNotify(lead, settings) && settings.notificationPreferences.inApp) {
          const hot = lead.urgency === 'hot' || lead.score >= 90
          const notification: AppNotification = {
            id: uid('note'),
            title: hot ? 'HOT LEAD DETECTED' : 'New painting lead',
            body: `${CATEGORY_LABELS[lead.category]}\n${lead.city}, ${lead.state}\n${lead.distanceMiles.toFixed(1)} miles away\nScore ${lead.score}`,
            leadId: lead.id,
            tone: hot ? 'hot' : 'info',
            read: false,
            createdAt: new Date().toISOString(),
          }
          setNotifications((current) => [notification, ...current].slice(0, 40))
          pushToast({
            title: notification.title,
            description: notification.body,
            tone: notification.tone,
          })
        }
      })
    },
    [highlight, pushToast, settings],
  )

  useEffect(() => {
    if (!persistReady.current || !hydrated) return
    savePersistedState({ settings, leads, notes, activity, searches, notifications, materialGroups })
  }, [settings, leads, notes, activity, searches, notifications, materialGroups, hydrated])

  const seedIfNeeded = useCallback(async () => {
    if (!isSupabaseConfigured) return
    const remote = await fetchRemoteLeads()
    if (remote.length) {
      setLeads(remote.filter((lead) => lead.source !== 'demo'))
    }
    setScan({
      scanning: false,
      lastScanAt: new Date().toISOString(),
      nextScanAt: new Date(Date.now() + SCAN_INTERVAL_MS).toISOString(),
      lastSource: 'supabase',
    })
  }, [])

  useEffect(() => {
    if (hydrated && settings.onboarded) {
      void seedIfNeeded()
    }
  }, [hydrated, seedIfNeeded, settings.onboarded])

  const pipelineContext = useCallback(
    () => ({
      home: {
        city: settings.homeCity,
        state: settings.homeState,
        latitude: settings.latitude,
        longitude: settings.longitude,
      },
      radiusMiles: radius,
      minimumScore: settings.minimumLeadScore ?? 40,
      existing: leads.map((lead) => ({
        source: lead.source,
        sourcePostId: lead.sourcePostId,
        sourceUrl: lead.sourceUrl,
        title: lead.title,
        description: lead.description,
      })),
    }),
    [leads, radius, settings.homeCity, settings.homeState, settings.latitude, settings.longitude, settings.minimumLeadScore],
  )

  const runScan = useCallback(async () => {
    setScan((current) => ({ ...current, scanning: true, lastSource: 'configured sources' }))
    try {
      const report = await scanAllSources(pipelineContext())
      setLastScanReport(report)
      setSourceStats(report.sources)
      if (report.leads.length) {
        const incoming = report.leads.map(toDashboardLead)
        setLeads((current) => {
          const seen = new Set(current.map((lead) => lead.id))
          return [...incoming.filter((lead) => !seen.has(lead.id)), ...current]
        })
        announceLeads(incoming)
      }
      setScan({
        scanning: false,
        lastScanAt: report.scannedAt,
        nextScanAt: new Date(Date.now() + SCAN_INTERVAL_MS).toISOString(),
        lastSource: 'pipeline',
      })
    } catch (error) {
      console.warn('[scan] failed', error)
      setScan((current) => ({
        ...current,
        scanning: false,
        lastScanAt: new Date().toISOString(),
        nextScanAt: new Date(Date.now() + SCAN_INTERVAL_MS).toISOString(),
      }))
    }
  }, [announceLeads, pipelineContext])

  useEffect(() => {
    const client = supabase
    if (!isSupabaseConfigured || !client) return
    void fetchRemoteLeads().then((remote) => {
      const real = remote.filter((lead) => lead.source !== 'demo')
      if (!real.length) return
      setLeads(real)
    })

    const channel = client
      .channel('paintradar-leads')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'leads' }, (payload) => {
        const row = payload.new as { id?: string }
        if (!row.id) return
        void fetchRemoteLeads().then((remote) => {
          const incoming = remote.find((lead) => lead.id === row.id)
          if (!incoming) return
          setLeads((current) => {
            if (current.some((lead) => lead.id === incoming.id)) return current
            return [incoming, ...current]
          })
        })
      })
      .subscribe()

    return () => {
      void client.removeChannel(channel)
    }
  }, [])

  const updateSettings = useCallback((next: Partial<AppSettings>) => {
    setSettings((current) => {
      const merged = { ...current, ...next }
      if (next.homeCity) {
        const city = findCity(next.homeCity)
        if (city) {
          merged.latitude = city.latitude
          merged.longitude = city.longitude
          merged.homeState = city.state
        }
      }
      return merged
    })
    if (next.defaultRadius) setRadius(next.defaultRadius)
    if (next.homeCity || next.scoringWeights) {
      setLeads((current) =>
        current.map((lead) =>
          rescoreLead(
            lead,
            {
              latitude: next.homeCity ? (findCity(next.homeCity)?.latitude ?? settings.latitude) : settings.latitude,
              longitude: next.homeCity ? (findCity(next.homeCity)?.longitude ?? settings.longitude) : settings.longitude,
            },
            next.scoringWeights ?? settings.scoringWeights,
          ),
        ),
      )
    }
  }, [settings.latitude, settings.longitude, settings.scoringWeights])

  const completeOnboarding = useCallback((next: Partial<AppSettings>) => {
    updateSettings({ ...next, onboarded: true })
    void seedIfNeeded()
    pushToast({
      title: 'PaintLedger is ready',
      description: 'Start an estimate or open a customer.',
      tone: 'success',
    })
  }, [pushToast, seedIfNeeded, updateSettings])

  const analyzePipelineLead = useCallback(
    async (raw: PipelineRawLead, extra?: Parameters<typeof processLead>[1]) =>
      processLead(raw, { ...pipelineContext(), ...extra }),
    [pipelineContext],
  )

  const saveProcessedLead = useCallback(
    async (result: ProcessResult) => {
      if (!result.accepted || !result.lead) {
        throw new Error(result.reason ? `Lead rejected: ${result.reason}` : 'Lead was not qualified')
      }
      const saved = await saveLead(result.lead)
      setLeads((current) => [saved, ...current.filter((lead) => lead.id !== saved.id)])
      announceLeads([saved])
      return saved
    },
    [announceLeads],
  )

  const addManualLead = useCallback(
    (raw: RawLead, extras?: { note?: string; quote?: LeadQuote }) => {
      const lead = normalizeRawLead({ ...raw, source: 'manual', postedAt: raw.postedAt ?? new Date().toISOString() }, home, settings.scoringWeights)
      const saved = extras?.quote ? { ...lead, quote: extras.quote } : lead
      setLeads((current) => [saved, ...current])
      setActivity((current) => [createActivity('Manual lead captured', saved.id, { city: saved.city }), ...current])
      if (extras?.note?.trim()) {
        const item = { id: uid('note'), leadId: saved.id, note: extras.note.trim(), createdAt: new Date().toISOString() }
        setNotes((current) => [item, ...current])
      }
      highlight(saved.id)
      pushToast({ title: 'Lead added', description: `${saved.customerName} · ${saved.city}`, tone: 'success' })
      return saved
    },
    [highlight, home, pushToast, settings.scoringWeights],
  )

  const addMaterialGroup = useCallback((group: Omit<MaterialGroup, 'id' | 'createdAt' | 'items'> & { items?: MaterialItem[] }) => {
    setMaterialGroups((current) => [
      {
        ...group,
        id: uid('mat'),
        items: group.items ?? [],
        createdAt: new Date().toISOString(),
      },
      ...current,
    ])
  }, [])

  const updateMaterialGroup = useCallback((id: string, patch: Partial<MaterialGroup>) => {
    setMaterialGroups((current) => current.map((group) => (group.id === id ? { ...group, ...patch } : group)))
  }, [])

  const deleteMaterialGroup = useCallback((id: string) => {
    setMaterialGroups((current) => current.filter((group) => group.id !== id))
  }, [])

  const addMaterialItem = useCallback((groupId: string, item: Omit<MaterialItem, 'id'>) => {
    setMaterialGroups((current) =>
      current.map((group) =>
        group.id === groupId ? { ...group, items: [...group.items, { ...item, id: uid('item') }] } : group,
      ),
    )
  }, [])

  const updateMaterialItem = useCallback((groupId: string, itemId: string, patch: Partial<MaterialItem>) => {
    setMaterialGroups((current) =>
      current.map((group) =>
        group.id === groupId
          ? { ...group, items: group.items.map((item) => (item.id === itemId ? { ...item, ...patch } : item)) }
          : group,
      ),
    )
  }, [])

  const deleteMaterialItem = useCallback((groupId: string, itemId: string) => {
    setMaterialGroups((current) =>
      current.map((group) =>
        group.id === groupId ? { ...group, items: group.items.filter((item) => item.id !== itemId) } : group,
      ),
    )
  }, [])

  const updateLead = useCallback((id: string, patch: Partial<Lead>) => {
    setLeads((current) =>
      current.map((lead) => (lead.id === id ? { ...lead, ...patch, updatedAt: new Date().toISOString() } : lead)),
    )
  }, [])

  const setLeadStatus = useCallback((id: string, status: LeadStatus) => {
    setLeads((current) =>
      current.map((lead) => (lead.id === id ? { ...lead, status, updatedAt: new Date().toISOString() } : lead)),
    )
    setActivity((current) => [createActivity(`Moved to ${status.replaceAll('_', ' ')}`, id), ...current])
  }, [])

  const toggleSaved = useCallback((id: string) => {
    setLeads((current) =>
      current.map((lead) => (lead.id === id ? { ...lead, saved: !lead.saved, updatedAt: new Date().toISOString() } : lead)),
    )
  }, [])

  const dismissLead = useCallback((id: string) => {
    setLeadStatus(id, 'dismissed')
    if (selectedLeadId === id) setSelectedLeadId(null)
  }, [selectedLeadId, setLeadStatus])

  const addNote = useCallback((leadId: string, note: string) => {
    const item: LeadNote = { id: uid('note'), leadId, note, createdAt: new Date().toISOString() }
    setNotes((current) => [item, ...current])
    setActivity((current) => [createActivity('Note added', leadId), ...current])
  }, [])

  const addSearch = useCallback((search: Omit<SavedSearch, 'id' | 'createdAt'>) => {
    setSearches((current) => [{ ...search, id: uid('search'), createdAt: new Date().toISOString() }, ...current])
  }, [])

  const updateSearch = useCallback((id: string, patch: Partial<SavedSearch>) => {
    setSearches((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)))
  }, [])

  const deleteSearch = useCallback((id: string) => {
    setSearches((current) => current.filter((item) => item.id !== id))
  }, [])

  const visibleLeads = useMemo(
    () => applyLeadFilters(leads, filters, radius),
    [filters, leads, radius],
  )

  const selectedLead = useMemo(
    () => leads.find((lead) => lead.id === selectedLeadId) ?? null,
    [leads, selectedLeadId],
  )

  const value: AppStateValue = {
    settings,
    leads,
    notes,
    activity,
    searches,
    notifications,
    toasts,
    scan,
    filters,
    radius,
    highlightedIds,
    selectedLeadId,
    addLeadOpen,
    commandOpen,
    mobileNavOpen,
    hydrated,
    visibleLeads,
    selectedLead,
    materialGroups,
    sources: sourceHealth(providers, leads),
    sourceStats,
    lastScanReport,
    unreadCount: notifications.filter((item) => !item.read).length,
    setFilters: (next) => setFiltersState((current) => ({ ...current, ...next })),
    setRadius,
    setSelectedLeadId,
    setAddLeadOpen,
    setCommandOpen,
    setMobileNavOpen,
    updateSettings,
    completeOnboarding,
    addManualLead,
    analyzePipelineLead,
    saveProcessedLead,
    updateLead,
    setLeadStatus,
    toggleSaved,
    dismissLead,
    addNote,
    addSearch,
    updateSearch,
    deleteSearch,
    addMaterialGroup,
    updateMaterialGroup,
    deleteMaterialGroup,
    addMaterialItem,
    updateMaterialItem,
    deleteMaterialItem,
    markNotificationsRead: () => setNotifications((current) => current.map((item) => ({ ...item, read: true }))),
    dismissToast: (id) => setToasts((current) => current.filter((item) => item.id !== id)),
    runScan,
    notesFor: (leadId) => notes.filter((item) => item.leadId === leadId),
    activityFor: (leadId) => activity.filter((item) => item.leadId === leadId),
  }

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
}

export function useAppState() {
  const context = useContext(AppStateContext)
  if (!context) throw new Error('useAppState must be used within AppStateProvider')
  return context
}

export function useLeadIntelligence(lead: Lead | null) {
  return useMemo(() => (lead ? analyzeLead(lead) : null), [lead])
}
