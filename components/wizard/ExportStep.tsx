'use client';

import { useEffect, useCallback } from 'react';
import { useWizardStore } from '@/lib/store';
import { StepMotion } from '@/components/ui/StepMotion';
import { BookLoader } from '@/components/ui/BookLoader';

export function ExportStep() {
  const {
    getScene, isExporting, setIsExporting,
    exportedImageUrl, setExportedImageUrl,
    setStep, reset,
  } = useWizardStore();

  const scene = getScene();

  useEffect(() => {
    if (exportedImageUrl) return;

    const generate = async () => {
      setIsExporting(true);
      try {
        const res = await fetch('/api/export', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scene }),
        });
        if (!res.ok) throw new Error('Export failed');
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        setExportedImageUrl(url);
      } catch (err) {
        console.error('Export error:', err);
      } finally {
        setIsExporting(false);
      }
    };

    generate();
  }, []);

  const handleShare = useCallback(async () => {
    if (!exportedImageUrl) return;
    try {
      const res = await fetch(exportedImageUrl);
      const blob = await res.blob();
      const file = new File([blob], 'shelfie-story.png', { type: 'image/png' });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'My Shelfie' });
      }
    } catch (err) {
      if ((err as Error)?.name !== 'AbortError') {
        console.error('Share failed:', err);
      }
    }
  }, [exportedImageUrl]);

  const supportsShare = typeof navigator !== 'undefined' && !!navigator.share;

  return (
    <StepMotion>
      <div className="flex-1 flex flex-col items-center px-6 pt-6">
        {isExporting && !exportedImageUrl && (
          <div className="flex-1 flex items-center justify-center">
            <BookLoader message="Creating your story…" />
          </div>
        )}

        {exportedImageUrl && (
          <>
            <h2 className="text-lg font-bold mb-1">Your story is ready</h2>

            <p className="text-xs text-shell-muted mb-4 text-center leading-relaxed">
              Long press the image below to save to your Photos.
            </p>

            {/* Full-width image for easy long-press saving on iOS */}
            <div className="w-full max-w-[280px] mb-5">
              <img
                src={exportedImageUrl}
                alt="Your Shelfie story card"
                className="w-full h-auto rounded-2xl shadow-xl"
              />
            </div>

            <div className="w-full space-y-2.5 max-w-xs">
              {supportsShare && (
                <button
                  onClick={handleShare}
                  className="w-full py-3.5 rounded-full text-white font-semibold text-base shadow-lg active:scale-[0.98] transition-transform"
                  style={{ backgroundColor: 'var(--shell-accent)' }}
                >
                  Share
                </button>
              )}
            </div>

            <p className="text-[11px] text-shell-muted mt-4 text-center leading-relaxed max-w-[260px]">
              Tap <strong>Share</strong> to open your share sheet, then pick Instagram.
              Or long press the image above to save to Photos first.
            </p>

            <div className="flex gap-4 mt-6">
              <button
                onClick={() => {
                  setExportedImageUrl(null);
                  setStep('customize');
                }}
                className="text-sm font-medium underline underline-offset-2 text-shell-muted"
              >
                Edit Again
              </button>
              <button
                onClick={() => reset()}
                className="text-sm font-medium underline underline-offset-2"
                style={{ color: 'var(--shell-accent)' }}
              >
                Make Another
              </button>
            </div>
          </>
        )}

        {!isExporting && !exportedImageUrl && (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <p className="text-sm text-shell-muted mb-4">
              Something went wrong creating your story. Let&apos;s try again.
            </p>
            <button
              onClick={() => {
                setExportedImageUrl(null);
                setStep('customize');
              }}
              className="px-6 py-2.5 rounded-full text-white font-semibold text-sm"
              style={{ backgroundColor: 'var(--shell-accent)' }}
            >
              Go Back &amp; Retry
            </button>
          </div>
        )}
      </div>

      <div className="text-center pb-6 pt-4">
        <p className="text-[10px] text-shell-muted/50">
          Book data from Open Library · Cover images from respective publishers
        </p>
      </div>
    </StepMotion>
  );
}
