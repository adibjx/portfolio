# Adib Vieira — portfolio

Static one-pager for [portfolio.adibjv.com](https://portfolio.adibjv.com/). No build step. Upload the folder as-is to Cloudflare Pages (build command empty, output directory `/`) or as Workers static assets.

Preview locally:

```bash
python3 -m http.server 4173
```

Open http://127.0.0.1:4173

## Add a video ad

Slots are numbered `01` through `10`. The frame is vertical 9:16.

1. Export an H.264 MP4 (720×1280 is a good default) and a poster JPG, ideally under ~200 KB.
2. Save them as:
   - `assets/videos/01.mp4`
   - `assets/videos/01.jpg`
3. In `main.js`, add the slot to `VIDEO_ADS`:

```js
const VIDEO_ADS = [
  { id: "01", src: "assets/videos/01.mp4", poster: "assets/videos/01.jpg", alt: "What happens in the ad" },
];
```

4. Refresh. The placeholder becomes the ad.

Both files are required. The poster shows first. The video file is not downloaded until the card is on screen or someone taps it. Playback starts muted. A tap turns sound on. It never autoplays with sound.

Optional captions: add `captions: "assets/videos/01.vtt"` and `lang: "en"` (or `pt`).

Use `02`, `03`, and so on for the next ads. Order on the page is always 01 to 10. To add an 11th slot, raise `SLOT_COUNT` at the top of `main.js`.

## Add a static ad

The frame is 4:5. The image is cropped to fill (`object-fit: cover`). Export at least 1200 px on the long side.

1. Save the image as `assets/stills/01.jpg` (or change `src` if the file is `.png` or `.webp`).
2. Add it to `STATIC_ADS` in `main.js`:

```js
const STATIC_ADS = [
  { id: "01", src: "assets/stills/01.jpg", alt: "What the ad shows" },
];
```

3. Refresh. Tap the card to open it larger. Close with the button, the backdrop, or Escape.

Paths have to start with `assets/`. A slot with a missing file stays on its placeholder.

## TODO for Adib

- Review the meta description and Open Graph text in `index.html`.
- Write a real `alt` for each ad (the `TODO:` placeholder in the sample is ignored on purpose).
- Add a captions `.vtt` when an ad has speech.
- Nav label “Work”, the skip link, and the JavaScript-off line are functional labels — change them in `index.html` if you want different wording.
