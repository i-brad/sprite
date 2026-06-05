# Privacy Policy — Sprite

_Last updated: 2026-06-05_

Sprite ("the extension") is a digital wellbeing tracker that runs entirely on
your device. This policy explains what it does and does not do with your data.

## The short version

**Sprite collects nothing about you, sends nothing anywhere, and has no servers,
accounts, analytics, or ads.** Everything it tracks stays in your browser.

## What Sprite stores locally

To do its job, Sprite keeps the following in your browser's local storage
(`chrome.storage.local`), on your device only:

- **Browsing stats** — for sites you visit, the registrable domain and host
  (e.g. `youtube.com`, `mail.google.com`), how many times you opened them, and
  how long the active tab spent on productive / distracting / neutral sites,
  aggregated per day for a rolling 7-day window.
- **Your settings** — your productive and distracting domain lists, tab limit,
  unlock duration, challenge time, and explosion fuse.
- **Temporary unlocks** — which distracting domains you've unlocked and when the
  unlock expires.

Sprite uses only the **hostname** of pages you visit. It does **not** read,
store, or transmit page contents, form data, keystrokes, URLs beyond the
hostname, or anything you type (the challenge answers are checked in memory and
discarded).

## What Sprite does NOT do

- It does **not** send any data off your device. Sprite makes **no network
  requests** of any kind.
- It does **not** use cookies, analytics, tracking pixels, or third-party SDKs.
- It does **not** sell, share, or transfer data to anyone.
- It does **not** require an account or collect personal information.

## Permissions

- `storage` — save your stats and settings locally.
- `tabs` — count open tabs and per-domain openings, and close the current tab
  when a focus challenge is failed.
- `alarms` — periodically save tracked time while the background worker is idle.
- `scripting` + host access (`<all_urls>`) — show the focus-blocker overlay and
  tab-overload warning on pages, and read the hostname for tracking. No page
  content is accessed or sent anywhere.

## Data retention and control

Daily stats are kept for a rolling 7-day window and older days are deleted
automatically. You can erase everything at any time by removing the extension,
or reset your settings with the "Reset to defaults" button in the dashboard.

## Changes

If this policy changes, the "Last updated" date above will change accordingly.

## Contact

Questions? Open an issue at https://github.com/i-brad/sprite or email
[braimahaboy@gmail.com].
