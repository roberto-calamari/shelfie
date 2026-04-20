'use client';

import { useCallback } from 'react';

interface StarRatingProps {
  value?: number;
  onChange: (value: number | undefined) => void;
}

export function StarRating({ value, onChange }: StarRatingProps) {
  const handleTap = useCallback(
    (newValue: number) => {
      if (newValue === value) {
        onChange(undefined);
      } else {
        onChange(newValue);
      }
    },
    [value, onChange]
  );

  return (
    <div className="flex flex-col gap-3">
      {/* Star display */}
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = value !== undefined && value >= star;
          const halfFilled = value !== undefined && !filled && value >= star - 0.5;
          return (
            <div key={star} className="relative w-11 h-11 flex items-center justify-center">
              {/* Left half = half star */}
              <button
                type="button"
                className="absolute left-0 top-0 w-1/2 h-full z-10"
                onClick={() => handleTap(star - 0.5)}
                aria-label={`${star - 0.5} stars`}
              />
              {/* Right half = full star */}
              <button
                type="button"
                className="absolute right-0 top-0 w-1/2 h-full z-10"
                onClick={() => handleTap(star)}
                aria-label={`${star} stars`}
              />
              <span
                className="text-3xl select-none pointer-events-none"
                style={{
                  color: filled ? 'var(--shell-accent)' : halfFilled ? 'var(--shell-accent)' : '#D9D0C4',
                }}
              >
                {filled ? '★' : halfFilled ? '★' : '★'}
              </span>
              {/* Half-star overlay: cover right half with bg color */}
              {halfFilled && (
                <span
                  className="absolute right-0 top-0 w-1/2 h-full overflow-hidden pointer-events-none flex items-center justify-end"
                >
                  <span className="text-3xl" style={{ color: '#D9D0C4', marginRight: -1 }}>★</span>
                </span>
              )}
            </div>
          );
        })}
        {value !== undefined && (
          <span className="ml-2 text-sm font-semibold text-shell-muted">{value}</span>
        )}
      </div>

      {/* Quick-select half-star buttons */}
      <div className="flex gap-1.5 flex-wrap">
        {[0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5].map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => handleTap(v)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              value === v
                ? 'bg-shell-accent text-white'
                : 'bg-shell-surface border border-shell-border text-shell-text'
            }`}
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  );
}
