// Thin, promise-based wrappers over chrome.storage.local. All mutations to the
// per-day archive go through update helpers that auto-prune to HISTORY_DAYS.

import { KEYS, HISTORY_DAYS, DEFAULT_SETTINGS, emptyDay } from './constants.js'

const area = () => chrome.storage.local

export function todayKey(d = new Date()) {
  // Local-time YYYY-MM-DD (not UTC) so "today" matches the user's clock.
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

async function get(key, fallback) {
  const res = await area().get(key)
  return key in res ? res[key] : fallback
}

async function set(key, value) {
  await area().set({ [key]: value })
}

/* ----------------------------- settings ----------------------------- */

export async function getSettings() {
  const stored = await get(KEYS.SETTINGS, {})
  // Merge so new default fields appear for existing installs.
  return { ...DEFAULT_SETTINGS, ...stored }
}

export async function saveSettings(patch) {
  const next = { ...(await getSettings()), ...patch }
  await set(KEYS.SETTINGS, next)
  return next
}

// Wipe all customizations back to the shipped defaults.
export async function resetSettings() {
  const next = { ...DEFAULT_SETTINGS }
  await set(KEYS.SETTINGS, next)
  return next
}

/* ------------------------------ days -------------------------------- */

export async function getDays() {
  return get(KEYS.DAYS, {})
}

// Keep only the most recent HISTORY_DAYS entries.
function prune(days) {
  const keys = Object.keys(days).sort() // ascending date strings
  while (keys.length > HISTORY_DAYS) {
    const oldest = keys.shift()
    delete days[oldest]
  }
  return days
}

export async function getDay(key = todayKey()) {
  const days = await getDays()
  return days[key] || emptyDay(key)
}

// Read-modify-write a single day. `mutator(day)` mutates in place or returns one.
export async function updateDay(mutator, key = todayKey()) {
  const days = await getDays()
  const current = days[key] || emptyDay(key)
  const next = mutator(current) || current
  days[key] = next
  prune(days)
  await set(KEYS.DAYS, days)
  return next
}

// Last N days (oldest -> newest), filling gaps with empty records so the grid
// always renders a full strip.
export async function getRecentDays(n = HISTORY_DAYS) {
  const days = await getDays()
  const out = []
  const base = new Date()
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(base)
    d.setDate(base.getDate() - i)
    const key = todayKey(d)
    out.push(days[key] || emptyDay(key))
  }
  return out
}

/* ----------------------------- unlocks ------------------------------ */
// A temporary unlock lets a distracting domain through until its expiry.

export async function getUnlocks() {
  const unlocks = await get(KEYS.UNLOCKS, {})
  // Drop expired entries on read.
  const now = Date.now()
  let changed = false
  for (const [domain, expiry] of Object.entries(unlocks)) {
    if (expiry <= now) {
      delete unlocks[domain]
      changed = true
    }
  }
  if (changed) await set(KEYS.UNLOCKS, unlocks)
  return unlocks
}

export async function grantUnlock(domain, minutes) {
  const unlocks = await get(KEYS.UNLOCKS, {})
  unlocks[domain] = Date.now() + minutes * 60 * 1000
  await set(KEYS.UNLOCKS, unlocks)
  return unlocks[domain]
}

export async function isUnlocked(domain) {
  const unlocks = await getUnlocks()
  return Boolean(unlocks[domain] && unlocks[domain] > Date.now())
}

/* ------------------------------ misc -------------------------------- */

export function onChanged(callback) {
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local') callback(changes)
  })
}
