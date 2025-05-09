import { useCallback, useRef, KeyboardEvent } from 'react';

interface KeyboardNavigationOptions {
  selector: string;
  onSelect?: (element: HTMLElement) => void;
  wrap?: boolean;
  orientation?: 'horizontal' | 'vertical' | 'both';
}

export function useKeyboardNavigation({
  selector,
  onSelect,
  wrap = true,
  orientation = 'both',
}: KeyboardNavigationOptions) {
  const currentIndex = useRef(-1);

  const getNavigableElements = useCallback(
    () => Array.from(document.querySelectorAll(selector)) as HTMLElement[],
    [selector]
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const elements = getNavigableElements();
      if (!elements.length) return;

      let nextIndex = currentIndex.current;
      const isHorizontal = orientation === 'horizontal' || orientation === 'both';
      const isVertical = orientation === 'vertical' || orientation === 'both';

      switch (event.key) {
        case 'ArrowRight':
          if (!isHorizontal) return;
          event.preventDefault();
          nextIndex++;
          break;
        case 'ArrowLeft':
          if (!isHorizontal) return;
          event.preventDefault();
          nextIndex--;
          break;
        case 'ArrowDown':
          if (!isVertical) return;
          event.preventDefault();
          nextIndex++;
          break;
        case 'ArrowUp':
          if (!isVertical) return;
          event.preventDefault();
          nextIndex--;
          break;
        case 'Home':
          event.preventDefault();
          nextIndex = 0;
          break;
        case 'End':
          event.preventDefault();
          nextIndex = elements.length - 1;
          break;
        case 'Enter':
        case ' ':
          event.preventDefault();
          if (currentIndex.current >= 0 && onSelect) {
            onSelect(elements[currentIndex.current]);
          }
          return;
        default:
          return;
      }

      // Handle wrapping
      if (wrap) {
        if (nextIndex < 0) nextIndex = elements.length - 1;
        if (nextIndex >= elements.length) nextIndex = 0;
      } else {
        if (nextIndex < 0) nextIndex = 0;
        if (nextIndex >= elements.length) nextIndex = elements.length - 1;
      }

      // Update focus if index changed
      if (nextIndex !== currentIndex.current && nextIndex >= 0 && nextIndex < elements.length) {
        currentIndex.current = nextIndex;
        elements[nextIndex].focus();
      }
    },
    [selector, onSelect, wrap, orientation, getNavigableElements]
  );

  const resetNavigation = useCallback(() => {
    currentIndex.current = -1;
  }, []);

  return {
    handleKeyDown,
    resetNavigation,
  };
}