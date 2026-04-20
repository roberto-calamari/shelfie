'use client';

import type { StoryScene, StyleTokens } from '@/types';
import { getStyleTokens } from '@/lib/styles';
import { formatFinishedDate } from '@/lib/formatting';

interface StoryPreviewProps {
  scene: StoryScene;
  scale?: number;
}

export function StoryPreview({ scene, scale = 0.2 }: StoryPreviewProps) {
  const tokens = getStyleTokens(scene.style, scene.palette);
  const W = 1080;
  const H = 1920;

  return (
    <div
      className="rounded-2xl overflow-hidden shadow-xl"
      style={{ width: W * scale, height: H * scale, position: 'relative' }}
    >
      <div
        style={{
          width: W, height: H,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          position: 'absolute', top: 0, left: 0,
        }}
      >
        {scene.style === 'dreamy' && <DreamyPreview scene={scene} tokens={tokens} />}
        {scene.style === 'retro' && <RetroPreview scene={scene} tokens={tokens} />}
        {scene.style === 'cinematic' && <CinematicPreview scene={scene} tokens={tokens} />}
      </div>
    </div>
  );
}

function Stars({ rating, color }: { rating: number; color: string }) {
  return (
    <span style={{ color, letterSpacing: 4, fontSize: 36 }}>
      {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
    </span>
  );
}

function CoverImage({ src, width, height, style }: {
  src: string; width: number; height: number; style?: React.CSSProperties;
}) {
  return (
    <img
      src={src}
      alt="Book cover"
      style={{
        width, height, objectFit: 'cover',
        border: '1px solid rgba(255,255,255,0.12)',
        boxShadow: '0 8px 40px rgba(0,0,0,0.3), 0 2px 8px rgba(0,0,0,0.15)',
        ...style,
      }}
    />
  );
}

function computeCoverDims(scene: StoryScene, maxW: number, maxH: number) {
  const aspect = scene.coverWidth / scene.coverHeight;
  let w = maxW;
  let h = w / aspect;
  if (h > maxH) { h = maxH; w = h * aspect; }
  return { w, h };
}

function DreamyPreview({ scene, tokens }: { scene: StoryScene; tokens: StyleTokens }) {
  const { w, h } = computeCoverDims(scene, 880, 820);
  const dateText = scene.finishedDate ? formatFinishedDate(scene.finishedDate) : '';

  return (
    <div style={{
      width: 1080, height: 1920, background: tokens.background,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: tokens.safeZonePadding, position: 'relative', fontFamily: "'DM Sans', sans-serif",
    }}>
      {tokens.overlay && (
        <div style={{ position: 'absolute', inset: 0, background: tokens.overlay }} />
      )}
      <CoverImage src={scene.coverUrl} width={w} height={h}
        style={{ borderRadius: 16, position: 'relative', zIndex: 1 }} />
      <h3 style={{
        marginTop: 48, fontSize: scene.title.length > 40 ? 42 : 52,
        fontWeight: 700, color: tokens.textPrimary, textAlign: 'center',
        fontFamily: "'Lora', Georgia, serif", lineHeight: 1.2,
        position: 'relative', zIndex: 1, maxWidth: 920,
      }}>
        {scene.title}
      </h3>
      <p style={{
        marginTop: 16, fontSize: 28, color: tokens.textSecondary,
        textAlign: 'center', position: 'relative', zIndex: 1,
      }}>
        {scene.author}
      </p>
      {scene.rating !== undefined && (
        <div style={{ marginTop: 32, position: 'relative', zIndex: 1 }}>
          <Stars rating={scene.rating} color={tokens.starColor} />
        </div>
      )}
      {dateText && (
        <p style={{
          marginTop: 24, fontSize: 22, color: tokens.textSecondary,
          fontStyle: 'italic', textAlign: 'center', position: 'relative', zIndex: 1,
        }}>{dateText}</p>
      )}
      {scene.showBranding && (
        <p style={{ position: 'absolute', bottom: 40, fontSize: 16, color: tokens.textSecondary, opacity: 0.5 }}>
          made with shelfie
        </p>
      )}
    </div>
  );
}

function RetroPreview({ scene, tokens }: { scene: StoryScene; tokens: StyleTokens }) {
  const { w, h } = computeCoverDims(scene, 750, 700);
  const dateText = scene.finishedDate ? formatFinishedDate(scene.finishedDate) : '';

  return (
    <div style={{
      width: 1080, height: 1920, background: tokens.background,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: tokens.safeZonePadding, position: 'relative', fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        background: tokens.cardBg, borderRadius: 24, padding: 48,
        boxShadow: '0 2px 16px rgba(0,0,0,0.08)', border: '1px solid rgba(0,0,0,0.06)',
        maxWidth: 936,
      }}>
        <CoverImage src={scene.coverUrl} width={w} height={h}
          style={{ borderRadius: 8, border: '1px solid rgba(0,0,0,0.1)' }} />
        <div style={{
          width: 60, height: 2, background: tokens.starColor,
          marginTop: 40, marginBottom: 32, borderRadius: 1,
        }} />
        <h3 style={{
          fontSize: scene.title.length > 40 ? 38 : 46,
          fontWeight: 700, color: tokens.textPrimary, textAlign: 'center',
          fontFamily: "'Lora', Georgia, serif", lineHeight: 1.25,
        }}>
          {scene.title}
        </h3>
        <p style={{ marginTop: 14, fontSize: 26, color: tokens.textSecondary, textAlign: 'center' }}>
          {scene.author}
        </p>
        {scene.rating !== undefined && (
          <div style={{ marginTop: 28 }}>
            <Stars rating={scene.rating} color={tokens.starColor} />
          </div>
        )}
        {dateText && (
          <p style={{ marginTop: 20, fontSize: 20, color: tokens.textSecondary, fontStyle: 'italic', textAlign: 'center' }}>
            {dateText}
          </p>
        )}
      </div>
      {scene.showBranding && (
        <p style={{ position: 'absolute', bottom: 40, fontSize: 16, color: tokens.textSecondary, opacity: 0.4 }}>
          made with shelfie
        </p>
      )}
    </div>
  );
}

function CinematicPreview({ scene, tokens }: { scene: StoryScene; tokens: StyleTokens }) {
  const { w, h } = computeCoverDims(scene, 800, 750);
  const dateText = scene.finishedDate ? formatFinishedDate(scene.finishedDate) : '';

  const textMain = '#F5F5F5';
  const textSub = 'rgba(255,255,255,0.6)';
  const starCol = '#E8C87A';

  return (
    <div style={{
      width: 1080, height: 1920,
      background: `linear-gradient(180deg, ${scene.palette.darkMuted} 0%, #0A0A0A 60%, #000000 100%)`,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end',
      padding: tokens.safeZonePadding, paddingBottom: 160,
      position: 'relative', fontFamily: "'DM Sans', sans-serif",
    }}>
      {tokens.overlay && (
        <div style={{ position: 'absolute', inset: 0, background: tokens.overlay }} />
      )}
      <CoverImage src={scene.coverUrl} width={w} height={h}
        style={{ position: 'absolute', top: '15%', borderRadius: 12, zIndex: 1 }} />
      <h3 style={{
        fontSize: scene.title.length > 40 ? 40 : 50,
        fontWeight: 700, color: textMain, textAlign: 'center',
        lineHeight: 1.2, letterSpacing: 1, position: 'relative', zIndex: 2,
      }}>
        {scene.title}
      </h3>
      <p style={{
        marginTop: 16, fontSize: 26, color: textSub,
        textAlign: 'center', textTransform: 'uppercase',
        letterSpacing: 3, position: 'relative', zIndex: 2,
      }}>
        {scene.author}
      </p>
      {scene.rating !== undefined && (
        <div style={{ marginTop: 28, position: 'relative', zIndex: 2 }}>
          <Stars rating={scene.rating} color={starCol} />
        </div>
      )}
      {dateText && (
        <p style={{ marginTop: 20, fontSize: 20, color: textSub, textAlign: 'center', position: 'relative', zIndex: 2 }}>
          {dateText}
        </p>
      )}
      {scene.showBranding && (
        <p style={{ position: 'absolute', bottom: 40, fontSize: 16, color: 'rgba(255,255,255,0.3)', zIndex: 2 }}>
          made with shelfie
        </p>
      )}
    </div>
  );
}
