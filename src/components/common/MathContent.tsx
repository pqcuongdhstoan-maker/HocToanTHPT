import React, { useEffect, useRef } from 'react';

declare global {
  interface Window {
    MathJax?: {
      typesetPromise?: (nodes?: (HTMLElement | null)[]) => Promise<void>;
      typesetClear?: (nodes?: (HTMLElement | null)[]) => void;
      startup?: {
        promise?: Promise<void>;
        defaultReady?: () => void;
      };
    };
  }
}

export type MathContentProps = {
  content: string;
  className?: string;
  inline?: boolean;
  id?: string;
};

export function MathContent({
  content,
  className = '',
}: MathContentProps) {
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let cancelled = false;

    async function typesetMath() {
      const element = containerRef.current;
      if (!element) return;

      const MathJax = window.MathJax;

      // If MathJax is not yet loaded on window, wait for mathjax-ready or poll
      if (!MathJax || !MathJax.typesetPromise) {
        const handleReady = () => {
          window.removeEventListener('mathjax-ready', handleReady);
          if (!cancelled) {
            typesetMath();
          }
        };
        window.addEventListener('mathjax-ready', handleReady);

        // Fallback polling for async CDN script
        let checkCount = 0;
        const interval = setInterval(() => {
          checkCount++;
          if (window.MathJax && window.MathJax.typesetPromise) {
            clearInterval(interval);
            if (!cancelled) typesetMath();
          } else if (checkCount > 50) {
            clearInterval(interval);
          }
        }, 80);

        return;
      }

      try {
        if (MathJax.startup?.promise) {
          await MathJax.startup.promise;
        }

        if (cancelled || !containerRef.current) return;

        MathJax.typesetClear?.([element]);
        await MathJax.typesetPromise?.([element]);
      } catch (error) {
        console.error('MathJax render error:', error);
      }
    }

    typesetMath();

    return () => {
      cancelled = true;
      if (containerRef.current && window.MathJax?.typesetClear) {
        try {
          window.MathJax.typesetClear([containerRef.current]);
        } catch {
          // Ignore cleanup errors
        }
      }
    };
  }, [content]);

  return (
    <span
      ref={containerRef}
      className={`math-content ${className}`}
    >
      {content}
    </span>
  );
}

export const MathRenderer = MathContent;
