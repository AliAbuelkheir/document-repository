'use client';

import { useEffect, useRef } from 'react';

interface LoadMoreSentinelProps {
  onLoadMore: () => void;
  /** False while a page loads or when there are no more pages. */
  isEnabled: boolean;
}

/** An empty element at the end of a list. It loads the next page when it comes into view. */
export function LoadMoreSentinel({ onLoadMore, isEnabled }: LoadMoreSentinelProps) {
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element || !isEnabled) {
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        onLoadMore();
      }
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [onLoadMore, isEnabled]);

  return <div ref={elementRef} className="h-px" />;
}
