# The Blog Toolkit

A personal collection of browser-based tools for producing featured images, banners, and post components across three sites: **Consume the Tangible** (music reviews), **Nine Circles** (metal reviews), and **Cinema Dual** (the *Cinema Dual* film podcast, published on Below Nirvana).

Everything here is a static, self-contained HTML file — no build step, no server, no dependencies beyond what's already in the browser. Each tool runs entirely client-side: upload images, generate, download. Hosted for free via GitHub Pages.

**Live hub:** `https://consumethetangible.github.io/ctt-tools/`

---

## How this is organized

```
ctt-tools/
├── index.html                              ← the hub — start here
│
├── ctt/
│   └── ctt-publisher-toolkit.html          ← Consume the Tangible
│
├── nine-circles/
│   ├── void-engine.js                      ← shared generative engine
│   ├── second-circle-header-creator.html
│   └── nine-circles-ov-grid-creator.html
│
└── cinema-dual/
    └── cinema-dual-filmstrip-header-creator.html
```

`index.html` is the front door: pick a site, its tools appear, click through to whichever one you need (each opens in a new tab). It's just a picker — it doesn't do any image processing itself.

---

## The tools

### Consume the Tangible — `ctt/ctt-publisher-toolkit.html`
One bundled toolkit with four tabs:
- **Rating Generator** — a deliberately absurd, meaningless score for each review (90 adverbs × 90 adjectives, with logic to avoid repeating a word within the last few generations)
- **Metadata Bar** — Label / Released / Format / Reviewed, output as inline-styled HTML for pasting into a Custom HTML block
- **Playlist Banner** — turns a set of album covers into a 900×600 banner
- **Color Palette** — click-to-copy hex codes for the site's design system

This tool outputs raw HTML (not images) for the Rating Generator and Metadata Bar tabs, because **WordPress.com strips `<style>` tags and JavaScript from Custom HTML blocks** — every style has to be inline on the element itself, or it gets silently sanitized away. Keep that in mind if this tool is ever extended.

### Nine Circles — `nine-circles/`
Two banner generators sharing one engine:
- **Second Circle Header Creator** — two album covers with the "void" treatment reaching in from both sides
- **Ov Grid Creator** — the nine-album 3×3 grid version of the same idea

Both load `void-engine.js` from the same folder via `<script src="void-engine.js">` — **that relative path means the three files must always stay together in the same directory.** If the engine file goes missing or moves, both tools fail silently (no tendrils, no error message).

The "void" is generative smoke/tendril artwork built from scratch in canvas: each tendril is a continuously tapering, curling ribbon (not a chain of stamped circles), with a noise-based grain pass and soft blur applied at the end for a photographic, non-digital feel. Tunable parameters (tendril density, length, thickness, branching, wispiness, opacity, blur) are hardcoded to tuned defaults in the two production tools; `void-engine-lab.html` (not part of the deployed hub) is the scratch tool used to dial those values in visually before baking them in.

### Cinema Dual — `cinema-dual/`
- **Filmstrip Header Creator** — two movie posters and one piece of episode art, scaled to a shared height (so nothing gets cropped or squished), assembled into one strip, then fit inside a black 35mm-filmstrip frame with sprocket holes, film grain, and rounded corners. Outputs a fixed 900×500px image.

Unlike the Nine Circles tools, this one doesn't share the void engine — the filmstrip's grain and sprocket rendering is its own separate, simpler system, since the visual language (physical film, not smoke) is unrelated.

---

## Design language

Each site keeps its own color identity, consistent between its panel on the hub and its actual tool pages:

| Site | Accent | Feel |
|---|---|---|
| Consume the Tangible | Terracotta (`#b5623a`) | Warm, editorial |
| Nine Circles | Ice blue (`#107AB8` / `#4EAEE5`) | Black, extreme-metal void |
| Cinema Dual | Monochrome silver/pewter | Black-and-white film |

The hub itself (`index.html`) stays neutral — dark, serif-accented, no single site's colors — since it belongs to none of them individually. Selecting a site tints its panel with that site's palette.

---

## A note on tool UX consistency

All multi-image tools (Ov Grid, Second Circle, Cinema Dual Filmstrip) use the same interaction pattern: a bulk "Choose Files" uploader, a grid of numbered slots that fill in order, drag-and-drop between slots to reorder, click an empty slot to fill just that one, and hover-to-reveal a remove button. If a new tool gets added later that takes multiple images, matching this pattern is preferred over inventing a new one.

---

## Adding a new tool

1. Decide which site it belongs to (or if it's a new site entirely).
2. Build it as a single self-contained `.html` file, following the interaction and visual conventions above.
3. Drop it in that site's folder (create the folder if it doesn't exist yet — GitHub's "Create new file" lets you type a full path like `new-site/tool-name.html` and it creates the folder automatically).
4. Add a link to it in `index.html`, inside that site's `tool-panel` section.
5. If it needs a genuinely new site color, add both the card's `.active` border color and a themed panel block (see the existing CTT/Nine Circles/Cinema Dual blocks in `index.html` for the pattern).

---

## Known limitations

- Cinema Dual's filmstrip output is a fixed 900×500px; the two poster images and the episode art are scaled to a shared height and may leave black margin on the sides or top/bottom depending on their aspect ratios — this is intentional (see `FRAME_MARGIN_SCALE` in that file), not a bug.
- None of these tools validate image content — uploading something that isn't roughly the expected shape (e.g., a landscape photo where a portrait poster is expected) will still render, just not necessarily look great.
- Everything runs entirely in the browser; there's no server-side processing, no image storage, and no analytics.
