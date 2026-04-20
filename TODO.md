# Future Improvements — Shelfie

## High Priority (v1.1)

- **Better palette extraction** — Use k-means clustering on cover pixels instead of averaging, for more accurate vibrant/muted/dominant colors. Consider integrating node-vibrant.
- **Cover upload dimension check** — Inspect uploaded cover dimensions client-side and warn if too small for good export quality.
- **Service worker** — Add basic offline shell caching so the PWA loads instantly when reopened from home screen, even without network.
- **Font bundling** — Bundle Inter and Lora .ttf files with the npm package instead of requiring manual download. Or fetch from Google Fonts CDN at build time.
- **Rate limiting** — Add basic rate limiting to API routes to prevent abuse on public deployments.

## Medium Priority (v1.2)

- **More story styles** — Add 2-3 additional styles: Minimalist White, Bold Color Block, Editorial Magazine.
- **Custom accent color** — Let users pick a manual accent/highlight color if auto-palette doesn't feel right.
- **Series support** — Optionally show series name/number on the card (e.g., "Book 2 of The Lord of the Rings").
- **Multi-book stories** — Generate a "recent reads" multi-book story card (2–4 books in one image).
- **Cover search enrichment** — Add ISBNdb or Amazon cover sources for better resolution options.
- **Batch mode** — Quick mode for creating multiple stories in a row without returning to intro.

## Lower Priority (v2+)

- **Template marketplace** — Community-contributed story templates/styles.
- **Reading challenge cards** — "I read 12 books this month" style cards.
- **Animated story export** — Subtle Ken Burns or parallax animation for video stories (MP4/WebM).
- **Dark mode for app shell** — Separate from story styles; a true dark mode for the UI itself.
- **Localization** — i18n for date formatting and UI copy.
- **Better accessibility** — Full WCAG 2.1 AA audit and remediation.
- **Open Graph previews** — Shareable links that show the story card as an OG image.

## Technical Debt

- **Satori limitations** — Satori doesn't support all CSS properties (e.g., `text-shadow`, `backdrop-filter`). The export templates are simplified compared to what CSS can do. Consider migrating to Puppeteer-based rendering if richer effects are needed.
- **Cover proxy security** — Currently allowlists hostnames. Should add request signing or token validation for production.
- **Error boundaries** — Add React error boundaries around each wizard step.
- **Stale-while-revalidate** — Implement SWR or React Query for client-side data fetching instead of raw fetch calls.
- **Test coverage** — Add more edge case unit tests (empty authors, very long ISBNs, malformed dates). Increase integration test coverage.
- **Monitoring** — Add basic error logging/reporting for production (Sentry or similar).
