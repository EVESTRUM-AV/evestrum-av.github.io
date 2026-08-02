# EVESTRUM — portfolio site

Static site. No build step, no dependencies. Just HTML, CSS and ~90 lines of JavaScript.

## Structure

```
index.html              single-page: hero / practice / work / credits / about / contact
404.html
work/
  beacon.html           Beacon — Singularity & Coexistence
  rite-of-spring.html   Rite of Spring
  latent-spaces.html    Latent Spaces
  oblivion.html         Oblivion
  inside.html           Inside — Genius Loci Weimar
  modern-bon.html       Modern Bön
assets/
  css/main.css          all styling, one file
  js/main.js            reveal on scroll, lazy video, lightbox
  img/                  every image at 900px and 1800px wide
  video/                muted loops, 720–1280px
  evestrum-mark.svg     logo, traced to vector
```

Total weight: ~31 MB. Comfortably inside GitHub Pages limits.

## Deploying to GitHub Pages

1. Rename your GitHub account to `evestrum` (Settings → Account → Change username).
2. Create a new **public** repository called `evestrum-av.github.io`.
3. On the empty repo page, click **uploading an existing file**.
4. Drag the *contents* of this `_SITE` folder in (not the folder itself — select all inside it).
5. Commit. The site is live at `https://evestrum-av.github.io` within a minute or two.

`.nojekyll` is included so GitHub serves the files as-is.

## Adding a custom domain later

1. Buy the domain (Namecheap, Porkbun, INWX for `.berlin`).
2. Add a file called `CNAME` at the root containing only your domain, e.g. `evestrum.av`.
3. At the registrar, point the domain at GitHub:
   - `A` records for the apex → `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - `CNAME` for `www` → `evestrum-av.github.io`
4. In the repo: Settings → Pages → set the custom domain, tick **Enforce HTTPS**.

Then find-and-replace `https://evestrum-av.github.io` with the new domain in the `<link rel="canonical">`, `og:url`, `og:image` tags and `sitemap.xml`.

## Adding a Vimeo embed

Where a full-length video should go, paste this and swap the ID:

```html
<div style="position:relative;padding-top:56.25%">
  <iframe src="https://player.vimeo.com/video/VIDEO_ID?title=0&byline=0&portrait=0&dnt=1"
          style="position:absolute;inset:0;width:100%;height:100%;border:0"
          allow="autoplay; fullscreen; picture-in-picture"
          title="Beacon — full documentation"></iframe>
</div>
```

## Adding a new project

Copy `work/oblivion.html`, change the text, drop new images into `assets/img/`, then add a
matching `<a class="work rv">` block to the works list in `index.html`.

Images want two sizes: `slug-900.jpg` for grids and `slug-1800.jpg` for full-bleed and the
lightbox. Keep them under ~400 KB each.

## Credits to keep

- Photography, Beacon and Aura Labs: **Martina Giannetti**
- Photography, Oblivion: **Lea Brugnoli**
- Visuals on Beacon / Oblivion / Latent Spaces: **Francesco Della Toffola — xmtry_studio**
- Video and 3D on Inside: **Vincenzo Gagliardi — The Nent**
- Rite of Spring TouchDesigner component: **Lyell Hintz — @dotsimulate**
