// Turn a DayRecord into a 0–4 "chaos level" that drives the focus grid colour
// and the dashboard copy. Level 0 = perfect focus, level 4 = total chaos.

export function chaosLevel(day) {
  if (!day) return 0
  const perfect = day.distractingVisits === 0 && day.explosions === 0
  if (perfect) return 0 // pitch-black square

  // Weighted chaos: each blocked visit, each explosion, and accumulated
  // distraction minutes push the day toward neon.
  const score =
    day.distractingVisits * 3 +
    day.explosions * 5 +
    Math.floor(day.distractSeconds / 300) // +1 per 5 distracting minutes

  if (score >= 18) return 4 // neon — absolute chaos / exploded tabs
  if (score >= 10) return 3
  if (score >= 5) return 2
  return 1
}

// Monochrome ramp + neon peak. Index by chaosLevel().
export const LEVEL_COLORS = [
  '#050505', // 0 perfect focus — pitch black
  '#1c1c20', // 1
  '#3a3a40', // 2
  '#6b6b75', // 3 moderate
  '#c6ff00', // 4 neon chaos
]

export const LEVEL_LABELS = [
  'Perfect focus',
  'Light noise',
  'Moderate',
  'Heavy distraction',
  'Chaos / exploded',
]

export function hours(seconds) {
  return Math.round((seconds / 3600) * 10) / 10
}
