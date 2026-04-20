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

    let coverW = Math.round(displayWidth);
    let coverH = Math.round(displayHeight);
    if (scene.style === 'retro') {
      coverW = Math.round(displayWidth * 0.85);
      coverH = Math.round(displayHeight * 0.85);
    } else if (scene.style === 'cinematic') {
      coverW = Math.round(displayWidth * 0.9);
      coverH = Math.round(displayHeight * 0.9);
    }

    // Compute cover position
    const coverX = Math.round((WIDTH - coverW) / 2);
    let coverY;
    if (scene.style === 'cinematic') {
      coverY = Math.round(HEIGHT * 0.15);
    } else if (scene.style === 'retro') {
      coverY = Math.round((HEIGHT - coverH) / 2 - 140);
    } else {
      coverY = Math.round((HEIGHT - coverH) / 2 - 100);
    }

    // 1. Render text/background via Satori (no cover image)
    const element = renderStoryJSX(scene, tokens, coverW, coverH);
    const svg = await satori(element, {
      width: WIDTH,
      height: HEIGHT,
      fonts: getFontConfig(),
    });

    // 2. Convert SVG to PNG
    let result = await sharp(Buffer.from(svg)).resize(WIDTH, HEIGHT).png().toBuffer();

    // 3. Fetch and composite cover image on top
    try {
      const coverUrl = scene.coverUrl.startsWith('http')
        ? scene.coverUrl
        : `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}${scene.coverUrl}`;
      const coverRes = await fetch(coverUrl);
      if (coverRes.ok) {
        const coverBuffer = Buffer.from(await coverRes.arrayBuffer());
        const resizedCover = await sharp(coverBuffer)
          .resize(coverW, coverH, { fit: 'cover' })
          .png()
          .toBuffer();

        result = await sharp(result)
          .composite([{ input: resizedCover, left: coverX, top: coverY }])
          .png({ quality: 95 })
          .toBuffer();
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
  const half = rating % 1 >= 0.5;
  let text = '\u2605'.repeat(full);
  if (half) text += '\u00BD';
  const empty = 5 - full - (half ? 1 : 0);
  text += '\u2606'.repeat(empty);
  return text;
}

function renderStoryJSX(scene, tokens, coverW, coverH) {
  const dateText = scene.finishedDate ? formatFinishedDate(scene.finishedDate) : '';
  const stars = scene.rating !== undefined ? renderStarsText(scene.rating) : '';
  const titleFontFamily = tokens.titleFont === 'serif' ? 'Lora' : 'Inter';
  const metaFontFamily = 'Inter';

  // Empty placeholder where cover will be composited
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
        fontFamily: titleFontFamily, lineHeight: 1.2, maxWidth: 920,
      },
      children: scene.title,
    },
  };

  const authorEl = {
    type: 'div',
    props: {
      style: {
        marginTop: 16, fontSize: 28, color: tokens.textSecondary,
        textAlign: 'center', fontFamily: metaFontFamily,
        ...(scene.style === 'cinematic' ? { textTransform: 'uppercase', letterSpacing: 3, fontSize: 26 } : {}),
      },
      children: scene.author,
    },
  };

  const starsEl = stars ? {
    type: 'div',
    props: { style: { marginTop: 32, fontSize: 36, color: tokens.starColor, letterSpacing: 4 }, children: stars },
  } : null;

  const dateEl = dateText ? {
    type: 'div',
    props: { style: { marginTop: 24, fontSize: 22, color: tokens.textSecondary, textAlign: 'center', fontStyle: 'italic' }, children: dateText },
  } : null;

  const brandingEl = scene.showBranding ? {
    type: 'div',
    props: { style: { position: 'absolute', bottom: 40, fontSize: 16, color: tokens.textSecondary, opacity: 0.5 }, children: 'made with shelfie' },
  } : null;

  if (scene.style === 'retro') {
    return {
      type: 'div',
      props: {
        style: {
          width: WIDTH, height: HEIGHT, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', background: tokens.background,
          padding: tokens.safeZonePadding, fontFamily: metaFontFamily,
        },
        children: [
          {
            type: 'div',
            props: {
              style: {
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                background: tokens.cardBg || '#FFFDF5', borderRadius: 24, padding: 48,
                border: '1px solid rgba(0,0,0,0.06)', maxWidth: WIDTH - tokens.safeZonePadding * 2,
              },
              children: [
                coverPlaceholder,
                { type: 'div', props: { style: { width: 60, height: 2, background: tokens.starColor, marginTop: 40, marginBottom: 32, borderRadius: 1 } } },
                titleEl, authorEl, starsEl, dateEl,
              ].filter(Boolean),
            },
          },
          brandingEl,
        ].filter(Boolean),
      },
    };
  }

  if (scene.style === 'cinematic') {
    return {
      type: 'div',
      props: {
        style: {
          width: WIDTH, height: HEIGHT, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'flex-end', background: tokens.background,
          padding: tokens.safeZonePadding, paddingBottom: 160, fontFamily: metaFontFamily,
        },
        children: [
          tokens.overlay ? { type: 'div', props: { style: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: tokens.overlay } } } : null,
          titleEl, authorEl, starsEl, dateEl, brandingEl,
        ].filter(Boolean),
      },
    };
  }

  // Dreamy (default)
  return {
    type: 'div',
    props: {
      style: {
        width: WIDTH, height: HEIGHT, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', background: tokens.background,
        padding: tokens.safeZonePadding, fontFamily: metaFontFamily,
      },
      children: [
        tokens.overlay ? { type: 'div', props: { style: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: tokens.overlay } } } : null,
        coverPlaceholder, titleEl, authorEl, starsEl, dateEl, brandingEl,
      ].filter(Boolean),
    },
  };
}
