import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppLayout } from '@/components/layout/AppLayout'
import { AppStateProvider, useAppState } from '@/providers/AppState'
import { Analytics } from '@/pages/Analytics'
import { Dashboard } from '@/pages/Dashboard'
import { LeadDetail } from '@/pages/LeadDetail'
import { LiveLeads } from '@/pages/LiveLeads'
import { MapPage } from '@/pages/MapPage'
import { Notifications } from '@/pages/Notifications'
import { Onboarding } from '@/pages/Onboarding'
import { Pipeline } from '@/pages/Pipeline'
import { SavedLeads } from '@/pages/SavedLeads'
import { Searches } from '@/pages/Searches'
import { Settings } from '@/pages/Settings'
import { Materials } from '@/pages/Materials'
import { Quote } from '@/pages/Quote'
import { Sources } from '@/pages/Sources'
import { LeadTester } from '@/pages/LeadTester'
import { SourceMonitor } from '@/pages/SourceMonitor'

const queryClient = new QueryClient()

function Gate() {
  const { settings, hydrated } = useAppState()
  if (!hydrated) return <div className="min-h-screen bg-bg" />
  if (!settings.onboarded) return <Onboarding />
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/leads" element={<LiveLeads />} />
        <Route path="/leads/:id" element={<LeadDetail />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/pipeline" element={<Pipeline />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/saved" element={<SavedLeads />} />
        <Route path="/searches" element={<Searches />} />
        <Route path="/materials" element={<Materials />} />
        <Route path="/quote" element={<Quote />} />
        <Route path="/sources" element={<Sources />} />
        <Route path="/dev/tester" element={<LeadTester />} />
        <Route path="/dev/sources" element={<SourceMonitor />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppStateProvider>
        <BrowserRouter>
          <Gate />
        </BrowserRouter>
      </AppStateProvider>
    </QueryClientProvider>
  )
}
