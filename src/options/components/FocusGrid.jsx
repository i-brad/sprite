import React from 'react'
import { chaosLevel, LEVEL_COLORS, LEVEL_LABELS } from '../../lib/score.js'

const WEEKDAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// A GitHub-contribution-style strip of the rolling history. Each day is a
// rounded cell coloured by its chaos level — pitch-black for perfect focus,
// neon for total chaos.
export default function FocusGrid({ days }) {
  return (
    <section className="panel p-6">
      <div className="flex items-end justify-between">
        <div>
          <div className="kicker">Focus grid</div>
          <h2 className="mt-1 text-lg font-semibold text-ink-50">
            Last {days.length} days
          </h2>
        </div>
        <Legend />
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        {days.map((day) => {
          const level = chaosLevel(day)
          const date = new Date(day.date + 'T00:00:00')
          const neon = level === 4
          return (
            <div key={day.date} className="flex flex-col items-center gap-2">
              <div
                className="ln group relative h-14 w-14 rounded-lg border transition-transform hover:scale-105"
                style={{
                  backgroundColor: LEVEL_COLORS[level],
                  boxShadow: neon
                    ? '0 0 0 1px rgba(198,255,0,0.6), 0 0 22px -2px rgba(198,255,0,0.55)'
                    : undefined,
                }}
              >
                <Tooltip day={day} level={level} />
              </div>
              <span className="text-[10px] uppercase tracking-wider text-ink-400">
                {WEEKDAY[date.getDay()]}
              </span>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function Tooltip({ day, level }) {
  return (
    <div className="ln-2 pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg border bg-ink-800 px-3 py-2 text-xs shadow-xl group-hover:block">
      <div className="font-semibold text-ink-50">{day.date}</div>
      <div className="text-ink-300">{LEVEL_LABELS[level]}</div>
      <div className="mt-1 text-ink-400">
        {day.distractingVisits} blocked · {day.explosions} explosions
      </div>
    </div>
  )
}

function Legend() {
  return (
    <div className="flex items-center gap-2 text-[10px] text-ink-400">
      <span>Focus</span>
      {LEVEL_COLORS.map((c, i) => (
        <span
          key={i}
          className="ln h-3.5 w-3.5 rounded-sm border"
          style={{
            backgroundColor: c,
            boxShadow:
              i === 4 ? '0 0 8px -1px rgba(198,255,0,0.7)' : undefined,
          }}
        />
      ))}
      <span>Chaos</span>
    </div>
  )
}
