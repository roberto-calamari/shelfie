'use client';

import { useEffect, useCallback } from 'react';
import { useWizardStore } from '@/lib/store';
import { StepMotion } from '@/components/ui/StepMotion';
import { BookLoader } from '@/components/ui/BookLoader';
import { StoryPreview } from '@/components/preview/StoryPreview';

export function ExportStep() {
  const {
    getScene, isExporting, setIsExporting,
    exportedImageUrl, setExportedImageUrl,
    setStep, reset,
  } = useWizardStore();

  const scene = getScene();

  // Generate PNG on mount
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleShare = useCallback(async () => {
    if (!exportedImageUrl) return;

    try {
      const res = await fetch(exportedImageUrl);
      const blob = await res.blob();
      const file = new File([blob], 'shelfie-story.png', { type: 'image/png' });

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'My Shelfie',
        });
        return;
      }
    } catch (err) {
      // Share cancelled or failed — fall through to save
      if ((err as Error)?.name === 'AbortError') return;
    }

    // Fallback: trigger download
    handleSave();
  }, [exportedImageUrl]);

  const handleSave = useCallback(() => {
    if (!exportedImageUrl) return;
    const a = document.createElement('a');
    a.href = exportedImageUrl;
    a.download = 'shelfie-story.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [exportedImageUrl]);

  const supportsShare = typeof navigator !== 'undefined' && !!navigator.share;

  return (
    <StepMotion>
      <div className="flex-1 flex flex-col items-center px-6 pt-6">
        {/* Generating state */}
        {isExporting && !exportedImageUrl && (
          <div className="flex-1 flex items-center justify-center">
            <BookLoader message="Creating your story…" />
          </div>
        )}

        {/* Success state */}
        {exportedImageUrl && (
          <>
            <h2 className="text-lg font-bold mb-1">Your story is ready</h2>
            <p className="text-xs text-shell-muted mb-5">
              Optimized for Instagram Stories.
            </p>

            {/* Preview of exported image */}
            <div className="rounded-2xl overflow-hidden shadow-xl mb-6 border border-shell-border/30">
              <img
                src={exportedImageUrl}
                alt="Generated story"
                className="w-[200px] h-auto"
              />
            </div>

            {/* Action buttons */}
            <div className="w-full space-y-2.5 max-w-xs">
              {supportsShare ? (
                <button
                  onClick={handleShare}
                  className="w-full py-3.5 rounded-full text-white font-semibold text-base shadow-lg active:scale-[0.98] transition-transform"
                  style={{ backgroundColor: 'var(--shell-accent)' }}
                >
                  Share to Instagram
                </button>
              ) : (
                <button
                  onClick={handleSave}
                  className="w-full py-3.5 rounded-full text-white font-semibold text-base shadow-lg active:scale-[0.98] transition-transform"
                  style={{ backgroundColor: 'var(--shell-accent)' }}
                >
                  Save Image
                </button>
              )}

              {supportsShare && (
                <button
                  onClick={handleSave}
                  className="w-full py-3 rounded-full border-2 border-shell-border text-shell-text font-medium text-sm active:scale-[0.98] transition-transform"
                >
                  Save Image
                </button>
              )}
            </div>

            {/* Post-export actions */}
            <div className="flex gap-4 mt-8">
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

        {/* Error state */}
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

      {/* Credits footer */}
      <div className="text-center pb-6 pt-4">
        <p className="text-[10px] text-shell-muted/50">
          Book data from Open Library · Cover images from respective publishers
        </p>
      </div>
    </StepMotion>
  );
}
