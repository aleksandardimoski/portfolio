# Aleksandar Dimoski — Portfolio

Single-page portfolio in a **dark "Polished 3D Creator Minimalism"** style — deep
graphite background, glowing white avatar halo, cool blue-white highlights, cinematic
project cards. No build step, no dependencies — open `index.html` in a browser, or
drag the whole folder into [Netlify Drop](https://app.netlify.com/drop) to put it online.

## Add a video

Copy this block inside `<div class="vgrid">` in `index.html` (replace a
placeholder card):

```html
<article class="vcard reveal" data-video="https://player.vimeo.com/video/VIDEO_ID"
         data-title="Title" data-client="Client name" data-dur="24">
  <div class="vframe">
    <img class="vthumb" src="thumbs/VIDEO_ID.jpg" alt="Short description" loading="lazy" />
    <span class="vdur">0:24</span>
    <span class="vplay" aria-hidden="true"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></span>
  </div>
  <div class="vmeta"><span class="mono tnum">01 · Client</span><h3>Title</h3></div>
</article>
```

- **Thumbnail:** drop `thumbs/VIDEO_ID.jpg`. If the file is missing, the site
  automatically loads Vimeo's own thumbnail for that video.
- **Landscape (16:9) video:** add class `vcard--wide` to the `<article>`.

## Edit your content

| What | Where |
|------|-------|
| Hero avatar | `images/avatar.jpg` (the 3D memoji in the glowing halo) |
| Your photo | `images/aleksandar.jpg` (About section) |
| Results screenshots | Drop images into `images/results/` and add an `<img class="shot">` inside `.shots` in `index.html` |
| Stat counters | In `index.html`, the `.stats-panel` numbers (`data-count` / `data-suffix`) |
| Hero badges | The four `.hbadge` blocks around the halo |
| Brands marquee | The `.marquee-track` spans (each name appears twice for the loop) |
| Email / socials | Search `aleksandar_dimoski@outlook.com`, `instagram.com`, `linkedin.com` |
| Colors / fonts | Top of `css/styles.css` (`:root` — all dark-theme tokens from the style guide) |
