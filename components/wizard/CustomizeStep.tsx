'use client';

import { useState } from 'react';
import { useWizardStore } from '@/lib/store';
import { StepMotion } from '@/components/ui/StepMotion';
import { StarRating } from '@/components/ui/StarRating';
import { StoryPreview } from '@/components/preview/StoryPreview';

export function CustomizeStep() {
  const store = useWizardStore();
  const scene = store.getScene();
  const [showDatePicker, setShowDatePicker] = useState(!!scene.finishedDate);

  return (
    <StepMotion>
      <div className="px-6 pt-4 pb-2">
        <button
          className="text-sm text-shell-muted mb-3 flex items-center gap-1"
          onClick={() => store.setStep('cover')}
        >
          ← Back
        </button>
      </div>

      {/* Live Preview */}
      <div className="flex justify-center px-4 mb-4">
        <StoryPreview scene={scene} scale={0.185} />
      </div>

      {/* Controls panel */}
      <div className="flex-1 bg-shell-surface/60 rounded-t-3xl border-t border-shell-border px-6 pt-5 pb-8 space-y-5 overflow-y-auto">
        {/* Rating */}
        <div>
          <label className="text-xs font-semibold text-shell-muted uppercase tracking-wider mb-2 block">
            Rating (optional)
          </label>
          <StarRating
            value={scene.rating}
            onChange={(v) => store.setRating(v)}
          />
        </div>

        {/* Finished date */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-shell-muted uppercase tracking-wider">
              Finished Date
            </label>
            <button
              className="text-xs font-medium"
              style={{ color: 'var(--shell-accent)' }}
              onClick={() => {
                if (showDatePicker) {
                  store.setFinishedDate(undefined);
                  setShowDatePicker(false);
                } else {
                  setShowDatePicker(true);
                }
              }}
            >
              {showDatePicker ? 'Hide date' : 'Add date'}
            </button>
          </div>
          {showDatePicker && (
            <input
              type="date"
              value={scene.finishedDate || ''}
              onChange={(e) => store.setFinishedDate(e.target.value || undefined)}
              className="w-full px-4 py-2.5 rounded-xl bg-white border border-shell-border text-sm text-shell-text outline-none focus:border-shell-accent"
            />
          )}
        </div>

        {/* Title edit */}
        <div>
          <label className="text-xs font-semibold text-shell-muted uppercase tracking-wider mb-2 block">
            Title
          </label>
          <input
            type="text"
            value={scene.title}
            onChange={(e) => store.setTitleOverride(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-white border border-shell-border text-sm text-shell-text outline-none focus:border-shell-accent"
          />
        </div>

        {/* Author edit */}
        <div>
          <label className="text-xs font-semibold text-shell-muted uppercase tracking-wider mb-2 block">
            Author
          </label>
          <input
            type="text"
            value={scene.author}
            onChange={(e) => store.setAuthorOverride(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-white border border-shell-border text-sm text-shell-text outline-none focus:border-shell-accent"
          />
        </div>

        {/* Branding toggle */}
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-shell-muted uppercase tracking-wider">
            Shelfie watermark
          </label>
          <button
            onClick={() => store.setShowBranding(!scene.showBranding)}
            className={`w-11 h-6 rounded-full transition-colors relative ${
              scene.showBranding ? 'bg-shell-accent' : 'bg-shell-border'
            }`}
          >
            <span
              className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                scene.showBranding ? 'translate-x-[22px]' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>

        {/* Export CTA */}
        <button
          onClick={() => store.setStep('export')}
          className="w-full py-3.5 rounded-full text-white font-semibold text-base shadow-lg active:scale-[0.98] transition-transform mt-4"
          style={{ backgroundColor: 'var(--shell-accent)' }}
        >
          Create Story
        </button>
      </div>
    </StepMotion>
  );
}
