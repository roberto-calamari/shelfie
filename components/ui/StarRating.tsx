'use client';

import { useCallback } from 'react';

interface StarRatingProps {
  value?: number;
  onChange: (value: number | undefined) => void;
}

export function StarRating({ value, onChange }: StarRatingProps) {
  const handleTap = useCallback(
    (star: number) => {
      if (star === value) {
        onChange(undefined);
      } else {
        onChange(star);
      }
    },
    [value, onChange]
  );

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => handleTap(star)}
          className="w-12 h-12 flex items-center justify-center active:scale-110 transition-transform"
          aria-label={`${star} star${star > 1 ? 's' : ''}`}
        >
          <span
            className="text-3xl select-none"
            style={{ color: value !== undefined && star <= value ? 'var(--shell-accent)' : '#D9D0C4' }}
          >
            ★
          </span>
        </button>
      ))}
      {value !== undefined && (
        <span className="ml-2 text-sm font-semibold text-shell-muted">{value}</span>
      )}
      {value !== undefined && (
        <button
          type="button"
          onClick={() => onChange(undefined)}
          className="ml-1 text-xs text-shell-muted underline underline-offset-2"
        >
          Clear
        </button>
      )}
    </div>
  );
}
