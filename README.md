# Khushal Saini — Research ⟷ Film

A two-sided portfolio. The **research side** (light) opens with a 3D silicon wafer that tilts with your mouse. Press **film side** (or the `F` key) and the whole page flips like a coin to the **film side** (dark): a stack of VHS tapes you drag into a VCR to play on a CRT TV.

No build step, no npm. Vercel serves the files as they are.

---

## Change words, links, research or videos

Open **`js/content.js`**. Everything you see on the site comes from there. Lines marked `TODO` are placeholders.

| You want to… | Edit in `js/content.js` |
|---|---|
| Change your bio, facts, email, socials | `PROFILE` |
| Add or edit a research project | `RESEARCH` |
| Add a poster or figures to a project | put the image in `assets/research/`, then set `poster:` or `images:` |
| Add or edit a film | `FILMS` (YouTube links play inside the site) |
| Add event photos | put files in `assets/img/`, then add to `PHOTOS` |

Images: use `.webp` or `.jpg`, about 1600–2000 px on the long side.

## Files

```
index.html        page structure
css/style.css     all styling
js/content.js     ← your content (edit this)
js/main.js        loader, research side, flip, menu, terminal
js/film.js        film side: tape list, VHS view, large video sheet
js/vhs.js         film side: VHS view (tapes, TV, VCR, photo window)
js/wafer.js       the 3D silicon wafer (three.js)
js/sound.js       all sounds, generated live (no audio files)
js/cursor.js      custom cursor
assets/img/       photos (optimised)
```

## Hidden extras

- Press `/` for a command terminal (`help`, `spin`, `invert`, `bw`, `reset`…)
- Press `F` to flip sides.
- Film side: drag a tape into the VCR (or click it); ▶ / Space plays and pauses.
- `yoursite.com/#film` opens straight on the film side.

## Preview on your computer

In Cursor's terminal, inside this folder:

```
python -m http.server 5500
```

Then open http://localhost:5500

## Publish (GitHub → Vercel)

Vercel redeploys automatically whenever you push to GitHub.

```
git add .
git commit -m "describe what you changed"
git push
```

Pushing to any branch other than `main` gives you a private **preview** link in Vercel. Pushing to `main` updates the live site.

## Credits

- 3D: [three.js](https://threejs.org) (MIT), loaded from jsDelivr
- Fonts: Instrument Serif, Geist, Geist Mono, Pixelify Sans (Google Fonts, open licence)
- Sounds: synthesised in the browser with the Web Audio API
