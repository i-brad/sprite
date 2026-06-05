// Sprite content script — injected at document_start on every page.
//
//   • Distracting domain + not unlocked  -> full-screen glassmorphic blocker
//     with a frantic 30s math micro-task. Solve it -> 5-min unlock. Fail or
//     time out -> redirected to a blank page.
//   • Tab Explosion active (over limit)   -> the Sprite mascot peeks into the
//     bottom-right corner, panicking. You can dismiss it. Ignore it for the
//     fuse duration (default 30s) and the whole screen detonates.
//
// All UI lives inside a Shadow DOM so neither host-page styles nor our own
// leak across the boundary.

import { getSettings, isUnlocked } from '../lib/storage.js'
import { normalizeDomain, matchesList } from '../lib/domains.js'

const HOST_ID = 'sprite-shadow-host'
const CURRENT_DOMAIN = normalizeDomain(location.hostname)

let shadow = null
let timerHandle = null // puzzle countdown

// Tab-explosion episode state (per tab / page).
let settings = null // cached settings for sync access in render
let fuseTimer = null // doom countdown handle
let dismissed = false // user dismissed the sprite this episode
let detonated = false // full-screen explosion already played this episode

/* ----------------------------- shadow host -------------------------- */

function ensureShadow() {
  if (shadow) return shadow
  const host = document.createElement('div')
  host.id = HOST_ID
  host.style.cssText = 'all: initial; position: fixed; inset: 0; z-index: 2147483647;'
  host.style.pointerEvents = 'none' // children opt back in
  ;(document.documentElement || document.body || document).appendChild(host)
  shadow = host.attachShadow({ mode: 'open' })
  const style = document.createElement('style')
  style.textContent = STYLES
  shadow.appendChild(style)
  return shadow
}

function mount(node) {
  ensureShadow().appendChild(node)
}

/* ------------------------------ blocker ----------------------------- */

const rnd = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
const pickOne = (arr) => arr[Math.floor(Math.random() * arr.length)]

/* Each challenge renders into `root` and calls api.solve() / api.fail().
 * It returns { instructions } shown in the panel lead. api.onCleanup(fn)
 * registers teardown for any timers/RAF it starts. */

function challengeMath(root, { solve, fail }) {
  const a = Math.random() < 0.5 ? rnd(11, 99) : rnd(137, 989)
  const b = Math.random() < 0.5 ? rnd(11, 99) : rnd(137, 989)
  const mult = Math.random() < 0.5
  const answer = mult ? a * b : a + b
  root.innerHTML = `
    <div class="puzzle">${a} ${mult ? '×' : '+'} ${b} =</div>
    <input class="answer" type="number" inputmode="numeric" autocomplete="off" placeholder="?" />
    <button class="submit" type="button">UNLOCK</button>`
  const input = root.querySelector('.answer')
  setTimeout(() => input.focus(), 0)
  const submit = () => (Number(input.value) === answer ? solve() : fail())
  root.querySelector('.submit').addEventListener('click', submit)
  input.addEventListener('keydown', (e) => e.key === 'Enter' && submit())
  return { instructions: 'Solve the math puzzle to unlock this site.' }
}

const PHRASES = [
  'i am choosing to waste my focus',
  'this is not what i should be doing',
  'my attention is worth more than this',
  'i will regret this in five minutes',
  'scrolling is stealing my time',
  'one more tab is never just one more',
]
function challengeType(root, { solve, fail }) {
  const phrase = pickOne(PHRASES)
  root.innerHTML = `
    <div class="phrase">${phrase}</div>
    <input class="answer typed" type="text" autocomplete="off" autocapitalize="off"
           autocorrect="off" spellcheck="false" placeholder="type it exactly" />
    <button class="submit" type="button">UNLOCK</button>`
  const input = root.querySelector('.answer')
  setTimeout(() => input.focus(), 0)
  const submit = () => (input.value.trim().toLowerCase() === phrase ? solve() : fail())
  root.querySelector('.submit').addEventListener('click', submit)
  input.addEventListener('keydown', (e) => e.key === 'Enter' && submit())
  return { instructions: 'Type the sentence exactly (lowercase) to unlock.' }
}

function challengeHold(root, { solve, onCleanup }) {
  const need = 4000 // ms of continuous hold
  root.innerHTML = `
    <button class="hold-btn" type="button">HOLD</button>
    <div class="hold-bar"><div class="hold-fill"></div></div>`
  const btn = root.querySelector('.hold-btn')
  const fill = root.querySelector('.hold-fill')
  let startT = null
  let raf = null
  const tick = () => {
    if (startT == null) return
    const pct = Math.min(1, (Date.now() - startT) / need)
    fill.style.width = `${pct * 100}%`
    if (pct >= 1) return solve()
    raf = requestAnimationFrame(tick)
  }
  const down = (e) => {
    e.preventDefault()
    startT = Date.now()
    raf = requestAnimationFrame(tick)
  }
  const up = () => {
    startT = null
    if (raf) cancelAnimationFrame(raf)
    fill.style.width = '0%'
  }
  btn.addEventListener('pointerdown', down)
  btn.addEventListener('pointerup', up)
  btn.addEventListener('pointerleave', up)
  onCleanup(() => raf && cancelAnimationFrame(raf))
  return { instructions: 'Press and hold for 4 seconds straight. Let go and it resets.' }
}

function challengeReaction(root, { solve, onCleanup }) {
  const target = 5
  let hit = 0
  root.innerHTML = `<div class="react-area"><span class="react-count">${target} targets</span></div>`
  const area = root.querySelector('.react-area')
  const countEl = root.querySelector('.react-count')
  let dot = null
  const spawn = () => {
    if (dot) dot.remove()
    if (hit >= target) return solve()
    dot = document.createElement('button')
    dot.className = 'react-dot'
    dot.type = 'button'
    dot.style.left = `${rnd(6, 86)}%`
    dot.style.top = `${rnd(8, 72)}%`
    dot.addEventListener('pointerdown', (e) => {
      e.preventDefault()
      hit += 1
      countEl.textContent = `${target - hit} targets`
      spawn()
    })
    area.appendChild(dot)
  }
  spawn()
  onCleanup(() => dot && dot.remove())
  return { instructions: `Tap all ${target} neon targets before the timer runs out.` }
}

const CHALLENGES = [challengeMath, challengeType, challengeHold, challengeReaction]

async function showBlocker() {
  if (shadow && shadow.querySelector('.blocker')) return
  const cfg = settings || (await getSettings())
  let remaining = cfg.puzzleSeconds

  const wrap = document.createElement('div')
  wrap.className = 'blocker'
  wrap.innerHTML = `
    <div class="blocker__panel">
      <div class="blocker__avatar">${SPRITE_SVG}</div>
      <div class="kicker">SPRITE · FOCUS LOCK</div>
      <div class="domain">${CURRENT_DOMAIN}</div>
      <p class="lead"></p>
      <div class="timer"><span class="timer__num">${remaining}</span><span class="timer__unit">s</span></div>
      <div class="challenge"></div>
      <div class="hint">Fail it or hit zero on the clock → this tab blows up.</div>
    </div>`
  mount(wrap)

  const numEl = wrap.querySelector('.timer__num')
  const timerEl = wrap.querySelector('.timer')
  const root = wrap.querySelector('.challenge')
  const cleanups = []

  let done = false
  const stopAll = () => {
    cleanupTimer()
    cleanups.forEach((fn) => {
      try {
        fn()
      } catch {}
    })
  }
  const fail = () => {
    if (done) return // guard double-trigger (wrong answer as clock hits 0)
    done = true
    stopAll()
    wrap.remove() // clear the challenge so the blast fills the screen
    playDoom('Challenge failed. Tab destroyed.')
    setTimeout(() => {
      chrome.runtime
        .sendMessage({ type: 'SPRITE_CLOSE_TAB' })
        .catch(() => location.replace('about:blank')) // fallback if close fails
    }, 1300)
  }
  const succeed = () => {
    if (done) return
    done = true
    stopAll()
    wrap.remove() // tear down the UI first so a slow/failed message can't strand it
    chrome.runtime
      .sendMessage({ type: 'SPRITE_UNLOCK', domain: CURRENT_DOMAIN })
      .catch(() => {})
  }

  // Pick a random challenge each time so it can't be autopiloted.
  const challenge = pickOne(CHALLENGES)
  const { instructions } = challenge(root, {
    solve: succeed,
    fail,
    onCleanup: (fn) => cleanups.push(fn),
  })
  wrap.querySelector('.lead').textContent =
    `${instructions} Unlocks for ${cfg.unlockMinutes} minutes.`

  timerHandle = setInterval(() => {
    remaining -= 1
    numEl.textContent = remaining
    if (remaining <= 3) timerEl.classList.add('timer--danger')
    if (remaining <= 0) fail()
  }, 1000)
}

function cleanupTimer() {
  if (timerHandle) {
    clearInterval(timerHandle)
    timerHandle = null
  }
}

/* -------------------------- explosion banner ------------------------ */

function renderExplosion(state) {
  const existing = shadow && shadow.querySelector('.sprite-blast')

  // Defused (or never exploded) — the episode is over. Slide the sprite off,
  // disarm the fuse, and reset episode flags so a future explosion starts fresh.
  if (!state || !state.exploded) {
    cancelFuse()
    dismissed = false
    detonated = false
    if (existing && !existing.classList.contains('sprite-blast--leaving')) {
      existing.classList.add('sprite-blast--leaving')
      existing.addEventListener('animationend', () => existing.remove(), { once: true })
    }
    return
  }

  // Over the limit. If the user already dismissed or the screen already
  // detonated this episode, stay quiet until they defuse.
  if (dismissed || detonated) return

  const over = state.count - state.limit
  const action = `Close ${over} tab${over === 1 ? '' : 's'} to defuse`

  if (existing) {
    existing.querySelector('.sprite-blast__count').textContent = state.count
    existing.querySelector('.sprite-blast__action').textContent = action
    return
  }

  // The Sprite mascot peeks into the bottom-right corner, panicking.
  const el = document.createElement('div')
  el.className = 'sprite-blast'
  el.innerHTML = `
    <div class="sprite-blast__bubble">
      <button class="sprite-blast__dismiss" type="button" aria-label="Dismiss">×</button>
      <span class="sprite-blast__title">TAB EXPLOSION</span>
      <span class="sprite-blast__action">${action}</span>
    </div>
    <div class="sprite-blast__token">
      <span class="sprite-blast__ring"></span>
      <span class="sprite-blast__ring sprite-blast__ring--2"></span>
      <span class="sprite-blast__avatar">${SPRITE_SVG}</span>
      <span class="sprite-blast__count">${state.count}</span>
    </div>`
  el.querySelector('.sprite-blast__dismiss').addEventListener('click', dismissSprite)
  mount(el)

  armFuse() // start the doom countdown
}

// Manual dismiss — calm the sprite and defuse the screen detonation.
function dismissSprite() {
  cancelFuse()
  dismissed = true
  const el = shadow && shadow.querySelector('.sprite-blast')
  if (el && !el.classList.contains('sprite-blast--leaving')) {
    el.classList.add('sprite-blast--leaving')
    el.addEventListener('animationend', () => el.remove(), { once: true })
  }
}

function armFuse() {
  if (fuseTimer || detonated) return
  const secs = settings?.explosionFuseSeconds ?? 30
  fuseTimer = setTimeout(detonate, secs * 1000)
}

function cancelFuse() {
  if (fuseTimer) {
    clearTimeout(fuseTimer)
    fuseTimer = null
  }
}

// Ignored too long: blow up the whole screen.
function detonate() {
  fuseTimer = null
  detonated = true
  // The warning sprite gets consumed by the blast.
  const sprite = shadow && shadow.querySelector('.sprite-blast')
  if (sprite) sprite.remove()
  playDoom()
}

function playDoom(subtitle = 'Too many tabs. You let it blow.') {
  if (shadow && shadow.querySelector('.doom')) return
  const doom = document.createElement('div')
  doom.className = 'doom'

  // Glowing embers flung from the centre, each a random fire colour/angle.
  const EMBER = ['#fff3b0', '#ffd000', '#ff8a00', '#ff4d00', '#d92000']
  let debris = ''
  for (let i = 0; i < 26; i++) {
    const angle = (i / 26) * Math.PI * 2 + Math.random() * 0.5
    const dist = 220 + Math.random() * 420
    const dx = Math.round(Math.cos(angle) * dist)
    const dy = Math.round(Math.sin(angle) * dist)
    const delay = (Math.random() * 0.14).toFixed(2)
    const size = 5 + Math.round(Math.random() * 12)
    const color = EMBER[Math.floor(Math.random() * EMBER.length)]
    debris += `<span class="doom__bit" style="--dx:${dx}px;--dy:${dy}px;--d:${delay}s;width:${size}px;height:${size}px;background:${color}"></span>`
  }

  doom.innerHTML = `
    <div class="doom__flash"></div>
    <div class="doom__core">
      <span class="doom__fireball"></span>
      <span class="doom__ring"></span>
      <span class="doom__ring doom__ring--2"></span>
      <div class="doom__debris">${debris}</div>
      <div class="doom__boom">BOOM</div>
      <div class="doom__sub">${subtitle}</div>
    </div>`
  mount(doom)
  playBoomSound()

  // Play once, then clear (the user is still over the limit, but we've made
  // our point — it won't re-arm until they defuse).
  doom.addEventListener(
    'animationend',
    (e) => {
      if (e.target === doom || e.animationName === 'doom-out') doom.remove()
    },
    { once: false }
  )
  setTimeout(() => doom.remove(), 3200)
}

// Synthesize an explosion entirely in the Web Audio API — a filtered noise
// burst (the blast) layered over a falling sine (the sub-bass thud). No asset
// files, so nothing to package or expose as a web-accessible resource.
function playBoomSound() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext
    if (!Ctx) return
    const ctx = new Ctx()
    // Audio may be blocked without a recent gesture (e.g. idle-fuse detonation);
    // resume() best-effort and let it fail silently if the browser refuses.
    ctx.resume?.()
    const now = ctx.currentTime
    const master = ctx.createGain()
    master.gain.value = 0.9
    master.connect(ctx.destination)

    // 1) Noise burst -> lowpass sweep (bright crack settling into a roar).
    const dur = 1.4
    const buffer = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / data.length) // decaying noise
    }
    const noise = ctx.createBufferSource()
    noise.buffer = buffer
    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.setValueAtTime(1800, now)
    lp.frequency.exponentialRampToValueAtTime(120, now + dur)
    const ng = ctx.createGain()
    ng.gain.setValueAtTime(1, now)
    ng.gain.exponentialRampToValueAtTime(0.001, now + dur)
    noise.connect(lp).connect(ng).connect(master)

    // 2) Sub-bass thud.
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(90, now)
    osc.frequency.exponentialRampToValueAtTime(28, now + 0.7)
    const og = ctx.createGain()
    og.gain.setValueAtTime(0.9, now)
    og.gain.exponentialRampToValueAtTime(0.001, now + 0.8)
    osc.connect(og).connect(master)

    noise.start(now)
    osc.start(now)
    noise.stop(now + dur)
    osc.stop(now + 0.8)
    setTimeout(() => ctx.close?.(), (dur + 0.2) * 1000)
  } catch {
    /* audio unavailable — fail silently */
  }
}

/* ------------------------------- boot ------------------------------- */

async function init() {
  // Cache settings for synchronous access in the render path.
  settings = await getSettings()

  // Blocker check (distracting + not currently unlocked).
  if (matchesList(CURRENT_DOMAIN, settings.distractingDomains)) {
    const unlocked = await isUnlocked(CURRENT_DOMAIN)
    if (!unlocked) showBlocker()
  }

  // Initial explosion state + live updates.
  const state = await chrome.runtime.sendMessage({ type: 'SPRITE_GET_STATE' }).catch(() => null)
  if (state?.explosion) renderExplosion(state.explosion)

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg?.type === 'SPRITE_EXPLOSION') renderExplosion(msg.payload)
  })

  // React to setting/unlock changes.
  chrome.storage.onChanged.addListener(async (changes, area) => {
    if (area !== 'local') return
    if (changes['sprite:settings']) settings = await getSettings()
    if (changes['sprite:unlocks']) {
      // Capture the node once — it may be torn down during the await below
      // (e.g. the very unlock we just earned), so don't re-query it.
      const blocker = shadow?.querySelector('.blocker')
      if (blocker && (await isUnlocked(CURRENT_DOMAIN))) blocker.remove()
    }
  })
}

init().catch(() => {})

/* ------------------------------ assets ------------------------------ */

// The Sprite mascot: a monochrome ghost-blob with a panicked face and a lit
// fuse on its head (it's about to blow with you). Drawn so it reads as a
// character, not just an icon.
const SPRITE_SVG = `
<svg viewBox="0 0 64 64" width="44" height="44" aria-hidden="true">
  <!-- lit fuse + spark -->
  <path d="M32 9 q6 -6 11 -2" fill="none" stroke="#a1a1aa" stroke-width="2" stroke-linecap="round"/>
  <circle class="sprite-spark" cx="44" cy="6" r="3" fill="#c6ff00"/>
  <!-- body -->
  <path d="M32 12 C19 12 12 22 12 35 L12 52 q0 4 4 3 l4 -3 q2 -1.5 4 0 l4 3 q2 1.5 4 0 l4 -3 q2 -1.5 4 0 l4 3 q4 1 4 -3 L52 35 C52 22 45 12 32 12 Z"
        fill="#0e0e10" stroke="#52525a" stroke-width="1.6"/>
  <!-- panicked eyebrows -->
  <path d="M21 27 l7 3" stroke="#a1a1aa" stroke-width="2" stroke-linecap="round"/>
  <path d="M43 27 l-7 3" stroke="#a1a1aa" stroke-width="2" stroke-linecap="round"/>
  <!-- wide eyes -->
  <circle cx="25" cy="34" r="5" fill="#f4f4f5"/>
  <circle cx="39" cy="34" r="5" fill="#f4f4f5"/>
  <circle cx="25" cy="35.5" r="2.2" fill="#050505"/>
  <circle cx="39" cy="35.5" r="2.2" fill="#050505"/>
  <!-- worried open mouth -->
  <ellipse cx="32" cy="44" rx="4" ry="3.2" fill="#050505"/>
  <!-- neon sweat drop -->
  <path d="M48 36 q2 4 0 6 a2.2 2.2 0 0 1 -4 0 q-1 -3 1 -5 z" fill="#c6ff00" opacity="0.85"/>
</svg>`

const STYLES = `
:host { all: initial; }
* { box-sizing: border-box; font-family: 'SF Mono', ui-monospace, Menlo, monospace; }

.blocker {
  pointer-events: auto;
  position: fixed; inset: 0;
  display: flex; align-items: center; justify-content: center;
  background: rgba(5,5,5,0.72);
  backdrop-filter: blur(18px) saturate(120%);
  -webkit-backdrop-filter: blur(18px) saturate(120%);
}
.blocker__panel {
  width: min(420px, 90vw);
  padding: 36px 34px;
  border-radius: 20px;
  background: linear-gradient(160deg, rgba(22,22,24,0.92), rgba(10,10,11,0.96));
  border: 1px solid rgba(255,255,255,0.08);
  box-shadow: 0 30px 80px -30px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.03) inset;
  text-align: center; color: #f4f4f5;
}
.blocker__avatar {
  display: flex; justify-content: center; margin-bottom: 14px;
  animation: sprite-shake 3s ease-in-out infinite;
  filter: drop-shadow(0 0 12px rgba(198,255,0,0.3));
}
.blocker__avatar svg { width: 56px; height: 56px; }
.kicker { font-size: 11px; letter-spacing: 0.22em; color: #71717a; }
.domain { font-size: 22px; font-weight: 700; margin-top: 8px; color: #fff; }
.lead { font-size: 13px; line-height: 1.5; color: #a1a1aa; margin: 12px 0 22px; }
.timer { font-size: 56px; font-weight: 800; line-height: 1; color: #f4f4f5; }
.timer__unit { font-size: 22px; color: #52525a; margin-left: 4px; }
.timer--danger .timer__num { color: #c6ff00; text-shadow: 0 0 24px rgba(198,255,0,0.6); }
.puzzle { font-size: 30px; font-weight: 700; letter-spacing: 0.04em; margin: 18px 0 14px; color: #d4d4d8; }
.answer {
  width: 100%; padding: 14px 16px; font-size: 22px; text-align: center;
  border-radius: 12px; border: 1px solid #2c2c30; background: #050505; color: #fff;
  outline: none;
}
.answer:focus { border-color: #c6ff00; box-shadow: 0 0 0 3px rgba(198,255,0,0.15); }
.submit {
  margin-top: 14px; width: 100%; padding: 14px; font-weight: 800; letter-spacing: 0.12em;
  border: none; border-radius: 12px; cursor: pointer;
  background: #c6ff00; color: #050505;
}
.submit:hover { box-shadow: 0 0 24px -4px rgba(198,255,0,0.6); }
.hint { font-size: 11px; color: #52525a; margin-top: 14px; }

/* type-to-confirm */
.phrase {
  font-size: 18px; font-weight: 600; line-height: 1.4; color: #d4d4d8;
  margin: 8px 0 14px; padding: 0 6px; user-select: none;
}
.answer.typed { font-size: 16px; text-align: left; }

/* hold-to-unlock */
.hold-btn {
  width: 100%; padding: 22px; font-weight: 800; letter-spacing: 0.18em;
  border: 1px solid #2c2c30; border-radius: 12px; cursor: pointer;
  background: #161618; color: #f4f4f5; touch-action: none; user-select: none;
}
.hold-btn:active { border-color: #c6ff00; }
.hold-bar {
  margin-top: 12px; height: 10px; border-radius: 999px;
  background: #161618; overflow: hidden;
}
.hold-fill { height: 100%; width: 0%; background: #c6ff00; transition: width 0.05s linear; }

/* reaction targets */
.react-area {
  position: relative; height: 200px; margin-top: 6px;
  border: 1px dashed #2c2c30; border-radius: 14px; background: #050505;
  overflow: hidden;
}
.react-count {
  position: absolute; top: 8px; left: 10px;
  font-size: 11px; letter-spacing: 0.12em; color: #71717a;
}
.react-dot {
  position: absolute; width: 34px; height: 34px; padding: 0;
  border: none; border-radius: 50%; cursor: pointer;
  background: #c6ff00; box-shadow: 0 0 16px -2px rgba(198,255,0,0.8);
  animation: react-pop 0.12s ease-out;
}
@keyframes react-pop { from { transform: scale(0.4); } to { transform: scale(1); } }

/* --- Tab-Explosion mascot: peeks into the bottom-right corner and stays --- */
.sprite-blast {
  pointer-events: auto;
  position: fixed; right: 22px; bottom: 22px;
  display: flex; align-items: flex-end; gap: 12px;
  transform-origin: bottom right;
  animation: sprite-pop-in 0.5s cubic-bezier(0.18, 1.4, 0.4, 1) both;
}
.sprite-blast--leaving {
  animation: sprite-leave 0.4s ease-in forwards;
}

.sprite-blast__bubble {
  position: relative;
  display: flex; flex-direction: column; align-items: flex-end;
  padding: 8px 12px; margin-bottom: 6px;
  border-radius: 12px;
  background: linear-gradient(160deg, rgba(22,22,24,0.96), rgba(10,10,11,0.98));
  border: 1px solid rgba(255,255,255,0.08);
  box-shadow: 0 16px 40px -18px rgba(0,0,0,0.9);
  white-space: nowrap;
}
.sprite-blast__dismiss {
  position: absolute; top: -8px; left: -8px;
  width: 20px; height: 20px; line-height: 18px;
  border-radius: 50%; border: 1px solid rgba(255,255,255,0.12);
  background: #161618; color: #a1a1aa;
  font-size: 14px; cursor: pointer; padding: 0;
  display: flex; align-items: center; justify-content: center;
}
.sprite-blast__dismiss:hover { color: #fff; border-color: #c6ff00; }
.sprite-blast__title { font-weight: 800; letter-spacing: 0.16em; color: #c6ff00; font-size: 12px; }
.sprite-blast__action { font-size: 11px; color: #a1a1aa; margin-top: 2px; }

.sprite-blast__token {
  position: relative;
  width: 64px; height: 64px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, #1c1c20, #050505);
  border: 1px solid rgba(255,255,255,0.08);
  box-shadow: 0 14px 36px -14px rgba(0,0,0,0.9);
  animation: sprite-bob 2.4s ease-in-out infinite;
}
.sprite-blast__avatar {
  display: flex;
  animation: sprite-shake 3s ease-in-out infinite;
  filter: drop-shadow(0 0 8px rgba(198,255,0,0.35));
}
.sprite-spark { animation: sprite-spark 0.6s steps(2) infinite; transform-origin: center; }
.sprite-blast__count {
  position: absolute; top: -6px; right: -6px;
  min-width: 22px; padding: 1px 5px;
  border-radius: 999px;
  background: #c6ff00; color: #050505;
  font-size: 12px; font-weight: 800; text-align: center;
  box-shadow: 0 0 14px -2px rgba(198,255,0,0.7);
}
/* Expanding neon shockwaves pulsing around the panicking sprite. */
.sprite-blast__ring {
  position: absolute; inset: 0; border-radius: 50%;
  border: 2px solid rgba(198,255,0,0.7);
  opacity: 0;
  animation: sprite-shock 3s ease-out infinite;
}
.sprite-blast__ring--2 { animation-delay: 0.5s; }

@keyframes sprite-pop-in {
  from { transform: translateY(135%) scale(0.6); opacity: 0; }
  to   { transform: translateY(0) scale(1); opacity: 1; }
}
@keyframes sprite-leave {
  from { transform: translateY(0) scale(1); opacity: 1; }
  to   { transform: translateY(135%) scale(0.6); opacity: 0; }
}
@keyframes sprite-bob {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-5px); }
}
@keyframes sprite-shake {
  0%, 70%   { transform: rotate(0deg); }
  74%  { transform: rotate(-10deg); }
  78%  { transform: rotate(9deg); }
  82%  { transform: rotate(-6deg); }
  86%  { transform: rotate(3deg); }
  90%, 100% { transform: rotate(0deg); }
}
@keyframes sprite-spark { 0% { opacity: 1; } 100% { opacity: 0.3; } }
@keyframes sprite-shock {
  0%   { transform: scale(0.6); opacity: 0; }
  12%  { opacity: 0.75; }
  60%  { transform: scale(2); opacity: 0; }
  100% { transform: scale(2); opacity: 0; }
}

/* --- Full-screen detonation when the warning is ignored too long --------- */
.doom {
  pointer-events: auto;
  position: fixed; inset: 0;
  display: flex; align-items: center; justify-content: center;
  overflow: hidden;
  animation: doom-out 0.5s ease-in 2.7s forwards;
}
.doom__flash {
  position: absolute; inset: 0;
  background: radial-gradient(circle at center,
    #ffffff 0%, #ffe08a 14%, #ff8a00 32%, #ff3000 52%, #5a0e00 74%, rgba(5,5,5,0.96) 100%);
  animation: doom-flash 0.6s ease-out forwards;
}
/* The fireball: a roiling molten core that punches out then collapses. */
.doom__fireball {
  position: absolute; left: 50%; top: 50%;
  width: 60px; height: 60px; margin: -30px 0 0 -30px;
  border-radius: 50%;
  background: radial-gradient(circle at 50% 45%,
    #fff7d6 0%, #ffd000 25%, #ff7a00 50%, #ff2d00 72%, #7a1500 100%);
  filter: blur(2px);
  box-shadow: 0 0 80px 30px rgba(255,120,0,0.7), 0 0 160px 60px rgba(255,40,0,0.4);
  animation: doom-fireball 1.2s ease-out forwards;
}
.doom__core {
  position: relative; text-align: center;
  animation: doom-shake 0.5s ease-in-out 3;
}
.doom__ring {
  position: absolute; left: 50%; top: 50%;
  width: 40px; height: 40px; margin: -20px 0 0 -20px;
  border-radius: 50%; border: 3px solid rgba(255,138,0,0.9);
  box-shadow: 0 0 24px rgba(255,90,0,0.6);
  animation: doom-ring 1s ease-out forwards;
}
.doom__ring--2 { animation-delay: 0.18s; border-color: rgba(255,225,120,0.85); }
.doom__debris { position: absolute; left: 50%; top: 50%; }
.doom__bit {
  position: absolute; left: 0; top: 0;
  border-radius: 50%; background: #ffae00;
  box-shadow: 0 0 8px 1px rgba(255,120,0,0.8);
  animation: doom-bit 0.9s ease-out var(--d, 0s) forwards;
}
.doom__boom {
  position: relative;
  font-size: clamp(64px, 16vw, 200px); font-weight: 900; letter-spacing: 0.04em;
  background: linear-gradient(180deg, #fff3b0 0%, #ffd000 35%, #ff7a00 70%, #ff2d00 100%);
  -webkit-background-clip: text; background-clip: text;
  -webkit-text-fill-color: transparent; color: transparent;
  text-shadow: 0 0 50px rgba(255,120,0,0.9);
  filter: drop-shadow(0 0 24px rgba(255,60,0,0.8));
  animation: doom-boom 0.6s cubic-bezier(0.18,1.6,0.4,1) forwards, doom-flicker 0.12s steps(2) infinite;
}
.doom__sub {
  margin-top: 8px; font-size: 14px; letter-spacing: 0.1em; color: #ffd0a0;
  opacity: 0; animation: doom-sub 0.4s ease-out 0.4s forwards;
}

@keyframes doom-flash { 0% { opacity: 1; } 100% { opacity: 0.35; } }
@keyframes doom-fireball {
  0%   { transform: scale(0.2); opacity: 0; }
  18%  { transform: scale(1.6); opacity: 1; }
  55%  { transform: scale(3.4); opacity: 0.9; }
  100% { transform: scale(5.5); opacity: 0; }
}
@keyframes doom-flicker { 0% { opacity: 1; } 100% { opacity: 0.82; } }
@keyframes doom-boom {
  0%   { transform: scale(0.2); opacity: 0; }
  60%  { transform: scale(1.15); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}
@keyframes doom-sub { to { opacity: 0.85; } }
@keyframes doom-ring {
  0%   { width: 40px; height: 40px; margin: -20px 0 0 -20px; opacity: 0.9; }
  100% { width: 140vmax; height: 140vmax; margin: -70vmax 0 0 -70vmax; opacity: 0; }
}
@keyframes doom-bit {
  0%   { transform: translate(0, 0) scale(1); opacity: 1; }
  100% { transform: translate(var(--dx), var(--dy)) scale(0.2); opacity: 0; }
}
@keyframes doom-shake {
  0%, 100% { transform: translate(0, 0); }
  25%  { transform: translate(-8px, 6px); }
  50%  { transform: translate(7px, -5px); }
  75%  { transform: translate(-5px, -6px); }
}
@keyframes doom-out { to { opacity: 0; } }

@media (prefers-reduced-motion: reduce) {
  .sprite-blast { animation: none; }
  .sprite-blast__token, .sprite-blast__avatar, .sprite-blast__ring, .sprite-spark { animation: none; }
  .sprite-blast__ring { opacity: 0; }
  .doom__core, .doom__bit, .doom__fireball { animation: none; }
  .doom__boom { animation: doom-boom 0.6s cubic-bezier(0.18,1.6,0.4,1) forwards; }
}
`
