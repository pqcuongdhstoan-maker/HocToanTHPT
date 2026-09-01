import React from 'react';
import { MathJax } from 'better-react-mathjax';

export type MathTextProps = {
  children?: string | null;
  inline?: boolean;
  className?: string;
};

export function MathText({
  children,
  inline = false,
  className = '',
}: MathTextProps) {
  if (!children) return null;

  return (
    <MathJax
      dynamic
      inline={inline}
      className={`math-text ${className}`}
    >
      {children}
    </MathJax>
  );
}

// Backward compatibility adapter for existing components
export const MathContent = ({
  content,
  inline = false,
  className = '',
}: {
  content?: string | null;
  inline?: boolean;
  className?: string;
}) => <MathText inline={inline} className={className}>{content || ''}</MathText>;

export const MathRenderer = MathContent;
