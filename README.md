# Adib Vieira — portfolio

Static one-pager for [portfolio.adibjv.com](https://portfolio.adibjv.com/). No build step. Upload the folder to Cloudflare Pages (build command empty, output directory `/`) or as Workers static assets.

Preview locally:

```bash
python3 -m http.server 4173
```

Open http://127.0.0.1:4173

## Videos

The files are not in git (they are about 110MB). `videos/` is gitignored. Deploy that folder next to `index.html` as static assets, so the live paths are:

- `/videos/01.mp4` and `/videos/01.jpg`
- through `/videos/08.mp4` and `/videos/08.jpg`

Cards are 9:16. Posters show first (`preload="none"`). The player is the browser’s own controls. Only one video plays at a time.

To add another ad, drop in `videos/09.mp4` and `videos/09.jpg`, then append a line in `main.js`:

```js
{ src: "/videos/09.mp4", poster: "/videos/09.jpg" },
```

Order on the page is the order of that list.
