// URL/domain helpers, framework-agnostic so they work in the service worker,
// the content script, and the React dashboard.

// Pull a normalized registrable-ish domain from a URL.
// "https://m.youtube.com/watch?v=1" -> "youtube.com"
export function domainFromUrl(url) {
  try {
    const { hostname } = new URL(url)
    return normalizeDomain(hostname)
  } catch {
    return null
  }
}

// Multi-part public suffixes where the registrable domain is suffix + 1 label.
// Without this, a naive "last two labels" rule mangles these: site.co.uk would
// collapse to "co.uk" and user.github.io to "github.io". Curated, not a full
// PSL — covers the common cases; extend as needed.
const MULTI_SUFFIXES = new Set([
  // country-code second-level domains
  'co.uk', 'org.uk', 'gov.uk', 'ac.uk', 'me.uk', 'ltd.uk', 'plc.uk', 'net.uk',
  'com.au', 'net.au', 'org.au', 'edu.au', 'gov.au', 'id.au',
  'co.jp', 'or.jp', 'ne.jp', 'ac.jp', 'go.jp',
  'co.nz', 'org.nz', 'govt.nz', 'ac.nz', 'net.nz',
  'co.in', 'net.in', 'org.in', 'gen.in', 'firm.in',
  'co.za', 'org.za', 'net.za', 'gov.za',
  'com.br', 'net.br', 'org.br', 'gov.br',
  'com.cn', 'net.cn', 'org.cn', 'gov.cn',
  'co.kr', 'or.kr', 'go.kr',
  'com.mx', 'com.ar', 'com.tr', 'com.sg', 'com.hk', 'com.tw', 'com.ua',
  'co.id', 'co.th', 'com.my', 'com.ph', 'co.il', 'com.sa',
  // platform suffixes where each subdomain is its own site
  'github.io', 'gitlab.io', 'pages.dev', 'workers.dev', 'vercel.app',
  'netlify.app', 'web.app', 'firebaseapp.com', 'herokuapp.com', 'r2.dev',
  'blogspot.com', 'wordpress.com', 'tumblr.com', 'myshopify.com',
  's3.amazonaws.com', 'azurewebsites.net', 'glitch.me', 'repl.co',
])

// Reduce a hostname to its registrable domain (eTLD+1), suffix-aware so that
// m.youtube.com -> youtube.com, but user.github.io -> user.github.io and
// shop.example.co.uk -> example.co.uk.
export function normalizeDomain(hostname) {
  if (!hostname) return null
  const h = hostname.toLowerCase().replace(/\.$/, '')
  const parts = h.split('.')
  if (parts.length <= 2) return h

  // If the last 3 labels form a known multi-part suffix, keep 3 labels;
  // if the last 2 do, keep 3; otherwise the registrable domain is 2 labels.
  const last2 = parts.slice(-2).join('.')
  const last3 = parts.slice(-3).join('.')
  if (MULTI_SUFFIXES.has(last3)) return parts.slice(-4).join('.')
  if (MULTI_SUFFIXES.has(last2)) return parts.slice(-3).join('.')
  return last2
}

// Is this a real, trackable web page (not chrome://, about:, extension pages)?
export function isTrackableUrl(url) {
  if (!url) return false
  return /^https?:\/\//i.test(url)
}

// Does `domain` match any entry in `list`? Matches apex + subdomains.
export function matchesList(domain, list) {
  if (!domain || !Array.isArray(list)) return false
  return list.some((entry) => {
    const e = normalizeDomain(entry)
    return domain === e || domain.endsWith('.' + e)
  })
}
