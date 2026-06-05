// Sprite background service worker (MV3).
// Responsibilities:
//   1. Active-tab time tracking (focus / distract / neutral seconds).
//   2. Per-domain "tab opening" counter.
//   3. Tab-Overload detection -> "Tab Explosion" state broadcast to all tabs.
//   4. Daily persistence with a rolling 7-day archive (handled in storage.js).
//
// MV3 service workers are evicted aggressively, so all cross-event state lives
// in chrome.storage.session (cleared on browser restart, which is what we want
// for ephemeral tracking) rather than in module-scope variables.

import {
  getSettings,
  updateDay,
  grantUnlock,
  getDay,
} from '../lib/storage.js'
import { isUnlimited } from '../lib/constants.js'
import { domainFromUrl, hostFromUrl, isTrackableUrl, matchesList } from '../lib/domains.js'

const SESSION_KEY = 'sprite:activeSession' // { tabId, domain, kind, startedAt }
const EXPLOSION_KEY = 'sprite:explosion' // { exploded, count, limit }  (in local)
const LAST_DOMAIN_KEY = 'sprite:lastDomainByTab' // { [tabId]: domain }
const ALARM_TICK = 'sprite:tick'

// A single flush never credits more than this, guarding against a stale
// startedAt (e.g. machine asleep) being counted as real active time.
const MAX_FLUSH_MS = 5 * 60 * 1000

/* --------------------------- session state -------------------------- */

async function getSession() {
  const r = await chrome.storage.session.get(SESSION_KEY)
  return r[SESSION_KEY] || null
}
async function setSession(value) {
  if (value) await chrome.storage.session.set({ [SESSION_KEY]: value })
  else await chrome.storage.session.remove(SESSION_KEY)
}

async function classify(domain) {
  const settings = await getSettings()
  if (matchesList(domain, settings.productiveDomains)) return 'focus'
  if (matchesList(domain, settings.distractingDomains)) return 'distract'
  return 'neutral'
}

/* ----------------------------- time flush --------------------------- */
// Credit elapsed wall time on the current active session to its bucket, then
// reset the clock so repeated flushes don't double-count.

async function flush() {
  const session = await getSession()
  if (!session) return
  const now = Date.now()
  const elapsed = Math.min(now - session.startedAt, MAX_FLUSH_MS)
  if (elapsed <= 0) return
  const seconds = Math.round(elapsed / 1000)
  if (seconds > 0) {
    await updateDay((day) => {
      if (session.kind === 'focus') day.focusSeconds += seconds
      else if (session.kind === 'distract') day.distractSeconds += seconds
      else day.neutralSeconds += seconds
      return day
    })
  }
  session.startedAt = now
  await setSession(session)
}

// Switch the active session to a new tab/url (flushing the previous one first).
async function setActive(tabId, url) {
  await flush()
  if (!isTrackableUrl(url)) {
    await setSession(null)
    return
  }
  const domain = domainFromUrl(url)
  if (!domain) {
    await setSession(null)
    return
  }
  const kind = await classify(domain)
  await setSession({ tabId, domain, kind, startedAt: Date.now() })
}

async function pause() {
  // Browser/window lost focus — bank what we have and stop the clock.
  await flush()
  await setSession(null)
}

async function refreshActiveFromBrowser() {
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true })
  if (tab && tab.url) await setActive(tab.id, tab.url)
  else await setSession(null)
}

/* ------------------------- tab-open counting ------------------------ */

async function getLastDomains() {
  const r = await chrome.storage.session.get(LAST_DOMAIN_KEY)
  return r[LAST_DOMAIN_KEY] || {}
}
async function setLastDomains(map) {
  await chrome.storage.session.set({ [LAST_DOMAIN_KEY]: map })
}

// Count a "tab opening" the first time a tab lands on a given host (i.e. a
// navigation to a *new* host), not on every in-site path click. Deduping by
// host (not registrable domain) means switching subdomains — mail.google.com
// to docs.google.com — registers, so sub-domain detail stays accurate.
async function countOpen(tabId, url) {
  if (!isTrackableUrl(url)) return
  const domain = domainFromUrl(url)
  if (!domain) return
  const host = hostFromUrl(url) || domain
  const last = await getLastDomains()
  if (last[tabId] === host) return // same host as before — not a new open
  last[tabId] = host
  await setLastDomains(last)

  const settings = await getSettings()
  const isDistracting = matchesList(domain, settings.distractingDomains)
  await updateDay((day) => {
    day.tabOpens += 1
    day.opensByDomain[domain] = (day.opensByDomain[domain] || 0) + 1
    if (!day.opensByHost) day.opensByHost = {} // migrate older records
    day.opensByHost[host] = (day.opensByHost[host] || 0) + 1
    if (isDistracting) day.distractingVisits += 1
    return day
  })
}

/* ------------------------- tab explosion ---------------------------- */

async function getExplosion() {
  const r = await chrome.storage.local.get(EXPLOSION_KEY)
  return r[EXPLOSION_KEY] || { exploded: false, count: 0, limit: 15 }
}

async function recomputeTabCount() {
  const settings = await getSettings()
  const limit = settings.tabLimit
  const tabs = await chrome.tabs.query({})
  const count = tabs.length
  const prev = await getExplosion()
  const exploded = !isUnlimited(limit) && count > limit

  // Track the day's peak open-tab count, and count a fresh explosion event.
  await updateDay((day) => {
    if (count > day.maxOpenTabs) day.maxOpenTabs = count
    if (exploded && !prev.exploded) day.explosions += 1
    return day
  })

  const next = { exploded, count, limit }
  await chrome.storage.local.set({ [EXPLOSION_KEY]: next })

  if (next.exploded !== prev.exploded || next.count !== prev.count) {
    broadcast({ type: 'SPRITE_EXPLOSION', payload: next })
  }
}

function broadcast(message) {
  chrome.tabs.query({}, (tabs) => {
    for (const tab of tabs) {
      if (tab.id >= 0) {
        chrome.tabs.sendMessage(tab.id, message).catch(() => {
          /* no content script in this tab (e.g. chrome://) — ignore */
        })
      }
    }
  })
}

/* ----------------------------- listeners ---------------------------- */

chrome.runtime.onInstalled.addListener(async () => {
  await ensureAlarm()
  await getSettings() // materialize defaults
  await recomputeTabCount()
  await refreshActiveFromBrowser()
})

chrome.runtime.onStartup.addListener(async () => {
  await ensureAlarm()
  await recomputeTabCount()
  await refreshActiveFromBrowser()
})

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  try {
    const tab = await chrome.tabs.get(tabId)
    await setActive(tabId, tab.url)
  } catch {
    /* tab gone */
  }
})

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.url) {
    await countOpen(tabId, changeInfo.url)
    if (tab.active) await setActive(tabId, changeInfo.url)
  }
})

chrome.tabs.onCreated.addListener(() => recomputeTabCount())

chrome.tabs.onRemoved.addListener(async (tabId) => {
  const last = await getLastDomains()
  if (tabId in last) {
    delete last[tabId]
    await setLastDomains(last)
  }
  await recomputeTabCount()
})

chrome.windows.onFocusChanged.addListener(async (windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) await pause()
  else await refreshActiveFromBrowser()
})

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === ALARM_TICK) {
    await flush()
    await recomputeTabCount()
  }
})

// Open the dashboard when the toolbar icon is clicked.
chrome.action.onClicked.addListener(() => {
  chrome.runtime.openOptionsPage()
})

// Content scripts ask us to grant a temporary unlock after a solved puzzle,
// or to report the current state on load.
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  ;(async () => {
    if (msg?.type === 'SPRITE_UNLOCK' && msg.domain) {
      const settings = await getSettings()
      const expiry = await grantUnlock(msg.domain, settings.unlockMinutes)
      sendResponse({ ok: true, expiry })
      return
    }
    if (msg?.type === 'SPRITE_CLOSE_TAB') {
      // Close the tab the failed puzzle came from.
      const tabId = sender?.tab?.id
      if (tabId >= 0) await chrome.tabs.remove(tabId).catch(() => {})
      sendResponse({ ok: true })
      return
    }
    if (msg?.type === 'SPRITE_GET_STATE') {
      sendResponse({ explosion: await getExplosion(), day: await getDay() })
      return
    }
    sendResponse({ ok: false })
  })()
  return true // keep the channel open for the async response
})

async function ensureAlarm() {
  const existing = await chrome.alarms.get(ALARM_TICK)
  if (!existing) {
    // 1 min is the production floor for periodic alarms; flush() credits the
    // full elapsed wall-time regardless, so coarse ticks stay accurate.
    chrome.alarms.create(ALARM_TICK, { periodInMinutes: 1 })
  }
}
