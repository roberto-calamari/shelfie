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
      style={{
        width: W * scale,
        height: H * scale,
        position: 'relative',
      }}
    >
      <div
        style={{
          width: W,
          height: H,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          position: 'absolute',
          top: 0,
          left: 0,
        }}
      >
        {scene.style === 'dreamy' && <DreamyPreview scene={scene} tokens={tokens} />}
        {scene.style === 'retro' && <RetroPreview scene={scene} tokens={tokens} />}
        {scene.style === 'cinematic' && <CinematicPreview scene={scene} tokens={tokens} />}
      </div>
    </div>
  );
}

// ─── Shared helpers ────────────────────────────────────────────

function Stars({ rating, color }: { rating: number; color: string }) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return (
    <span style={{ color, letterSpacing: 4, fontSize: 36 }}>
      {'★'.repeat(full)}
      {half ? '⯪' : ''}
      {'☆'.repeat(empty)}
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
        width,
        height,
        objectFit: 'cover',
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

// ─── Dreamy Style ──────────────────────────────────────────────

function DreamyPreview({ scene, tokens }: { scene: StoryScene; tokens: StyleTokens }) {
  const { w, h } = computeCoverDims(scene, 880, 820);
  const dateText = scene.finishedDate ? formatFinishedDate(scene.finishedDate) : '';

  return (
    <div
      style={{
        width: 1080,
        height: 1920,
        background: tokens.background,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: tokens.safeZonePadding,
        position: 'relative',
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {tokens.overlay && (
        <div style={{
          position: 'absolute', inset: 0,
          background: tokens.overlay,
        }} />
      )}
      <CoverImage
        src={scene.coverUrl}
        width={w}
        height={h}
        style={{ borderRadius: 16, boxShadow: '0 24px 80px rgba(0,0,0,0.25)', position: 'relative', zIndex: 1 }}
      />
      <h3 style={{
        marginTop: 48,
        fontSize: scene.title.length > 40 ? 42 : 52,
        fontWeight: 700,
        color: tokens.textPrimary,
        textAlign: 'center',
        fontFamily: "'Lora', Georgia, serif",
        lineHeight: 1.2,
        position: 'relative',
        zIndex: 1,
        maxWidth: 920,
        overflow: 'hidden',
        display: '-webkit-box',
        WebkitLineClamp: 3,
        WebkitBoxOrient: 'vertical' as const,
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
        }}>
          {dateText}
        </p>
      )}
      {scene.showBranding && (
        <p style={{
          position: 'absolute', bottom: 40, fontSize: 16,
          color: tokens.textSecondary, opacity: 0.5,
        }}>
          made with shelfie
        </p>
      )}
    </div>
  );
}

// ─── Retro Style ───────────────────────────────────────────────

function RetroPreview({ scene, tokens }: { scene: StoryScene; tokens: StyleTokens }) {
  const { w, h } = computeCoverDims(scene, 750, 700);
  const dateText = scene.finishedDate ? formatFinishedDate(scene.finishedDate) : '';

  return (
    <div
      style={{
        width: 1080, height: 1920,
        background: tokens.background,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: tokens.safeZonePadding,
        position: 'relative',
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        background: tokens.cardBg, borderRadius: 24, padding: 48,
        boxShadow: '0 2px 16px rgba(0,0,0,0.08)',
        border: '1px solid rgba(0,0,0,0.06)',
        maxWidth: 936,
      }}>
        <CoverImage
          src={scene.coverUrl}
          width={w}
          height={h}
          style={{ borderRadius: 8, border: '1px solid rgba(0,0,0,0.08)' }}
        />
        <div style={{
          width: 60, height: 2, background: tokens.starColor,
          marginTop: 40, marginBottom: 32, borderRadius: 1,
        }} />
        <h3 style={{
          fontSize: scene.title.length > 40 ? 38 : 46,
          fontWeight: 700, color: tokens.textPrimary,
          textAlign: 'center', fontFamily: "'Lora', Georgia, serif",
          lineHeight: 1.25,
        }}>
          {scene.title}
        </h3>
        <p style={{
          marginTop: 14, fontSize: 26, color: tokens.textSecondary, textAlign: 'center',
        }}>
          {scene.author}
        </p>
        {scene.rating !== undefined && (
          <div style={{ marginTop: 28 }}>
            <Stars rating={scene.rating} color={tokens.starColor} />
          </div>
        )}
        {dateText && (
          <p style={{
            marginTop: 20, fontSize: 20, color: tokens.textSecondary,
            fontStyle: 'italic', textAlign: 'center',
          }}>
            {dateText}
          </p>
        )}
      </div>
      {scene.showBranding && (
        <p style={{
          position: 'absolute', bottom: 40, fontSize: 16,
          color: tokens.textSecondary, opacity: 0.4,
        }}>
          made with shelfie
        </p>
      )}
    </div>
  );
}

// ─── Cinematic Style ───────────────────────────────────────────

function CinematicPreview({ scene, tokens }: { scene: StoryScene; tokens: StyleTokens }) {
  const { w, h } = computeCoverDims(scene, 800, 750);
  const dateText = scene.finishedDate ? formatFinishedDate(scene.finishedDate) : '';

  // Always use light text for cinematic regardless of palette
  const textMain = '#F5F5F5';
  const textSub = 'rgba(255,255,255,0.6)';
  const starCol = tokens.starColor === '#1E1E1E' ? '#E8C87A' : tokens.starColor;

  return (
    <div
      style={{
        width: 1080, height: 1920,
        background: `linear-gradient(180deg, ${scene.palette.darkMuted} 0%, #0A0A0A 60%, #000000 100%)`,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'flex-end',
        padding: tokens.safeZonePadding,
        paddingBottom: 160,
        position: 'relative',
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {tokens.overlay && (
        <div style={{ position: 'absolute', inset: 0, background: tokens.overlay }} />
      )}
      <CoverImage
        src={scene.coverUrl}
        width={w}
        height={h}
        style={{
          position: 'absolute', top: '15%', borderRadius: 12,
          boxShadow: '0 32px 100px rgba(0,0,0,0.6)',
          zIndex: 1,
        }}
      />
      <h3 style={{
        fontSize: scene.title.length > 40 ? 40 : 50,
        fontWeight: 700, color: textMain,
        textAlign: 'center', lineHeight: 1.2,
        letterSpacing: 1, position: 'relative', zIndex: 2,
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
        <p style={{
          marginTop: 20, fontSize: 20, color: textSub,
          textAlign: 'center', position: 'relative', zIndex: 2,
        }}>
          {dateText}
        </p>
      )}
      {scene.showBranding && (
        <p style={{
          position: 'absolute', bottom: 40, fontSize: 16,
          color: 'rgba(255,255,255,0.3)', zIndex: 2,
        }}>
          made with shelfie
        </p>
      )}
    </div>
  );
}
