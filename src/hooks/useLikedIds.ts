import { useCallback, useEffect, useState } from 'react';

// A Set<string> of "liked" ids mirrored to localStorage under `storageKey`.
// Shared by the marketplace (deployment likes) and the detail page (version likes).
export function useLikedIds(storageKey: string) {
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());

  // One-time hydration from localStorage after mount (running post-mount avoids
  // an SSR/client markup mismatch). storageKey is constant for the component's
  // lifetime, so this intentionally runs once.
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setLikedIds(new Set(parsed.filter((item): item is string => typeof item === 'string')));
        }
      }
    } catch {
      setLikedIds(new Set());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const persistLikedIds = useCallback(
    (nextLikedIds: Set<string>) => {
      setLikedIds(nextLikedIds);
      window.localStorage.setItem(storageKey, JSON.stringify(Array.from(nextLikedIds)));
    },
    [storageKey],
  );

  return { likedIds, persistLikedIds };
}
