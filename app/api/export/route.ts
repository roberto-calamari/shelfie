// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import satori from 'satori';
import sharp from 'sharp';
import { exportRequestSchema } from '@/lib/validation';
import { getStyleTokens } from '@/lib/styles';
import { formatFinishedDate } from '@/lib/formatting';
import { readFileSync } from 'fs';
import { join } from 'path';

const WIDTH = 1080;
const HEIGHT = 1920;

let sansFont = null;
let sansBoldFont = null;
let serifFont = null;

function loadFonts() {
  if (sansFont) return;
  try {
    const fontDir = join(process.cwd(), 'public', 'fonts');
    sansFont = readFileSync(join(fontDir, 'Inter-Regular.ttf')).buffer;
    sansBoldFont = readFileSync(join(fontDir, 'Inter-Bold.ttf')).buffer;
    serifFont = readFileSync(join(fontDir, 'Lora-Regular.ttf')).buffer;
  } catch {
    console.warn('Font files not found in public/fonts/.');
  }
}

function getFontConfig() {
  loadFonts();
  const fonts = [];
  if (sansFont) fonts.push({ name: 'Inter', data: sansFont, weight: 400, style: 'normal' });
  if (sansBoldFont) fonts.push({ name: 'Inter', data: sansBoldFont, weight: 700, style: 'normal' });
  if (serifFont) fonts.push({ name: 'Lora', data: serifFont, weight: 400, style: 'normal' });
  if (fonts.length === 0) throw new Error('No fonts available');
  return fonts;
}

// Fetch with retry for cover reliability
async function fetchWithRetry(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Shelfie/1.0' },
        signal: AbortSignal.timeout(10000),
      });
      if (res.ok) return res;
      console.warn(`Cover fetch attempt ${i + 1} returned ${res.status}`);
    } catch (e) {
      console.warn(`Cover fetch attempt ${i + 1} failed:`, e.message);
      if (i < retries - 1) await new Promise(r => setTimeout(r, 500));
    }
  }
  return null;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const parsed = exportRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid scene data.' }, { status: 400 });
    }

    const { scene } = parsed.data;
    const tokens = getStyleTokens(scene.style, scene.palette);
    const pad = tokens.safeZonePadding;

    // Compute cover display size
    const maxCoverWidth = WIDTH - pad * 2 - 40;
    const maxCoverHeight = HEIGHT * 0.45;
    const coverAspect = scene.coverWidth / scene.coverHeight;
    let displayWidth = maxCoverWidth;
    let displayHeight = displayWidth / coverAspect;
    if (displayHeight > maxCoverHeight) {
      displayHeight = maxCoverHeight;
      displayWidth = displayHeight * coverAspect;
    }

    const coverW = Math.round(displayWidth);
    const coverH = Math.round(displayHeight);
    const coverX = Math.round((WIDTH - coverW) / 2);
    const coverY = Math.round((HEIGHT - coverH) / 2 - 100);

    // 1. Render text/background via Satori (no cover image)
    const element = renderStoryJSX(scene, tokens, coverW, coverH);
    const svg = await satori(element, {
      width: WIDTH,
      height: HEIGHT,
      fonts: getFontConfig(),
    });

    // 2. Convert SVG to PNG
    let result = await sharp(Buffer.from(svg)).resize(WIDTH, HEIGHT).png().toBuffer();

    // 3. Fetch and composite cover image on top (with retry)
    try {
      let coverUrl = scene.coverUrl;
      if (coverUrl.includes('/api/covers/proxy?url=')) {
        const encoded = coverUrl.split('/api/covers/proxy?url=')[1];
        coverUrl = decodeURIComponent(encoded);
      } else if (!coverUrl.startsWith('http')) {
        coverUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}${coverUrl}`;
      }

      const coverRes = await fetchWithRetry(coverUrl);
      if (coverRes) {
        const coverBuffer = Buffer.from(await coverRes.arrayBuffer());
        const resizedCover = await sharp(coverBuffer)
          .resize(coverW, coverH, { fit: 'cover' })
          .png()
          .toBuffer();

        result = await sharp(result)
          .composite([{ input: resizedCover, left: coverX, top: coverY }])
          .png({ quality: 95 })
          .toBuffer();
      } else {
        console.warn('All cover fetch attempts failed for:', coverUrl);
      }
    } catch (e) {
      console.warn('Could not composite cover:', e);
    }

    return new NextResponse(result, {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': 'inline; filename="shelfie-story.png"',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Something went wrong creating your story.' },
      { status: 500 }
    );
  }
}

function renderStarsText(rating) {
  const full = Math.floor(rating);
  const empty = 5 - full;
  return '\u2605'.repeat(full) + '\u2606'.repeat(empty);
}

function renderStoryJSX(scene, tokens, coverW, coverH) {
  const dateText = scene.finishedDate ? formatFinishedDate(scene.finishedDate) : '';
  const stars = scene.rating !== undefined ? renderStarsText(scene.rating) : '';

  const coverPlaceholder = {
    type: 'div',
    props: { style: { width: coverW, height: coverH, flexShrink: 0 } },
  };

  const titleEl = {
    type: 'div',
    props: {
      style: {
        marginTop: 48, fontSize: scene.title.length > 40 ? 42 : 52,
        fontWeight: 700, color: tokens.textPrimary, textAlign: 'center',
        fontFamily: 'Lora', lineHeight: 1.2, maxWidth: 920,
      },
      children: scene.title,
    },
  };

  const authorEl = {
    type: 'div',
    props: {
      style: {
        marginTop: 16, fontSize: 28, color: tokens.textSecondary,
        textAlign: 'center', fontFamily: 'Inter',
      },
      children: scene.author,
    },
  };

  // Gold stars, always visible
  const starsEl = stars ? {
    type: 'div',
    props: {
      style: {
        marginTop: 32, fontSize: 44, letterSpacing: 6,
        color: '#F5C518',
      },
      children: stars,
    },
  } : null;

  const dateEl = dateText ? {
    type: 'div',
    props: {
      style: {
        marginTop: 24, fontSize: 22, color: tokens.textSecondary,
        textAlign: 'center', fontStyle: 'italic', fontFamily: 'Inter',
      },
      children: dateText,
    },
  } : null;

  // More prominent watermark
  const brandingEl = scene.showBranding ? {
    type: 'div',
    props: {
      style: {
        position: 'absolute', bottom: 44, left: 0, right: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 20, color: 'rgba(255,255,255,0.55)',
        fontFamily: 'Lora', letterSpacing: 1.5,
      },
      children: 'shelfie',
    },
  } : null;

  return {
    type: 'div',
    props: {
      style: {
        width: 1080, height: 1920, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', background: tokens.background,
        padding: tokens.safeZonePadding, fontFamily: 'Inter',
      },
      children: [
        tokens.overlay ? { type: 'div', props: { style: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: tokens.overlay } } } : null,
        coverPlaceholder, titleEl, authorEl, starsEl, dateEl, brandingEl,
      ].filter(Boolean),
    },
  };
}
