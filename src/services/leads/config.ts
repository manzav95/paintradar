export const PIPELINE_WEIGHTS = {
  recency: 25,
  distance: 20,
  urgency: 20,
  hiringIntent: 15,
  projectValue: 10,
  aiConfidence: 10,
} as const

export const DEFAULT_SERVICE_RADIUS_MILES = 50
export const DEFAULT_MINIMUM_CONFIDENCE = 0.55
export const DEFAULT_MINIMUM_SCORE = 40

export const REDDIT_KEYWORDS = [
  'looking for painter',
  'need painter',
  'painter recommendation',
  'cabinet painter',
  'house painted',
  'interior painter',
  'exterior painter',
  'painting quote',
  'painting estimate',
  'repaint house',
  'paint kitchen cabinets',
  'cabinet refinishing',
]

export const REDDIT_LOCATION_WORDS = ['Brentwood', 'Antioch', 'Oakley', 'East Bay', 'Pittsburg']
