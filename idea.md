Act as a Principal Browser Extension Engineer and UI/UX Designer. I need you to build a comprehensive, production-ready Google Chrome Extension using Manifest V3, React, and Tailwind CSS. The extension is a gamified digital wellbeing tracker that utilizes a striking institutional monochrome aesthetic with a single vibrant neon accent color.

Please generate the file structure, configuration files, and core component logic for the following system architecture:

1. MANIFEST & STORAGE CONFIGURATION (manifest.json)
   - Must use Manifest V3.
   - Requires permissions for: "storage", "tabs", "alarms", and "scripting".
   - Configure a background service worker (`background.js`) and a dedicated options page dashboard (`options.html`).

2. BACKGROUND ENGINE & TRACKING STATE (`background.js`)
   - Active Tab Tracking: Track time spent (in seconds) on active tabs. Differentiate between user-defined "Productive" domains and "Distracting" domains.
   - Tab Opening Counter: Maintain a continuous incrementing counter for how many times a user opens or navigates to a new domain per day.
   - The Tab-Overload Mechanic: Track the total number of open tabs across all windows. If the number of open tabs exceeds 15, trigger a "Tab Explosion" state.
   - Storage Sync: Save data daily to `chrome.storage.local` and maintain a historical archive for a rolling 7-day period to feed the dashboard.

3. HIGH-FRICTION BLOCKING LAYER & FUNNY MICRO-TASKS (`content.js` / Overlays)
   - When a user visits a domain on the "Distracting" blocklist, inject a full-screen, premium glassmorphic monochrome overlay that completely hides the site.
   - To unlock the site for a temporary 5-minute window, the user must complete a quick, frantic micro-task: Solve a multi-digit multiplication or addition math puzzle under a strict 10-second countdown timer. If the timer hits zero or they get it wrong, they are redirected to a blank page.
   - If the background script flags a "Tab Explosion" (15+ tabs open), inject a strict banner across the top of all tabs showing a cartoon bomb icon that has "exploded" their monochrome avatar, locking further browsing behavior until they close enough tabs to get back under the limit.

4. THE GITHUB-STYLE FOCUS GRID & DASHBOARD (`options.html` React App)
   - Create a full-page options dashboard using React and Tailwind CSS.
   - Feature a stunning, minimalist grid layout modeled directly after GitHub's contribution graph representing the last 7 days (or weeks).
     - Pitch-Black Square = Perfect Focus Day (Zero distracting sites visited).
     - Varying shades of dark/light gray = Moderate focus.
     - Bright Neon Accent Square = Absolute Distraction Chaos / Exploded Tabs.
   - Include data cards breaking down: Total Focus Hours Achieved, Total Number of Tab Openings per domain, and a "Top Distracting Habit" list.

5. MODULAR FILE STRUCTURE
   - Please output clean, modular code snippets for: `manifest.json`, the state management wrappers for `chrome.storage`, the core `background.js` listeners, the React code for the GitHub-style Grid Component, and the CSS Tailwind configuration. Ensure everything uses modern React hooks and tailwindcss utility classes.
