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
        <DreamyPreview scene={scene} tokens={tokens} />
      </div>
    </div>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          style={{
            fontSize: 44,
            color: i <= rating ? '#F5C518' : 'rgba(255,255,255,0.3)',
            textShadow: '0 2px 8px rgba(0,0,0,0.4), 0 0 2px rgba(0,0,0,0.2)',
            lineHeight: 1,
          }}
        >
          ★
        </span>
      ))}
    </div>
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
        border: '1px solid rgba(255,255,255,0.15)',
        boxShadow: '0 12px 48px rgba(0,0,0,0.35), 0 4px 12px rgba(0,0,0,0.2)',
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
        textShadow: tokens.textPrimary === '#FFFFFF'
          ? '0 1px 6px rgba(0,0,0,0.3)'
          : '0 1px 4px rgba(255,255,255,0.3)',
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
          <Stars rating={scene.rating} />
        </div>
      )}
      {dateText && (
        <p style={{
          marginTop: 24, fontSize: 22, color: tokens.textSecondary,
          fontStyle: 'italic', textAlign: 'center', position: 'relative', zIndex: 1,
        }}>{dateText}</p>
      )}
      {scene.showBranding && (
        <div style={{
          position: 'absolute', bottom: 44, display: 'flex',
          alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          <span style={{
            fontSize: 20, fontFamily: "'Lora', Georgia, serif",
            color: 'rgba(255,255,255,0.55)', letterSpacing: 1.5,
            textShadow: '0 1px 4px rgba(0,0,0,0.25)',
          }}>
            shelfie
          </span>
        </div>
      )}
    </div>
  );
}
