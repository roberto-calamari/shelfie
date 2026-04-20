'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useWizardStore } from '@/lib/store';
import { StepMotion } from '@/components/ui/StepMotion';
import { BookLoader } from '@/components/ui/BookLoader';
import type { CoverCandidate, ColorPalette } from '@/types';

export function CoverStep() {
  const {
    selectedWork, covers, setCovers, selectCover, setUploadedCover,
    isLoadingCovers, setIsLoadingCovers, setStep, setPalette,
    manualMode, manualTitle, manualAuthor, setManualTitle, setManualAuthor,
    uploadedCover,
  } = useWizardStore();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch covers on mount (unless manual mode)
  useEffect(() => {
    if (manualMode || !selectedWork) return;
    if (covers.length > 0) return; // Already loaded

    const fetchCovers = async () => {
      setIsLoadingCovers(true);
      try {
        const res = await fetch('/api/work/covers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ work: selectedWork }),
        });
        if (res.ok) {
          const data = await res.json();
          setCovers(data.covers);
        }
      } catch {
        // Will show empty state
      } finally {
        setIsLoadingCovers(false);
      }
    };

    fetchCovers();
  }, [selectedWork, manualMode, covers.length, setCovers, setIsLoadingCovers]);

  const handleSelectCover = useCallback(
    async (cover: CoverCandidate) => {
      selectCover(cover);

      // Extract palette from selected cover
      try {
        const paletteRes = await fetch(
          `/api/covers/palette?url=${encodeURIComponent(cover.proxyUrl.startsWith('/') ? `${window.location.origin}${cover.proxyUrl}` : cover.proxyUrl)}`
        );
        if (paletteRes.ok) {
          const palette: ColorPalette = await paletteRes.json();
          setPalette(palette);
        }
      } catch {
        // Palette extraction failed; will use defaults
      }

      setStep('customize');
    },
    [selectCover, setPalette, setStep]
  );

  const handleUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setUploadedCover(dataUrl);
        setStep('customize');
      };
      reader.readAsDataURL(file);
    },
    [setUploadedCover, setStep]
  );

  const isLowQuality = (cover: CoverCandidate) =>
    cover.inspected && cover.width !== undefined && cover.width < 400;

  return (
    <StepMotion>
      <div className="px-6 pt-4 pb-3">
        <button
          className="text-sm text-shell-muted mb-3 flex items-center gap-1"
          onClick={() => setStep(manualMode ? 'search' : 'work')}
        >
          ← Back
        </button>

        {/* Manual mode: title/author fields */}
        {manualMode ? (
          <div className="mb-5">
            <h2 className="text-lg font-bold mb-3">Enter book details</h2>
            <input
              type="text"
              value={manualTitle}
              onChange={(e) => setManualTitle(e.target.value)}
              placeholder="Book title"
              className="w-full px-4 py-3 rounded-xl bg-shell-surface border border-shell-border text-shell-text placeholder:text-shell-muted/50 text-sm outline-none focus:border-shell-accent mb-2"
            />
            <input
              type="text"
              value={manualAuthor}
              onChange={(e) => setManualAuthor(e.target.value)}
              placeholder="Author"
              className="w-full px-4 py-3 rounded-xl bg-shell-surface border border-shell-border text-shell-text placeholder:text-shell-muted/50 text-sm outline-none focus:border-shell-accent"
            />
            <p className="text-xs text-shell-muted mt-3">
              Upload a cover image to continue.
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="mt-3 w-full py-3 rounded-xl border-2 border-dashed border-shell-border text-sm font-medium text-shell-muted active:bg-shell-surface transition-colors"
            >
              Upload Cover Image
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleUpload}
            />
            {uploadedCover && (
              <div className="mt-4 flex flex-col items-center">
                <img src={uploadedCover} alt="Uploaded cover" className="w-24 h-36 rounded-lg object-cover shadow" />
                <button
                  onClick={() => setStep('customize')}
                  className="mt-3 px-6 py-2.5 rounded-full text-white font-semibold text-sm"
                  style={{ backgroundColor: 'var(--shell-accent)' }}
                >
                  Continue
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            <h2 className="text-lg font-bold mb-0.5">Pick a cover</h2>
            <p className="text-xs text-shell-muted mb-4">
              We recommend the best quality option.
            </p>
          </>
        )}
      </div>

      {/* Loading */}
      {isLoadingCovers && <BookLoader message="Finding covers…" />}

      {/* Cover grid */}
      {!manualMode && !isLoadingCovers && covers.length > 0 && (
        <div className="px-6 pb-6">
          <div className="grid grid-cols-3 gap-3 cover-grid">
            {covers.map((cover) => (
              <button
                key={cover.id}
                onClick={() => handleSelectCover(cover)}
                className="cover-option relative rounded-xl overflow-hidden bg-shell-surface aspect-[2/3] shadow-sm border border-shell-border/50"
              >
                <img
                  src={cover.proxyUrl}
                  alt="Book cover"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                {cover.recommended && (
                  <span className="absolute top-1.5 left-1.5 text-[9px] px-1.5 py-0.5 rounded-full bg-shell-accent text-white font-semibold shadow">
                    Recommended
                  </span>
                )}
                {isLowQuality(cover) && (
                  <span className="absolute bottom-1.5 left-1.5 text-[9px] px-1.5 py-0.5 rounded-full bg-yellow-500/90 text-white font-medium">
                    Lower quality
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Low quality warning */}
          {covers[0] && isLowQuality(covers[0]) && (
            <p className="mt-3 text-xs text-shell-muted bg-shell-surface/60 p-3 rounded-xl leading-relaxed">
              This cover isn&apos;t as crisp as we&apos;d like. You can still use it or swap in your own.
            </p>
          )}

          {/* Upload own */}
          <div className="mt-4 text-center">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-sm font-medium underline underline-offset-2"
              style={{ color: 'var(--shell-accent)' }}
            >
              Upload your own cover
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleUpload}
            />
          </div>
        </div>
      )}

      {/* No covers found */}
      {!manualMode && !isLoadingCovers && covers.length === 0 && (
        <div className="px-6 text-center py-8">
          <p className="text-sm text-shell-muted mb-4">
            We couldn&apos;t find any covers for this edition. Upload one to continue.
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-6 py-2.5 rounded-full text-white font-semibold text-sm"
            style={{ backgroundColor: 'var(--shell-accent)' }}
          >
            Upload Cover
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleUpload}
          />
        </div>
      )}
    </StepMotion>
  );
}
