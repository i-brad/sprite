import React, { useState } from 'react'

// Editable lists of productive / distracting domains plus the core knobs.
// Writes straight back through saveSettings (the background reads these live).
export default function SettingsPanel({ settings, onSave, onReset, onClose }) {
  const reset = () => {
    if (window.confirm('Reset all domains and limits to the Sprite defaults?')) {
      onReset?.()
    }
  }
  return (
    <section className="panel max-h-[88vh] overflow-y-auto p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="kicker">Configuration</div>
          <h2 className="mt-1 text-lg font-semibold text-ink-50">Domains &amp; limits</h2>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={reset}
            className="ln-2 rounded-lg border px-3 py-1.5 text-xs text-ink-300 transition-colors hover:border-neon hover:text-neon"
          >
            Reset to defaults
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close settings"
              className="ln-2 flex h-8 w-8 items-center justify-center rounded-lg border text-ink-300 transition-colors hover:border-neon hover:text-neon"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <DomainList
          title="Productive"
          hint="Time here counts as focus."
          accent="#52525a"
          domains={settings.productiveDomains}
          onChange={(productiveDomains) => onSave({ productiveDomains })}
        />
        <DomainList
          title="Distracting"
          hint="Blocked behind a 30s challenge."
          accent="#c6ff00"
          domains={settings.distractingDomains}
          onChange={(distractingDomains) => onSave({ distractingDomains })}
        />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <TabLimitField
          value={settings.tabLimit}
          onChange={(tabLimit) => onSave({ tabLimit })}
        />
        <NumberField
          label="Unlock minutes"
          value={settings.unlockMinutes}
          min={1}
          onChange={(unlockMinutes) => onSave({ unlockMinutes })}
        />
        <NumberField
          label="Puzzle seconds"
          value={settings.puzzleSeconds}
          min={3}
          onChange={(puzzleSeconds) => onSave({ puzzleSeconds })}
        />
      </div>

      <div className="mt-6">
        <ToggleField
          label="Explosion sound"
          hint="Play a sound when the screen detonates."
          checked={settings.sound !== false}
          onChange={(sound) => onSave({ sound })}
        />
      </div>
    </section>
  )
}

// A labelled on/off switch.
function ToggleField({ label, hint, checked, onChange }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <div className="text-sm text-ink-100">{label}</div>
        {hint && <div className="text-[11px] text-ink-500">{hint}</div>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full border transition-colors ${
          checked ? 'border-neon/60 bg-neon/30' : 'ln-2 bg-ink-800'
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full transition-all ${
            checked ? 'left-[22px] bg-neon' : 'left-0.5 bg-ink-400'
          }`}
        />
      </button>
    </div>
  )
}

// Tab limit with an "Unlimited" toggle. Unlimited is stored as tabLimit === 0,
// which the background treats as "never explode".
function TabLimitField({ value, onChange }) {
  const unlimited = !value || value <= 0
  return (
    <label className="block">
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-wider text-ink-400">
          Tab limit
        </span>
        <button
          type="button"
          onClick={() => onChange(unlimited ? 15 : 0)}
          aria-pressed={unlimited}
          className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider transition-colors ${
            unlimited
              ? 'border-neon/50 bg-neon/10 text-neon'
              : 'ln-2 text-ink-400 hover:text-ink-100'
          }`}
        >
          ∞ Unlimited
        </button>
      </div>
      <input
        type="number"
        min={2}
        disabled={unlimited}
        value={unlimited ? '' : value}
        placeholder={unlimited ? 'Unlimited' : ''}
        onChange={(e) => onChange(Math.max(2, Number(e.target.value) || 2))}
        className="mt-1 w-full rounded-lg border border-ink-700 bg-ink-950 px-3 py-2 text-sm text-ink-100 outline-none placeholder:text-ink-500 focus:border-neon disabled:opacity-50"
      />
    </label>
  )
}

function DomainList({ title, hint, accent, domains, onChange }) {
  const [draft, setDraft] = useState('')

  const add = () => {
    const value = draft.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '')
    if (!value || domains.includes(value)) return setDraft('')
    onChange([...domains, value])
    setDraft('')
  }

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-semibold" style={{ color: accent }}>
          {title}
        </span>
        <span className="text-[11px] text-ink-500">{hint}</span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {domains.map((d) => (
          <span
            key={d}
            className="ln-2 group flex items-center gap-1.5 rounded-full border bg-ink-800 px-3 py-1 text-xs text-ink-100"
          >
            {d}
            <button
              type="button"
              aria-label={`Remove ${d}`}
              className="text-ink-500 hover:text-neon"
              onClick={() => onChange(domains.filter((x) => x !== d))}
            >
              ×
            </button>
          </span>
        ))}
        {domains.length === 0 && (
          <span className="text-xs text-ink-500">None yet.</span>
        )}
      </div>

      <div className="mt-3 flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
          placeholder="example.com"
          className="flex-1 rounded-lg border border-ink-700 bg-ink-950 px-3 py-2 text-sm text-ink-100 outline-none focus:border-neon"
        />
        <button
          type="button"
          onClick={add}
          className="rounded-lg border border-ink-700 bg-ink-800 px-3 py-2 text-sm text-ink-100 hover:border-neon"
        >
          Add
        </button>
      </div>
    </div>
  )
}

function NumberField({ label, value, min, onChange }) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-wider text-ink-400">
        {label}
      </span>
      <input
        type="number"
        min={min}
        value={value}
        onChange={(e) => onChange(Math.max(min, Number(e.target.value) || min))}
        className="mt-1 w-full rounded-lg border border-ink-700 bg-ink-950 px-3 py-2 text-sm text-ink-100 outline-none focus:border-neon"
      />
    </label>
  )
}
