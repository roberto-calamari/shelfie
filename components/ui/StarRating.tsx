'use client';

import { useCallback } from 'react';

interface StarRatingProps {
  value?: number;
  onChange: (value: number | undefined) => void;
}

export function StarRating({ value, onChange }: StarRatingProps) {
  const handleTap = useCallback(
    (starIndex: number, isLeftHalf: boolean) => {
      const newValue = starIndex + (isLeftHalf ? 0.5 : 1);
      // Tap same value again to clear
      if (newValue === value) {
        onChange(undefined);
      } else {
        onChange(newValue);
      }
    },
    [value, onChange]
  );

  return (
    <div className="flex items-center gap-0.5" role="group" aria-label="Star rating">
      {[0, 1, 2, 3, 4].map((i) => {
        const filled = value !== undefined && value >= i + 1;
        const halfFilled = value !== undefined && !filled && value >= i + 0.5;

        return (
          <div key={i} className="relative w-10 h-10 flex items-center justify-center">
            {/* Left half tap target */}
            <button
              type="button"
              className="absolute left-0 top-0 w-1/2 h-full z-10"
              onClick={() => handleTap(i, true)}
              aria-label={`${i + 0.5} stars`}
            />
            {/* Right half tap target */}
            <button
              type="button"
              className="absolute right-0 top-0 w-1/2 h-full z-10"
              onClick={() => handleTap(i, false)}
              aria-label={`${i + 1} stars`}
            />
            {/* Star visual */}
            <span
              className="star-input text-2xl select-none pointer-events-none"
              style={{
                color: filled || halfFilled ? 'var(--shell-accent)' : 'var(--shell-border)',
              }}
            >
              {filled ? '★' : halfFilled ? '⯪' : '☆'}
            </span>
          </div>
        );
      })}
      {value !== undefined && (
        <span className="ml-2 text-sm font-medium text-shell-muted">{value}</span>
      )}
    </div>
  );
}
