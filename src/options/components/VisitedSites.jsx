import React, { useMemo, useState } from 'react'
import { aggregate } from './DataCards.jsx'
import { matchesList } from '../../lib/domains.js'
import SpriteAvatar from './SpriteAvatar.jsx'

// A full table of every domain visited across the rolling history, ranked by
// openings, with its productive / distracting / neutral classification. Each
// domain can expand to reveal its sub-domain breakdown (mail.google.com, …).
export default function VisitedSites({ days, settings }) {
  const [expanded, setExpanded] = useState(() => new Set())

  const { rows, hostsByDomain } = useMemo(() => {
    const a = aggregate(days, settings)
    return {
      hostsByDomain: a.hostsByDomain,
      rows: a.ranked.map((r) => ({
        ...r,
        productive: matchesList(r.domain, settings.productiveDomains),
      })),
    }
  }, [days, settings])

  const max = rows[0]?.opens || 1

  const toggle = (domain) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(domain) ? next.delete(domain) : next.add(domain)
      return next
    })

  // A domain is expandable when it has any sub-host beyond the bare apex.
  const subHosts = (domain) =>
    (hostsByDomain[domain] || []).filter(
      (h) => h.host !== domain || (hostsByDomain[domain] || []).length > 1
    )

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
              {rows.map((r, i) => {
                const hosts = subHosts(r.domain)
                const canExpand = hosts.length > 0
                const isOpen = expanded.has(r.domain)
                return (
                  <React.Fragment key={r.domain}>
                    <tr
                      className={`ln hv border-t ${
                        canExpand ? 'cursor-pointer' : ''
                      }`}
                      onClick={canExpand ? () => toggle(r.domain) : undefined}
                    >
                      <td className="py-2.5 font-mono text-ink-500">{i + 1}</td>
                      <td className="py-2.5 pr-3 text-ink-100">
                        <span className="flex items-center gap-1.5">
                          {canExpand && (
                            <span
                              className={`text-ink-500 transition-transform ${
                                isOpen ? 'rotate-90' : ''
                              }`}
                            >
                              ▸
                            </span>
                          )}
                          {r.domain}
                          {canExpand && (
                            <span className="text-[11px] text-ink-500">
                              ({hosts.length})
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="py-2.5 pr-3">
                        <TypeTag productive={r.productive} distracting={r.distracting} />
                      </td>
                      <td className="py-2.5 pr-2 text-right font-mono text-ink-200">
                        {r.opens}
                      </td>
                      <td className="hidden py-2.5 sm:table-cell">
                        <Bar value={r.opens} max={max} distracting={r.distracting} />
                      </td>
                    </tr>

                    {isOpen &&
                      hosts.map((h) => (
                        <tr key={h.host} className="bg-black/20 text-xs">
                          <td />
                          <td className="py-1.5 pl-6 pr-3 text-ink-300">{h.host}</td>
                          <td />
                          <td className="py-1.5 pr-2 text-right font-mono text-ink-400">
                            {h.opens}
                          </td>
                          <td className="hidden py-1.5 sm:table-cell">
                            <Bar value={h.opens} max={max} distracting={r.distracting} dim />
                          </td>
                        </tr>
                      ))}
                  </React.Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

function Bar({ value, max, distracting, dim }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-800">
      <div
        className="h-full rounded-full"
        style={{
          width: `${Math.max(6, Math.round((value / max) * 100))}%`,
          backgroundColor: distracting ? '#c6ff00' : '#52525a',
          opacity: dim ? 0.55 : 1,
        }}
      />
    </div>
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
      <span className="ln-3 rounded-full border px-2 py-0.5 text-[11px] text-ink-200">
        Productive
      </span>
    )
  return (
    <span className="ln rounded-full border px-2 py-0.5 text-[11px] text-ink-500">
      Neutral
    </span>
  )
}
