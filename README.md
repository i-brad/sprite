# Sprite — Focus Wellbeing Tracker

A gamified digital wellbeing Chrome extension (Manifest V3 · React · Tailwind).

## What it does

- **Active-tab time tracking** — banks seconds spent on _productive_ vs
  _distracting_ vs neutral domains, focus-banked even across service-worker
  sleep via timestamp flushing.
- **Tab-opening counter** — per-domain count of new-domain navigations per day.
- **Tab-Overload → "Tab Explosion"** — when open tabs exceed your limit (default
  15), every page gets a strict top banner with an _exploded_ monochrome avatar
  that stays until you close enough tabs.
- **High-friction blocker** — visiting a distracting domain injects a full-screen
  glassmorphic overlay. Solve a multi-digit math puzzle in 30 seconds to unlock
  the site for 5 minutes; miss it or run out the clock → redirected to a blank
  page.
- **GitHub-style focus grid** — a contribution-graph strip of the rolling 7-day
  history. Pitch-black = perfect focus, grays = moderate, neon = chaos/explosion.
- **Dashboard cards** — total focus hours, tab openings per domain, and a Top
  Distracting Habit list. All data stays local (`chrome.storage.local`).

## Develop

```bash
npm install
npm run dev      # Vite + HMR (CRXJS)
npm run build    # outputs dist/
```

## Load in Chrome

1. `npm run build`
2. Visit `chrome://extensions`, enable **Developer mode**.
3. **Load unpacked** → select the `dist/` folder.
4. Click the Sprite toolbar icon to open the dashboard, or open the extension's
   **Options** page. Edit your productive/distracting domains and limits there.

## Architecture

| File                                                         | Role                                                                  |
| ------------------------------------------------------------ | --------------------------------------------------------------------- |
| [manifest.json](manifest.json)                               | MV3 manifest (storage, tabs, alarms, scripting)                       |
| [src/lib/constants.js](src/lib/constants.js)                 | Storage keys, defaults, day-record shape                              |
| [src/lib/storage.js](src/lib/storage.js)                     | Promise wrappers over `chrome.storage`, 7-day pruning, unlock windows |
| [src/lib/domains.js](src/lib/domains.js)                     | URL normalization + blocklist matching                                |
| [src/lib/score.js](src/lib/score.js)                         | Chaos-level scoring + color ramp                                      |
| [src/background/background.js](src/background/background.js) | Service worker: time tracking, counters, tab-explosion broadcast      |
| [src/content/content.js](src/content/content.js)             | Shadow-DOM overlays: blocker, math puzzle, explosion banner           |
| [src/options/](src/options/)                                 | React + Tailwind dashboard (FocusGrid, DataCards, SettingsPanel)      |

Icons are generated, dependency-free, via
[scripts/generate-icons.mjs](scripts/generate-icons.mjs).
