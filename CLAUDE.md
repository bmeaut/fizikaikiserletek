# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A GitHub Pages site that serves as a hub for mobile-targeted Progressive Web Apps (PWAs) for physics experiments. The site is written in Hungarian. See `WEBSITE.md` for the step-by-step guide on adding new apps.

## Structure

```
fizikaikiserletek/
├── index.html              # Hub landing page
├── manifest.json           # PWA manifest for the hub
├── sw.js                   # Service Worker for the hub
├── assets/
│   ├── style.css           # Shared styles (light/dark mode via CSS variables)
│   ├── main.js             # QR code generation + lightbox + SW registration
│   └── icons/              # SVG placeholders — replace with PNG for real PWA install
├── apps/
│   ├── surlodas/           # Adhesion coefficient measurer (standalone PWA)
│   ├── oscilloscope/       # Sound oscilloscope student PWA (connects to server)
│   ├── oscilloscope-server/  # Teacher Electron app (Node.js + WebSocket server)
│   └── sensor-logger-server/ # Sensor Logger HTTP Push receiver (Electron, plain HTTP)
├── specs/                  # Open specifications for every app + the hub
└── experiment-ideas/       # Research notes on future experiments
```

## No build step (hub + student PWAs)

Plain HTML/CSS/JS. No bundler, no package manager. Served as-is by GitHub Pages.

## Electron server app

`apps/oscilloscope-server/` is a Node.js + Electron app. Run with:
```
cd apps/oscilloscope-server
npm install
npm start
```
Build Windows installer: `npm run dist`

Key dependencies: `electron`, `express`, `ws`, `node-forge` (TLS), `bcryptjs`, `qrcode`.

## Adding a new app

See `WEBSITE.md`. In brief:
1. Create `apps/<name>/` with `index.html`, `manifest.json`, `sw.js`, and icons.
2. Add an `<article class="app-card">` to `#app-grid` in `index.html`.
3. Write a spec in `specs/<name>.md`.

## Open specifications

Every app has a spec in `specs/`. These are the source of truth for AI-assisted regeneration.
When modifying an app significantly, update its spec too.

## Icons

`assets/icons/` and each app's `icons/` contain SVG placeholders. For PWA installability,
convert to PNG (192×192 and 512×512). `manifest.json` files already reference `.png`.

## GitHub Pages deployment

Push to `master`. Pages serves from the repo root.
Live URL: `https://bmeaut.github.io/fizikaikiserletek/`

## Cache busting

When updating an app, increment the `CACHE` version string in its `sw.js` (e.g. `oscilloscope-v1` → `oscilloscope-v2`).

## WebSocket / HTTPS notes

The Electron server generates a self-signed TLS certificate on first run (stored in `%APPDATA%/oscilloscope-server/tls/`). Students must accept the browser warning once. iOS requires HTTPS for microphone access — the server provides this.

The student PWA at `apps/oscilloscope/` connects via `wss://` (WebSocket over TLS) to the teacher's server. The server also serves the student PWA at `/app/` so students can reach it directly from the server URL without needing GitHub Pages.
