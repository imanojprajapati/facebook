'use client';

import { useRef, useEffect, useState, ReactNode } from 'react';

interface LazyLoadProps {
  children: ReactNode;
  threshold?: number;
  rootMargin?: string;
  placeholder?: ReactNode;
}

export function LazyLoad({
  children,
  threshold = 0.1,
  rootMargin = '50px',
  placeholder
}: LazyLoadProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const currentRef = containerRef.current;
    if (!currentRef || hasIntersected) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            setHasIntersected(true);
            observer.unobserve(currentRef);
          }
        });
      },
      {
        threshold,
        rootMargin
      }
    );

    observer.observe(currentRef);

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [threshold, rootMargin, hasIntersected]);

  return (
    <div ref={containerRef} className="min-h-[20px]">
      {isVisible ? children : placeholder || <div className="animate-pulse bg-gray-200 h-full w-full rounded" />}
    </div>
  );
}