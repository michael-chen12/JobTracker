import { useState, useCallback, useRef } from 'react';
import { useSwipeable } from 'react-swipeable';

interface UseSwipeToRevealOptions {
  /** Pixel threshold to snap open (default: 80) */
  threshold?: number;
  /** Called when the swipe reveals the action zone */
  onReveal?: () => void;
  /** Called when the swipe closes */
  onClose?: () => void;
}

interface UseSwipeToRevealReturn {
  /** Spread on the swipeable element */
  handlers: ReturnType<typeof useSwipeable>;
  /** Whether the action zone is revealed */
  isRevealed: boolean;
  /** Current translateX offset (negative = swiped left) */
  offset: number;
  /** Programmatically close the reveal */
  close: () => void;
}

export function useSwipeToReveal(
  options: UseSwipeToRevealOptions = {}
): UseSwipeToRevealReturn {
  const { threshold = 80, onReveal, onClose } = options;
  const [isRevealed, setIsRevealed] = useState(false);
  const [offset, setOffset] = useState(0);
  const startOffsetRef = useRef(0);

  const close = useCallback(() => {
    setIsRevealed(false);
    setOffset(0);
    onClose?.();
  }, [onClose]);

  const handlers = useSwipeable({
    onSwipeStart: () => {
      startOffsetRef.current = isRevealed ? -threshold : 0;
    },
    onSwiping: (eventData) => {
      if (eventData.dir === 'Left' || eventData.dir === 'Right') {
        // deltaX is positive when swiping left, negative when swiping right
        // We want negative offset for left swipe, so we negate deltaX
        const newOffset = startOffsetRef.current + (-eventData.deltaX);
        // Clamp between -threshold and 0 (no over-swipe)
        const clamped = Math.max(-threshold, Math.min(0, newOffset));
        setOffset(clamped);
      }
    },
    onSwipedLeft: () => {
      if (Math.abs(offset) >= threshold / 2) {
        setOffset(-threshold);
        setIsRevealed(true);
        onReveal?.();
      } else {
        close();
      }
    },
    onSwipedRight: () => {
      close();
    },
    onSwiped: (eventData) => {
      // Snap to nearest state after any swipe ends
      if (eventData.dir !== 'Left' && eventData.dir !== 'Right') {
        if (Math.abs(offset) >= threshold / 2) {
          setOffset(-threshold);
          setIsRevealed(true);
        } else {
          close();
        }
      }
    },
    trackMouse: false,
    trackTouch: true,
    delta: 10,
    preventScrollOnSwipe: false,
  });

  return { handlers, isRevealed, offset, close };
}
