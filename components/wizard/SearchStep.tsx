'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useWizardStore } from '@/lib/store';
import { StepMotion } from '@/components/ui/StepMotion';
import { BookLoader } from '@/components/ui/BookLoader';
import type { SearchResponse, WorkSearchResult } from '@/types';

export function SearchStep() {
  const {
    query, setQuery, setResults, selectWork, setStep,
    isSearching, setIsSearching, setManualMode, setManualTitle, setManualAuthor,
  } = useWizardStore();

  const [localQuery, setLocalQuery] = useState(query);
  const [suggestions, setSuggestions] = useState<WorkSearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState('');
  const debounceRef = useRef<NodeJS.Timeout>();
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on mount
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 400);
  }, []);

  // Debounced suggestions
  useEffect(() => {
    if (localQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(localQuery)}`);
        if (res.ok) {
          const data: SearchResponse = await res.json();
          setSuggestions(data.results.slice(0, 6));
        }
      } catch {
        // Silent fail for suggestions
      }
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [localQuery]);

  const doSearch = useCallback(async () => {
    if (!localQuery.trim()) return;
    setIsSearching(true);
    setError('');
    setHasSearched(true);

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(localQuery.trim())}`);
      if (!res.ok) throw new Error('Search failed');

      const data: SearchResponse = await res.json();
      setQuery(localQuery.trim());
      setResults(data.results);
      setSuggestions([]);

      if (data.results.length > 0) {
        setStep('work');
      }
    } catch {
      setError("We couldn't search right now. Please try again.");
    } finally {
      setIsSearching(false);
    }
  }, [localQuery, setQuery, setResults, setStep, setIsSearching]);

  const handleSelect = useCallback(
    (work: WorkSearchResult) => {
      setQuery(localQuery.trim());
      selectWork(work);
      setStep('cover');
    },
    [localQuery, setQuery, selectWork, setStep]
  );

  const handleManual = useCallback(() => {
    setManualMode(true);
    setManualTitle('');
    setManualAuthor('');
    setStep('cover');
  }, [setManualMode, setManualTitle, setManualAuthor, setStep]);

  return (
    <StepMotion>
      <div className="px-6 pt-6 pb-4">
        {/* Back to intro */}
        <button
          className="text-sm text-shell-muted mb-4 flex items-center gap-1"
          onClick={() => useWizardStore.getState().setStep('intro')}
        >
          ← Back
        </button>

        <h2 className="text-xl font-bold mb-1">Find your book</h2>
        <p className="text-sm text-shell-muted mb-5">
          Search by title, author, or ISBN.
        </p>

        {/* Search input */}
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && doSearch()}
            placeholder="e.g. The Secret History"
            className="flex-1 px-4 py-3 rounded-xl bg-shell-surface border border-shell-border text-shell-text placeholder:text-shell-muted/50 text-base outline-none focus:border-shell-accent transition-colors"
            autoComplete="off"
            autoCorrect="off"
            enterKeyHint="search"
          />
          <button
            onClick={doSearch}
            disabled={isSearching || !localQuery.trim()}
            className="px-5 py-3 rounded-xl font-semibold text-white text-sm active:scale-95 transition-all disabled:opacity-40"
            style={{ backgroundColor: 'var(--shell-accent)' }}
          >
            Search
          </button>
        </div>

        {/* Error */}
        {error && (
          <p className="mt-3 text-sm text-red-600/80 bg-red-50 px-3 py-2 rounded-lg">
            {error}
          </p>
        )}
      </div>

      {/* Loading */}
      {isSearching && <BookLoader message="Searching…" />}

      {/* Suggestions */}
      {!isSearching && suggestions.length > 0 && (
        <div className="px-6 pb-4">
          <p className="text-xs text-shell-muted mb-2 font-medium">Suggestions</p>
          <div className="space-y-1">
            {suggestions.map((s) => (
              <button
                key={s.id}
                onClick={() => handleSelect(s)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-shell-surface/80 active:bg-shell-surface transition-colors text-left"
              >
                {s.thumbnail ? (
                  <img
                    src={s.thumbnail}
                    alt=""
                    className="w-8 h-12 rounded object-cover bg-shell-surface flex-shrink-0"
                  />
                ) : (
                  <div className="w-8 h-12 rounded bg-shell-border flex-shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{s.title}</p>
                  <p className="text-xs text-shell-muted truncate">
                    {s.authors.join(', ')}
                    {s.firstPublishYear ? ` · ${s.firstPublishYear}` : ''}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* No results state */}
      {hasSearched && !isSearching && suggestions.length === 0 && (
        <div className="px-6 text-center py-8">
          <p className="text-sm text-shell-muted mb-4">
            No strong matches found. Try refining your search, or enter details manually.
          </p>
          <button
            onClick={handleManual}
            className="text-sm font-medium underline underline-offset-2"
            style={{ color: 'var(--shell-accent)' }}
          >
            Enter manually instead
          </button>
        </div>
      )}
    </StepMotion>
  );
}
