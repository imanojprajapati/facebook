'use client';

import { useState, useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';

const KeyboardShortcutsHelp = dynamic(() => import('./KeyboardShortcutsHelp'), {
  ssr: false,
  loading: () => <div>Loading...</div>
});

export default function KeyboardCheatSheet() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

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

  return (
    <Suspense fallback={<div>Loading...</div>}>
      {isOpen && <KeyboardShortcutsHelp isOpen={isOpen} onClose={() => setIsOpen(false)} />}
    </Suspense>
  );
}