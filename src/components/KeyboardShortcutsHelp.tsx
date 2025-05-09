'use client';

import { useState, useEffect, useRef } from 'react';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useFocusManager } from '@/hooks/useFocusManager';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function KeyboardShortcutsHelp({ isOpen, onClose }: Props) {
  const [shortcuts] = useState(() => [
    { key: '?', description: 'Show/hide keyboard shortcuts', handler: onClose },
    { key: 'h', description: 'Go to home', handler: () => window.location.href = '/' },
    { key: '/', description: 'Focus search', handler: () => document.querySelector<HTMLInputElement>('input[type="search"]')?.focus() },
    { key: 'Escape', description: 'Close dialogs', handler: onClose },
    { key: 'j', description: 'Next item', handler: () => {} },
    { key: 'k', description: 'Previous item', handler: () => {} },
    { key: 'r', description: 'Refresh page data', handler: () => window.location.reload() },
  ]);

  const { getShortcuts } = useKeyboardShortcuts(shortcuts);
  const { containerRef } = useFocusManager<HTMLDivElement>({
    enabled: isOpen,
    trapFocus: true,
    restoreFocus: true,
  });

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="keyboard-shortcuts-title"
    >
      <div
        ref={containerRef}
        className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 id="keyboard-shortcuts-title" className="text-xl font-bold">
            Keyboard Shortcuts
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close keyboard shortcuts dialog"
          >
            ×
          </button>
        </div>
        <div className="grid gap-4">
          {getShortcuts().map((shortcut, index) => (
            <div
              key={index}
              className="flex justify-between items-center border-b border-gray-100 pb-2"
              role="listitem"
            >
              <span className="text-gray-600">{shortcut.description}</span>
              <kbd className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">
                {shortcut.shortcutText}
              </kbd>
            </div>
          ))}
        </div>
        <div className="mt-6 text-center text-sm text-gray-500">
          Press ? to toggle this help menu
        </div>
      </div>
    </div>
  );
}