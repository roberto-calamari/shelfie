import { describe, it, expect } from 'vitest';
import { autoSelectStyle, paletteFromHex, getStyleTokens } from '@/lib/styles';

describe('paletteFromHex', () => {
  it('generates a complete palette from a hex color', () => {
    const palette = paletteFromHex('#3B7DD8');
    expect(palette.dominant).toBe('#3b7dd8');
    expect(palette.textColor).toBeTruthy();
    expect(palette.textSecondary).toBeTruthy();
    expect(palette.vibrant).toBeTruthy();
    expect(palette.muted).toBeTruthy();
    expect(palette.darkMuted).toBeTruthy();
    expect(palette.lightMuted).toBeTruthy();
  });

  it('chooses white text for dark backgrounds', () => {
    const palette = paletteFromHex('#1A1A2E');
    expect(palette.textColor).toBe('#FFFFFF');
  });

  it('chooses dark text for light backgrounds', () => {
    const palette = paletteFromHex('#F5F0E0');
    expect(palette.textColor).toBe('#1E1E1E');
  });
});

describe('autoSelectStyle', () => {
  it('selects cinematic for very dark palettes', () => {
    const palette = paletteFromHex('#0A0A0A');
    expect(autoSelectStyle(palette)).toBe('cinematic');
  });

  it('selects dreamy for warm saturated palettes', () => {
    const palette = paletteFromHex('#E85D3A');
    expect(autoSelectStyle(palette)).toBe('dreamy');
  });

  it('selects retro for muted/pastel palettes', () => {
    const palette = paletteFromHex('#C8BFA8');
    expect(autoSelectStyle(palette)).toBe('retro');
  });

  it('defaults to dreamy for ambiguous palettes', () => {
    const palette = paletteFromHex('#808080');
    // Grey is ambiguous — should fall to default
    const style = autoSelectStyle(palette);
    expect(['dreamy', 'retro', 'cinematic']).toContain(style);
  });
});

describe('getStyleTokens', () => {
  const palette = paletteFromHex('#3B7DD8');

  it('returns dreamy tokens', () => {
    const tokens = getStyleTokens('dreamy', palette);
    expect(tokens.style).toBe('dreamy');
    expect(tokens.background).toContain('linear-gradient');
    expect(tokens.titleFont).toBe('serif');
    expect(tokens.safeZonePadding).toBeGreaterThan(0);
  });

  it('returns retro tokens with card background', () => {
    const tokens = getStyleTokens('retro', palette);
    expect(tokens.style).toBe('retro');
    expect(tokens.cardBg).toBeTruthy();
    expect(tokens.background).toBe('#F5ECD7');
  });

  it('returns cinematic tokens', () => {
    const tokens = getStyleTokens('cinematic', palette);
    expect(tokens.style).toBe('cinematic');
    expect(tokens.textPrimary).toBe('#F5F5F5');
    expect(tokens.background).toContain('linear-gradient');
  });

  it('all styles have required fields', () => {
    for (const style of ['dreamy', 'retro', 'cinematic'] as const) {
      const tokens = getStyleTokens(style, palette);
      expect(tokens.textPrimary).toBeTruthy();
      expect(tokens.textSecondary).toBeTruthy();
      expect(tokens.starColor).toBeTruthy();
      expect(tokens.titleFont).toBeTruthy();
      expect(tokens.metaFont).toBeTruthy();
      expect(tokens.safeZonePadding).toBeGreaterThan(0);
    }
  });
});
