import { useCallback, useEffect, useRef } from 'react';

interface FocusManagerOptions {
  enabled?: boolean;
  restoreFocus?: boolean;
  trapFocus?: boolean;
}

export function useFocusManager<T extends HTMLElement>({
  enabled = true,
  restoreFocus = true,
  trapFocus = true,
}: FocusManagerOptions = {}) {
  const containerRef = useRef<T>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const getFocusableElements = useCallback(() => {
    if (!containerRef.current || typeof document === 'undefined') return [];
    
    return Array.from(
      containerRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    ).filter(
      (element) =>
        !element.hasAttribute('disabled') &&
        !element.getAttribute('aria-hidden') &&
        element.offsetParent !== null
    );
  }, []);

  useEffect(() => {
    if (!enabled || typeof document === 'undefined') return;

    // Store the previously focused element
    previousFocusRef.current = document.activeElement as HTMLElement;

    // Focus the first focusable element in the container
    if (containerRef.current) {
      const focusableElements = getFocusableElements();
      if (focusableElements.length > 0) {
        focusableElements[0].focus();
      }
    }

    return () => {
      // Restore focus when component unmounts
      if (restoreFocus && previousFocusRef.current && 'focus' in previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    };
  }, [enabled, getFocusableElements, restoreFocus]);

  useEffect(() => {
    if (!enabled || !trapFocus || typeof document === 'undefined') return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement;

      // Shift + Tab
      if (event.shiftKey) {
        if (activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      }
      // Tab
      else {
        if (activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [enabled, trapFocus, getFocusableElements]);

  return {
    containerRef,
  };
}