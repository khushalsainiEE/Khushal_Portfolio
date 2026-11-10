# Version history

Changelog for the Khushal Saini portfolio site. Git commit messages should mirror these entries when you push to GitHub.

---

## v1.0.0 — 2026-11-10 · "Two sides" revamp
- New two-sided site: research side and film side, with a 3D coin-flip between them
- Research side: mouse-reactive 3D silicon wafer (iridescence + diffraction shader), drop-in name chips, about, research projects with "LOADING PLS WAIT" detail pages, other work, contact
- Film side: 3D spiral of videos, list view with floating previews, white slide-in menu with letter-roll links, rotating showreel badge, video sheet that grows from the clicked card
- "Enter with sound / without sound" intro with pixel-curtain reveal
- All UI sounds and ambient beds synthesised live (no audio files)
- Custom cursor with label tags; `/` command terminal; `F` to flip
- All content moved into `js/content.js`
- Photos optimised (7 MB → 1.3 MB); removed the 17 MB camera model and old scripts

## v0.5.0 — 2026-05-29
- Hero + photography images wired (`hero.JPG`, photo-1/2/3)
- All YouTube / Shorts project links in `media-config.js`
- Auto YouTube thumbnails on video cards; Instagram reel opens externally

## v0.4.3 — 2026-05-29
- Fixed 3D camera: self-hosted `assets/models/AntiqueCamera.glb`, instant fallback, load timeout
- Added `scripts/serve.ps1` for reliable localhost on port 3000

## v0.4.1 — 2026-05-29
- Pushed to GitHub: [khushalsainiEE/Khushal_Portfolio](https://github.com/khushalsainiEE/Khushal_Portfolio)
- Added `scripts/git-here.ps1` for terminals where `git` is not on PATH

## v0.4.0 — 2026-05-29
- Added interactive **Three.js** antique camera scene (Khronos CC0 model)
- Orbit controls, theme-aware lighting, reduced-motion support
- Git setup: `.gitignore`, `README.md`, `scripts/setup-github.ps1`
- Human-readable changelog (this file) linked from footer

## v0.3.0 — 2026-05-29
- **Dark mode** with moon/sun toggle in glass navigation
- Theme persisted in `localStorage`
- `media-config.js` for photos and video embeds (YouTube / Vimeo / MP4)
- `assets/` folder structure for images and videos

## v0.2.0 — 2026-05-29
- Liquid glass navigation (Home, Videos, Photography, About)
- Scroll spy, mobile menu, video modal, card tilt effects
- Hero parallax orbs and scroll reveals

## v0.1.0 — 2026-05-29
- Initial portfolio shell: hero, videography grid, photography, about, contact
- Editorial typography and custom cursor

---

### How to update this log
1. Make your changes on the site.
2. Add a new `## vX.Y.Z — date` block at the **top** (below this intro).
3. Commit with the same version in the message, e.g. `v0.5.0: add showreel embed`.
