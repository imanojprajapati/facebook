'use client';

import React, { createContext, useContext, useCallback, useState } from 'react';

interface LiveAnnouncerContextType {
  announce: (message: string, assertive?: boolean) => void;
}

const LiveAnnouncerContext = createContext<LiveAnnouncerContextType | null>(null);

export function LiveAnnouncerProvider({ children }: { children: React.ReactNode }) {
  const [politeMessage, setPoliteMessage] = useState('');
  const [assertiveMessage, setAssertiveMessage] = useState('');

  const announce = useCallback((message: string, assertive = false) => {
    if (assertive) {
      setAssertiveMessage('');
      setTimeout(() => setAssertiveMessage(message), 100);
    } else {
      setPoliteMessage('');
      setTimeout(() => setPoliteMessage(message), 100);
    }
  }, []);

  return (
    <LiveAnnouncerContext.Provider value={{ announce }}>
      {children}
      <div
        aria-live="polite"
        className="sr-only"
        role="status"
        aria-atomic="true"
      >
        {politeMessage}
      </div>
      <div
        aria-live="assertive"
        className="sr-only"
        role="alert"
        aria-atomic="true"
      >
        {assertiveMessage}
      </div>
    </LiveAnnouncerContext.Provider>
  );
}

export function useLiveAnnouncer() {
  const context = useContext(LiveAnnouncerContext);
  if (!context) {
    throw new Error('useLiveAnnouncer must be used within a LiveAnnouncerProvider');
  }
  return context;
}