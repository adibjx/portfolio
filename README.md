# Adib Vieira — portfolio

Static one-pager for [portfolio.adibjv.com](https://portfolio.adibjv.com/). No build step. Upload the folder to Cloudflare Pages (build command empty, output directory `/`) or as Workers static assets.

Preview locally:

```bash
python3 -m http.server 4173
```

Open http://127.0.0.1:4173

## Videos

The files are not in git (they are about 110MB). `videos/` is gitignored. Deploy that folder next to `index.html` as static assets. Each live ad is `/videos/NN.mp4` plus `/videos/NN.jpg`. Page order is the order of `VIDEO_ADS` in `main.js`, not the filename numbers.

- 11 — wedding necklace
- 12 — reserved for the whole bible ad (not live yet; not in the array)
- 13 — mom's faith came back (song)
- 14 — pawn shop

Cards are 9:16. Posters show first (`preload="none"`). The player is the browser’s own controls. Only one video plays at a time.

To add another ad, drop in `videos/15.mp4` and `videos/15.jpg`, then append a line in `main.js`:

```js
{ src: "/videos/15.mp4", poster: "/videos/15.jpg" },
```

Order on the page is the order of that list.

## Deploy

`wrangler.jsonc` runs `worker.js` in front of the static files. Every path is served with `env.ASSETS.fetch`, except `/videos/*.mp4`: the worker answers `Range` requests with `206` responses so a player can seek. Upload includes the gitignored `videos/` folder, so that folder has to be on the machine that deploys.

```bash
npx wrangler deploy
```

If an mp4 response has no `Content-Length`, put its byte size in the `SIZES` map at the top of `worker.js`.
