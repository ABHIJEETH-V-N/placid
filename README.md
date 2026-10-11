<p align="center">
  <img src="./public/icon-192.png" width="96" height="96" alt="Placid Logo" style="border-radius: 22px;" />
</p>

<h1 align="center">Placid</h1>

<p align="center">
  <em>Sit still. Notice everything.</em>
</p>

<p align="center">
  A calm, minimal mobile Progressive Web App for stepping outside, putting your phone face down, and listening to the world.
</p>

<p align="center">
  <a href="#key-features">Features</a> •
  <a href="#design-philosophy">Design Philosophy</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#deploying-to-cloudflare-pages">Cloudflare Pages</a> •
  <a href="#privacy--offline">Privacy</a>
</p>

---

## Overview

Modern life moves quickly. **Placid** is designed for solitary outdoor pauses—whether on a park bench, beneath a backyard tree, or on a garden step. 

It is built as an installable Progressive Web App (PWA). When opened in a browser tab, it presents a twilight editorial magazine landing spread. When launched from your phone’s home screen, it skips the landing page entirely and opens immediately into your sitting ritual.

---

## Key Features

### 🪷 1. Sit Session & Meditation Timer
- **Accurate Timestamp Tracking**: Calculates elapsed time using `Date.now()` differences rather than simple interval counters, guaranteeing accurate timekeeping even when your phone is placed face-down or locked.
- **Paced Breathing Guide**: An expandable, subtle breathing sphere paced to a 12-second cycle (6s breathe in, 6s breathe out). Can be toggled on or off.
- **Senses Anchor (Noticing Guide)**: Gentle, non-intrusive sensory cues rotating beneath the timer (*"Notice the farthest sound reaching your ears"*, *"Feel the temperature of the air on your skin"*, *"Sense the space between each breath"*). Tap anytime to cycle.
- **Screen Wake Lock**: Automatically prevents screen sleep during sits using the Screen Wake Lock API.
- **Tactile Haptic Feedback**: Gentle vibration chimes at the start, quarter intervals (25%, 50%, 75%), and conclusion.

### 🍃 2. Procedural Nature Soundscapes (Web Audio API)
Zero audio assets, zero streaming bandwidth, and 100% offline. Synthesized directly in code:
- **Soft Wind**: Gentle filtered pink noise with 8-second slow gust modulation.
- **Forest Rain**: Multilayer granular raindrops pattering against green leaves.
- **Night Crickets**: Ambient warm twilight field with rhythmic dual-tone chirps.
- **Flowing Stream**: Continuous babbling brook with water ripple resonance.
- **Silence**: Pristine silence to attend only to the real sounds around you.
- **In-Session Switcher**: Switch or mute ambient audio mid-session without stopping your sit.

### 🔔 3. Acoustic Bell Tones
- **Tibetan Singing Bowl**: Harmonic sine resonance with fundamental 528Hz tuning and long acoustic decay.
- **Kyoto Temple Bell**: Deep subharmonic gong with grounded resonant body.
- **Zen Wood Clapper**: Snappy, organic woodblock click with rapid dissipation.

### 🌅 4. Living Generative Scenes with Gyroscope Parallax
- **Meadow**: Procedurally generated 4-layer grass field swaying in the wind, with wildflowers and drifting pollen motes.
- **Temple**: Dusk pagoda silhouette, stepped curved eaves, warm lantern glow, drifting mountain mist, and rising incense smoke.
- **Local Sky**: Live weather and sunrise/sunset powered by Open-Meteo. Automatically displays clear sky, overcast clouds, falling rain lines, snow, or fog based on your exact position (with graceful Meadow fallback).
- **My Place**: Upload up to 5 personal photos of your favorite outdoor benches or hideaways, stored locally with subtle parallax depth and text-contrast gradient overlays.
- **Gyroscope Tilt Engine**: Android `deviceorientation` tilt with low-pass filtering (0.08 lerp factor) and depth multipliers. Includes iOS 13+ permission support, desktop pointer fallback, and reduced-motion compliance.

### 📓 5. Noticings & Journal
- **Keep What You Noticed**: Record up to 3 quiet observations after every sit (*"Shift of the light"*, *"Cold gust on the neck"*, *"A crow passing overhead"*).
- **State of Mind**: Minimalist mood markers (`calm`, `restless`, `sleepy`, `happy`, `heavy`).
- **Date Grouping & Search**: Search by text, spot name, observation, or mood.
- **JSON Backup**: One-click full data export and restore directly from the app.

### 🌿 6. Outdoor Light Tracker & Practice Streaks
- **Outdoor Light Phase**: Live status on the Today tab tracking natural light transitions (*Dawn Twilight*, *Morning Sun*, *Midday Stillness*, *Golden Hour*, *Dusk Horizon*, *Starlight Night*).
- **Gentle Reset Streaks**: Tracks consecutive days with sits of 5+ minutes. Missing a day gently restarts the count without guilt language or punishment mechanics.
- **Weekly Practice Chart**: Pure CSS 7-day bar chart showing total daily sitting minutes.

### 🌙 7. Night Twilight Dark Mode
- **True Obsidian Palette**: Deep `#121214` canvas, dark slate `#1c1c1f` cards, soft glow rings, and high-legibility night typography.
- **1-Tap Quick Switch**: Sun/Moon toggle accessible directly from the top utility header and the landing nav capsule.
- **Theme Modes**: Supports **Light**, **Dark**, and **System** (device-matched).

---

## Design Philosophy

- **Zero Guilt**: No streaks shaming, no notification spam, no badges or gamification candy.
- **Twilight Serif Editorial**: Playfair Display for editorial headlines, paired with Inter for clear, functional typography.
- **Subtle Elevation**: 5px soft glow rings and hairline borders rather than heavy drop shadows.
- **Mobile-First & Notched Safe**: Built with safe-area insets (`env(safe-area-inset-top)`, `env(safe-area-inset-bottom)`) and minimum 44px touch targets.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | React 19 + TypeScript |
| **Bundler** | Vite 8 |
| **Styling** | Tailwind CSS v4 |
| **Audio** | Web Audio API (real-time synthesizers) |
| **Storage** | Browser IndexedDB (zero external database) |
| **Weather** | Open-Meteo API (free, open, no API key) |
| **Deployment** | Cloudflare Pages / Static Hosting |

---

## Privacy & Offline

Placid does not use user tracking, analytics scripts, or remote databases:
- **100% Private**: All sitting spots, journal records, settings, and uploaded photos are stored exclusively in your browser’s IndexedDB.
- **Offline Shell**: Service Worker (`sw.js`) precaches the app shell, fonts, and assets. After your initial visit, Placid opens and functions entirely without an internet connection.

---

## Quick Start

### Prerequisites
- Node.js 20+
- npm 10+

### Installation

```bash
# Clone the repository
git clone https://github.com/ABHIJEETH-V-N/placid.git
cd placid

# Install dependencies
npm install

# Start development server on port 3000
npm run dev
```

Visit `http://localhost:3000` in your browser.

### Build

```bash
npm run build
```

Production output will be generated in the `dist/` directory.

---

## Deploying to Cloudflare Pages

Placid is pre-configured for **Cloudflare Pages**:

- `public/_redirects`: Provides SPA fallback routing (`/* /index.html 200`) so direct navigation to `/app` never 404s.
- `public/_headers`: Enforces PWA cache policies (`sw.js` never stale-cached) and security headers.
- `wrangler.toml`: Configured with `pages_build_output_dir = "dist"` and `NODE_VERSION = "22"`.

### Deploy via Cloudflare Dashboard
1. Go to **Workers & Pages** in your Cloudflare dashboard.
2. Click **Create application** > **Pages** > **Connect to Git**.
3. Select your repository.
4. Set build settings:
   - **Framework preset**: `Vite`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
5. Click **Save and Deploy**.

### Deploy via Wrangler CLI
```bash
npx wrangler pages deploy dist --project-name=placid
```

---

<p align="center">
  <sub>Built with serenity for quiet moments outside.</sub>
</p>
