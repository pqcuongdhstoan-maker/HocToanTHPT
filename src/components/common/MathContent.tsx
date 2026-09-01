import React, { useEffect, useRef, useMemo } from 'react';
import katex from 'katex';

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
  content?: string;
  className?: string;
  inline?: boolean;
  id?: string;
};

/**
 * Parses raw text containing LaTeX delimiters ($...$, $$...$$, \(...\), \[...\])
 * and renders them to formatted KaTeX HTML synchronously with zero latency.
 */
export function renderMathToHtml(rawText: string = ''): string {
  if (!rawText) return '';

  let text = String(rawText);

  // 1. Process display math $$...$$
  text = text.replace(/\$\$([\s\S]*?)\$\$/g, (match, formula) => {
    try {
      return `<div class="my-3 text-center overflow-x-auto">${katex.renderToString(formula.trim(), {
        displayMode: true,
        throwOnError: false,
      })}</div>`;
    } catch {
      return match;
    }
  });

  // 2. Process display math \[...\]
  text = text.replace(/\\\[([\s\S]*?)\\\]/g, (match, formula) => {
    try {
      return `<div class="my-3 text-center overflow-x-auto">${katex.renderToString(formula.trim(), {
        displayMode: true,
        throwOnError: false,
      })}</div>`;
    } catch {
      return match;
    }
  });

  // 3. Process inline math $...$
  text = text.replace(/(?<!\\)\$([^\$\n]+?)(?<!\\)\$/g, (match, formula) => {
    try {
      return katex.renderToString(formula.trim(), {
        displayMode: false,
        throwOnError: false,
      });
    } catch {
      return match;
    }
  });

  // 4. Process inline math \(...\)
  text = text.replace(/\\\(([\s\S]*?)\\\)/g, (match, formula) => {
    try {
      return katex.renderToString(formula.trim(), {
        displayMode: false,
        throwOnError: false,
      });
    } catch {
      return match;
    }
  });

  // Convert newlines to breaks only if not inside HTML tags
  const parts = text.split('\n');
  return parts.join('<br />');
}

export function MathContent({ content = '', className = '' }: MathContentProps) {
  const containerRef = useRef<HTMLSpanElement>(null);

  // Instant synchronous KaTeX rendering
  const renderedHtml = useMemo(() => {
    return renderMathToHtml(content);
  }, [content]);

  // Secondary MathJax pass for any specialized LaTeX macros
  useEffect(() => {
    let cancelled = false;

    async function triggerMathJaxPass() {
      const element = containerRef.current;
      if (!element || !window.MathJax?.typesetPromise) return;

      try {
        if (window.MathJax.startup?.promise) {
          await window.MathJax.startup.promise;
        }
        if (cancelled || !containerRef.current) return;
        window.MathJax.typesetClear?.([element]);
        await window.MathJax.typesetPromise?.([element]);
      } catch (err) {
        console.warn('MathJax secondary pass notice:', err);
      }
    }

    triggerMathJaxPass();

    return () => {
      cancelled = true;
    };
  }, [content]);

  return (
    <span
      ref={containerRef}
      className={`math-content inline-block max-w-full ${className}`}
      dangerouslySetInnerHTML={{ __html: renderedHtml }}
    />
  );
}

export const MathRenderer = MathContent;
