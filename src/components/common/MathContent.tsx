import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { RefreshCw, AlertCircle } from 'lucide-react';

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

/**
 * Normalizes mathematical delimiters without altering internal LaTeX expressions.
 * Ensures \(...\) and \[...\] work properly with MathJax while preserving $...$ and $$...$$.
 * Does NOT double-wrap or create $$$...$$$.
 */
export function normalizeMathDelimiters(rawText: string): string {
  if (!rawText) return '';

  let text = rawText;

  // Replace standalone \begin{array}...\end{array} or \begin{matrix}...\end{matrix} without $$ with $$
  // Only if not already enclosed in $ or $$
  text = text.replace(
    /(?<!\$)(?:\\begin\{(?:array|matrix|pmatrix|bmatrix|vmatrix|cases|align\*?)\}[\s\S]*?\\end\{(?:array|matrix|pmatrix|bmatrix|vmatrix|cases|align\*?)\})(?!\$)/g,
    (match) => `\n\n$$${match}$$\n\n`
  );

  return text;
}

/**
 * Safely converts light markdown (bold, lists, linebreaks) while PROTECTING all LaTeX math blocks
 * so that newlines or characters like \\, &, _, *, <, > inside math are never modified or replaced with <br/> or <p>.
 */
export function formatContentWithProtectedMath(content: string): string {
  if (!content) return '';

  const normalized = normalizeMathDelimiters(content);

  // Store protected math blocks
  const mathTokens: string[] = [];
  const tokenPrefix = '___MATH_TOKEN_';
  const tokenSuffix = '___';

  // 1. Protect display math $$...$$
  let processed = normalized.replace(/\$\$([\s\S]*?)\$\$/g, (match) => {
    const idx = mathTokens.length;
    mathTokens.push(match);
    return `${tokenPrefix}${idx}${tokenSuffix}`;
  });

  // 2. Protect display math \[...\]
  processed = processed.replace(/\\\[([\s\S]*?)\\\]/g, (match) => {
    const idx = mathTokens.length;
    mathTokens.push(match);
    return `${tokenPrefix}${idx}${tokenSuffix}`;
  });

  // 3. Protect inline math $...$ (avoid matching empty $$)
  processed = processed.replace(/(?<!\\)\$([^\$\n]+?)(?<!\\)\$/g, (match) => {
    const idx = mathTokens.length;
    mathTokens.push(match);
    return `${tokenPrefix}${idx}${tokenSuffix}`;
  });

  // 4. Protect inline math \(...\)
  processed = processed.replace(/\\\(([\s\S]*?)\\\)/g, (match) => {
    const idx = mathTokens.length;
    mathTokens.push(match);
    return `${tokenPrefix}${idx}${tokenSuffix}`;
  });

  // 5. Protect code blocks ```...```
  processed = processed.replace(/```([\s\S]*?)```/g, (_m, code) => {
    const idx = mathTokens.length;
    mathTokens.push(`<pre class="bg-slate-900 text-teal-300 p-3 rounded-lg overflow-x-auto my-2 text-xs font-mono">${code}</pre>`);
    return `${tokenPrefix}${idx}${tokenSuffix}`;
  });

  // 6. Now safely format markdown ONLY on text outside math blocks
  // Headers
  processed = processed.replace(/^### (.*$)/gim, '<h4 class="text-sm font-bold text-teal-900 mt-3 mb-1.5">$1</h4>');
  processed = processed.replace(/^## (.*$)/gim, '<h3 class="text-base font-bold text-teal-950 mt-4 mb-2">$1</h3>');
  processed = processed.replace(/^# (.*$)/gim, '<h2 class="text-lg font-bold text-teal-950 mt-5 mb-2.5">$1</h2>');

  // Bold **text**
  processed = processed.replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-slate-900">$1</strong>');

  // Italic *text*
  processed = processed.replace(/(?<!\*)\*([^\*\n]+?)\*(?!\*)/g, '<em class="italic">$1</em>');

  // Unordered list items - item
  processed = processed.replace(/^\s*[-•]\s+(.*$)/gim, '<li class="ml-4 list-disc text-slate-700 my-0.5">$1</li>');

  // Double newlines to paragraph breaks
  processed = processed.replace(/\n\s*\n/g, '<p class="my-2"></p>');

  // Single newlines to <br />
  processed = processed.replace(/\n/g, '<br />');

  // 7. Restore protected math blocks verbatim
  for (let i = 0; i < mathTokens.length; i++) {
    const token = `${tokenPrefix}${i}${tokenSuffix}`;
    processed = processed.replace(token, () => mathTokens[i]);
  }

  return processed;
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
  inline = false,
  id,
}: MathContentProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasError, setHasError] = useState<boolean>(false);
  const [isRendered, setIsRendered] = useState<boolean>(false);
  const [retryKey, setRetryKey] = useState<number>(0);

  const formattedHtml = useMemo(() => {
    return formatContentWithProtectedMath(content);
  }, [content]);

  const renderMath = useCallback(async () => {
    const container = containerRef.current;
    if (!container) return;

    const MathJax = window.MathJax;

    // If MathJax is not yet loaded, wait for it or setup listener
    if (!MathJax) {
      const handleReady = () => {
        window.removeEventListener('mathjax-ready', handleReady);
        renderMath();
      };
      window.addEventListener('mathjax-ready', handleReady);

      // Timeout fallback to prevent infinite wait
      const timer = setTimeout(() => {
        window.removeEventListener('mathjax-ready', handleReady);
        if (!window.MathJax) {
          console.warn('MathJax failed to load within timeout');
        }
      }, 4000);

      return () => {
        window.removeEventListener('mathjax-ready', handleReady);
        clearTimeout(timer);
      };
    }

    try {
      if (MathJax.startup?.promise) {
        await MathJax.startup.promise;
      }

      if (!containerRef.current) return;

      if (MathJax.typesetClear) {
        MathJax.typesetClear([containerRef.current]);
      }

      if (MathJax.typesetPromise) {
        await MathJax.typesetPromise([containerRef.current]);
      }

      setHasError(false);
      setIsRendered(true);
    } catch (error) {
      console.error('Lỗi render MathJax:', error);
      setHasError(true);
    }
  }, [retryKey]);

  useEffect(() => {
    let cancelled = false;

    renderMath().catch((err) => {
      if (!cancelled) {
        console.error('Lỗi khi typeset MathJax:', err);
      }
    });

    return () => {
      cancelled = true;
      const container = containerRef.current;
      if (container && window.MathJax?.typesetClear) {
        try {
          window.MathJax.typesetClear([container]);
        } catch {
          // Ignore clear errors on unmount
        }
      }
    };
  }, [content, renderMath]);

  const handleRetry = (e: React.MouseEvent) => {
    e.stopPropagation();
    setHasError(false);
    setRetryKey((prev) => prev + 1);
  };

  if (hasError) {
    return (
      <div className={`math-content-error inline-flex items-center gap-2 p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs ${className}`}>
        <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
        <span>Không thể hiển thị công thức toán học</span>
        <button
          onClick={handleRetry}
          className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded font-medium transition"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Tải lại</span>
        </button>
        <span className="font-mono text-[11px] text-slate-500 ml-2">({content})</span>
      </div>
    );
  }

  if (inline) {
    return (
      <span
        id={id}
        ref={containerRef}
        className={`math-content inline ${className}`}
        dangerouslySetInnerHTML={{ __html: formattedHtml }}
      />
    );
  }

  return (
    <div
      id={id}
      ref={containerRef}
      className={`math-content ${className}`}
      dangerouslySetInnerHTML={{ __html: formattedHtml }}
    />
  );
}

// Backward compatibility alias
export const MathRenderer = MathContent;
