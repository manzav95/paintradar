export const DEMO_CONTACTS: Record<string, { phone: string; email: string }> = {
  'Sarah M.': { phone: '(925) 555-0142', email: 'sarah.m@inbox.test' },
  'James R.': { phone: '(925) 555-0188', email: 'james.r@inbox.test' },
  'Priya S.': { phone: '(925) 555-0114', email: 'priya.s@inbox.test' },
  'Daniel K.': { phone: '(925) 555-0167', email: 'daniel.k@inbox.test' },
  'Marcus T.': { phone: '(925) 555-0190', email: 'marcus.t@inbox.test' },
  'Keisha M.': { phone: '(925) 555-0133', email: 'keisha.m@inbox.test' },
  'Gina E.': { phone: '(925) 555-0175', email: 'gina.e@inbox.test' },
  'Hannah L.': { phone: '(925) 555-0121', email: 'hannah.l@inbox.test' },
}

export function contactFor(name: string) {
  return DEMO_CONTACTS[name]
}
