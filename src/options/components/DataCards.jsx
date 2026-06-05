import React from 'react'
import { matchesList, normalizeDomain } from '../../lib/domains.js'
import SpriteAvatar from './SpriteAvatar.jsx'

const TIME_COLORS = {
  focus: '#d4d4d8', // light — focused work
  distract: '#c6ff00', // neon — distraction
  neutral: '#52525a', // mid gray — everything else
}

// Aggregate the rolling history into the headline metrics.
export function aggregate(days, settings) {
  const totalFocus = days.reduce((s, d) => s + d.focusSeconds, 0)
  const totalDistract = days.reduce((s, d) => s + d.distractSeconds, 0)
  const totalNeutral = days.reduce((s, d) => s + (d.neutralSeconds || 0), 0)
  const totalTime = totalFocus + totalDistract + totalNeutral
  const totalOpens = days.reduce((s, d) => s + d.tabOpens, 0)
  const totalExplosions = days.reduce((s, d) => s + d.explosions, 0)

  // Merge per-domain opens across the window.
  const opensByDomain = {}
  for (const d of days) {
    for (const [domain, n] of Object.entries(d.opensByDomain || {})) {
      opensByDomain[domain] = (opensByDomain[domain] || 0) + n
    }
  }
  const ranked = Object.entries(opensByDomain)
    .map(([domain, opens]) => ({
      domain,
      opens,
      distracting: matchesList(domain, settings.distractingDomains),
    }))
    .sort((a, b) => b.opens - a.opens)

  // Merge per-host (sub-domain) opens and group them under their registrable
  // domain so the dashboard can break each domain down by subdomain.
  const hostsByDomain = {}
  for (const d of days) {
    for (const [host, n] of Object.entries(d.opensByHost || {})) {
      const reg = normalizeDomain(host) || host
      ;(hostsByDomain[reg] ||= {})[host] = (hostsByDomain[reg]?.[host] || 0) + n
    }
  }
  for (const reg of Object.keys(hostsByDomain)) {
    hostsByDomain[reg] = Object.entries(hostsByDomain[reg])
      .map(([host, opens]) => ({ host, opens }))
      .sort((a, b) => b.opens - a.opens)
  }

  const topHabits = ranked.filter((r) => r.distracting).slice(0, 5)
  const perfectDays = days.filter(
    (d) => d.distractingVisits === 0 && d.explosions === 0
  ).length

  return {
    totalFocus,
    totalDistract,
    totalNeutral,
    totalTime,
    totalOpens,
    totalExplosions,
    perfectDays,
    ranked,
    topHabits,
    hostsByDomain,
  }
}

// "0h" reads as nothing for short sessions — show minutes under an hour.
export function dur(seconds) {
  if (seconds >= 3600) return `${Math.round((seconds / 3600) * 10) / 10}h`
  if (seconds >= 60) return `${Math.round(seconds / 60)}m`
  return `${Math.round(seconds)}s`
}

export default function DataCards({ days, settings }) {
  const a = aggregate(days, settings)
  const maxHabit = a.topHabits[0]?.opens || 1

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
      <TimeCard a={a} totalDays={days.length} />

      <Stat
        kicker="Tab openings"
        value={a.totalOpens.toLocaleString()}
        sub={`${a.ranked.length} distinct domains · ${a.totalExplosions} explosions`}
      >
        <div className="mt-4 space-y-2">
          {a.ranked.slice(0, 4).map((r) => (
            <Bar
              key={r.domain}
              label={r.domain}
              value={r.opens}
              max={a.ranked[0]?.opens || 1}
              distracting={r.distracting}
            />
          ))}
          {a.ranked.length === 0 && <Empty />}
        </div>
      </Stat>

      <div className="panel p-6">
        <div className="kicker">Top distracting habit</div>
        <h3 className="mt-1 text-lg font-semibold text-ink-50">
          {a.topHabits[0]?.domain || 'None — nice.'}
        </h3>
        <ul className="mt-4 space-y-2.5">
          {a.topHabits.map((h, i) => (
            <li key={h.domain} className="flex items-center gap-3 text-sm">
              <span className="w-4 text-ink-400">{i + 1}</span>
              <span className="flex-1 truncate text-ink-100">{h.domain}</span>
              <span className="font-mono text-neon">{h.opens}</span>
              <Spark value={h.opens} max={maxHabit} />
            </li>
          ))}
          {a.topHabits.length === 0 && (
            <Empty message="Zero distracting habits. Keep it up." />
          )}
        </ul>
      </div>
    </div>
  )
}

// Total time across all tabs, broken into focus / distracting / neutral.
function TimeCard({ a, totalDays }) {
  const total = a.totalTime
  return (
    <div className="panel p-6">
      <div className="kicker">Total time on tabs</div>
      <div className="mt-2 text-4xl font-bold tracking-tight text-ink-50">
        {dur(total)}
      </div>
      <div className="mt-1 text-xs text-ink-400">
        this week · {a.perfectDays}/{totalDays} perfect days
      </div>

      <StackedBar
        segments={[
          { value: a.totalFocus, color: TIME_COLORS.focus },
          { value: a.totalDistract, color: TIME_COLORS.distract },
          { value: a.totalNeutral, color: TIME_COLORS.neutral },
        ]}
        total={total}
      />

      <div className="mt-4 space-y-2">
        <LegendRow color={TIME_COLORS.focus} label="Focus" seconds={a.totalFocus} />
        <LegendRow
          color={TIME_COLORS.distract}
          label="Distracting"
          seconds={a.totalDistract}
        />
        <LegendRow color={TIME_COLORS.neutral} label="Neutral" seconds={a.totalNeutral} />
      </div>
    </div>
  )
}

function StackedBar({ segments, total }) {
  return (
    <div className="mt-4 flex h-2.5 w-full overflow-hidden rounded-full bg-ink-800">
      {total > 0 &&
        segments.map((s, i) => (
          <div
            key={i}
            style={{
              width: `${(s.value / total) * 100}%`,
              backgroundColor: s.color,
            }}
          />
        ))}
    </div>
  )
}

function LegendRow({ color, label, seconds }) {
  return (
    <div className="flex items-center gap-2.5 text-xs">
      <span
        className="h-2.5 w-2.5 rounded-sm"
        style={{ backgroundColor: color }}
      />
      <span className="flex-1 text-ink-200">{label}</span>
      <span className="font-mono text-ink-100">{dur(seconds)}</span>
    </div>
  )
}

function Stat({ kicker, value, sub, accent, children }) {
  return (
    <div className="panel p-6">
      <div className="kicker">{kicker}</div>
      <div
        className="mt-2 text-4xl font-bold tracking-tight"
        style={accent ? { color: '#c6ff00' } : { color: '#f4f4f5' }}
      >
        {value}
      </div>
      <div className="mt-1 text-xs text-ink-400">{sub}</div>
      {children}
    </div>
  )
}

function Bar({ label, value, max, distracting }) {
  const pct = Math.max(6, Math.round((value / max) * 100))
  return (
    <div className="flex items-center gap-3 text-xs">
      <span className="w-28 truncate text-ink-200">{label}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-ink-800">
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            backgroundColor: distracting ? '#c6ff00' : '#52525a',
          }}
        />
      </div>
      <span className="w-8 text-right font-mono text-ink-300">{value}</span>
    </div>
  )
}

function Spark({ value, max }) {
  const pct = Math.max(8, Math.round((value / max) * 100))
  return (
    <div className="h-1.5 w-16 overflow-hidden rounded-full bg-ink-800">
      <div
        className="h-full rounded-full bg-neon"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

function Empty({ message = 'No activity recorded yet.' }) {
  return (
    <div className="flex flex-col items-center gap-2 py-3 text-center">
      <SpriteAvatar size={40} className="opacity-60" />
      <p className="text-sm text-ink-500">{message}</p>
    </div>
  )
}
