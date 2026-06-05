import React, { useEffect, useState, useCallback } from 'react'
import { getRecentDays, getSettings, saveSettings, resetSettings, onChanged } from '../lib/storage.js'
import { HISTORY_DAYS } from '../lib/constants.js'
import FocusGrid from './components/FocusGrid.jsx'
import DataCards from './components/DataCards.jsx'
import VisitedSites from './components/VisitedSites.jsx'
import SettingsPanel from './components/SettingsPanel.jsx'
import SpriteAvatar from './components/SpriteAvatar.jsx'

export default function App() {
  const [days, setDays] = useState(null)
  const [settings, setSettings] = useState(null)
  const [showConfig, setShowConfig] = useState(false)

  const load = useCallback(async () => {
    const [d, s] = await Promise.all([getRecentDays(HISTORY_DAYS), getSettings()])
    setDays(d)
    setSettings(s)
  }, [])

  useEffect(() => {
    load()
    // Live-refresh when the background writes new tracking data.
    onChanged((changes) => {
      if (changes['sprite:days'] || changes['sprite:settings']) load()
    })
  }, [load])

  const handleSave = useCallback(async (patch) => {
    const next = await saveSettings(patch)
    setSettings(next)
  }, [])

  const handleReset = useCallback(async () => {
    const next = await resetSettings()
    setSettings(next)
  }, [])

  if (!days || !settings) return <Loading />

  return (
    <div className="mx-auto min-h-screen max-w-5xl px-6 py-12">
      <Header
        days={days}
        showConfig={showConfig}
        onToggleConfig={() => setShowConfig((v) => !v)}
      />
      <div className="mt-10 space-y-8">
        <FocusGrid days={days} />
        <DataCards days={days} settings={settings} />
        <VisitedSites days={days} settings={settings} />
        {showConfig && (
          <SettingsPanel settings={settings} onSave={handleSave} onReset={handleReset} />
        )}
      </div>
      <Footer />
    </div>
  )
}

function Header({ days, showConfig, onToggleConfig }) {
  const streak = perfectStreak(days)
  return (
    <header className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-ink-900 shadow-neon">
          <SpriteAvatar size={34} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-50">Sprite</h1>
          <p className="text-sm text-ink-400">Digital wellbeing, gamified.</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-ink-900/60 px-5 py-3">
          <span className="text-3xl font-bold text-neon">{streak}</span>
          <span className="text-xs leading-tight text-ink-400">
            day perfect
            <br />
            focus streak
          </span>
        </div>
        <button
          type="button"
          onClick={onToggleConfig}
          aria-label="Toggle configuration"
          aria-pressed={showConfig}
          title="Configuration"
          className={`flex h-12 w-12 items-center justify-center rounded-xl border transition-colors ${
            showConfig
              ? 'border-neon/50 bg-ink-900 text-neon shadow-neon'
              : 'border-white/10 bg-ink-900/60 text-ink-300 hover:border-white/20 hover:text-ink-100'
          }`}
        >
          <GearIcon spinning={showConfig} />
        </button>
      </div>
    </header>
  )
}

function GearIcon({ spinning }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={spinning ? 'transition-transform duration-300 rotate-45' : 'transition-transform duration-300'}
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}

// Trailing run of perfect-focus days ending today.
function perfectStreak(days) {
  let streak = 0
  for (let i = days.length - 1; i >= 0; i--) {
    const d = days[i]
    if (d.distractingVisits === 0 && d.explosions === 0) streak++
    else break
  }
  return streak
}

function Loading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <SpriteAvatar size={56} className="animate-bounce" />
      <span className="kicker animate-pulse">Loading focus data…</span>
    </div>
  )
}

function Footer() {
  return (
    <footer className="mt-12 border-t border-white/5 pt-6 text-center text-xs text-ink-500">
      Sprite tracks locally on your device. Nothing leaves your browser.
    </footer>
  )
}
