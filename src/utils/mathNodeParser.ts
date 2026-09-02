/**
 * Robust Math & Text Node Parser and Serializer.
 * Separates raw LaTeX strings into structured Text and Math nodes (inlineMath / blockMath)
 * without losing backslashes, braces, or array environments.
 */

export interface TextNode {
  id: string;
  type: 'text';
  text: string;
}

export interface MathNode {
  id: string;
  type: 'inlineMath' | 'blockMath';
  latex: string;
  source?: 'manual' | 'docx';
  conversionStatus?: 'success' | 'warning' | 'failed';
}

export type ContentNode = TextNode | MathNode;

let nextNodeId = 1;
export const generateNodeId = (): string => `node-${Date.now()}-${nextNodeId++}`;

/**
 * Parses raw text containing LaTeX into an array of ContentNodes (Text and Math).
 * Handles $...$, $$...$$, \(...\), \[...\] and \begin{array}...\end{array}.
 */
export function parseContentToNodes(rawText: string = ''): ContentNode[] {
  if (!rawText) return [{ id: generateNodeId(), type: 'text', text: '' }];

  const text = String(rawText);
  const nodes: ContentNode[] = [];

  // Regex pattern matching:
  // 1. $$...$$ (Display math)
  // 2. \[...\] (Display math)
  // 3. $...$ (Inline math, avoiding matching empty $$)
  // 4. \(...\) (Inline math)
  const mathRegex = /(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|(?<!\\)\$(?!\$)[^\$\n]+?(?<!\\)\$|\\\([\s\S]*?\\\))/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = mathRegex.exec(text)) !== null) {
    const matchStart = match.index;
    const matchEnd = mathRegex.lastIndex;
    const matchedStr = match[0];

    // Push preceding text segment if any
    if (matchStart > lastIndex) {
      const precedingText = text.substring(lastIndex, matchStart);
      if (precedingText) {
        nodes.push({
          id: generateNodeId(),
          type: 'text',
          text: precedingText,
        });
      }
    }

    // Determine math type and strip outer delimiters
    let mathType: 'inlineMath' | 'blockMath' = 'inlineMath';
    let cleanLatex = matchedStr;

    if (matchedStr.startsWith('$$') && matchedStr.endsWith('$$')) {
      mathType = 'blockMath';
      cleanLatex = matchedStr.slice(2, -2).trim();
    } else if (matchedStr.startsWith('\\[') && matchedStr.endsWith('\\]')) {
      mathType = 'blockMath';
      cleanLatex = matchedStr.slice(2, -2).trim();
    } else if (matchedStr.startsWith('$') && matchedStr.endsWith('$')) {
      mathType = 'inlineMath';
      cleanLatex = matchedStr.slice(1, -1).trim();
    } else if (matchedStr.startsWith('\\(') && matchedStr.endsWith('\\)')) {
      mathType = 'inlineMath';
      cleanLatex = matchedStr.slice(2, -2).trim();
    }

    nodes.push({
      id: generateNodeId(),
      type: mathType,
      latex: cleanLatex,
      source: 'manual',
      conversionStatus: 'success',
    });

    lastIndex = matchEnd;
  }

  // Push trailing text if any
  if (lastIndex < text.length) {
    const trailingText = text.substring(lastIndex);
    if (trailingText) {
      nodes.push({
        id: generateNodeId(),
        type: 'text',
        text: trailingText,
      });
    }
  }

  // If no nodes extracted, return single empty text node
  if (nodes.length === 0) {
    nodes.push({ id: generateNodeId(), type: 'text', text: '' });
  }

  return nodes;
}

/**
 * Serializes an array of ContentNodes back into a single unified LaTeX string.
 */
export function serializeNodesToLatex(nodes: ContentNode[]): string {
  if (!nodes || nodes.length === 0) return '';

  return nodes
    .map((node) => {
      if (node.type === 'text') {
        return node.text;
      }
      if (node.type === 'blockMath') {
        return `$$\n${node.latex.trim()}\n$$`;
      }
      if (node.type === 'inlineMath') {
        return `$${node.latex.trim()}$`;
      }
      return '';
    })
    .join('');
}
