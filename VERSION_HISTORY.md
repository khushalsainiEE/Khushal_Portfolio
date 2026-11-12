# Version history

Changelog for the Khushal Saini portfolio site. Git commit messages should mirror these entries when you push to GitHub.

---

## v1.5.1 — 2026-11-12 · realistic tapes, real controls
- Tape spines look like real cassettes: moulded plastic with a seam and sheen, write-protect tab, debossed VHS logo, recessed paper label with a numbered colour band, a ruled line and a lifting corner; stills get a smoky shell; the stack sits slightly uneven
- Labels are handwritten in Nanum Pen Script (blue-black ink)
- The VCR ▶ button now plays / pauses the video (shows ❚❚ while playing); Space does the same
- The LCD counter follows the video's real time: it stops on pause, jumps when you scrub, shows ■ END when it finishes (▶ replays from 0:00)

## v1.5.0 — 2026-11-12 · VHS stack
- Tapes are now a stack of spines lying flat (masking-tape labels, small gaps), like the list view
- Hover pulls a tape out of the stack (neighbours shift a little) and a preview picture springs out to its right
- Much bigger TV: sized to the window height, thinner bezels, wider screen
- The spine lines up with the VCR slot and slides in; eject reverses it
- The video starts loading muted the moment you drop the tape, then unmutes from 0:00 when the picture appears
- Dropping a tape no longer triggers the grid heartbeat

## v1.4.1 — 2026-11-12
- Photo window: the whole photo fits at 100% (portrait shots were cropped); pan limits follow the fitted size
- The film side can no longer be nudged up when a tape gets keyboard focus

## v1.4.0 — 2026-11-12 · VHS
- New third film view, **vhs**: a shelf of cassettes (thumbnail on the label, title on masking tape; stills in a light shell with a STILL stamp)
- Drag a tape into the VCR, or click it: tape lines up over the slot, the flap opens, it slides in, clunk, static, then it plays on the CRT
- Beige CRT TV with power-on/off, scanlines, glass, blue "INSERT TAPE" screen and on-screen display; VCR with slot, LCD counter and eject / play / watch large
- Photo tapes open in a retro picture window on the TV: zoom in/out, fit, drag to pan, close ejects
- New sounds (film side only): pick up, insert + motor, clunk, static, eject, TV on/off

## v1.3.2 — 2026-11-10
- Contact fills the screen, so the bottom of the page never shows the dark band above it
- Flip coin: flowing colours are back, playing forward then in reverse (no jump); the back face mirrors the front, so turning looks like the colours reversing
- Social links show LinkedIn, Instagram, YouTube and GitHub logos instead of initials (menu and contact)

## v1.3.1 — 2026-11-10
- Top bar: clear over the hero, frosted once you scroll, slides away while scrolling down and returns on scroll up
- Experience: dark section that flows into the flip; columns line up on every row (dates in a fixed right-aligned column)
- Contact: more room, footer pinned to the bottom
- Flip coin: two real faces, so the colour changes exactly as it turns edge-on; hover adds a smooth half-turn instead of speeding the loop up
- Spiral: spacing tightened to halfway between the last two versions

## v1.3.0 — 2026-11-10
- Film viewer: the close button stays pinned at the top right however far you scroll (original and full width)
- Spiral: wider spacing so neighbouring cards keep a small gap and switching between landscape and portrait is smoother
- Heartbeat: click the empty grid on the film side and a lub-dub ripple runs through dots on the grid, with a soft low thump

## v1.2.1 — 2026-11-10
- Spiral: cards are painted in depth order, so the focused card stays in front and landscape/portrait cards never slice through each other
- Research row shows all four results (cutoff frequency, capacitance, breakdown, fc × breakdown)
- "Fulton Forge Expo page" button next to the poster PDF (the page the poster's QR code opens)
- List view centred with breathing room top and bottom

## v1.2.0 — 2026-11-10 · Real research content
- Research: full write-up of the TSMC FURI project on AlN RF Schottky diodes, built from the poster (question, results at a glance, method, device design, results figures, fabrication flow, benchmark table, poster + PDF)
- NanoFab metrology training photo as the research cover
- New Projects section (VisionForce, CATS) and Experience section (Fu Research Group, AKAI, Vodafone) from the resume
- About and facts rewritten from the resume
- Film side: spiral cards now render at true size, so photos and "still" labels are sharp
- True Love now uses a frame from the reel instead of a repeated photo

## v1.1.0 — 2026-11-10
- Removed the loading screen: the research side opens straight away
- No background music; research side is silent; sound effects only on the film side (sound button shown there only)
- Cursor: normal system cursor on the research side; instant, no-lag dot on the film side
- Spiral now unfolds smoothly after the flip instead of snapping into place; lighter per-frame rendering
- Photo viewer shows portrait photos uncropped, with an "original / full width" toggle
- Film viewer stays black when you scroll down

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
