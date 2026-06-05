import React, { useMemo } from 'react'
import { aggregate } from './DataCards.jsx'
import { matchesList } from '../../lib/domains.js'
import SpriteAvatar from './SpriteAvatar.jsx'

// A full table of every domain visited across the rolling history, ranked by
// openings, with its productive / distracting / neutral classification.
export default function VisitedSites({ days, settings }) {
  const rows = useMemo(() => {
    const { ranked } = aggregate(days, settings)
    return ranked.map((r) => ({
      ...r,
      productive: matchesList(r.domain, settings.productiveDomains),
    }))
  }, [days, settings])

  const max = rows[0]?.opens || 1

  return (
    <section className="panel p-6">
      <div className="flex items-end justify-between">
        <div>
          <div className="kicker">Visited sites</div>
          <h2 className="mt-1 text-lg font-semibold text-ink-50">
            {rows.length} domain{rows.length === 1 ? '' : 's'} this week
          </h2>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="mt-5 flex flex-col items-center gap-2 py-6 text-center">
          <SpriteAvatar size={48} className="opacity-60" />
          <p className="text-sm text-ink-500">No sites visited yet.</p>
        </div>
      ) : (
        <div className="mt-5 max-h-80 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-ink-900/95 backdrop-blur">
              <tr className="text-left text-[11px] uppercase tracking-wider text-ink-400">
                <th className="w-8 py-2 font-medium">#</th>
                <th className="py-2 font-medium">Domain</th>
                <th className="py-2 font-medium">Type</th>
                <th className="py-2 pr-2 text-right font-medium">Openings</th>
                <th className="hidden w-40 py-2 font-medium sm:table-cell">
                  <span className="sr-only">Relative openings</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr
                  key={r.domain}
                  className="border-t border-white/5 hover:bg-white/[0.02]"
                >
                  <td className="py-2.5 font-mono text-ink-500">{i + 1}</td>
                  <td className="py-2.5 pr-3 text-ink-100">{r.domain}</td>
                  <td className="py-2.5 pr-3">
                    <TypeTag productive={r.productive} distracting={r.distracting} />
                  </td>
                  <td className="py-2.5 pr-2 text-right font-mono text-ink-200">
                    {r.opens}
                  </td>
                  <td className="hidden py-2.5 sm:table-cell">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-800">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.max(6, Math.round((r.opens / max) * 100))}%`,
                          backgroundColor: r.distracting ? '#c6ff00' : '#52525a',
                        }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

function TypeTag({ productive, distracting }) {
  if (distracting)
    return (
      <span className="rounded-full border border-neon/40 px-2 py-0.5 text-[11px] text-neon">
        Distracting
      </span>
    )
  if (productive)
    return (
      <span className="rounded-full border border-white/15 px-2 py-0.5 text-[11px] text-ink-200">
        Productive
      </span>
    )
  return (
    <span className="rounded-full border border-white/5 px-2 py-0.5 text-[11px] text-ink-500">
      Neutral
    </span>
  )
}
