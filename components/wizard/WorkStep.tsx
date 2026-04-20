'use client';

import { useWizardStore } from '@/lib/store';
import { StepMotion } from '@/components/ui/StepMotion';
import type { WorkSearchResult } from '@/types';

export function WorkStep() {
  const { results, selectWork, setStep, query, setManualMode, setManualTitle, setManualAuthor } = useWizardStore();

  const handleSelect = (work: WorkSearchResult) => {
    selectWork(work);
    setStep('cover');
  };

  const handleManual = () => {
    setManualMode(true);
    setManualTitle('');
    setManualAuthor('');
    setStep('cover');
  };

  return (
    <StepMotion>
      <div className="px-6 pt-4 pb-3">
        <button
          className="text-sm text-shell-muted mb-3 flex items-center gap-1"
          onClick={() => setStep('search')}
        >
          ← Back
        </button>
        <h2 className="text-lg font-bold mb-0.5">Pick the right book</h2>
        <p className="text-xs text-shell-muted">
          Results for &ldquo;{query}&rdquo;
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-6">
        <div className="space-y-2">
          {results.map((work, i) => (
            <button
              key={work.id}
              onClick={() => handleSelect(work)}
              className="w-full flex items-start gap-3.5 p-3 rounded-2xl bg-shell-surface/60 border border-transparent hover:border-shell-border active:bg-shell-surface transition-all text-left"
            >
              {/* Cover thumbnail */}
              {work.thumbnail ? (
                <img
                  src={work.thumbnail}
                  alt=""
                  className="w-12 h-[72px] rounded-lg object-cover bg-shell-border flex-shrink-0 shadow-sm"
                />
              ) : (
                <div className="w-12 h-[72px] rounded-lg bg-shell-border flex-shrink-0 flex items-center justify-center">
                  <span className="text-shell-muted text-xs">?</span>
                </div>
              )}

              {/* Info */}
              <div className="min-w-0 pt-0.5">
                <p className="text-[15px] font-semibold leading-tight line-clamp-2">
                  {work.title}
                </p>
                <p className="text-xs text-shell-muted mt-1 truncate">
                  {work.authors.join(', ') || 'Unknown author'}
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                  {work.firstPublishYear && (
                    <span className="text-[11px] text-shell-muted/70">
                      {work.firstPublishYear}
                    </span>
                  )}
                  {work.sources.length > 1 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-shell-accent/10 text-shell-accent font-medium">
                      Multi-source
                    </span>
                  )}
                </div>
              </div>

              {/* Rank indicator */}
              {i === 0 && (
                <span className="ml-auto flex-shrink-0 text-[10px] px-2 py-1 rounded-full bg-shell-accent/15 text-shell-accent font-semibold">
                  Best match
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Manual fallback */}
        <div className="mt-6 text-center">
          <p className="text-xs text-shell-muted mb-2">
            Not seeing your book?
          </p>
          <button
            onClick={handleManual}
            className="text-sm font-medium underline underline-offset-2"
            style={{ color: 'var(--shell-accent)' }}
          >
            Enter details manually
          </button>
        </div>
      </div>
    </StepMotion>
  );
}
