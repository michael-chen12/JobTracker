import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// ─── useMediaQuery ──────────────────────────────────────────────
describe('useMediaQuery', () => {
  let listeners: Map<string, ((e: MediaQueryListEvent) => void)[]>;
  let matchStates: Map<string, boolean>;

  beforeEach(() => {
    listeners = new Map();
    matchStates = new Map();

    vi.stubGlobal('matchMedia', (query: string) => {
      if (!listeners.has(query)) listeners.set(query, []);
      return {
        matches: matchStates.get(query) ?? false,
        media: query,
        addEventListener: (_: string, handler: (e: MediaQueryListEvent) => void) => {
          listeners.get(query)!.push(handler);
        },
        removeEventListener: (_: string, handler: (e: MediaQueryListEvent) => void) => {
          const arr = listeners.get(query)!;
          const idx = arr.indexOf(handler);
          if (idx >= 0) arr.splice(idx, 1);
        },
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      };
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should return false initially when query does not match', async () => {
    matchStates.set('(max-width: 767px)', false);
    const { useMediaQuery } = await import('@/hooks/useMediaQuery');
    const { result } = renderHook(() => useMediaQuery('(max-width: 767px)'));
    expect(result.current).toBe(false);
  });

  it('should return true initially when query matches', async () => {
    matchStates.set('(max-width: 767px)', true);
    const { useMediaQuery } = await import('@/hooks/useMediaQuery');
    const { result } = renderHook(() => useMediaQuery('(max-width: 767px)'));
    expect(result.current).toBe(true);
  });

  it('should update when media query changes', async () => {
    matchStates.set('(max-width: 767px)', false);
    const { useMediaQuery } = await import('@/hooks/useMediaQuery');
    const { result } = renderHook(() => useMediaQuery('(max-width: 767px)'));

    expect(result.current).toBe(false);

    // Simulate resize
    act(() => {
      const handlers = listeners.get('(max-width: 767px)')!;
      handlers.forEach((h) => h({ matches: true } as MediaQueryListEvent));
    });

    expect(result.current).toBe(true);
  });

  it('should clean up listener on unmount', async () => {
    matchStates.set('(max-width: 767px)', false);
    const { useMediaQuery } = await import('@/hooks/useMediaQuery');
    const { unmount } = renderHook(() => useMediaQuery('(max-width: 767px)'));

    const listenerCount = listeners.get('(max-width: 767px)')!.length;
    expect(listenerCount).toBe(1);

    unmount();

    expect(listeners.get('(max-width: 767px)')!.length).toBe(0);
  });
});

// ─── useIsMobile / useIsSmall ───────────────────────────────────
describe('useIsMobile', () => {
  beforeEach(() => {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query === '(max-width: 767px)',
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should return true for mobile breakpoint', async () => {
    const { useIsMobile } = await import('@/hooks/useMediaQuery');
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });
});

describe('useIsSmall', () => {
  beforeEach(() => {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query === '(max-width: 639px)',
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should return true for small breakpoint', async () => {
    const { useIsSmall } = await import('@/hooks/useMediaQuery');
    const { result } = renderHook(() => useIsSmall());
    expect(result.current).toBe(true);
  });
});

// ─── useApplicationDialogStore ──────────────────────────────────
describe('useApplicationDialogStore', () => {
  it('should start with open = false', async () => {
    const { useApplicationDialogStore } = await import(
      '@/stores/application-dialog-store'
    );
    const state = useApplicationDialogStore.getState();
    expect(state.open).toBe(false);
  });

  it('should set open to true', async () => {
    const { useApplicationDialogStore } = await import(
      '@/stores/application-dialog-store'
    );
    act(() => {
      useApplicationDialogStore.getState().setOpen(true);
    });
    expect(useApplicationDialogStore.getState().open).toBe(true);
  });

  it('should set open back to false', async () => {
    const { useApplicationDialogStore } = await import(
      '@/stores/application-dialog-store'
    );
    act(() => {
      useApplicationDialogStore.getState().setOpen(true);
    });
    expect(useApplicationDialogStore.getState().open).toBe(true);
    act(() => {
      useApplicationDialogStore.getState().setOpen(false);
    });
    expect(useApplicationDialogStore.getState().open).toBe(false);
  });
});

// ─── useSwipeToReveal ───────────────────────────────────────────
describe('useSwipeToReveal', () => {
  it('should start closed', async () => {
    const { useSwipeToReveal } = await import('@/hooks/useSwipeToReveal');
    const { result } = renderHook(() => useSwipeToReveal());
    expect(result.current.isRevealed).toBe(false);
    expect(result.current.offset).toBe(0);
  });

  it('should have a close function', async () => {
    const { useSwipeToReveal } = await import('@/hooks/useSwipeToReveal');
    const { result } = renderHook(() => useSwipeToReveal());
    expect(typeof result.current.close).toBe('function');
  });

  it('should have handlers object with touch handlers', async () => {
    const { useSwipeToReveal } = await import('@/hooks/useSwipeToReveal');
    const { result } = renderHook(() => useSwipeToReveal());
    expect(result.current.handlers).toBeDefined();
    // react-swipeable returns handlers with onTouchStart, onTouchMove, etc.
    expect(typeof result.current.handlers).toBe('object');
  });

  it('should accept custom threshold', async () => {
    const { useSwipeToReveal } = await import('@/hooks/useSwipeToReveal');
    const { result } = renderHook(() =>
      useSwipeToReveal({ threshold: 100 })
    );
    expect(result.current.isRevealed).toBe(false);
  });

  it('should call onClose callback when close is called', async () => {
    const onClose = vi.fn();
    const { useSwipeToReveal } = await import('@/hooks/useSwipeToReveal');
    const { result } = renderHook(() =>
      useSwipeToReveal({ onClose })
    );

    act(() => {
      result.current.close();
    });

    expect(onClose).toHaveBeenCalledOnce();
  });
});

// ─── BottomNav active state logic ───────────────────────────────
describe('BottomNav isActive logic', () => {
  // Testing the isActive function logic extracted from the component
  const isActive = (href: string, pathname: string) => {
    if (href === '/dashboard') {
      return pathname === href;
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  it('should match /dashboard exactly', () => {
    expect(isActive('/dashboard', '/dashboard')).toBe(true);
  });

  it('should not match /dashboard for sub-routes', () => {
    expect(isActive('/dashboard', '/dashboard/analytics')).toBe(false);
  });

  it('should match /dashboard/analytics for that exact path', () => {
    expect(isActive('/dashboard/analytics', '/dashboard/analytics')).toBe(true);
  });

  it('should match /dashboard/profile for sub-routes', () => {
    expect(isActive('/dashboard/profile', '/dashboard/profile/settings')).toBe(
      true
    );
  });

  it('should not match unrelated paths', () => {
    expect(isActive('/dashboard/wins', '/dashboard/analytics')).toBe(false);
  });
});

// ─── Button touch variant ───────────────────────────────────────
describe('Button touch variant', () => {
  it('should include h-11 class for 44px height', async () => {
    const { buttonVariants } = await import('@/components/ui/button');
    const classes = buttonVariants({ size: 'touch' });
    expect(classes).toContain('h-11');
    expect(classes).toContain('min-w-[44px]');
  });

  it('should include default h-9 class', async () => {
    const { buttonVariants } = await import('@/components/ui/button');
    const classes = buttonVariants({ size: 'default' });
    expect(classes).toContain('h-9');
  });
});
