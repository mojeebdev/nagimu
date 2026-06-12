# NAGIMU — CURSOR COMPOSER 2.5 MASTER PROMPT
> Paste this entire document into Cursor Composer 2.5 as your opening prompt.
> Do not split it. Composer will scaffold the full project from this single instruction set.

---

## ROLE

You are a senior frontend engineer and game developer building a production-ready PWA called **NAGIMU** (凪む). You write clean, well-commented code. You never use placeholder logic — every system you scaffold must be functional. You follow every constraint in this document exactly. When in doubt, refer back to this document before making assumptions.

---

## WHAT IS NAGIMU

NAGIMU is a mobile-first, offline-first stress-relief game built as a Progressive Web App. The name comes from the Japanese verb 凪む — "the moment the sea becomes still after a storm." The game is designed for people experiencing stress, mental fatigue, or emotional overload. They turn off their data, add NAGIMU to their home screen, and play in silence.

The core mechanic: zodiac-element orbs drift slowly across a void canvas. The player taps or drags to nudge them. When 3 or more same-element orbs touch, they converge and dissolve — triggering a dopamine micro-hit through satisfying particle effects and a soft audio tone. There is no timer. There is no failure state. There is no game over. The game ends only when the player ends it.

When the player's data comes back on, the session's highest score syncs silently to a global leaderboard filtered by zodiac sign.

---

## TECH STACK

- **Framework:** Vanilla HTML + CSS + JavaScript (ES Modules). No React, no Next.js, no build tool required. This must run from a static file server or Vercel static deployment.
- **Canvas:** Native HTML5 Canvas API for the game loop.
- **Audio:** Web Audio API only. No audio files. All sounds generated programmatically.
- **Storage:** IndexedDB (via idb-keyval CDN) for local score history, player data, and sync queue.
- **Offline:** Service Worker with precache strategy (Workbox via CDN or hand-written SW).
- **Sync:** Background Sync API for leaderboard score upload when connection resumes.
- **Leaderboard backend:** Supabase (REST API, no SDK — raw fetch calls only). Table: `nagimu_scores`.
- **Fonts:** Vend Sans only, loaded via Google Fonts CDN. Bold (700) for display/titles. Regular (400) for body/UI/labels. No other font is ever used anywhere in this project.
- **Deployment target:** Vercel static. `vercel.json` must be included.

---

## FILE STRUCTURE

Scaffold exactly this structure. Do not add files not listed here unless they are auto-generated (e.g. `package-lock.json`).

```
nagimu/
├── index.html                  # Entry point — onboarding / zodiac select screen
├── game.html                   # Game screen — full canvas + HUD
├── leaderboard.html            # Leaderboard screen — by sign + all signs
├── manifest.json               # PWA manifest
├── sw.js                       # Service Worker
├── vercel.json                 # Vercel routing config
├── assets/
│   └── icons/
│       ├── icon-192.png        # PWA icon (generate a placeholder)
│       └── icon-512.png        # PWA icon (generate a placeholder)
├── css/
│   ├── base.css                # Reset, CSS variables, shell layout
│   ├── onboarding.css          # Zodiac select + player name screen
│   ├── game.css                # HUD, breath gate overlay, session end screen
│   └── leaderboard.css         # Leaderboard table + tabs
├── js/
│   ├── db.js                   # IndexedDB helpers (idb-keyval wrapper)
│   ├── sync.js                 # Background Sync — score upload queue
│   ├── zodiac.js               # Zodiac data, element system, orb configs
│   ├── audio.js                # Web Audio API — all sounds
│   ├── particles.js            # Particle burst system
│   ├── orb.js                  # Orb class — physics, render, state
│   ├── game.js                 # Game loop, canvas, input, scoring
│   └── leaderboard.js          # Fetch + render leaderboard data
└── README.md                   # Setup, Supabase config, deployment steps
```

---

## CSS VARIABLES — BASE SYSTEM

Define all of these in `css/base.css` under `:root`. These are the only colors used in the entire project.

```css
:root {
  /* Void palette */
  --void-00: #020203;
  --void-01: #050508;        /* page/canvas background */
  --void-02: #0C0C12;        /* card surface */
  --void-03: #14141C;        /* elevated surface */
  --void-04: #1E1E28;        /* hover / border fill */
  --void-05: #2C2C3A;        /* border / divider */

  /* Ink */
  --ink-primary:   #F0EEF8;
  --ink-secondary: rgba(240,238,248,0.55);
  --ink-tertiary:  rgba(240,238,248,0.28);
  --ink-disabled:  rgba(240,238,248,0.15);

  /* Element accent colors — one active per session */
  --fire:   #D85A30;
  --fire-bg: rgba(216,90,48,0.12);
  --earth:  #1D9E75;
  --earth-bg: rgba(29,158,117,0.12);
  --air:    #378ADD;
  --air-bg: rgba(55,138,221,0.12);
  --water:  #7F77DD;
  --water-bg: rgba(127,119,221,0.12);

  /* Active element — set via JS on session start */
  --element-color: var(--water);
  --element-bg:    var(--water-bg);

  /* Typography */
  --font: 'Vend', sans-serif;
  --weight-bold:    700;
  --weight-regular: 400;

  /* Type scale */
  --text-hero:  64px;
  --text-h1:    32px;
  --text-h2:    20px;
  --text-h3:    16px;
  --text-body:  13px;
  --text-label: 10px;
  --tracking-display: -0.04em;
  --tracking-heading: -0.02em;
  --tracking-label:    0.14em;

  /* Layout */
  --shell-width:  390px;
  --shell-radius: 44px;
  --shell-border: 1px solid rgba(255,255,255,0.07);

  /* Transitions */
  --ease: cubic-bezier(0.16, 1, 0.3, 1);
}
```

---

## SHELL LAYOUT — MOBILE FIRST ON ALL SCREENS

In `css/base.css`, the shell is always a 390px-wide phone frame. On desktop it sits centered on the void background. There is no wide-layout breakpoint. The game always looks like a phone.

```css
html, body {
  margin: 0;
  padding: 0;
  background: var(--void-00);
  min-height: 100vh;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  font-family: var(--font);
  font-weight: var(--weight-regular);
  color: var(--ink-primary);
  -webkit-font-smoothing: antialiased;
}

.shell {
  width: 390px;
  min-height: 100svh;
  background: var(--void-01);
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* On actual mobile, shell fills the full viewport */
@media (max-width: 430px) {
  .shell {
    width: 100vw;
    border-radius: 0;
    border: none;
  }
}

/* On desktop, shell shows as phone */
@media (min-width: 431px) {
  body {
    padding: 24px 0 40px;
  }
  .shell {
    border-radius: var(--shell-radius);
    border: var(--shell-border);
    box-shadow: 0 0 0 6px rgba(255,255,255,0.02);
    min-height: 844px;
  }
}
```

Every HTML file wraps its content in `<div class="shell">`.

---

## FONT LOADING

In every HTML file `<head>`, include exactly this. No other font is ever loaded.

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Vend:wght@400;700&display=swap" rel="stylesheet">
```

All font usage in CSS must reference only:
- `font-family: var(--font); font-weight: var(--weight-bold);` — titles, hero, scores, zodiac names
- `font-family: var(--font); font-weight: var(--weight-regular);` — body, labels, descriptions, buttons

---

## SCREEN 1 — ONBOARDING (index.html)

### Flow
1. Player opens app. They see the NAGIMU wordmark, a starfield canvas in the background, and two inputs below.
2. **Input A:** Text field — "What's your name?" (max 18 chars). Stored in IndexedDB as `playerName`.
3. **Input B:** Zodiac sign selector — a 6×2 grid of 12 zodiac chips. Each chip shows the glyph, sign name, and element. Tapping one selects it (active state). Stored in IndexedDB as `zodiacSign`.
4. A "Begin Session" button appears once both are filled. Tapping it navigates to `game.html`.
5. On return visits, if `playerName` and `zodiacSign` are in IndexedDB, skip directly to game.html — but show a small "Not you? Reset" link in the top-right of game.html.

### Zodiac chip active state
Active chip gets `border: 1px solid var(--element-color)` and `background: var(--element-bg)`. The active element color is set dynamically based on which sign is selected (see Zodiac System below).

### Starfield background
A `<canvas id="starfield">` sits behind all content, `position: absolute; inset: 0; z-index: 0`. JS draws ~80 tiny white particles drifting left at 0.05–0.25px/frame speed. Opacity 0.08–0.5. Sizes 0.2–1.4px radius. All content sits on `z-index: 1`.

---

## SCREEN 2 — GAME (game.html)

### Layout
- Top HUD (fixed height 56px): sign glyph + player name (left), current score (center, bold 24px), session time (right, label style).
- Canvas (fills remaining height): the game field.
- Bottom bar (fixed height 48px): "End Session" ghost button (left), combo streak indicator (right).

### Canvas game loop

Implement in `js/game.js` using `requestAnimationFrame`.

**Initialization:**
- Read `zodiacSign` and `playerName` from IndexedDB on load.
- Set `--element-color` and `--element-bg` CSS variables on `document.documentElement` based on the sign's element.
- Spawn initial set of orbs (see Orb System below).
- Start the game loop.
- Start a session timer (counts up, displayed in HUD).
- `sessionHighScore = 0`, `currentScore = 0`, `comboCount = 0`.

**Game loop (per frame):**
1. Clear canvas with `fillRect` using `var(--void-01)` (`#050508`).
2. Draw the starfield layer (same drifting particles as onboarding, but denser — ~120 particles).
3. Update all orb positions (apply velocity + element-specific drift behavior).
4. Check for boundary collision (orbs wrap around edges, not bounce).
5. Check for convergence (see Convergence Logic).
6. Draw all orbs.
7. Draw active particles.
8. Check breath gate trigger (every 90 seconds).
9. Update HUD score display.
10. Track `sessionHighScore = Math.max(sessionHighScore, currentScore)`.

---

## ZODIAC SYSTEM (js/zodiac.js)

Export a `ZODIACS` object with all 12 signs. Each entry:

```js
export const ZODIACS = {
  aries:       { glyph: '♈', name: 'Aries',       element: 'fire',  color: '#D85A30', bg: 'rgba(216,90,48,0.14)'  },
  taurus:      { glyph: '♉', name: 'Taurus',      element: 'earth', color: '#1D9E75', bg: 'rgba(29,158,117,0.14)' },
  gemini:      { glyph: '♊', name: 'Gemini',      element: 'air',   color: '#378ADD', bg: 'rgba(55,138,221,0.14)' },
  cancer:      { glyph: '♋', name: 'Cancer',      element: 'water', color: '#7F77DD', bg: 'rgba(127,119,221,0.14)'},
  leo:         { glyph: '♌', name: 'Leo',         element: 'fire',  color: '#D85A30', bg: 'rgba(216,90,48,0.14)'  },
  virgo:       { glyph: '♍', name: 'Virgo',       element: 'earth', color: '#1D9E75', bg: 'rgba(29,158,117,0.14)' },
  libra:       { glyph: '♎', name: 'Libra',       element: 'air',   color: '#378ADD', bg: 'rgba(55,138,221,0.14)' },
  scorpio:     { glyph: '♏', name: 'Scorpio',     element: 'water', color: '#7F77DD', bg: 'rgba(127,119,221,0.14)'},
  sagittarius: { glyph: '♐', name: 'Sagittarius', element: 'fire',  color: '#D85A30', bg: 'rgba(216,90,48,0.14)'  },
  capricorn:   { glyph: '♑', name: 'Capricorn',   element: 'earth', color: '#1D9E75', bg: 'rgba(29,158,117,0.14)' },
  aquarius:    { glyph: '♒', name: 'Aquarius',    element: 'air',   color: '#378ADD', bg: 'rgba(55,138,221,0.14)' },
  pisces:      { glyph: '♓', name: 'Pisces',      element: 'water', color: '#7F77DD', bg: 'rgba(127,119,221,0.14)'},
};
```

Export element physics configs:

```js
export const ELEMENT_PHYSICS = {
  fire: {
    speed:       { min: 0.6, max: 1.1 },   // fast, chase-like
    wobble:      0.06,                      // high directional deviation
    pullStrength: 0.0,                      // self-directed, no attraction
    description: 'Orbs burst and chase — reactive, intense'
  },
  earth: {
    speed:       { min: 0.15, max: 0.35 },  // slow and steady
    wobble:      0.01,
    pullStrength: 0.012,                    // cluster passively
    description: 'Orbs drift slowly and hold position'
  },
  air: {
    speed:       { min: 0.4, max: 0.9 },
    wobble:      0.09,                      // high scatter
    pullStrength: 0.0,
    description: 'Orbs scatter and need coaxing'
  },
  water: {
    speed:       { min: 0.2, max: 0.5 },
    wobble:      0.02,
    pullStrength: 0.018,                    // magnetically pull toward same-element
    description: 'Orbs drift in silence, pulling toward each other'
  },
};
```

---

## ORB SYSTEM (js/orb.js)

### Orb class

```js
class Orb {
  constructor(canvasWidth, canvasHeight, element, zodiac) {
    this.x = Math.random() * canvasWidth;
    this.y = Math.random() * canvasHeight;
    this.radius = 22;                    // all orbs same size
    this.element = element;
    this.zodiac = zodiac;                // the player's sign
    this.glyph = ZODIACS[zodiac].glyph;
    this.color = ELEMENT_PHYSICS[element].color; // resolved in zodiac.js
    this.vx = (Math.random() - 0.5) * physics.speed.max;
    this.vy = (Math.random() - 0.5) * physics.speed.max;
    this.pulsePhase = Math.random() * Math.PI * 2; // staggered ring pulse
    this.opacity = 0;                    // fade-in on spawn
    this.alive = true;
    this.converging = false;
  }
}
```

### Orb rendering (per orb, every frame)

1. Draw outer pulse ring: `arc` at `radius + 7`, opacity `0.15 * sin(pulsePhase)`, stroke with element color. Advance `pulsePhase += 0.03`.
2. Draw orb body: filled `arc` at `radius`, fill color = element color at 20% opacity (`rgba(..., 0.20)`).
3. Draw orb border: stroke `arc` at `radius`, stroke = element color at 70% opacity, lineWidth 1.
4. Draw zodiac glyph: `fillText` centered, font = `"16px 'Vend'"`, fill = element color at 90% opacity.
5. Fade-in: if `opacity < 1`, increment by `0.02` per frame. Apply `ctx.globalAlpha = this.opacity` before drawing.

### Orb count

Always maintain exactly 16 orbs on the canvas. When orbs are destroyed in a convergence, spawn replacements after a 600ms delay, drifting in from a random edge.

### Orb wrapping

When an orb exits any canvas edge, it re-enters from the opposite edge (toroidal wrap). No bouncing.

### Player interaction

- **Tap/click:** On `touchstart` / `mousedown`, find the nearest orb within 48px of the tap point. If found, apply an impulse: add `(±0.8, ±0.8)` velocity in the direction away from touch (gentle nudge, not teleport).
- **Drag:** On `touchmove` / `mousemove` while pressed, if an orb was selected on press, move it toward the touch/cursor position at 30% lerp speed per frame (smooth drag, not snap).

---

## CONVERGENCE LOGIC

Every frame, after updating positions:

1. Build a list of all orbs with `element === playerElement`.
2. For each pair of same-element orbs, check if distance < `orb.radius * 2.5` (touching threshold).
3. Use Union-Find (or simple flood-fill) to group connected touching orbs into clusters.
4. Any cluster of size ≥ 3 triggers a **convergence event**:
   - Mark all orbs in cluster as `converging = true`.
   - Run a 300ms "pull" animation — orbs accelerate toward cluster centroid.
   - At 300ms: destroy all orbs in cluster, spawn particle burst at centroid, play convergence sound.
   - Calculate score: `clusterSize === 3 → +10`, `clusterSize === 4 → +20`, `clusterSize >= 5 → +30` base. Multiply by current `comboMultiplier`.
   - If `clusterSize >= 5`: trigger constellation flash (see Constellation Flash).
   - Increment `comboCount`. If next convergence happens within 4 seconds: `comboMultiplier = 2`. Reset to 1 after 4s gap.
   - Queue replacement orbs.

---

## CONSTELLATION FLASH

When a 5+ orb convergence occurs:

1. For 3 seconds, draw a faint constellation pattern over the canvas center.
2. The constellation is a static set of 5–7 dot positions connected by thin lines (`strokeStyle = rgba(element-color, 0.18)`, `lineWidth = 0.5`).
3. Each sign has its own unique dot layout. Hardcode the dot coordinates as normalized (0–1) x/y pairs in `js/zodiac.js` under a `constellation` key per sign. They do not need to be astronomically accurate — just visually distinct per sign.
4. The constellation fades out over the final 1 second using `globalAlpha` decay.
5. Show a label above the constellation: the sign name in Vend Bold 12px, ink-tertiary color, uppercase, letter-spacing 0.14em.

---

## SCORING SYSTEM

```
3-orb convergence   = +10  × comboMultiplier
4-orb convergence   = +20  × comboMultiplier
5+ orb convergence  = +30  × comboMultiplier

comboMultiplier     = 1 (default)
                    = 2 (if second convergence happens within 4s of last)

sessionHighScore    = Math.max(sessionHighScore, currentScore)
```

- HUD displays `currentScore` live, updating immediately on each convergence.
- `sessionHighScore` is recalculated every convergence and stored in IndexedDB (`nagimu_session_high`).

---

## BREATH GATE

Every 90 seconds of active gameplay:

1. Slow all orb velocities to 10% of current over 2 seconds (lerp).
2. Show a full-canvas overlay: `background: rgba(5,5,8,0.7)`.
3. Center a pulsing circle: radius 40px, stroke only, element color at 30% opacity. The stroke pulses from radius 40 → 56 → 40 over 4 seconds. `lineWidth = 1.5`.
4. Show text below the circle: `"breathe"` in Vend Regular 13px, ink-tertiary, letter-spacing 0.18em.
5. Show a skip affordance: `"tap to continue"` in Vend Regular 10px, ink-disabled, bottom of overlay.
6. After 6 seconds (or on tap): remove overlay, restore orb velocities over 1.5 seconds.
7. Do not deduct time from the 90s counter during the breath gate — it resets from 0 after each gate.

---

## AUDIO SYSTEM (js/audio.js)

All audio via Web Audio API. Create an `AudioContext` lazily on first user interaction (tap/click). Export these functions:

### `playConvergence(element, clusterSize)`
- Base tone: sine wave.
- Frequency per element: fire = 440Hz, earth = 220Hz, air = 528Hz, water = 396Hz.
- Duration: 0.6s. Envelope: attack 0.02s, sustain 0.3s, release 0.28s.
- If `clusterSize >= 5`: layer a second harmonic at frequency × 1.5, volume 0.3.

### `playOrbSpawn()`
- Short sine blip: 600Hz, 0.15s, volume 0.08. Envelope: attack 0.01s, release 0.14s.

### `playBreathGateStart()`
- Deep sine hum: 110Hz, 1.5s fade-in, held for 4s, 1.5s fade-out. Volume 0.12.

### `playSessionEnd(score)`
- If `score > 0`: ascending two-note sine chord (root + fifth) at 330Hz and 495Hz, 1.2s, volume 0.15.
- If `score === 0`: single low sine tone at 165Hz, 0.8s.

All functions must be no-ops (silent) if AudioContext is not yet initialized or if the browser blocks it.

---

## PARTICLE SYSTEM (js/particles.js)

On each convergence, spawn a particle burst at the cluster centroid.

### Particle burst

- Count: `clusterSize * 6` particles.
- Each particle: random angle (0–360°), speed 1.5–4.5px/frame, radius 1.5–3.5px, color = element color, opacity starts at 0.9.
- Each frame: advance position by velocity, decay velocity by 0.93×, decay opacity by 0.04.
- Remove particle when opacity < 0.02.

### Orb spawn particles

On each new orb spawn (after convergence replacement), spawn 8 tiny particles from the orb's entry point. Speed 0.5–1.5, radius 0.8–1.5, same color as element.

---

## SESSION END SCREEN

When the player taps "End Session":

1. Pause the game loop.
2. Show a full-canvas overlay with:
   - Sign glyph at 56px (Vend Bold).
   - "Session complete" in Vend Regular 12px, ink-tertiary, uppercase, letter-spacing 0.14em.
   - `sessionHighScore` value in Vend Bold 48px, element color.
   - "points" label in Vend Regular 10px, ink-tertiary.
   - If `sessionHighScore > previousAllTimeHigh` (from IndexedDB): show "New personal best" badge — background = element-bg, text = element color, Vend Bold 11px.
   - Two buttons: "Play again" (restarts session, same zodiac) and "Change sign" (goes to index.html).
3. Save `sessionHighScore` to IndexedDB and queue for leaderboard sync (see Sync System).
4. Play `playSessionEnd(sessionHighScore)`.

---

## INDEXEDDB SYSTEM (js/db.js)

Use `idb-keyval` from CDN:

```html
<script type="module">
  import { get, set, del } from 'https://cdn.jsdelivr.net/npm/idb-keyval@6/+esm';
</script>
```

Keys to store and their types:

| Key                      | Type     | Description                                      |
|--------------------------|----------|--------------------------------------------------|
| `nagimu_player_name`     | string   | Player's display name (max 18 chars)            |
| `nagimu_zodiac`          | string   | Selected zodiac key (e.g. `"leo"`)              |
| `nagimu_all_time_high`   | number   | All-time highest score across all sessions      |
| `nagimu_session_high`    | number   | Current/last session's highest score            |
| `nagimu_sync_queue`      | object[] | Array of score objects pending leaderboard sync |
| `nagimu_session_count`   | number   | Total number of sessions played                 |

Sync queue object shape:
```js
{
  playerName: string,
  zodiacSign: string,    // e.g. "leo"
  element:    string,    // e.g. "fire"
  score:      number,
  timestamp:  number,    // Date.now()
  synced:     boolean    // false until uploaded
}
```

Export helper functions: `getPlayer()`, `setPlayer(name, zodiac)`, `saveScore(score)`, `getSyncQueue()`, `markSynced(timestamp)`, `clearSyncedItems()`.

---

## BACKGROUND SYNC + LEADERBOARD UPLOAD (js/sync.js)

### Supabase config

```js
const SUPABASE_URL = 'YOUR_SUPABASE_URL';       // replaced at deploy time
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON'; // replaced at deploy time
const TABLE = 'nagimu_scores';
```

Table schema (Supabase SQL to run once):
```sql
create table nagimu_scores (
  id          uuid default gen_random_uuid() primary key,
  player_name text not null,
  zodiac_sign text not null,
  element     text not null,
  score       integer not null,
  played_at   timestamptz default now()
);

create index on nagimu_scores (zodiac_sign);
create index on nagimu_scores (score desc);
```

### Upload logic

```js
export async function uploadPendingScores() {
  const queue = await getSyncQueue();
  const pending = queue.filter(item => !item.synced);
  for (const item of pending) {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          player_name: item.playerName,
          zodiac_sign: item.zodiacSign,
          element:     item.element,
          score:       item.score,
          played_at:   new Date(item.timestamp).toISOString()
        })
      });
      if (res.ok) await markSynced(item.timestamp);
    } catch (e) {
      // Network error — leave in queue, try next time
    }
  }
  await clearSyncedItems();
}
```

### Background Sync registration (in sw.js)

```js
self.addEventListener('sync', event => {
  if (event.tag === 'nagimu-score-sync') {
    event.waitUntil(uploadPendingScores());
  }
});
```

Call this from game.js after saving score:
```js
if ('serviceWorker' in navigator && 'SyncManager' in window) {
  const reg = await navigator.serviceWorker.ready;
  await reg.sync.register('nagimu-score-sync');
}
```

If Background Sync is not supported, attempt `uploadPendingScores()` directly on session end (online only — catch and silently fail if offline).

---

## SERVICE WORKER (sw.js)

Precache strategy. Cache the entire app shell on install.

```js
const CACHE_NAME = 'nagimu-v1';
const PRECACHE = [
  '/',
  '/index.html',
  '/game.html',
  '/leaderboard.html',
  '/css/base.css',
  '/css/onboarding.css',
  '/css/game.css',
  '/css/leaderboard.css',
  '/js/db.js',
  '/js/sync.js',
  '/js/zodiac.js',
  '/js/audio.js',
  '/js/particles.js',
  '/js/orb.js',
  '/js/game.js',
  '/js/leaderboard.js',
  '/manifest.json',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  // Cache-first for precached assets, network-first for API calls
  if (event.request.url.includes('supabase.co')) {
    event.respondWith(fetch(event.request).catch(() => new Response('', { status: 503 })));
    return;
  }
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});
```

Also handle the Background Sync event in sw.js (import uploadPendingScores via importScripts or inline the logic).

---

## SCREEN 3 — LEADERBOARD (leaderboard.html)

### Layout

- Top: "NAGIMU" wordmark (Vend Bold 28px) + "Leaderboard" label (Vend Regular 11px, ink-tertiary, uppercase).
- Tab row: two tabs — "My Sign" and "All Signs". Active tab has bottom border = element color.
- Score list: flat list, no table borders. Each row:
  - Rank number (Vend Bold 14px, ink-tertiary, right-aligned, 24px wide)
  - Player name (Vend Bold 14px, ink-primary)
  - Zodiac glyph (16px) — only visible in "All Signs" tab
  - Score (Vend Bold 14px, element color, right-aligned)
- Show top 50 entries per tab.
- Current player's row: background = `var(--element-bg)`, with a subtle left border = element color.
- "Your best: X pts" shown above the list in ink-secondary.
- Back arrow (←) top-left to return to game.html.

### Data fetch

```js
// My Sign tab
const sign = await get('nagimu_zodiac');
const res = await fetch(
  `${SUPABASE_URL}/rest/v1/${TABLE}?zodiac_sign=eq.${sign}&order=score.desc&limit=50`,
  { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
);

// All Signs tab
const res = await fetch(
  `${SUPABASE_URL}/rest/v1/${TABLE}?order=score.desc&limit=50`,
  { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
);
```

If offline, show the message: "Connect to see the board" in ink-tertiary, centered, with the offline icon (just text: "✕ no connection" in Vend Regular 12px).

---

## PWA MANIFEST (manifest.json)

```json
{
  "name": "NAGIMU",
  "short_name": "NAGIMU",
  "description": "A zodiac drift game for mental stillness",
  "start_url": "/",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#050508",
  "theme_color": "#050508",
  "icons": [
    { "src": "/assets/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/assets/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

---

## VERCEL CONFIG (vercel.json)

```json
{
  "rewrites": [
    { "source": "/game", "destination": "/game.html" },
    { "source": "/leaderboard", "destination": "/leaderboard.html" }
  ],
  "headers": [
    {
      "source": "/sw.js",
      "headers": [
        { "key": "Cache-Control", "value": "no-cache, no-store, must-revalidate" },
        { "key": "Service-Worker-Allowed", "value": "/" }
      ]
    }
  ]
}
```

---

## HTML HEAD TEMPLATE

Use this `<head>` block in every HTML file (swap `<title>` as needed):

```html
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <meta name="theme-color" content="#050508">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="NAGIMU">
  <link rel="manifest" href="/manifest.json">
  <link rel="apple-touch-icon" href="/assets/icons/icon-192.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Vend:wght@400;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/css/base.css">
  <!-- page-specific CSS below -->
  <title>NAGIMU</title>
  <script>
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js');
    }
  </script>
</head>
```

---

## CONSTRAINTS — DO NOT VIOLATE

1. **No React, no Vue, no build step.** Vanilla ES Modules only. All `<script>` tags use `type="module"`.
2. **No other fonts.** Vend Sans Bold (700) and Vend Sans Regular (400) only. Never Inter, never system-ui, never fallback to anything except `sans-serif` as the CSS fallback.
3. **No wide layout.** The shell is always 390px. Desktop shows the phone shell centered. No responsive wide breakpoints.
4. **No localStorage.** Only IndexedDB (via idb-keyval).
5. **No canvas framework.** Native Canvas 2D API only — no Phaser, no PixiJS, no p5.js.
6. **No audio files.** Web Audio API synthesized sounds only.
7. **No timer pressure.** The game has no countdown. Sessions end only on player choice.
8. **No failure state.** There is no health bar, no lives, no game over screen. Only session end.
9. **Only peak score uploads.** `nagimu_sync_queue` stores only the session's `sessionHighScore`, not intermediate scores.
10. **Offline first.** Every feature must work at airplane mode. Leaderboard is the only online-dependent feature. All others degrade gracefully.

---

## EXECUTION ORDER

Build the files in exactly this sequence. Complete each before starting the next:

1. `css/base.css` — full token system + shell layout
2. `manifest.json` + `vercel.json`
3. `sw.js` — full precache + background sync handler
4. `js/zodiac.js` — ZODIACS object + ELEMENT_PHYSICS + constellation dot coords
5. `js/db.js` — full IndexedDB helpers
6. `js/audio.js` — all 4 sound functions
7. `js/particles.js` — particle burst + spawn particles
8. `js/orb.js` — Orb class (full render + physics)
9. `css/onboarding.css` + `index.html` + onboarding JS (inline module)
10. `js/game.js` — full game loop
11. `css/game.css` + `game.html`
12. `js/sync.js` — upload logic
13. `js/leaderboard.js` + `css/leaderboard.css` + `leaderboard.html`
14. `README.md` — setup instructions, Supabase config steps, deployment guide

---

## FINAL NOTE TO COMPOSER

Do not ask for clarification. Do not propose alternatives. Build exactly what is described here. Every system is fully specified. If a detail is ambiguous, use the most minimal, functional implementation that matches the aesthetic described — void-first dark, Vend Sans only, slow physics, no pressure. This is a game about stillness. The code should feel that way too.

Begin with Step 1.