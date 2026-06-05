import React, { useState } from 'react'

// Editable lists of productive / distracting domains plus the core knobs.
// Writes straight back through saveSettings (the background reads these live).
export default function SettingsPanel({ settings, onSave }) {
  return (
    <section className="panel p-6">
      <div className="kicker">Configuration</div>
      <h2 className="mt-1 text-lg font-semibold text-ink-50">Domains &amp; limits</h2>

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
          hint="Blocked behind a 30s math puzzle."
          accent="#c6ff00"
          domains={settings.distractingDomains}
          onChange={(distractingDomains) => onSave({ distractingDomains })}
        />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
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
        <NumberField
          label="Explosion fuse (s)"
          value={settings.explosionFuseSeconds}
          min={5}
          onChange={(explosionFuseSeconds) => onSave({ explosionFuseSeconds })}
        />
      </div>
    </section>
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
              : 'border-white/10 text-ink-400 hover:text-ink-100'
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
            className="group flex items-center gap-1.5 rounded-full border border-white/10 bg-ink-800 px-3 py-1 text-xs text-ink-100"
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
