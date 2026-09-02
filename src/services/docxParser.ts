import JSZip from 'jszip';
import {
  Question,
  QuestionType,
  Option,
  TrueFalseStatement,
  DocxParseReport,
  DocxParseWarning,
  ContentBlock,
} from '../types';
import { parseContentToNodes, serializeNodesToLatex } from '../utils/mathNodeParser';

/**
 * Normalizes Unicode mathematical symbols to standard LaTeX macros
 */
export function normalizeMathSymbols(raw: string): string {
  if (!raw) return '';
  return raw
    .replace(/≤/g, ' \\le ')
    .replace(/≥/g, ' \\ge ')
    .replace(/≠/g, ' \\ne ')
    .replace(/≈/g, ' \\approx ')
    .replace(/±/g, ' \\pm ')
    .replace(/∓/g, ' \\mp ')
    .replace(/∈/g, ' \\in ')
    .replace(/∉/g, ' \\notin ')
    .replace(/⊂/g, ' \\subset ')
    .replace(/⊃/g, ' \\supset ')
    .replace(/⊆/g, ' \\subseteq ')
    .replace(/⊇/g, ' \\supseteq ')
    .replace(/∪/g, ' \\cup ')
    .replace(/∩/g, ' \\cap ')
    .replace(/∅|Ø/g, ' \\varnothing ')
    .replace(/∞/g, ' \\infty ')
    .replace(/→/g, ' \\rightarrow ')
    .replace(/←/g, ' \\leftarrow ')
    .replace(/↔/g, ' \\leftrightarrow ')
    .replace(/⇒/g, ' \\implies ')
    .replace(/⇔/g, ' \\iff ')
    .replace(/∀/g, ' \\forall ')
    .replace(/∃/g, ' \\exists ')
    .replace(/⊥/g, ' \\perp ')
    .replace(/∥/g, ' \\parallel ')
    .replace(/∠/g, ' \\angle ')
    .replace(/∇/g, ' \\nabla ')
    .replace(/∂/g, ' \\partial ')
    .replace(/·|∙/g, ' \\cdot ')
    .replace(/×/g, ' \\times ')
    .replace(/÷/g, ' \\div ')
    .replace(/°/g, '^{\\circ}')
    .replace(/α/g, '\\alpha ')
    .replace(/β/g, '\\beta ')
    .replace(/γ/g, '\\gamma ')
    .replace(/Δ/g, '\\Delta ')
    .replace(/δ/g, '\\delta ')
    .replace(/ε|ϵ/g, '\\epsilon ')
    .replace(/ζ/g, '\\zeta ')
    .replace(/η/g, '\\eta ')
    .replace(/θ/g, '\\theta ')
    .replace(/ϑ/g, '\\vartheta ')
    .replace(/ι/g, '\\iota ')
    .replace(/κ/g, '\\kappa ')
    .replace(/λ/g, '\\lambda ')
    .replace(/μ/g, '\\mu ')
    .replace(/ν/g, '\\nu ')
    .replace(/ξ/g, '\\xi ')
    .replace(/π/g, '\\pi ')
    .replace(/ρ/g, '\\rho ')
    .replace(/σ/g, '\\sigma ')
    .replace(/Σ/g, '\\Sigma ')
    .replace(/τ/g, '\\tau ')
    .replace(/υ/g, '\\upsilon ')
    .replace(/φ|ϕ/g, '\\varphi ')
    .replace(/Φ/g, '\\Phi ')
    .replace(/χ/g, '\\chi ')
    .replace(/ψ/g, '\\psi ')
    .replace(/Ψ/g, '\\Psi ')
    .replace(/ω/g, '\\omega ')
    .replace(/Ω/g, '\\Omega ')
    .replace(/ℝ/g, '\\mathbb{R}')
    .replace(/ℤ/g, '\\mathbb{Z}')
    .replace(/ℕ/g, '\\mathbb{N}')
    .replace(/ℚ/g, '\\mathbb{Q}')
    .replace(/ℂ/g, '\\mathbb{C}');
}

/**
 * Safely wraps mathematical notations in $...$ for visual MathJax rendering
 * only on pure text segments, preventing double wrapping of existing formulas.
 */
export function ensureMathDelimiters(text: string): string {
  if (!text) return '';

  const nodes = parseContentToNodes(text);
  const processed = nodes.map((node) => {
    if (node.type !== 'text') {
      return node; // Preserve existing math intact!
    }

    let t = node.text;

    // Wrap \mathbb{R}, \mathbb{Z} ...
    t = t.replace(/\\mathbb\{[A-Z]\}/g, (m) => `$${m}$`);

    // Wrap f(x), f'(x), g(x), y=f(x)
    t = t.replace(/\b([fg]\s*\(\s*x\s*\)|[fg]'\s*\(\s*x\s*\)|y\s*=\s*[fg]\s*\(\s*x\s*\))/g, (m) => `$${m}$`);

    // Wrap geometric angle expressions: \widehat{A} = 45^0 or \widehat{A} = 45^\circ
    t = t.replace(/(\\widehat\{[A-Z]\}\s*=\s*\d+[\^0°^{\\circ}]*|\\hat\{[A-Z]\}\s*=\s*\d+[\^0°^{\\circ}]*)/g, (m) => {
      const clean = m.replace(/\^0|\^\{\\circ\}|°/g, '^{\\circ}');
      return `$${clean}$`;
    });

    // Wrap side lengths: AB = 10, AC = 6, BC = ...
    t = t.replace(/\b([A-Z]{2}\s*=\s*\d+)/g, (m) => `$${m}$`);

    // Wrap triangle names: tam giác ABC -> tam giác $ABC$
    t = t.replace(/(tam giác\s+)([A-Z]{3})\b/gi, (_, prefix, tri) => `${prefix}$${tri}$`);

    // Wrap square roots: 30\sqrt{2}, 15\sqrt{3}, \sqrt{2}
    t = t.replace(/(\d*\\sqrt\{[^\}]+\}|\d*\\sqrt\s*\d+)/g, (m) => `$${m}$`);

    // Wrap intervals: (-\infty; 1), (-2; 1), (-2; +\infty), (-\infty; -2), (-1; 0)
    t = t.replace(/\(([+-]?\\infty|-?\d+)\s*;\s*([+-]?\\infty|-?\d+)\)/g, (m) => `$${m}$`);

    // Wrap relations: f(2024) < f(2025)
    t = t.replace(/\b([fg]\s*\(\s*\d+\s*\)\s*[<>=≤≥]\s*[fg]\s*\(\s*\d+\s*\))/g, (m) => `$${m}$`);

    // Wrap simple variable equations: x = 2, y = 3
    t = t.replace(/\b([xy]\s*=\s*-?\d+)\b/g, (m) => `$${m}$`);

    return { ...node, text: t };
  });

  return serializeNodesToLatex(processed);
}

/**
 * Robust extraction of MCQ Options (A, B, C, D) supporting asterisk *A., *B., *C., *D.
 */
export function extractMcqOptions(fullText: string): {
  isMcq: boolean;
  stem: string;
  options: Option[];
  correctAnswer?: string;
} {
  const optionHeaderRegex = /(?:^|\n|\s{1,})(\*?\s*[ABCD])[\s.:\)\-–]/g;
  const matches = Array.from(fullText.matchAll(optionHeaderRegex));

  const uniqueLetters = Array.from(new Set(matches.map((m) => m[1].replace('*', '').trim().toUpperCase())));
  if (uniqueLetters.length < 2) {
    return { isMcq: false, stem: fullText, options: [] };
  }

  const firstMatchIndex = matches[0].index !== undefined ? matches[0].index : 0;
  const stem = fullText.substring(0, firstMatchIndex).trim();

  let correctAnswer = 'A';
  const optionsMap: Record<string, string> = { A: '', B: '', C: '', D: '' };

  for (let i = 0; i < matches.length; i++) {
    const curMatch = matches[i];
    const rawTag = curMatch[1].trim();
    const isStar = rawTag.startsWith('*');
    const letter = rawTag.replace('*', '').trim().toUpperCase();

    if (isStar) {
      correctAnswer = letter;
    }

    const startPos = (curMatch.index || 0) + curMatch[0].length;
    const endPos = i < matches.length - 1 ? (matches[i + 1].index || fullText.length) : fullText.length;

    let content = fullText.substring(startPos, endPos).trim();

    // Remove any trailing solution markers if at last option
    const solIdx = content.search(/(?:Lời giải|Hướng dẫn giải|Giải chi tiết|Đáp án)[\s.:\-–]/i);
    if (solIdx >= 0) {
      content = content.substring(0, solIdx).trim();
    }

    optionsMap[letter] = content;
  }

  // Also check if answer was indicated in text like "Chọn D" or "Đáp án: D"
  const ansMatch = fullText.match(/(?:Chọn|Đáp án|Key)\s*([ABCD])/i);
  if (ansMatch) {
    correctAnswer = ansMatch[1].toUpperCase();
  }

  const options: Option[] = ['A', 'B', 'C', 'D'].map((id) => {
    const rawContent = optionsMap[id] || `Phương án ${id}`;
    const cleanContent = ensureMathDelimiters(rawContent);
    return {
      id,
      text: cleanContent,
      latex: cleanContent,
    };
  });

  return {
    isMcq: true,
    stem: ensureMathDelimiters(stem),
    options,
    correctAnswer,
  };
}

/**
 * Robust extraction of True/False statements (a, b, c, d) with [ĐÚNG], [SAI] tag parsing
 */
export function extractTrueFalseStatements(fullText: string): {
  isTf: boolean;
  stem: string;
  statements: TrueFalseStatement[];
} {
  const stHeaderRegex = /(?:^|\n|\s{1,})(\*?\s*[abcdABCD])[\s.)\-]/g;
  const matches = Array.from(fullText.matchAll(stHeaderRegex));

  const uniqueLetters = Array.from(new Set(matches.map((m) => m[1].replace('*', '').trim().toLowerCase())));
  if (uniqueLetters.length < 3 || (!uniqueLetters.includes('a') && !uniqueLetters.includes('b'))) {
    return { isTf: false, stem: fullText, statements: [] };
  }

  const firstMatchIndex = matches[0].index !== undefined ? matches[0].index : 0;
  const stem = fullText.substring(0, firstMatchIndex).trim();

  const statementsMap: Record<string, { statement: string; isCorrect: boolean }> = {
    a: { statement: 'Mệnh đề a', isCorrect: true },
    b: { statement: 'Mệnh đề b', isCorrect: false },
    c: { statement: 'Mệnh đề c', isCorrect: true },
    d: { statement: 'Mệnh đề d', isCorrect: true },
  };

  for (let i = 0; i < matches.length; i++) {
    const curMatch = matches[i];
    const rawTag = curMatch[1].trim();
    const letter = rawTag.replace('*', '').trim().toLowerCase();

    const startPos = (curMatch.index || 0) + curMatch[0].length;
    const endPos = i < matches.length - 1 ? (matches[i + 1].index || fullText.length) : fullText.length;

    let content = fullText.substring(startPos, endPos).trim();

    // Check for [ĐÚNG] or [SAI] tag
    let isCorrect = true;
    if (/\[\s*ĐÚNG\s*\]|\[\s*Đúng\s*\]|\[\s*Đ\s*\]|\(\s*Đúng\s*\)/i.test(content)) {
      isCorrect = true;
      content = content.replace(/\[\s*(?:ĐÚNG|Đúng|Đ)\s*\]|\(\s*(?:ĐÚNG|Đúng|Đ)\s*\)/gi, '').trim();
    } else if (/\[\s*SAI\s*\]|\[\s*Sai\s*\]|\[\s*S\s*\]|\(\s*Sai\s*\)/i.test(content)) {
      isCorrect = false;
      content = content.replace(/\[\s*(?:SAI|Sai|S)\s*\]|\(\s*(?:SAI|Sai|S)\s*\)/gi, '').trim();
    }

    // Cut off any leaked next section headers (e.g. "Phần III: Câu hỏi trả lời ngắn", "Câu 2.", "Lời giải:")
    const leakedSectionIdx = content.search(/(?:PHẦN|Phần)\s+(?:I|II|III|IV|\d+)|(?:Câu|câu)\s+\d+[\s.:]|(?:Lời giải|Hướng dẫn giải)/i);
    if (leakedSectionIdx >= 0) {
      content = content.substring(0, leakedSectionIdx).trim();
    }

    if (statementsMap[letter]) {
      statementsMap[letter] = {
        statement: ensureMathDelimiters(content),
        isCorrect,
      };
    }
  }

  const statements: TrueFalseStatement[] = ['a', 'b', 'c', 'd'].map((id) => ({
    id,
    statement: statementsMap[id].statement,
    isCorrect: statementsMap[id].isCorrect,
  }));

  return {
    isTf: true,
    stem: ensureMathDelimiters(stem),
    statements,
  };
}

/**
 * Converts OMML (Office Math Markup Language) XML Node to standard LaTeX string
 */
export function convertOmmlToLatex(ommlNode: Element): string {
  if (!ommlNode) return '';

  function parseNode(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent || '';
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return '';

    const el = node as Element;
    const tagName = el.localName || el.tagName.replace(/^[a-zA-Z0-9]+:/, '');

    switch (tagName) {
      case 'oMathPara':
      case 'oMath': {
        return Array.from(el.childNodes).map(parseNode).join('');
      }
      case 't': {
        const text = el.textContent || '';
        return normalizeMathSymbols(text);
      }
      case 'r': {
        return Array.from(el.childNodes).map(parseNode).join('');
      }
      case 'f': {
        // Fraction: <m:num>, <m:den>
        const num = el.getElementsByTagNameNS('*', 'num')[0] || el.querySelector('num');
        const den = el.getElementsByTagNameNS('*', 'den')[0] || el.querySelector('den');
        const numLatex = num ? Array.from(num.childNodes).map(parseNode).join('').trim() : '';
        const denLatex = den ? Array.from(den.childNodes).map(parseNode).join('').trim() : '';
        return `\\frac{${numLatex}}{${denLatex}}`;
      }
      case 'rad': {
        // Radical (sqrt / nth root): <m:deg>, <m:e>
        const deg = el.getElementsByTagNameNS('*', 'deg')[0] || el.querySelector('deg');
        const e = el.getElementsByTagNameNS('*', 'e')[0] || el.querySelector('e');
        const eLatex = e ? Array.from(e.childNodes).map(parseNode).join('').trim() : '';
        const degLatex = deg ? Array.from(deg.childNodes).map(parseNode).join('').trim() : '';
        if (degLatex && degLatex.length > 0) {
          return `\\sqrt[${degLatex}]{${eLatex}}`;
        }
        return `\\sqrt{${eLatex}}`;
      }
      case 'sSub': {
        // Subscript: <m:e>, <m:sub>
        const e = el.getElementsByTagNameNS('*', 'e')[0] || el.querySelector('e');
        const sub = el.getElementsByTagNameNS('*', 'sub')[0] || el.querySelector('sub');
        const eLatex = e ? Array.from(e.childNodes).map(parseNode).join('').trim() : '';
        const subLatex = sub ? Array.from(sub.childNodes).map(parseNode).join('').trim() : '';
        return `${eLatex}_{${subLatex}}`;
      }
      case 'sSup': {
        // Superscript: <m:e>, <m:sup>
        const e = el.getElementsByTagNameNS('*', 'e')[0] || el.querySelector('e');
        const sup = el.getElementsByTagNameNS('*', 'sup')[0] || el.querySelector('sup');
        const eLatex = e ? Array.from(e.childNodes).map(parseNode).join('').trim() : '';
        const supLatex = sup ? Array.from(sup.childNodes).map(parseNode).join('').trim() : '';
        return `${eLatex}^{${supLatex}}`;
      }
      case 'sSubSup': {
        // Sub-Superscript: <m:e>, <m:sub>, <m:sup>
        const e = el.getElementsByTagNameNS('*', 'e')[0] || el.querySelector('e');
        const sub = el.getElementsByTagNameNS('*', 'sub')[0] || el.querySelector('sub');
        const sup = el.getElementsByTagNameNS('*', 'sup')[0] || el.querySelector('sup');
        const eLatex = e ? Array.from(e.childNodes).map(parseNode).join('').trim() : '';
        const subLatex = sub ? Array.from(sub.childNodes).map(parseNode).join('').trim() : '';
        const supLatex = sup ? Array.from(sup.childNodes).map(parseNode).join('').trim() : '';
        return `${eLatex}_{${subLatex}}^{${supLatex}}`;
      }
      case 'sPre': {
        // Pre-sub/superscript
        const e = el.getElementsByTagNameNS('*', 'e')[0] || el.querySelector('e');
        const sub = el.getElementsByTagNameNS('*', 'sub')[0] || el.querySelector('sub');
        const sup = el.getElementsByTagNameNS('*', 'sup')[0] || el.querySelector('sup');
        const eLatex = e ? Array.from(e.childNodes).map(parseNode).join('').trim() : '';
        const subLatex = sub ? Array.from(sub.childNodes).map(parseNode).join('').trim() : '';
        const supLatex = sup ? Array.from(sup.childNodes).map(parseNode).join('').trim() : '';
        return `{}^{${supLatex}}_{${subLatex}}${eLatex}`;
      }
      case 'd': {
        // Delimiters (brackets, parentheses, absolute values): <m:dPr>, <m:e>
        const dPr = el.getElementsByTagNameNS('*', 'dPr')[0] || el.querySelector('dPr');
        const begChr = dPr?.getElementsByTagNameNS('*', 'begChr')[0]?.getAttribute('m:val') || '(';
        const endChr = dPr?.getElementsByTagNameNS('*', 'endChr')[0]?.getAttribute('m:val') || ')';
        const sepChr = dPr?.getElementsByTagNameNS('*', 'sepChr')[0]?.getAttribute('m:val') || ';';

        const eElements = el.getElementsByTagNameNS('*', 'e');
        const eList = Array.from(eElements).map((eNode) => Array.from(eNode.childNodes).map(parseNode).join('').trim());

        const joined = eList.join(sepChr ? ` ${sepChr} ` : ' ; ');

        if (begChr === '|' && endChr === '|') return `|${joined}|`;
        if (begChr === '{' || endChr === '}') return `\\left\\{${joined}\\right\\}`;
        if (begChr === '[' || endChr === ']') return `\\left[${joined}\\right]`;
        if (begChr === '(' && endChr === ')') return `\\left(${joined}\\right)`;

        return `\\left${begChr || '.'} ${joined} \\right${endChr || '.'}`;
      }
      case 'nary': {
        // N-ary operators (Integrals, Sums, Products)
        const naryPr = el.getElementsByTagNameNS('*', 'naryPr')[0] || el.querySelector('naryPr');
        const chr = naryPr?.getElementsByTagNameNS('*', 'chr')[0]?.getAttribute('m:val') || '∫';
        const sub = el.getElementsByTagNameNS('*', 'sub')[0] || el.querySelector('sub');
        const sup = el.getElementsByTagNameNS('*', 'sup')[0] || el.querySelector('sup');
        const e = el.getElementsByTagNameNS('*', 'e')[0] || el.querySelector('e');

        let symbol = '\\int';
        if (chr === '∑' || chr.toLowerCase() === 'sum') symbol = '\\sum';
        if (chr === '∏' || chr.toLowerCase() === 'prod') symbol = '\\prod';

        const subLatex = sub ? Array.from(sub.childNodes).map(parseNode).join('').trim() : '';
        const supLatex = sup ? Array.from(sup.childNodes).map(parseNode).join('').trim() : '';
        const eLatex = e ? Array.from(e.childNodes).map(parseNode).join('').trim() : '';

        let limitStr = '';
        if (subLatex) limitStr += `_{${subLatex}}`;
        if (supLatex) limitStr += `^{${supLatex}}`;

        return `${symbol}${limitStr} ${eLatex}`;
      }
      case 'm': {
        // Matrix: <m:mr> rows, <m:e> elements
        const rows = el.getElementsByTagNameNS('*', 'mr');
        const rowStrings: string[] = [];
        for (let r = 0; r < rows.length; r++) {
          const cells = rows[r].getElementsByTagNameNS('*', 'e');
          const cellStrings = Array.from(cells).map((c) => Array.from(c.childNodes).map(parseNode).join('').trim());
          rowStrings.push(cellStrings.join(' & '));
        }
        return `\\begin{pmatrix} ${rowStrings.join(' \\\\ ')} \\end{pmatrix}`;
      }
      case 'eqArr': {
        // Equation array / Systems of equations
        const eElements = el.getElementsByTagNameNS('*', 'e');
        const lines = Array.from(eElements).map((eNode) => Array.from(eNode.childNodes).map(parseNode).join('').trim());
        return `\\begin{cases} ${lines.join(' \\\\ ')} \\end{cases}`;
      }
      case 'func': {
        // Functions: <m:fName>, <m:e>
        const fName = el.getElementsByTagNameNS('*', 'fName')[0] || el.querySelector('fName');
        const e = el.getElementsByTagNameNS('*', 'e')[0] || el.querySelector('e');
        const fNameLatex = fName ? Array.from(fName.childNodes).map(parseNode).join('').trim() : '';
        const eLatex = e ? Array.from(e.childNodes).map(parseNode).join('').trim() : '';
        return `${fNameLatex}(${eLatex})`;
      }
      case 'limLow':
      case 'limUpp': {
        const fName = el.getElementsByTagNameNS('*', 'fName')[0] || el.querySelector('fName');
        const lim = el.getElementsByTagNameNS('*', 'lim')[0] || el.querySelector('lim');
        const e = el.getElementsByTagNameNS('*', 'e')[0] || el.querySelector('e');
        const fNameLatex = fName ? Array.from(fName.childNodes).map(parseNode).join('').trim() : '\\lim';
        const limLatex = lim ? Array.from(lim.childNodes).map(parseNode).join('').trim() : '';
        const eLatex = e ? Array.from(e.childNodes).map(parseNode).join('').trim() : '';
        return `${fNameLatex}_{${limLatex}} ${eLatex}`;
      }
      case 'acc': {
        // Accent: Vector, Overbar, Hat
        const accPr = el.getElementsByTagNameNS('*', 'accPr')[0] || el.querySelector('accPr');
        const chr = accPr?.getElementsByTagNameNS('*', 'chr')[0]?.getAttribute('m:val') || '→';
        const e = el.getElementsByTagNameNS('*', 'e')[0] || el.querySelector('e');
        const eLatex = e ? Array.from(e.childNodes).map(parseNode).join('').trim() : '';

        if (chr === '→' || chr === '⃗') return `\\vec{${eLatex}}`;
        if (chr === '¯' || chr === '–' || chr === '-') return `\\overline{${eLatex}}`;
        if (chr === '^' || chr === '̂') return `\\hat{${eLatex}}`;
        if (chr === '~' || chr === '̃') return `\\tilde{${eLatex}}`;
        return `\\vec{${eLatex}}`;
      }
      case 'groupChr': {
        // Overbrace / Underbrace
        const groupChrPr = el.getElementsByTagNameNS('*', 'groupChrPr')[0] || el.querySelector('groupChrPr');
        const pos = groupChrPr?.getElementsByTagNameNS('*', 'pos')[0]?.getAttribute('m:val') || 'bot';
        const e = el.getElementsByTagNameNS('*', 'e')[0] || el.querySelector('e');
        const eLatex = e ? Array.from(e.childNodes).map(parseNode).join('').trim() : '';
        return pos === 'top' ? `\\overbrace{${eLatex}}` : `\\underbrace{${eLatex}}`;
      }
      case 'bar': {
        const e = el.getElementsByTagNameNS('*', 'e')[0] || el.querySelector('e');
        const eLatex = e ? Array.from(e.childNodes).map(parseNode).join('').trim() : '';
        return `\\overline{${eLatex}}`;
      }
      default: {
        return Array.from(el.childNodes).map(parseNode).join('');
      }
    }
  }

  return parseNode(ommlNode);
}

/**
 * Converts Word Table (<w:tbl>) into clean LaTeX Array for sign/variation tables,
 * or structured table matrix.
 */
export function convertWordTableToLatex(tableNode: Element): { latexArray: string; rows: string[][] } {
  const rows = tableNode.getElementsByTagNameNS('*', 'tr');
  const tableMatrix: string[][] = [];

  for (let r = 0; r < rows.length; r++) {
    const rowEl = rows[r];
    const cells = rowEl.getElementsByTagNameNS('*', 'tc');
    const rowCells: string[] = [];

    for (let c = 0; c < cells.length; c++) {
      const cellEl = cells[c];
      let cellText = '';

      // Extract paragraphs and math inside cell
      const pElements = cellEl.getElementsByTagNameNS('*', 'p');
      const pTexts: string[] = [];

      for (let p = 0; p < pElements.length; p++) {
        const pEl = pElements[p];
        let line = '';

        for (const child of Array.from(pEl.childNodes)) {
          const cEl = child as Element;
          const cTag = cEl.localName || cEl.tagName.replace(/^[a-zA-Z0-9]+:/, '');

          if (cTag === 'r') {
            const t = cEl.getElementsByTagNameNS('*', 't')[0]?.textContent || '';
            line += normalizeMathSymbols(t);
          } else if (cTag === 'oMath' || cTag === 'oMathPara') {
            const math = convertOmmlToLatex(cEl);
            if (math) line += ` ${math} `;
          }
        }
        if (line.trim()) pTexts.push(line.trim());
      }

      cellText = pTexts.join(' ').trim();
      rowCells.push(cellText);
    }

    if (rowCells.length > 0) {
      tableMatrix.push(rowCells);
    }
  }

  if (tableMatrix.length === 0) return { latexArray: '', rows: [] };

  const colCount = Math.max(...tableMatrix.map((r) => r.length));
  // Alignment: first column 'c|' then 'c' for others
  const colAlign = colCount > 1 ? `c|${'c'.repeat(colCount - 1)}` : 'c';

  const rowLatexStrings = tableMatrix.map((row) => {
    // Fill trailing empty cells if any
    const padded = [...row];
    while (padded.length < colCount) padded.push('');
    return padded.join(' & ');
  });

  const latexArray = `$$\\begin{array}{${colAlign}}\n${rowLatexStrings.join(' \\\\\n\\hline\n')}\n\\end{array}$$`;
  return { latexArray, rows: tableMatrix };
}

/**
 * Deep DOCX / OOXML Master Parser
 * Preserves exact flow: text -> math -> image -> table -> options -> solution
 */
export async function parseDocxFile(
  file: File,
  lessonId: string = 'lesson-1',
  chapterId: string = 'chap-1'
): Promise<{ report: DocxParseReport; questions: Question[] }> {
  const zip = new JSZip();
  let zipContents: JSZip;

  try {
    zipContents = await zip.loadAsync(file);
  } catch (err: any) {
    throw new Error(`Không thể giải nén file DOCX: ${err.message || 'File có thể không đúng định dạng .docx'}`);
  }

  const warnings: DocxParseWarning[] = [];
  const unparsedParagraphs: string[] = [];

  let ommlCount = 0;
  let mathTypeCount = 0;
  let fallbackImageCount = 0;
  let tableCount = 0;

  // 1. Direct scan and extraction of all media files in word/media/*
  const mediaMap: Record<string, string> = {};

  try {
    // Scan all files under word/media/
    const mediaFiles = zipContents.file(/^word\/media\//);
    for (const mFile of mediaFiles) {
      const fileName = mFile.name.replace(/^word\/media\//, '');
      const lowerName = fileName.toLowerCase();
      let mimeType = 'image/png';
      if (lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg')) mimeType = 'image/jpeg';
      else if (lowerName.endsWith('.svg')) mimeType = 'image/svg+xml';
      else if (lowerName.endsWith('.webp')) mimeType = 'image/webp';
      else if (lowerName.endsWith('.gif')) mimeType = 'image/gif';
      else if (lowerName.endsWith('.emf') || lowerName.endsWith('.wmf')) {
        mimeType = 'image/x-wmf';
        fallbackImageCount++;
      }

      const base64 = await mFile.async('base64');
      const dataUri = `data:${mimeType};base64,${base64}`;

      // Index by full path and filename
      mediaMap[mFile.name] = dataUri;
      mediaMap[fileName] = dataUri;
      mediaMap[`media/${fileName}`] = dataUri;
    }

    // Map rIds from word/_rels/document.xml.rels
    const relsXmlStr = (await zipContents.file('word/_rels/document.xml.rels')?.async('text')) || '';
    if (relsXmlStr) {
      const parser = new DOMParser();
      const relsDoc = parser.parseFromString(relsXmlStr, 'application/xml');
      const rels = relsDoc.getElementsByTagName('Relationship');

      for (let i = 0; i < rels.length; i++) {
        const id = rels[i].getAttribute('Id');
        const target = rels[i].getAttribute('Target') || '';

        if (id && target) {
          const cleanTarget = target.replace(/^\//, '').replace(/^word\//, '');
          const targetFileName = cleanTarget.replace(/^media\//, '');

          const matchedUri = mediaMap[`word/media/${targetFileName}`] || mediaMap[targetFileName] || mediaMap[cleanTarget];
          if (matchedUri) {
            mediaMap[id] = matchedUri;
          }
        }
      }
    }
  } catch (mediaErr) {
    warnings.push({
      lineOrIndex: 0,
      code: 'MEDIA_SCAN_WARNING',
      message: 'Có cảnh báo khi quét tệp hình ảnh tài liệu Word.',
      severity: 'low',
    });
  }

  // 2. Read word/document.xml
  const docXmlStr = await zipContents.file('word/document.xml')?.async('text');
  if (!docXmlStr) {
    throw new Error('Không tìm thấy file word/document.xml. File DOCX có thể bị lỗi cấu trúc.');
  }

  const parser = new DOMParser();
  const docXml = parser.parseFromString(docXmlStr, 'application/xml');
  const body = docXml.getElementsByTagNameNS('*', 'body')[0] || docXml.querySelector('body');

  if (!body) {
    throw new Error('Không thể đọc thẻ nội dung body trong file Word.');
  }

  // 3. Sequential traversal of body elements (Paragraphs <w:p> and Tables <w:tbl>)
  const sequentialBlocks: {
    type: 'paragraph' | 'table';
    text: string;
    contentBlocks: ContentBlock[];
    mediaUrls: string[];
    hasMath: boolean;
  }[] = [];

  const bodyChildren = Array.from(body.childNodes).filter((n) => n.nodeType === Node.ELEMENT_NODE) as Element[];

  for (const el of bodyChildren) {
    const tagName = el.localName || el.tagName.replace(/^[a-zA-Z0-9]+:/, '');

    // PROCESS PARAGRAPHS (<w:p>)
    if (tagName === 'p') {
      let pText = '';
      const pBlocks: ContentBlock[] = [];
      const mediaUrls: string[] = [];
      let hasMath = false;

      // Recursive DOM Walker that preserves exact sequential order
      function walkNode(node: Node) {
        if (node.nodeType === Node.TEXT_NODE) {
          return;
        }

        if (node.nodeType !== Node.ELEMENT_NODE) return;

        const el = node as Element;
        const tag = el.localName || el.tagName.replace(/^[a-zA-Z0-9]+:/, '');

        // 1. Math Element (OMML)
        if (tag === 'oMath' || tag === 'oMathPara') {
          ommlCount++;
          hasMath = true;
          const latex = convertOmmlToLatex(el);
          if (latex) {
            const isBlock = tag === 'oMathPara';
            const formatted = isBlock ? `$$\n${latex}\n$$` : `$${latex}$`;
            pText += ` ${formatted} `;
            pBlocks.push(isBlock ? { type: 'blockMath', latex } : { type: 'inlineMath', latex });
          }
          return; // Consumed entire math subtree
        }

        // 2. Text Run Content (<w:t>)
        if (tag === 't') {
          const tVal = el.textContent || '';
          if (tVal) {
            const normalized = normalizeMathSymbols(tVal);
            pText += normalized;
            pBlocks.push({ type: 'text', text: normalized });
          }
          return;
        }

        // 3. Line Break (<w:br>)
        if (tag === 'br') {
          pText += '\n';
          pBlocks.push({ type: 'lineBreak' });
          return;
        }

        // 4. Tab (<w:tab>)
        if (tag === 'tab') {
          pText += '  ';
          return;
        }

        // 5. DrawingML Image (<a:blip r:embed="rId...">)
        if (tag === 'blip') {
          const rEmbed = el.getAttribute('r:embed') || el.getAttribute('embed') || el.getAttribute('r:id');
          if (rEmbed && mediaMap[rEmbed]) {
            const url = mediaMap[rEmbed];
            mediaUrls.push(url);
            pBlocks.push({ type: 'image', url, rId: rEmbed });
          }
          return;
        }

        // 6. VML Image / MathType OLE Preview (<v:imagedata r:id="rId...">)
        if (tag === 'imagedata') {
          const rId = el.getAttribute('r:id') || el.getAttribute('id');
          if (rId && mediaMap[rId]) {
            mathTypeCount++;
            const url = mediaMap[rId];
            mediaUrls.push(url);
            pBlocks.push({ type: 'image', url, rId, alt: 'Công thức MathType' });
          }
          return;
        }

        // Recurse through all child nodes in sequential order
        for (const child of Array.from(el.childNodes)) {
          walkNode(child);
        }
      }

      walkNode(el);

      const trimmedText = pText.trim();
      if (trimmedText || mediaUrls.length > 0) {
        sequentialBlocks.push({
          type: 'paragraph',
          text: trimmedText,
          contentBlocks: pBlocks,
          mediaUrls,
          hasMath,
        });
      }
    }

    // PROCESS TABLES (<w:tbl>)
    if (tagName === 'tbl') {
      tableCount++;
      const { latexArray, rows } = convertWordTableToLatex(el);
      if (latexArray || rows.length > 0) {
        sequentialBlocks.push({
          type: 'table',
          text: latexArray,
          contentBlocks: [{ type: 'table', rows, latexArray }],
          mediaUrls: [],
          hasMath: true,
        });
      }
    }
  }

  // 4. Segment Sequential Blocks into Questions based on sections and markers
  const questionSegments: {
    lines: string[];
    blocks: ContentBlock[];
    mediaUrls: string[];
    section: 'part_1' | 'part_2' | 'part_3' | 'part_4';
  }[] = [];

  let currentSection: 'part_1' | 'part_2' | 'part_3' | 'part_4' = 'part_1';
  let hasExplicitSectionInDoc = false;

  let currentSegment: {
    lines: string[];
    blocks: ContentBlock[];
    mediaUrls: string[];
    section: 'part_1' | 'part_2' | 'part_3' | 'part_4';
  } | null = null;

  const part1HeaderRegex = /(?:PHẦN|Phần)\s*(?:I\b|1\b|nhất\b)/i;
  const part2HeaderRegex = /(?:PHẦN|Phần)\s*(?:II\b|2\b|hai\b)/i;
  const part3HeaderRegex = /(?:PHẦN|Phần)\s*(?:III\b|3\b|ba\b)/i;
  const part4HeaderRegex = /(?:PHẦN|Phần)\s*(?:IV\b|4\b|tư\b|bốn\b)/i;

  const questionHeaderRegex = /^(?:câu|bài|question)\s*(\d+)[\s.:\-–]/i;

  for (const block of sequentialBlocks) {
    const textTrimmed = block.text.trim();

    // Check for Section Headers
    if (part4HeaderRegex.test(textTrimmed)) {
      hasExplicitSectionInDoc = true;
      currentSection = 'part_4';
      continue;
    } else if (part3HeaderRegex.test(textTrimmed)) {
      hasExplicitSectionInDoc = true;
      currentSection = 'part_3';
      continue;
    } else if (part2HeaderRegex.test(textTrimmed)) {
      hasExplicitSectionInDoc = true;
      currentSection = 'part_2';
      continue;
    } else if (part1HeaderRegex.test(textTrimmed)) {
      hasExplicitSectionInDoc = true;
      currentSection = 'part_1';
      continue;
    }

    const isNewQuestionStart = questionHeaderRegex.test(textTrimmed);

    if (isNewQuestionStart) {
      if (currentSegment && currentSegment.lines.length > 0) {
        questionSegments.push(currentSegment);
      }
      currentSegment = {
        lines: [block.text],
        blocks: [...block.contentBlocks],
        mediaUrls: [...block.mediaUrls],
        section: currentSection,
      };
    } else {
      if (currentSegment) {
        currentSegment.lines.push(block.text);
        currentSegment.blocks.push(...block.contentBlocks);
        currentSegment.mediaUrls.push(...block.mediaUrls);
      } else {
        unparsedParagraphs.push(block.text);
      }
    }
  }

  if (currentSegment && currentSegment.lines.length > 0) {
    questionSegments.push(currentSegment);
  }

  // Fallback: If no "Câu X" markers were found, split into logical question segments
  if (questionSegments.length === 0 && sequentialBlocks.length > 0) {
    warnings.push({
      lineOrIndex: 0,
      code: 'NO_QUESTION_MARKERS_AUTO_SEGMENT',
      message: 'Không tìm thấy tiền tố "Câu 1.", "Câu 2:". Hệ thống tự động gom toàn bộ nội dung.',
      severity: 'medium',
    });
    questionSegments.push({
      lines: sequentialBlocks.map((b) => b.text),
      blocks: sequentialBlocks.flatMap((b) => b.contentBlocks),
      mediaUrls: sequentialBlocks.flatMap((b) => b.mediaUrls),
      section: 'part_1',
    });
  }

  // 5. Classify & Build Complete Question Objects into 4 Sections
  const questions: Question[] = [];
  let mcqCount = 0;
  let tfCount = 0;
  let saCount = 0;
  let essayCount = 0;

  for (let qIdx = 0; qIdx < questionSegments.length; qIdx++) {
    const segment = questionSegments[qIdx];
    const fullText = segment.lines.join('\n');
    const qOrder = qIdx + 1;
    const media = segment.mediaUrls
      .filter((u) => u && u.trim().length > 10)
      .map((url) => ({ type: 'image' as const, url }));

    let solution = '';
    const solMatch = fullText.match(/(?:Lời giải|Hướng dẫn giải|Giải chi tiết|Đáp án)[\s.:\-–]([\s\S]*)/i);
    if (solMatch) {
      solution = solMatch[1].trim();
    }

    // IF EXPLICIT SECTION IN DOC: ROUTE EXACTLY TO THAT SECTION
    if (hasExplicitSectionInDoc) {
      if (segment.section === 'part_1') {
        const mcqResult = extractMcqOptions(fullText);
        questions.push({
          id: `q-docx-${Date.now()}-${qOrder}`,
          lessonId,
          chapterId,
          type: 'mcq',
          difficulty: 'NB',
          order: qOrder,
          points: 0.25,
          stem: mcqResult.isMcq ? mcqResult.stem : ensureMathDelimiters(fullText),
          media,
          options: mcqResult.options.length > 0 ? mcqResult.options : [
            { id: 'A', text: 'Phương án A', latex: 'Phương án A' },
            { id: 'B', text: 'Phương án B', latex: 'Phương án B' },
            { id: 'C', text: 'Phương án C', latex: 'Phương án C' },
            { id: 'D', text: 'Phương án D', latex: 'Phương án D' },
          ],
          correctAnswer: mcqResult.correctAnswer || 'A',
          solution: ensureMathDelimiters(solution),
          tags: ['Phần I', 'Trắc nghiệm nhiều lựa chọn'],
          confidenceScore: 0.98,
        });
        mcqCount++;
        continue;
      }

      if (segment.section === 'part_2') {
        const tfResult = extractTrueFalseStatements(fullText);
        questions.push({
          id: `q-docx-${Date.now()}-${qOrder}`,
          lessonId,
          chapterId,
          type: 'true_false',
          difficulty: 'TH',
          order: qOrder,
          points: 1.0,
          stem: tfResult.isTf ? tfResult.stem : ensureMathDelimiters(fullText),
          media,
          statements: tfResult.statements.length > 0 ? tfResult.statements : [
            { id: 'a', statement: 'Mệnh đề a', isCorrect: true },
            { id: 'b', statement: 'Mệnh đề b', isCorrect: false },
            { id: 'c', statement: 'Mệnh đề c', isCorrect: true },
            { id: 'd', statement: 'Mệnh đề d', isCorrect: true },
          ],
          solution: ensureMathDelimiters(solution),
          tags: ['Phần II', 'Đúng Sai'],
          confidenceScore: 0.98,
        });
        tfCount++;
        continue;
      }

      if (segment.section === 'part_3') {
        let acceptedVal = '0';
        const keyMatch = fullText.match(/(?:kết quả là|đáp án là|nhập số|giá trị bằng|bằng|key)[\s.:=–\s]*([+-]?\d+(?:[.,/]\d+)?)/i);
        if (keyMatch) {
          acceptedVal = keyMatch[1].replace(',', '.');
        }

        questions.push({
          id: `q-docx-${Date.now()}-${qOrder}`,
          lessonId,
          chapterId,
          type: 'short_answer',
          difficulty: 'VD',
          order: qOrder,
          points: 0.5,
          stem: ensureMathDelimiters(fullText),
          media,
          shortAnswerKey: {
            acceptedValues: [acceptedVal],
            isNumeric: true,
          },
          solution: ensureMathDelimiters(solution),
          tags: ['Phần III', 'Trả lời ngắn'],
          confidenceScore: 0.98,
        });
        saCount++;
        continue;
      }

      if (segment.section === 'part_4') {
        questions.push({
          id: `q-docx-${Date.now()}-${qOrder}`,
          lessonId,
          chapterId,
          type: 'essay',
          difficulty: 'VDC',
          order: qOrder,
          points: 1.0,
          stem: ensureMathDelimiters(fullText),
          media,
          solution: ensureMathDelimiters(solution),
          tags: ['Phần IV', 'Tự luận'],
          confidenceScore: 0.98,
        });
        essayCount++;
        continue;
      }
    }

    // AUTO-INFER SECTION IF NO EXPLICIT SECTION HEADER WAS FOUND
    // 1. Try True/False first (a, b, c, d with [ĐÚNG], [SAI])
    const tfResult = extractTrueFalseStatements(fullText);
    if (tfResult.isTf) {
      tfCount++;
      questions.push({
        id: `q-docx-${Date.now()}-${qOrder}`,
        lessonId,
        chapterId,
        type: 'true_false',
        difficulty: 'TH',
        order: qOrder,
        points: 1.0,
        stem: tfResult.stem,
        media,
        statements: tfResult.statements,
        solution: ensureMathDelimiters(solution),
        tags: ['Phần II', 'Đúng Sai'],
        confidenceScore: 0.98,
      });
      continue;
    }

    // 2. Try MCQ (A, B, C, D with *A., *B., *C., *D.)
    const mcqResult = extractMcqOptions(fullText);
    if (mcqResult.isMcq) {
      mcqCount++;
      questions.push({
        id: `q-docx-${Date.now()}-${qOrder}`,
        lessonId,
        chapterId,
        type: 'mcq',
        difficulty: 'NB',
        order: qOrder,
        points: 0.25,
        stem: mcqResult.stem,
        media,
        options: mcqResult.options,
        correctAnswer: mcqResult.correctAnswer || 'A',
        solution: ensureMathDelimiters(solution),
        tags: ['Phần I', 'Trắc nghiệm nhiều lựa chọn'],
        confidenceScore: 0.98,
      });
      continue;
    }

    // 3. Short Answer
    if (/trả lời ngắn|kết quả là|nhập số/i.test(fullText)) {
      saCount++;
      questions.push({
        id: `q-docx-${Date.now()}-${qOrder}`,
        lessonId,
        chapterId,
        type: 'short_answer',
        difficulty: 'VD',
        order: qOrder,
        points: 0.5,
        stem: ensureMathDelimiters(fullText),
        media,
        shortAnswerKey: {
          acceptedValues: ['0'],
          isNumeric: true,
        },
        solution: ensureMathDelimiters(solution),
        tags: ['Phần III', 'Trả lời ngắn'],
        confidenceScore: 0.85,
      });
      continue;
    }

    // 4. Default Essay
    essayCount++;
    questions.push({
      id: `q-docx-${Date.now()}-${qOrder}`,
      lessonId,
      chapterId,
      type: 'essay',
      difficulty: 'VDC',
      order: qOrder,
      points: 1.0,
      stem: ensureMathDelimiters(fullText),
      media,
      solution: ensureMathDelimiters(solution),
      tags: ['Phần IV', 'Tự luận'],
      confidenceScore: 0.85,
    });
  }

  const report: DocxParseReport = {
    fileName: file.name,
    fileSize: file.size,
    totalDetectedQuestions: questions.length,
    ommlCount,
    mathTypeCount,
    convertedLatexCount: ommlCount,
    fallbackImageCount,
    formulaCount: ommlCount + mathTypeCount,
    imageCount: Object.keys(mediaMap).length,
    tableCount,
    mcqCount,
    tfCount,
    saCount,
    essayCount,
    warnings,
    unparsedParagraphs,
    parsedAt: new Date().toISOString(),
    version: 2,
  };

  return { report, questions };
}
