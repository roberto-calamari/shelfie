import type { StoryScene, CoverCandidate, WorkSearchResult, ColorPalette, StoryStyle } from '@/types';
import { formatAuthors, todayISO } from '@/lib/formatting';
import { paletteFromHex } from '@/lib/styles';

/**
 * Build a StoryScene from the current wizard selections.
 * This model drives both the live preview and the server-side export.
 */
export function buildScene(params: {
  work: WorkSearchResult | null;
  cover: CoverCandidate | null;
  uploadedCover?: string | null;
  palette?: ColorPalette;
  style?: StoryStyle;
  rating?: number;
  finishedDate?: string;
  showBranding?: boolean;
  titleOverride?: string;
  authorOverride?: string;
}): StoryScene {
  const {
    work,
    cover,
    uploadedCover,
    palette: existingPalette,
    rating,
    finishedDate = todayISO(),
    showBranding = false,
    titleOverride,
    authorOverride,
  } = params;

  const coverUrl = uploadedCover || cover?.proxyUrl || '/placeholder-cover.png';
  const coverWidth = cover?.width || 600;
  const coverHeight = cover?.height || 900;

  const title = titleOverride || work?.title || 'Untitled';
  const author = authorOverride || (work ? formatAuthors(work.authors) : 'Unknown Author');

  const palette = existingPalette || paletteFromHex('#8B7D6B');

  // Always use dreamy style
  const style: StoryStyle = 'dreamy';

  return {
    coverUrl,
    coverWidth,
    coverHeight,
    title,
    author,
    rating,
    finishedDate,
    style,
    palette,
    showBranding,
  };
}
