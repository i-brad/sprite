import React from 'react'
import { chaosLevel, LEVEL_COLORS, LEVEL_LABELS } from '../../lib/score.js'

const WEEKDAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// A GitHub-contribution-style grid: weekdays down the rows, weeks across the
// columns. Each day is coloured by its chaos level — pitch-black for perfect
// focus, neon for total chaos. Scales to any history length.
export default function FocusGrid({ days }) {
  // days arrive oldest -> newest; offset the first cell to its weekday row.
  const firstDow = new Date(days[0].date + 'T00:00:00').getDay()

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

      <div className="mt-6 flex gap-2">
        {/* weekday labels (Mon / Wed / Fri, like GitHub) */}
        <div className="grid grid-rows-[repeat(7,14px)] gap-1 pr-1 text-[10px] leading-[14px] text-ink-400">
          {WEEKDAY.map((d, i) => (
            <span key={d} className="h-3.5">
              {i % 2 === 1 ? d : ''}
            </span>
          ))}
        </div>

        <div className="grid grid-flow-col grid-rows-[repeat(7,14px)] gap-1 overflow-x-auto">
          {days.map((day, i) => {
            const level = chaosLevel(day)
            const neon = level === 4
            const hasData =
              day.focusSeconds + day.distractSeconds + day.neutralSeconds + day.tabOpens > 0
            return (
              <div
                key={day.date}
                className="ln group relative h-3.5 w-3.5 rounded-sm border"
                style={{
                  backgroundColor: hasData ? LEVEL_COLORS[level] : 'transparent',
                  gridRowStart: i === 0 ? firstDow + 1 : undefined,
                  boxShadow: neon ? '0 0 8px -1px rgba(198,255,0,0.7)' : undefined,
                }}
              >
                <Tooltip day={day} level={level} hasData={hasData} />
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function Tooltip({ day, level, hasData }) {
  return (
    <div className="ln-2 pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg border bg-ink-800 px-3 py-2 text-xs shadow-xl group-hover:block">
      <div className="font-semibold text-ink-50">{day.date}</div>
      <div className="text-ink-300">{hasData ? LEVEL_LABELS[level] : 'No activity'}</div>
      {hasData && (
        <div className="mt-1 text-ink-400">
          {day.distractingVisits} blocked · {day.explosions} over-limit
        </div>
      )}
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
            boxShadow: i === 4 ? '0 0 8px -1px rgba(198,255,0,0.7)' : undefined,
          }}
        />
      ))}
      <span>Chaos</span>
    </div>
  )
}
