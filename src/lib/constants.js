// Central storage keys + tunable defaults shared across background, content,
// and the options dashboard. Keep this the single source of truth.

export const KEYS = {
  SETTINGS: 'sprite:settings',
  DAYS: 'sprite:days', // map of "YYYY-MM-DD" -> DayRecord
  UNLOCKS: 'sprite:unlocks', // map of domain -> unix-ms expiry
}

export const HISTORY_DAYS = 7

export const DEFAULT_SETTINGS = {
  // Domains the user considers focus work. Time here counts as focus.
  productiveDomains: [
    'github.com',
    'stackoverflow.com',
    'developer.mozilla.org',
    'docs.google.com',
    'notion.so',
    'linear.app',
  ],
  // Domains that get the high-friction blocking overlay.
  distractingDomains: [
    'youtube.com',
    'twitter.com',
    'x.com',
    'reddit.com',
    'instagram.com',
    'tiktok.com',
    'facebook.com',
    'netflix.com',
  ],
  tabLimit: 15, // > this triggers a Tab Explosion. 0 = unlimited (never explodes)
  unlockMinutes: 5, // temporary unlock window after solving a puzzle
  puzzleSeconds: 30, // countdown to solve the micro-task
  explosionFuseSeconds: 30, // ignore the warning sprite this long -> screen detonates
}

// tabLimit === 0 (or falsy) means "unlimited" — the Tab Explosion never fires.
export const isUnlimited = (limit) => !limit || limit <= 0

// A fresh per-day record.
export const emptyDay = (date) => ({
  date,
  focusSeconds: 0,
  distractSeconds: 0,
  neutralSeconds: 0,
  tabOpens: 0,
  opensByDomain: {}, // domain -> count of new visits today
  distractingVisits: 0, // count of blocked-site visits today
  maxOpenTabs: 0,
  explosions: 0, // number of times Tab Explosion fired today
})
