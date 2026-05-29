# Version history

Changelog for the Khushal Saini portfolio site. Git commit messages should mirror these entries when you push to GitHub.

---

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
