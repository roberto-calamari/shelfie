# QA Checklist — Shelfie v1

## iPhone Safari

- [ ] App loads cleanly on iPhone Safari (14+)
- [ ] Touch targets are large enough (44×44pt minimum on interactive elements)
- [ ] No horizontal overflow / scroll
- [ ] Font sizes are readable without zooming
- [ ] Inputs don't zoom the page (font size ≥ 16px)
- [ ] Keyboard doesn't obscure key UI when search input is focused
- [ ] Star rating taps register correctly (including half-star left-side taps)
- [ ] Date picker opens native iOS date input
- [ ] All animations feel smooth (no jank)

## PWA / Home Screen Install

- [ ] "Add to Home Screen" works from Safari share sheet
- [ ] App opens in standalone mode (no browser chrome)
- [ ] Status bar style matches app shell
- [ ] Safe area insets respected (no content under notch/home indicator)
- [ ] apple-touch-icon appears on home screen
- [ ] App shell background color matches launch screen

## Search

- [ ] Search for common book titles returns correct top result
- [ ] Search by author name returns relevant works
- [ ] Search with ISBN returns the correct edition
- [ ] Partial/misspelled queries still return useful results
- [ ] Very short queries (1-2 chars) don't trigger suggestions
- [ ] Empty search is prevented
- [ ] Search loading state appears (book animation)
- [ ] Error state shows if network fails (airplane mode test)
- [ ] Long query strings don't break layout

## Work Selection

- [ ] Results are visibly ranked (best match badge on #1)
- [ ] Cover thumbnails load for results that have them
- [ ] Missing cover thumbnail shows placeholder gracefully
- [ ] Multi-source badge shows when Google Books is enabled
- [ ] "Not seeing your book?" manual fallback link is visible
- [ ] Back button returns to search with query preserved

## Cover Selection

- [ ] Cover grid loads after selecting a work
- [ ] "Recommended" badge appears on the top cover
- [ ] Low-quality cover warning appears when appropriate
- [ ] Cover images load via proxy (no CORS errors)
- [ ] Upload own cover works (camera + photo library on iOS)
- [ ] Uploaded cover previews correctly before continuing
- [ ] Back button returns to work selection

## Customize Step

- [ ] Live preview renders and updates in real-time
- [ ] All 3 style switches work and preview updates instantly
- [ ] Star rating input works (tap to set, tap same to clear)
- [ ] Half-star increments work
- [ ] Finished date picker works (set, change, remove)
- [ ] Title field is editable and preview reflects changes
- [ ] Author field is editable and preview reflects changes
- [ ] Branding toggle works
- [ ] "Create Story" button is visible and tappable

## Long Title Handling

- [ ] Titles > 40 chars reduce font size
- [ ] Titles > 3 lines truncate gracefully in preview
- [ ] Very long titles don't break layout or overflow

## Export

- [ ] "Creating your story…" loading state appears
- [ ] Generated PNG preview displays after generation
- [ ] PNG is 9:16 aspect ratio (1080×1920)
- [ ] Export quality is sharp (not blurry on retina)
- [ ] "Share to Instagram" button appears on iOS (uses Web Share API)
- [ ] Share sheet opens with PNG file
- [ ] "Save Image" fallback works (triggers download)
- [ ] "Edit Again" returns to customize step
- [ ] "Make Another" resets entire wizard to intro

## Manual Fallback Path

- [ ] "Enter manually" link works from no-results state
- [ ] Title and author fields appear
- [ ] "Upload Cover Image" button works
- [ ] Cannot proceed without uploading a cover
- [ ] Manual entry flows through customize → export correctly

## Style-Specific Checks

### Dreamy
- [ ] Gradient background uses cover palette colors
- [ ] Soft glow overlay is visible
- [ ] Title uses serif font (Lora)
- [ ] Cover has shadow
- [ ] Text contrast is readable

### Retro Paper
- [ ] Cream/paper background
- [ ] Card container with subtle shadow
- [ ] Divider line between cover and title
- [ ] Clean, editorial feel

### Cinematic
- [ ] Dark gradient background
- [ ] Cover appears floating with strong shadow
- [ ] Text positioned at bottom
- [ ] Author text is uppercase with letter spacing
- [ ] Atmospheric overlay is subtle

## Error Handling

- [ ] Network error during search shows friendly message
- [ ] Cover fetch failure shows fallback state
- [ ] Export failure shows "Go Back & Retry" option
- [ ] No raw error messages or stack traces visible to user

## Accessibility

- [ ] All interactive elements have accessible labels
- [ ] Star rating has aria-label per increment
- [ ] Step progress is announced (screen reader test)
- [ ] `prefers-reduced-motion` disables animations
- [ ] Sufficient color contrast on all UI controls
- [ ] Keyboard navigation works for all steps (desktop)

## Performance

- [ ] Search results return within 2–4 seconds
- [ ] Cover grid loads within 5 seconds
- [ ] Export generates within 10 seconds
- [ ] No memory leaks from repeated search cycles
- [ ] Cached searches return faster on repeat queries
