# Shelfie

**Generate beautiful Instagram Story images for books you just finished reading.**

Shelfie solves one narrow frustration well: current book apps do a poor job generating clean, social-native Instagram Story visuals. Shelfie makes it easy to find a book, pick the best cover, and create a polished 9:16 story card — ready to share.

No account. No ads. No database. Just books and beautiful stories.

## Features

- **Smart book search** — Search by title, author, or ISBN. Results are grouped by work and ranked by relevance, powered by Open Library with optional Google Books enrichment.
- **Cover intelligence** — Covers are ranked by actual resolution (inspected server-side), source confidence, and visual quality. The best cover is always recommended.
- **3 story styles** — Dreamy (soft gradient), Retro Paper (analog/editorial), Dark Cinematic (moody). Palette is auto-extracted from the cover.
- **Deterministic export** — Final PNG is generated server-side via Satori + resvg for crisp, reliable output on iPhone Safari. No fragile DOM-to-image hacks.
- **Mobile-first PWA** — Installable on iPhone home screen. Feels app-like in standalone mode.
- **Share + Save** — Uses the Web Share API on supported devices; falls back to direct download.

## Quick Start

```bash
# Clone
git clone https://github.com/shelfie/shelfie.git
cd shelfie

# Install
npm install

# Set up fonts (required for export)
# Place Inter-Regular.ttf, Inter-Bold.ttf, and Lora-Regular.ttf in public/fonts/
# Download from: https://fonts.google.com/specimen/Inter and https://fonts.google.com/specimen/Lora

# Copy env
cp .env.example .env.local

# Run
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) on your phone or in a mobile-width browser.

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | Yes | Base URL for internal API calls (e.g. `http://localhost:3000`) |
| `GOOGLE_BOOKS_API_KEY` | No | Enables enriched search and additional cover sources |

## Fonts

The export pipeline requires `.ttf` font files in `public/fonts/`:

- `Inter-Regular.ttf`
- `Inter-Bold.ttf`
- `Lora-Regular.ttf`

These are Google Fonts (SIL Open Font License). Download them from [fonts.google.com](https://fonts.google.com) and place them in the directory before building.

## Architecture

```
app/
  page.tsx              # Wizard shell (client-side)
  layout.tsx            # Root layout, PWA metadata
  api/
    search/             # Book search endpoint
    work/covers/        # Cover fetching + ranking
    covers/proxy/       # Image proxy with dimension inspection
    covers/palette/     # Palette extraction via Sharp
    export/             # Satori → resvg PNG generation
components/
  wizard/               # Step components (Intro, Search, Work, Cover, Customize, Export)
  preview/              # Client-side story preview renderer
  ui/                   # Shared UI (StepProgress, StarRating, BookLoader, StepMotion)
lib/
  store.ts              # Zustand wizard state
  cache/                # In-memory LRU cache (search, covers, dimensions)
  covers/ranking.ts     # Cover scoring heuristics
  formatting/           # Date, author, title formatting + cleanup
  scene/                # StoryScene model builder
  styles/               # Palette extraction, style tokens, auto-selection
  validation/           # Zod schemas
providers/
  open-library.ts       # Open Library search + cover fetching
  google-books.ts       # Optional Google Books enrichment
  index.ts              # Provider merge strategy
types/
  index.ts              # All TypeScript interfaces
```

### Export Pipeline

```
StoryScene (typed model)
  ↓ POST /api/export
Satori (JSX → SVG, per-style templates)
  ↓
@resvg/resvg-js (SVG → PNG at 1080×1920)
  ↓
Binary PNG response → Share / Save
```

The same `StoryScene` model drives both the client-side live preview and the server-side export, ensuring WYSIWYG fidelity.

### Search Merge Strategy

When Google Books is configured, results from both providers are:
1. Fetched in parallel
2. Grouped by normalized title + first author
3. Best metadata selected from each source
4. Multi-source confirmation boosts score
5. Sorted by combined relevance score

### Cover Ranking

Covers are scored on:
1. **Resolution** (highest weight) — actual pixel dimensions inspected server-side via Sharp
2. **Source confidence** — Open Library slightly preferred for covers
3. **Aspect ratio sanity** — book-like ratios (1.3–1.7:1) get a bonus
4. **Inspection bonus** — known dimensions are more trustworthy

Near-duplicate covers (same source, similar rounded dimensions) are deduplicated.

## Deploy to Railway

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and init
railway login
railway init

# Set env vars
railway variables set NEXT_PUBLIC_APP_URL=https://your-app.up.railway.app

# Deploy
railway up
```

**Railway config notes:**
- No database required
- Sharp works out of the box on Railway's Docker-based builds
- Set the start command to `npm start` (Railway detects Next.js automatically)

### Dockerfile (optional, if needed)

```dockerfile
FROM node:20-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci --production=false
COPY . .
RUN npm run build
ENV PORT=3000
EXPOSE 3000
CMD ["npm", "start"]
```

## Tests

```bash
# Unit tests
npm test

# Unit tests (watch mode)
npm run test:watch

# E2E tests (requires Playwright browsers)
npx playwright install
npm run test:e2e
```

### Test Coverage

**Unit tests** cover:
- Query normalization and ISBN detection
- Title/author cleaning and noise stripping
- Date formatting with ordinal suffixes
- Author condensation rules
- Cover ranking heuristics and deduplication
- Style auto-selection logic
- Palette generation and contrast computation
- Zod validation schemas

**Integration tests** (skipped by default, need running server) cover:
- Search API with known books and ISBNs
- Cover fetching and ranking endpoint
- Cover proxy with inspect mode
- Export PNG generation
- Input validation and error responses

**E2E tests** cover:
- Complete happy path: intro → search → pick work → pick cover → customize → export
- Manual fallback flow

## Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Framer Motion** — wizard transitions
- **Zustand** — client state
- **Zod** — runtime validation
- **Sharp** — image inspection, palette extraction
- **Satori** — JSX to SVG rendering
- **@resvg/resvg-js** — SVG to PNG conversion
- **lru-cache** — in-memory caching (no database)

## Data Sources

- **[Open Library](https://openlibrary.org)** — Primary. Free, open API for book search and covers.
- **[Google Books API](https://developers.google.com/books)** — Optional enrichment for improved search quality and cover availability.

Both sources are used responsibly with proper User-Agent identification and modest caching.

## License

MIT — see [LICENSE](./LICENSE).

## Credits

Built with data from [Open Library](https://openlibrary.org) (Internet Archive) and optionally [Google Books](https://books.google.com). Cover images belong to their respective publishers.

---

*Shelfie is not affiliated with Goodreads, StoryGraph, Hardcover, Letterboxd, or Instagram.*
