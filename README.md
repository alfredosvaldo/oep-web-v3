# OEP Web v3

Separate continuation of the OEP interface. The v2 working files were restored byte-for-byte from the snapshot taken before the redesign, including the prior uncommitted changes.

## Local preview

`npm run dev -- --hostname 127.0.0.1 --port 3003`

The local `node_modules` link reuses v2 dependencies. On another computer, run `npm ci`.

## Validation and static export

`npm run check:atlas`

`GHPAGES=1 npm run build`

The export is written to `out/`, with the `/oep-web-v3/` prefix. The public site is deployed separately to GitHub Pages at https://alfredosvaldo.github.io/oep-web-v3/.

The shared atlas index and URL filters connect the map, table, project details, profiles and comparison. The homepage opens with the requested headline and a quiet, silent video backdrop, followed by the full-size map. The video pauses outside the viewport and has a still-image fallback for reduced motion.

## Verified in this version

- Data generation and 30,119 unique IDs; each record matches its detail chunk and exact source investment.
- Totals match for all regions, sectors and companies; accent-insensitive search and URL serialization pass.
- Antofagasta → Energía → table → project panel → region comparison → shared link → profile: 11 projects and US$ 7,161.5 million throughout.
- Project links restore the open panel. Escape closes it and returns focus. The mobile filter sheet supports keyboard focus.
- Static routes respond under /oep-web-v3/; v2 routes remain available under /oep-web-v2/.
- Production export includes 545 pages. v2 was independently rebuilt and all 599 source/data files were verified against its original snapshot.

## Publishing

The source repository is `alfredosvaldo/oep-web-v3`; GitHub Pages serves the `gh-pages` branch at https://alfredosvaldo.github.io/oep-web-v3/.

Run `bash scripts/deploy-gh-pages.sh` from this project to regenerate and publish. The original Excel workbook belongs at `data/raw/SEIA_TOTAL_93_26Q2.xlsx` and stays local. A clone without that workbook can verify the committed generated data with `npm run check:atlas` and export it using `GHPAGES=1 npx next build`.

The background video was created with Gemini and provided by the project owner, who authorized its public release. The hero uses a tighter crop to keep the corner watermark outside the visible frame. Its silent derivative and poster are in `public/media/`. No employment estimates are derived from the SEIA data.
