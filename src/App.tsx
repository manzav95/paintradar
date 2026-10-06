import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppLayout } from '@/components/layout/AppLayout'
import { AppStateProvider, useAppState } from '@/providers/AppState'
import { SalesStateProvider } from '@/providers/SalesState'
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
import { ChangeOrderJob } from '@/pages/sales/ChangeOrderJob'
import { ChangeOrders } from '@/pages/sales/ChangeOrders'
import { JobDetail } from '@/pages/sales/JobDetail'
import { CustomerDetail } from '@/pages/sales/CustomerDetail'
import { Customers } from '@/pages/sales/Customers'
import { EstimateBuilder } from '@/pages/sales/EstimateBuilder'
import { EstimatePrint } from '@/pages/sales/EstimatePrint'
import { Estimates, Quotes } from '@/pages/sales/Estimates'
import { InvoiceDetail } from '@/pages/sales/InvoiceDetail'
import { Invoices } from '@/pages/sales/Invoices'
import { NewEstimate } from '@/pages/sales/NewEstimate'
import { Payments } from '@/pages/sales/Payments'
import { Pricing } from '@/pages/sales/Pricing'
import { SalesMaterials } from '@/pages/sales/SalesMaterials'

const queryClient = new QueryClient()

function Gate() {
  const { settings, hydrated } = useAppState()
  if (!hydrated) return <div className="min-h-screen bg-bg" />
  if (!settings.onboarded) return <Onboarding />
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={settings.showLeadIntel ? <Dashboard /> : <Navigate to="/sales/estimates" replace />} />
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
        <Route path="/sales/estimates" element={<Estimates />} />
        <Route path="/sales/estimates/new" element={<NewEstimate />} />
        <Route path="/sales/estimates/:id" element={<EstimateBuilder />} />
        <Route path="/sales/quotes" element={<Quotes />} />
        <Route path="/sales/invoices" element={<Invoices />} />
        <Route path="/sales/invoices/:id" element={<InvoiceDetail />} />
        <Route path="/sales/customers" element={<Customers />} />
        <Route path="/sales/customers/:id" element={<CustomerDetail />} />
        <Route path="/sales/pricing" element={<Pricing />} />
        <Route path="/sales/materials" element={<SalesMaterials />} />
        <Route path="/sales/payments" element={<Payments />} />
        <Route path="/sales/change-orders" element={<ChangeOrders />} />
        <Route path="/sales/change-orders/:estimateId" element={<ChangeOrderJob />} />
        <Route path="/sales/jobs" element={<ChangeOrders />} />
        <Route path="/sales/jobs/:estimateId" element={<JobDetail />} />
      </Route>
      <Route path="/sales/estimates/:id/print" element={<EstimatePrint />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppStateProvider>
        <SalesStateProvider>
          <BrowserRouter>
            <Gate />
          </BrowserRouter>
        </SalesStateProvider>
      </AppStateProvider>
    </QueryClientProvider>
  )
}
