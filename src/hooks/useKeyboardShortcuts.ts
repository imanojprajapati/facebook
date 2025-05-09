import { useEffect, useCallback } from 'react';

interface ShortcutHandler {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  handler: () => void;
  description: string;
}

export function useKeyboardShortcuts(shortcuts: ShortcutHandler[]) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in form elements
      if (
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(
          (event.target as HTMLElement).tagName
        )
      ) {
        return;
      }

      for (const shortcut of shortcuts) {
        if (
          event.key.toLowerCase() === shortcut.key.toLowerCase() &&
          !!shortcut.ctrl === event.ctrlKey &&
          !!shortcut.alt === event.altKey &&
          !!shortcut.shift === event.shiftKey
        ) {
          event.preventDefault();
          shortcut.handler();
          break;
        }
      }
    },
    [shortcuts]
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Return all registered shortcuts for documentation
  const getShortcuts = useCallback(() => {
    return shortcuts.map(({ key, ctrl, alt, shift, description }) => ({
      key,
      ctrl,
      alt,
      shift,
      description,
      shortcutText: [
        ctrl && 'Ctrl',
        alt && 'Alt',
        shift && 'Shift',
        key.toUpperCase(),
      ]
        .filter(Boolean)
        .join(' + '),
    }));
  }, [shortcuts]);

  return { getShortcuts };
}