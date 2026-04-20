import type { ColorPalette, StoryStyle, StyleTokens } from '@/types';

// ─── Palette Extraction (server-side via Sharp) ────────────────

interface RGBColor {
  r: number;
  g: number;
  b: number;
}

function rgbToHex(c: RGBColor): string {
  return `#${[c.r, c.g, c.b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

function hexToRgb(hex: string): RGBColor {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

function luminance(c: RGBColor): number {
  const [r, g, b] = [c.r, c.g, c.b].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(c1: RGBColor, c2: RGBColor): number {
  const l1 = luminance(c1);
  const l2 = luminance(c2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function saturation(c: RGBColor): number {
  const max = Math.max(c.r, c.g, c.b) / 255;
  const min = Math.min(c.r, c.g, c.b) / 255;
  if (max === 0) return 0;
  return (max - min) / max;
}

function darken(hex: string, amount: number): string {
  const c = hexToRgb(hex);
  return rgbToHex({
    r: Math.round(c.r * (1 - amount)),
    g: Math.round(c.g * (1 - amount)),
    b: Math.round(c.b * (1 - amount)),
  });
}

function lighten(hex: string, amount: number): string {
  const c = hexToRgb(hex);
  return rgbToHex({
    r: Math.round(c.r + (255 - c.r) * amount),
    g: Math.round(c.g + (255 - c.g) * amount),
    b: Math.round(c.b + (255 - c.b) * amount),
  });
}

/**
 * Extract a color palette from image stats (from Sharp).
 * Accepts dominant color + channel stats.
 */
export function extractPalette(
  dominantRgb: RGBColor,
  stats?: { channels: Array<{ mean: number; min: number; max: number }> }
): ColorPalette {
  const dominant = rgbToHex(dominantRgb);
  const domSat = saturation(dominantRgb);
  const domLum = luminance(dominantRgb);

  // Derive palette variants
  const vibrant = domSat > 0.3 ? dominant : lighten(dominant, 0.2);
  const muted = domSat > 0.3 ? darken(dominant, 0.3) : dominant;
  const darkMuted = darken(dominant, 0.6);
  const lightMuted = lighten(dominant, 0.7);

  // Choose text color for best contrast
  const whiteContrast = contrastRatio(dominantRgb, { r: 255, g: 255, b: 255 });
  const blackContrast = contrastRatio(dominantRgb, { r: 30, g: 30, b: 30 });
  const textColor = whiteContrast > blackContrast ? '#FFFFFF' : '#1E1E1E';
  const textSecondary =
    textColor === '#FFFFFF'
      ? 'rgba(255,255,255,0.7)'
      : 'rgba(30,30,30,0.6)';

  return {
    dominant,
    vibrant,
    muted,
    darkMuted,
    lightMuted,
    textColor,
    textSecondary,
  };
}

/**
 * Build a simple palette from a hex color (client-side fallback).
 */
export function paletteFromHex(hex: string): ColorPalette {
  return extractPalette(hexToRgb(hex));
}

// ─── Style Auto-Selection ──────────────────────────────────────

/**
 * Auto-select the best starting style based on the cover palette.
 */
export function autoSelectStyle(palette: ColorPalette): StoryStyle {
  const dom = hexToRgb(palette.dominant);
  const lum = luminance(dom);
  const sat = saturation(dom);

  // Dark covers → cinematic looks great
  if (lum < 0.15) return 'cinematic';

  // Warm/saturated covers → dreamy
  if (sat > 0.4 && lum > 0.2) return 'dreamy';

  // Muted/pastel covers → retro paper
  if (sat < 0.3 && lum > 0.4) return 'retro';

  // Default to dreamy as safest
  return 'dreamy';
}

// ─── Style Tokens ──────────────────────────────────────────────

export function getStyleTokens(style: StoryStyle, palette: ColorPalette): StyleTokens {
  switch (style) {
    case 'dreamy':
      return {
        style: 'dreamy',
        background: `linear-gradient(160deg, ${palette.lightMuted} 0%, ${palette.muted} 50%, ${palette.dominant} 100%)`,
        overlay: `radial-gradient(ellipse at 50% 30%, ${palette.lightMuted}80 0%, transparent 70%)`,
        textPrimary: palette.textColor,
        textSecondary: palette.textSecondary,
        starColor: palette.vibrant,
        titleFont: 'serif',
        metaFont: 'sans-serif',
        safeZonePadding: 80,
      };

    case 'retro':
      return {
        style: 'retro',
        background: '#F5ECD7',
        cardBg: '#FFFDF5',
        textPrimary: '#2C2416',
        textSecondary: '#8B7D6B',
        starColor: '#C4956A',
        titleFont: 'serif',
        metaFont: 'sans-serif',
        safeZonePadding: 72,
      };

    case 'cinematic':
      return {
        style: 'cinematic',
        background: `linear-gradient(180deg, ${palette.darkMuted} 0%, #0A0A0A 60%, #000000 100%)`,
        overlay: `radial-gradient(ellipse at 50% 20%, ${palette.dominant}30 0%, transparent 60%)`,
        textPrimary: '#F5F5F5',
        textSecondary: 'rgba(255,255,255,0.55)',
        starColor: palette.vibrant,
        titleFont: 'sans-serif',
        metaFont: 'sans-serif',
        safeZonePadding: 64,
      };
  }
}
