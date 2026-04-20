import { NextRequest, NextResponse } from 'next/server';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { exportRequestSchema } from '@/lib/validation';
import { getStyleTokens } from '@/lib/styles';
import { formatFinishedDate } from '@/lib/formatting';
import type { StoryScene, StyleTokens } from '@/types';
import { readFileSync } from 'fs';
import { join } from 'path';

// Story dimensions: 1080 × 1920 (9:16)
const WIDTH = 1080;
const HEIGHT = 1920;

// Load fonts for Satori (bundled with the app)
let sansFont: ArrayBuffer | null = null;
let sansBoldFont: ArrayBuffer | null = null;
let serifFont: ArrayBuffer | null = null;

function loadFonts() {
  if (sansFont) return;
  try {
    // Use bundled font files from public/fonts/
    const fontDir = join(process.cwd(), 'public', 'fonts');
    sansFont = readFileSync(join(fontDir, 'Inter-Regular.ttf')).buffer as ArrayBuffer;
    sansBoldFont = readFileSync(join(fontDir, 'Inter-Bold.ttf')).buffer as ArrayBuffer;
    serifFont = readFileSync(join(fontDir, 'Lora-Regular.ttf')).buffer as ArrayBuffer;
  } catch {
    // Fonts not found — will use fallbacks
    console.warn('Font files not found in public/fonts/. Using system fallbacks.');
  }
}

function getFontConfig() {
  loadFonts();
  const fonts: Array<{ name: string; data: ArrayBuffer; weight: number; style: string }> = [];

  if (sansFont) fonts.push({ name: 'Inter', data: sansFont, weight: 400, style: 'normal' });
  if (sansBoldFont) fonts.push({ name: 'Inter', data: sansBoldFont, weight: 700, style: 'normal' });
  if (serifFont) fonts.push({ name: 'Lora', data: serifFont, weight: 400, style: 'normal' });

  // Fallback if no fonts loaded
  if (fonts.length === 0) {
    // Create a minimal font buffer (Satori requires at least one font)
    throw new Error('No fonts available for export rendering. Place .ttf files in public/fonts/');
  }

  return fonts;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = exportRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid scene data.', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { scene } = parsed.data;
    const tokens = getStyleTokens(scene.style, scene.palette);

    // Fetch the cover image as base64 for embedding in SVG
    let coverBase64 = '';
    try {
      const coverRes = await fetch(
        scene.coverUrl.startsWith('http')
          ? scene.coverUrl
          : `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}${scene.coverUrl}`
      );
      if (coverRes.ok) {
        const buf = Buffer.from(await coverRes.arrayBuffer());
        const contentType = coverRes.headers.get('content-type') || 'image/jpeg';
        coverBase64 = `data:${contentType};base64,${buf.toString('base64')}`;
      }
    } catch {
      console.warn('Could not fetch cover for export');
    }

    // Generate JSX for Satori
    const element = renderStoryJSX(scene, tokens, coverBase64);

    // Satori: JSX → SVG
    const svg = await satori(element, {
      width: WIDTH,
      height: HEIGHT,
      fonts: getFontConfig(),
    });

    // Resvg: SVG → PNG
    const resvg = new Resvg(svg, {
      fitTo: { mode: 'width', value: WIDTH },
    });
    const pngData = resvg.render();
    const pngBuffer = pngData.asPng();

    return new NextResponse(pngBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': 'inline; filename="shelfie-story.png"',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Something went wrong creating your story. Please try again.' },
      { status: 500 }
    );
  }
}

// ─── Satori JSX Templates ──────────────────────────────────────

function renderStoryJSX(scene: StoryScene, tokens: StyleTokens, coverBase64: string) {
  const dateText = scene.finishedDate ? formatFinishedDate(scene.finishedDate) : '';
  const stars = scene.rating !== undefined ? renderStarsText(scene.rating) : '';
  const pad = tokens.safeZonePadding;

  const titleFontFamily = tokens.titleFont === 'serif' ? 'Lora' : 'Inter';
  const metaFontFamily = 'Inter';

  // Compute cover display dimensions (fit within card area)
  const maxCoverWidth = WIDTH - pad * 2 - 40;
  const maxCoverHeight = HEIGHT * 0.45;
  const coverAspect = scene.coverWidth / scene.coverHeight;
  let displayWidth = maxCoverWidth;
  let displayHeight = displayWidth / coverAspect;
  if (displayHeight > maxCoverHeight) {
    displayHeight = maxCoverHeight;
    displayWidth = displayHeight * coverAspect;
  }

  switch (scene.style) {
    case 'dreamy':
      return renderDreamy(scene, tokens, coverBase64, {
        pad, titleFontFamily, metaFontFamily, dateText, stars,
        displayWidth, displayHeight,
      });
    case 'retro':
      return renderRetro(scene, tokens, coverBase64, {
        pad, titleFontFamily, metaFontFamily, dateText, stars,
        displayWidth, displayHeight,
      });
    case 'cinematic':
      return renderCinematic(scene, tokens, coverBase64, {
        pad, titleFontFamily, metaFontFamily, dateText, stars,
        displayWidth, displayHeight,
      });
  }
}

interface LayoutParams {
  pad: number;
  titleFontFamily: string;
  metaFontFamily: string;
  dateText: string;
  stars: string;
  displayWidth: number;
  displayHeight: number;
}

function renderDreamy(scene: StoryScene, tokens: StyleTokens, coverBase64: string, lp: LayoutParams) {
  return {
    type: 'div',
    props: {
      style: {
        width: WIDTH,
        height: HEIGHT,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: tokens.background,
        padding: lp.pad,
        fontFamily: lp.metaFontFamily,
      },
      children: [
        // Soft overlay glow
        tokens.overlay ? {
          type: 'div',
          props: {
            style: {
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              background: tokens.overlay,
            },
          },
        } : null,
        // Cover with shadow
        coverBase64 ? {
          type: 'img',
          props: {
            src: coverBase64,
            width: lp.displayWidth,
            height: lp.displayHeight,
            style: {
              borderRadius: 16,
              boxShadow: '0 24px 80px rgba(0,0,0,0.25)',
              objectFit: 'cover',
            },
          },
        } : null,
        // Title
        {
          type: 'div',
          props: {
            style: {
              marginTop: 48,
              fontSize: scene.title.length > 40 ? 42 : 52,
              fontWeight: 700,
              color: tokens.textPrimary,
              textAlign: 'center',
              fontFamily: lp.titleFontFamily,
              lineHeight: 1.2,
              maxWidth: WIDTH - lp.pad * 2,
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
            },
            children: scene.title,
          },
        },
        // Author
        {
          type: 'div',
          props: {
            style: {
              marginTop: 16,
              fontSize: 28,
              color: tokens.textSecondary,
              textAlign: 'center',
              fontFamily: lp.metaFontFamily,
            },
            children: scene.author,
          },
        },
        // Stars
        lp.stars ? {
          type: 'div',
          props: {
            style: {
              marginTop: 32,
              fontSize: 36,
              color: tokens.starColor,
              letterSpacing: 4,
            },
            children: lp.stars,
          },
        } : null,
        // Date
        lp.dateText ? {
          type: 'div',
          props: {
            style: {
              marginTop: 24,
              fontSize: 22,
              color: tokens.textSecondary,
              textAlign: 'center',
              fontFamily: lp.metaFontFamily,
              fontStyle: 'italic',
            },
            children: lp.dateText,
          },
        } : null,
        // Branding
        scene.showBranding ? {
          type: 'div',
          props: {
            style: {
              position: 'absolute',
              bottom: 40,
              fontSize: 16,
              color: tokens.textSecondary,
              opacity: 0.5,
            },
            children: 'made with shelfie',
          },
        } : null,
      ].filter(Boolean),
    },
  };
}

function renderRetro(scene: StoryScene, tokens: StyleTokens, coverBase64: string, lp: LayoutParams) {
  return {
    type: 'div',
    props: {
      style: {
        width: WIDTH,
        height: HEIGHT,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: tokens.background,
        padding: lp.pad,
        fontFamily: lp.metaFontFamily,
      },
      children: [
        // Card container
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              background: tokens.cardBg || '#FFFDF5',
              borderRadius: 24,
              padding: 48,
              boxShadow: '0 2px 16px rgba(0,0,0,0.08)',
              border: '1px solid rgba(0,0,0,0.06)',
              maxWidth: WIDTH - lp.pad * 2,
            },
            children: [
              // Cover
              coverBase64 ? {
                type: 'img',
                props: {
                  src: coverBase64,
                  width: lp.displayWidth * 0.85,
                  height: lp.displayHeight * 0.85,
                  style: {
                    borderRadius: 8,
                    border: '1px solid rgba(0,0,0,0.08)',
                    objectFit: 'cover',
                  },
                },
              } : null,
              // Divider
              {
                type: 'div',
                props: {
                  style: {
                    width: 60,
                    height: 2,
                    background: tokens.starColor,
                    marginTop: 40,
                    marginBottom: 32,
                    borderRadius: 1,
                  },
                },
              },
              // Title
              {
                type: 'div',
                props: {
                  style: {
                    fontSize: scene.title.length > 40 ? 38 : 46,
                    fontWeight: 700,
                    color: tokens.textPrimary,
                    textAlign: 'center',
                    fontFamily: lp.titleFontFamily,
                    lineHeight: 1.25,
                  },
                  children: scene.title,
                },
              },
              // Author
              {
                type: 'div',
                props: {
                  style: {
                    marginTop: 14,
                    fontSize: 26,
                    color: tokens.textSecondary,
                    textAlign: 'center',
                    fontFamily: lp.metaFontFamily,
                  },
                  children: scene.author,
                },
              },
              // Stars
              lp.stars ? {
                type: 'div',
                props: {
                  style: {
                    marginTop: 28,
                    fontSize: 32,
                    color: tokens.starColor,
                    letterSpacing: 4,
                  },
                  children: lp.stars,
                },
              } : null,
              // Date
              lp.dateText ? {
                type: 'div',
                props: {
                  style: {
                    marginTop: 20,
                    fontSize: 20,
                    color: tokens.textSecondary,
                    textAlign: 'center',
                    fontStyle: 'italic',
                  },
                  children: lp.dateText,
                },
              } : null,
            ].filter(Boolean),
          },
        },
        // Branding
        scene.showBranding ? {
          type: 'div',
          props: {
            style: {
              position: 'absolute',
              bottom: 40,
              fontSize: 16,
              color: tokens.textSecondary,
              opacity: 0.4,
            },
            children: 'made with shelfie',
          },
        } : null,
      ].filter(Boolean),
    },
  };
}

function renderCinematic(scene: StoryScene, tokens: StyleTokens, coverBase64: string, lp: LayoutParams) {
  return {
    type: 'div',
    props: {
      style: {
        width: WIDTH,
        height: HEIGHT,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-end',
        background: tokens.background,
        padding: lp.pad,
        paddingBottom: 160,
        fontFamily: lp.metaFontFamily,
      },
      children: [
        // Atmospheric overlay
        tokens.overlay ? {
          type: 'div',
          props: {
            style: {
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              background: tokens.overlay,
            },
          },
        } : null,
        // Cover (centered, floating)
        coverBase64 ? {
          type: 'img',
          props: {
            src: coverBase64,
            width: lp.displayWidth * 0.9,
            height: lp.displayHeight * 0.9,
            style: {
              position: 'absolute',
              top: '15%',
              borderRadius: 12,
              boxShadow: '0 32px 100px rgba(0,0,0,0.6)',
              objectFit: 'cover',
            },
          },
        } : null,
        // Title
        {
          type: 'div',
          props: {
            style: {
              fontSize: scene.title.length > 40 ? 40 : 50,
              fontWeight: 700,
              color: tokens.textPrimary,
              textAlign: 'center',
              fontFamily: lp.titleFontFamily,
              lineHeight: 1.2,
              letterSpacing: 1,
            },
            children: scene.title,
          },
        },
        // Author
        {
          type: 'div',
          props: {
            style: {
              marginTop: 16,
              fontSize: 26,
              color: tokens.textSecondary,
              textAlign: 'center',
              fontFamily: lp.metaFontFamily,
              textTransform: 'uppercase',
              letterSpacing: 3,
            },
            children: scene.author,
          },
        },
        // Stars
        lp.stars ? {
          type: 'div',
          props: {
            style: {
              marginTop: 28,
              fontSize: 34,
              color: tokens.starColor,
              letterSpacing: 4,
            },
            children: lp.stars,
          },
        } : null,
        // Date
        lp.dateText ? {
          type: 'div',
          props: {
            style: {
              marginTop: 20,
              fontSize: 20,
              color: tokens.textSecondary,
              textAlign: 'center',
            },
            children: lp.dateText,
          },
        } : null,
        // Branding
        scene.showBranding ? {
          type: 'div',
          props: {
            style: {
              position: 'absolute',
              bottom: 40,
              fontSize: 16,
              color: 'rgba(255,255,255,0.3)',
            },
            children: 'made with shelfie',
          },
        } : null,
      ].filter(Boolean),
    },
  };
}

// ─── Star Rendering ────────────────────────────────────────────

function renderStarsText(rating: number): string {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  let text = '★'.repeat(full);
  if (half) text += '½';
  const empty = 5 - full - (half ? 1 : 0);
  text += '☆'.repeat(empty);
  return text;
}
