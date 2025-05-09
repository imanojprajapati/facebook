'use client';

import { useState, useEffect } from 'react';
import { KeyboardShortcutsHelp } from './KeyboardShortcutsHelp';

export function KeyboardCheatSheet() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === '?' &&
        !event.ctrlKey &&
        !event.altKey &&
        !event.metaKey &&
        !['INPUT', 'TEXTAREA', 'SELECT'].includes(
          (event.target as HTMLElement).tagName
        )
      ) {
        event.preventDefault();
        setIsOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return <KeyboardShortcutsHelp isOpen={isOpen} onClose={() => setIsOpen(false)} />;
}