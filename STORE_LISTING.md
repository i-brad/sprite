# Chrome Web Store listing — Sprite

Copy/paste material for the Developer Dashboard. Edit the bracketed bits before
submitting.

---

## Item name

```
Sprite — Focus & Tab Wellbeing
```

## Summary (max 132 chars)

```
Gamified focus tracker: block distractions with frantic challenges, tame tab overload, watch your focus grid go pitch-black.
```

## Category

`Productivity`

## Language

`English (United States)`

---

## Detailed description

```
Sprite turns digital wellbeing into a game with an institutional monochrome look and a single neon accent.

FOCUS GRID
A GitHub-style contribution grid of your last 7 days. Pitch-black squares are perfect-focus days; neon squares are total chaos. Build a perfect-focus streak.

HIGH-FRICTION BLOCKER
Visit a distracting site and Sprite drops a full-screen overlay. To get in, beat a randomized 15-second challenge — a math puzzle, a type-to-confirm sentence, a hold-to-unlock bar, or a tap-the-targets game. Win and the site unlocks for a few minutes. Fail or run out the clock and the tab detonates and closes. Challenges are randomized so you can't autopilot through them.

TAB EXPLOSION
Open too many tabs and the Sprite mascot panics in the corner. Ignore it too long and the screen blows up (fiery, with sound). Set your own tab limit — or unlimited.

YOUR STATS, LOCAL ONLY
Total time on tabs broken into focus / distracting / neutral, tab openings per domain and subdomain, and your top distracting habits. Everything is stored on your device with chrome.storage.local. Nothing is ever sent anywhere.

FULLY CONFIGURABLE
Edit your productive and distracting domain lists, tab limit, unlock minutes, puzzle time, and explosion fuse. Reset to defaults anytime.

Sprite has no account, no servers, and no tracking. It's just you vs. your tabs.
```

---

## Permission justifications

Paste these into the "Permission justification" fields. Be specific — vague
answers slow review.

| Permission | Justification |
| --- | --- |
| `storage` | Stores the user's daily focus stats, settings, and temporary unlock windows locally via `chrome.storage.local`. No remote storage. |
| `tabs` | Counts total open tabs to detect "tab overload," counts per-domain openings for stats, and closes the active tab when a user fails an unlock challenge. |
| `alarms` | A periodic alarm flushes accumulated active-tab time to storage and recomputes the open-tab count, since the MV3 service worker is evicted when idle. |
| `scripting` / content script | Injects the focus-blocker overlay and the tab-overload warning into pages so distractions can be gated behind a challenge. |
| `host_permissions: <all_urls>` | The blocker and overload warning must be able to appear on any site the user adds to their distracting list, and stats are tracked across all sites the user visits. No page content is read or transmitted — only the hostname is used, locally. |

### Single purpose (required field)

```
Sprite helps users reduce digital distraction by tracking their browsing focus locally and gating distracting sites behind interactive challenges.
```

### Data usage disclosures (check on the form)

- Does your item collect user data? **Yes** — but only stored locally.
- Categories: **Website content / web history** (domains visited) — used **only** for the app's own functionality, **on-device**.
- **Not** sold to third parties. **Not** used for creditworthiness/lending.
- **Not** transferred off the device. Sprite makes **no network requests**.
- Add this line in the notes: *"All data is stored on the user's device via chrome.storage.local and is never transmitted, sold, or shared."*

> Note: `<all_urls>` + an all-pages content script triggers a deeper, slower
> review. Expect a few business days. If you want faster review later, consider
> narrowing host permissions or moving to `activeTab` (would change blocker UX).

---

## Required assets

| Asset | Spec | Status |
| --- | --- | --- |
| Store icon | 128×128 PNG | ✅ `public/icons/icon-128.png` |
| Screenshots | 1280×800 or 640×400, 1–5 images | ⬜ capture the dashboard + a blocker challenge + the tab-explosion + a detonation |
| Small promo tile (optional) | 440×280 | ⬜ optional |
| Privacy policy URL | public URL | ⬜ host `PRIVACY.md` (see that file) |

### Suggested screenshots
1. The full dashboard (focus grid + total-time card + visited sites).
2. A blocker challenge overlay (e.g. the tap-the-targets game) on a real site.
3. The Sprite mascot panicking in the corner during a Tab Explosion.
4. The fiery full-screen detonation.

---

## Pre-submit checklist

- [ ] `npm run package` → upload `sprite-v<version>.zip`
- [ ] Bump `version` in `manifest.json` for each new upload
- [ ] Add author + homepage URL to `manifest.json` (optional but recommended)
- [ ] Host the privacy policy and paste its URL
- [ ] Upload ≥1 screenshot at 1280×800
- [ ] Fill single-purpose + each permission justification
- [ ] Complete the data-usage disclosure
- [ ] Choose visibility: Public / Unlisted / Private
- [ ] Final `Load unpacked` test of `dist/`
```
