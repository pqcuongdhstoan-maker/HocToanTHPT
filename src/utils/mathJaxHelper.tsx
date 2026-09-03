import React, { useEffect, useRef } from "react";

declare global {
  interface Window {
    MathJax?: {
      typesetPromise?: (elements?: HTMLElement[]) => Promise<void>;
      typesetClear?: (elements?: HTMLElement[]) => void;
      startup?: {
        defaultPageReady?: () => Promise<void>;
        promise?: Promise<void>;
      };
    };
  }
}

interface MathRendererProps {
  content?: string;
  math?: string;
  className?: string;
  inline?: boolean;
}

export const MathRenderer: React.FC<MathRendererProps> = ({
  content,
  math,
  className = "",
  inline = false,
}) => {
  const containerRef = useRef<HTMLSpanElement | HTMLDivElement>(null);
  const textContent = content !== undefined ? content : (math || "");

  useEffect(() => {
    let isCancelled = false;
    let retries = 0;
    const maxRetries = 10;

    const triggerTypeset = () => {
      if (isCancelled || !containerRef.current) return;

      if (window.MathJax && typeof window.MathJax.typesetPromise === "function") {
        try {
          if (window.MathJax.typesetClear) {
            window.MathJax.typesetClear([containerRef.current]);
          }
          window.MathJax.typesetPromise([containerRef.current]).catch((err) => {
            console.warn("MathJax typeset error:", err);
          });
        } catch (e) {
          console.warn("MathJax invocation exception:", e);
        }
      } else if (retries < maxRetries) {
        retries++;
        setTimeout(triggerTypeset, 250);
      }
    };

    triggerTypeset();

    return () => {
      isCancelled = true;
    };
  }, [textContent]);

  const formattedContent = textContent || "";

  if (inline) {
    return (
      <span
        ref={containerRef as React.RefObject<HTMLSpanElement>}
        className={`tex2jax_process inline-math-container font-sans ${className}`}
      >
        {formattedContent}
      </span>
    );
  }

  return (
    <div
      ref={containerRef as React.RefObject<HTMLDivElement>}
      className={`tex2jax_process block-math-container leading-relaxed break-words font-sans ${className}`}
      style={{ whiteSpace: "pre-line" }}
    >
      {formattedContent}
    </div>
  );
};

export function renderLatexSafely(latex: string): string {
  if (!latex) return "";
  return latex.trim();
}

export async function copyLatexToClipboard(latex: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(latex);
    return true;
  } catch {
    return false;
  }
}
