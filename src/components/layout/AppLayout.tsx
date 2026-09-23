import { useEffect, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/layout/Sidebar'
import { LeadDrawer } from '@/components/leads/LeadDrawer'
import { CommandPalette } from '@/components/layout/CommandPalette'
import { NotificationToast } from '@/components/ui/Toast'
import { ScannerOverlay } from '@/components/ui/Skeleton'
import { useAppState } from '@/providers/AppState'

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const { mobileNavOpen, setMobileNavOpen, setCommandOpen, scan, hydrated } = useAppState()

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setCommandOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setCommandOpen])

  return (
    <div className="flex min-h-screen bg-transparent">
      <div className="hidden lg:block">
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((value) => !value)} />
      </div>
      <AnimatePresence>
        {mobileNavOpen ? (
          <motion.div
            className="fixed inset-0 z-50 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/55" onClick={() => setMobileNavOpen(false)} />
            <motion.div initial={{ x: -260 }} animate={{ x: 0 }} exit={{ x: -260 }} className="relative h-full">
              <Sidebar collapsed={false} onToggle={() => undefined} mobile onNavigate={() => setMobileNavOpen(false)} />
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
      <div className="flex min-w-0 flex-1 flex-col">
        <Header onMenu={() => setMobileNavOpen(true)} />
        <main className="flex-1 p-4 md:p-6">
          {!hydrated ? (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="skeleton h-40 rounded-2xl" />
              <div className="skeleton h-40 rounded-2xl" />
            </div>
          ) : (
            <Outlet />
          )}
        </main>
      </div>
      <button
        onClick={() => navigate('/quote')}
        className="fixed right-5 bottom-5 z-40 flex h-14 items-center gap-2 rounded-full bg-gold px-5 font-semibold text-[#1a1406] shadow-[0_12px_30px_rgba(232,180,74,0.28)]"
      >
        <Plus className="h-5 w-5" />
        Add Lead
      </button>
      <LeadDrawer />
      <CommandPalette />
      <NotificationToast />
      <ScannerOverlay visible={scan.scanning && !hydrated} />
    </div>
  )
}
