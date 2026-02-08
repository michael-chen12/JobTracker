import { useState, useEffect } from 'react';

/**
 * Reusable media query hook. Returns true when the query matches.
 * SSR-safe: defaults to false on server, hydrates on mount.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(query);
    setMatches(mql.matches);

    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

/** Below Tailwind `md` breakpoint (768px) */
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 767px)');
}

/** Below Tailwind `sm` breakpoint (640px) */
export function useIsSmall(): boolean {
  return useMediaQuery('(max-width: 639px)');
}
