/**
 * Scan orchestration.
 *
 * Callable from the dashboard, a Vite/dev API route, a Supabase scheduled
 * function, cron, or any other server job. Do not depend only on browser timers.
 */
export { DEFAULT_SCAN_INTERVAL_MS } from '@/services/scan/interval'
export { scanAllSources, createPipelineSources } from '@/services/scan/scanAllSources'
