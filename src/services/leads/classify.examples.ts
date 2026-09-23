import { mockClassify } from '@/services/leads/classifyLead'
import { normalizeLead } from '@/services/leads/normalizeLead'

export const CLASSIFIER_EXAMPLES = [
  {
    name: 'antioch bedrooms',
    content: 'Need someone to paint four bedrooms and hallway in Antioch before we move in Friday.',
    expectLead: true,
    expectCategory: 'Interior Painting',
  },
  {
    name: 'brentwood cabinets rec',
    content: 'Can anyone recommend someone who refinishes and paints kitchen cabinets around Brentwood?',
    expectLead: true,
    expectCategory: 'Cabinet Painting',
  },
  {
    name: 'color advice',
    content: 'Thinking about painting our cabinets. Should we choose white or gray?',
    expectLead: false,
  },
  {
    name: 'selling paint',
    content: 'Selling 4 unopened gallons of white exterior paint.',
    expectLead: false,
  },
  {
    name: 'tester milestone',
    content: 'Looking for someone to repaint our kitchen cabinets in Brentwood. Want quotes this week.',
    expectLead: true,
    expectCategory: 'Cabinet Painting',
  },
] as const

export function runClassifierExamples() {
  return CLASSIFIER_EXAMPLES.map((example) => {
    const classification = mockClassify(
      normalizeLead({
        source: 'manual',
        content: example.content,
      }),
    )
    const ok =
      classification.isLead === example.expectLead &&
      (!('expectCategory' in example) || classification.category === example.expectCategory)
    return { ...example, ok, classification }
  })
}