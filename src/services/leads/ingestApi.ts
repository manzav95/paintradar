import { processLead } from '@/services/leads/processLead'
import { saveLead } from '@/services/leads/saveLead'
import type { ProcessContext, ProcessResult, RawLead } from '@/types/lead'

export async function handleIngest(raw: RawLead, context?: Partial<ProcessContext>): Promise<ProcessResult> {
  const result = await processLead(raw, context)
  if (!result.accepted || !result.lead) return result
  try {
    const saved = await saveLead(result.lead)
    return { ...result, lead: { ...result.lead, id: saved.id } }
  } catch (error) {
    if (error instanceof Error && error.message === 'duplicate') {
      return {
        ...result,
        accepted: false,
        reason: 'duplicate',
        lead: undefined,
        log: `${result.log} duplicate_on_save`,
      }
    }
    throw error
  }
}
