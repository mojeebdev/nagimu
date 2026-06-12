# NAGIMU (凪む)

> A zodiac drift game for mental stillness. No timer, no pressure, no internet required. Your element, your pace, your silence.

---

## Why I built this

There was a particular kind of day I kept having.

Not a bad day in the dramatic sense. No single thing went wrong. It was more like — everything had been going for too long, at too many frequencies at once. Deadlines in three timezones. A Telegram that wouldn't stop. A build that kept breaking. The kind of fatigue that isn't sleep deprivation, it's just too much input with nowhere to put it.

On those days I would turn off my data. Not for any particular reason. Just because I needed the world to stop requiring things from me for a moment.

And I'd open a game. Something simple. Something that didn't care how I was performing. The problem was every game I found either had a timer pushing me, or a leaderboard judging me, or a notification asking me to come back tomorrow. Even the "calm" ones. Even the "wellness" ones. They all had the same underlying design: you are being measured.

I wanted something that had no opinion about me.

I'm a Leo. Which means when I'm stressed, I go inward — not outward. I don't need community in those moments. I need a room with the door closed. That's where the zodiac idea came from. Not as aesthetics — as a real observation: the way I cope when I'm overwhelmed is genuinely different from how someone else copes. A Scorpio withdraws differently than a Gemini scatters. A Taurus needs something slow and grounding. An Aries needs something to burn through. The element you belong to shapes what kind of stillness you need.

So I built NAGIMU.

The name is Japanese — 凪む. It means the moment the sea becomes still after a storm. Not before the storm. Not instead of the storm. After it. That moment when the water flattens and you can hear yourself again.

The mechanic is simple on purpose. Orbs drift. You nudge them together. When enough of them converge, they dissolve — and something in your brain says *yes*. Not because you won. Because something completed. There's a difference.

There's no timer. There's no life count. There's no game over. Every 90 seconds the whole field slows down and asks you, quietly, to breathe. You can ignore it. It doesn't push.

The whole thing works offline. That was non-negotiable. When you're mentally depleted, the last thing you need is a loading spinner. You need the thing to just be there. Already downloaded. Already waiting. Airplane mode is not a bug — it's the intended environment.

I built this as a solo founder, somewhere between three other builds, in the middle of a month where I was shipping something every day. The irony of building a stress-relief game while stressed was not lost on me. But that's exactly why it exists. I needed it to exist. So I made it exist.

If you find yourself on one of those days — the kind where everything is fine and somehow nothing is fine — add it to your home screen. Turn off your data. Pick your sign. Let the orbs drift.

You don't have to perform stillness. You just have to sit in it for a while.

— [Mojeeb Titilayo](https://mojeeb.xyz), Lagos · [BlindspotLab](https://blindspotlab.xyz)  
*Built during the 30 Days of Vibeathon challenge · June 2026*

---

## How it works

Pick your zodiac sign. Your element — Fire, Earth, Air, or Water — determines how your orbs move. Fire orbs burst and chase. Earth orbs cluster slowly. Air orbs scatter and need coaxing. Water orbs drift in silence, pulling toward each other.

Guide 3 or more same-element orbs until they touch. They converge, dissolve in a particle burst, and you score. No countdown. No failure state. The session ends only when you end it.

Every 90 seconds, the field slows and a breath gate appears. One quiet pulse. Six seconds. Then it resumes.

Tap your name in the HUD to open **Your journey** — day streak, total sessions, all-time HI, and last session score. All private, all on your device.

Sound is optional. Toggle it on or off from onboarding or in-game; your preference is remembered.

---

## Scoring

Like Chrome's dino game — your current score and personal **HI** (highest ever) live on your device only. No leaderboard, no sync, no comparison. The score is a private record of the session, nothing more.

When a session ends, choose **Play again** or **Back home** to return to onboarding and edit your profile.

---

## Tech stack

- Vanilla HTML, CSS, and JavaScript (ES Modules) — no framework, no build step
- HTML5 Canvas API — native game loop
- Web Audio API — synthesized sounds, with an on/off toggle
- IndexedDB via [idb-keyval](https://github.com/jakearchibald/idb-keyval) — player data, HI score, session stats, and preferences
- Service Worker with full precache strategy

---

## Local development

```bash
npx serve .
```

Open `http://localhost:3000` in your browser.

---

## Deploy to Vercel

1. Push this repo to GitHub.
2. Import the project in [Vercel](https://vercel.com) as a static site.
3. Deploy. `vercel.json` handles `/game` rewrites and service worker cache headers automatically.

---

## Project structure

```
nagimu/
├── index.html             # Onboarding — name + zodiac select
├── game.html              # Main game — canvas + HUD
├── manifest.json          # PWA manifest
├── sw.js                  # Service Worker
├── vercel.json            # Routing + SW headers
├── css/
│   ├── base.css           # Design tokens + shell layout
│   ├── onboarding.css
│   ├── game.css
│   └── credit.css
├── js/
│   ├── db.js              # IndexedDB helpers
│   ├── zodiac.js          # Sign data + element physics
│   ├── audio.js           # Web Audio sound functions
│   ├── audio-ui.js        # Sound toggle UI
│   ├── pull-refresh.js    # Pull-to-reload (onboarding only)
│   ├── particles.js       # Particle burst system
│   ├── orb.js             # Orb class — physics + render
│   └── game.js            # Game loop + input + scoring
└── assets/icons/
    ├── icon-192.png
    └── icon-512.png
```

---

## Offline behavior

The service worker precaches the full app shell on first install. Everything — game loop, audio, fonts, all screens — works in airplane mode. Add to home screen for the full offline experience.

On onboarding only: pull down from the top of the screen to reload the app. Pull-to-refresh is disabled during gameplay so swipes don't interrupt a session.

---

## Design

- **Shell:** Full-width mobile frame. Looks like a phone on every screen. No wide-layout breakpoints — the game was born mobile and stays mobile.
- **Palette:** Void-first dark. `#050508` base. One element accent color per session — fire amber, earth teal, air blue, water violet.
- **Font:** Vend (400 + 700) — the only typeface in the project.

---

## License

[MIT](LICENSE) — Copyright (c) 2026 [Mojeeb Titilayo](https://mojeeb.xyz).

You may use, fork, or adapt this project, but you **must** keep the copyright notice and license in any copy or derivative. Credit the original author and link back to this repo when you share or build on NAGIMU.