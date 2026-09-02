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
 * Automatically wraps mathematical notations in $...$ for visual MathJax rendering
 * when they are extracted from plain text runs (e.g. f(x), \mathbb{R}, AB = 10, \widehat{A} = 45^\circ, \sqrt{2})
 */
export function ensureMathDelimiters(text: string): string {
  if (!text) return '';

  let res = text;

  // Wrap standalone \mathbb{R}, \mathbb{Z} ... if not already inside $
  res = res.replace(/(?<!\$)\\mathbb\{[A-Z]\}(?!\$)/g, (m) => `$${m}$`);

  // Wrap f(x), f'(x), g(x), y=f(x) if not inside $
  res = res.replace(/(?<![\$\w\\])\b([fg]\s*\(\s*x\s*\)|[fg]'\s*\(\s*x\s*\)|y\s*=\s*[fg]\s*\(\s*x\s*\))(?!\$)/g, (m) => `$${m}$`);

  // Wrap geometric angle expressions: \widehat{A} = 45^0 or \widehat{A} = 45^\circ or \angle A = ...
  res = res.replace(/(?<!\$)(\\widehat\{[A-Z]\}\s*=\s*\d+[\^0°^{\\circ}]+|\\hat\{[A-Z]\}\s*=\s*\d+[\^0°^{\\circ}]+)(?!\$)/g, (m) => {
    const clean = m.replace(/\^0|\^\{\\circ\}|°/g, '^{\\circ}');
    return `$${clean}$`;
  });

  // Wrap side lengths: AB = 10, AC = 6, BC = ...
  res = res.replace(/(?<![\$\w\\])\b([A-Z]{2}\s*=\s*\d+)(?!\$)/g, (m) => `$${m}$`);

  // Wrap triangle names: tam giác ABC -> tam giác $ABC$
  res = res.replace(/(tam giác\s+)([A-Z]{3})\b(?!\$)/gi, (_, prefix, tri) => `${prefix}$${tri}$`);

  // Wrap square roots like 30\sqrt{2}, 15\sqrt{3}, \sqrt{2} if not inside $
  res = res.replace(/(?<![\$\\])(\d*\\sqrt\{[^\}]+\}|\d*\\sqrt\s*\d+)(?!\$)/g, (m) => `$${m}$`);

  // Wrap intervals like (-\infty; 1), (-2; 1), (-2; +\infty), (-\infty; -2)
  res = res.replace(/(?<!\$)\(([+-]?\\infty|-?\d+)\s*;\s*([+-]?\\infty|-?\d+)\)(?!\$)/g, (m) => `$${m}$`);

  return res;
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

  // 1. Read document relationships for media (word/_rels/document.xml.rels)
  const relsXmlStr = (await zipContents.file('word/_rels/document.xml.rels')?.async('text')) || '';
  const mediaMap: Record<string, string> = {};

  if (relsXmlStr) {
    try {
      const parser = new DOMParser();
      const relsDoc = parser.parseFromString(relsXmlStr, 'application/xml');
      const rels = relsDoc.getElementsByTagName('Relationship');

      for (let i = 0; i < rels.length; i++) {
        const id = rels[i].getAttribute('Id');
        const target = rels[i].getAttribute('Target') || '';
        const type = rels[i].getAttribute('Type') || '';

        if (id && target) {
          // Normalize media path inside zip
          const cleanTarget = target.replace(/^\//, '');
          const mediaPath = cleanTarget.startsWith('word/') ? cleanTarget : `word/${cleanTarget}`;
          const mediaFile = zipContents.file(mediaPath);

          if (mediaFile) {
            const lowerPath = mediaPath.toLowerCase();
            let mimeType = 'image/png';
            if (lowerPath.endsWith('.jpg') || lowerPath.endsWith('.jpeg')) mimeType = 'image/jpeg';
            else if (lowerPath.endsWith('.svg')) mimeType = 'image/svg+xml';
            else if (lowerPath.endsWith('.webp')) mimeType = 'image/webp';
            else if (lowerPath.endsWith('.gif')) mimeType = 'image/gif';
            else if (lowerPath.endsWith('.emf') || lowerPath.endsWith('.wmf')) {
              mimeType = 'image/x-wmf';
              fallbackImageCount++;
            }

            const base64 = await mediaFile.async('base64');
            mediaMap[id] = `data:${mimeType};base64,${base64}`;
          }
        }
      }
    } catch (relsErr) {
      warnings.push({
        lineOrIndex: 0,
        code: 'RELS_PARSE_WARNING',
        message: 'Có cảnh báo khi đọc bảng quan hệ hình ảnh tài liệu.',
        severity: 'low',
      });
    }
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

      for (const child of Array.from(el.childNodes)) {
        const cEl = child as Element;
        const cTag = cEl.localName || cEl.tagName.replace(/^[a-zA-Z0-9]+:/, '');

        if (cTag === 'r') {
          // Check for regular text
          const tElements = cEl.getElementsByTagNameNS('*', 't');
          let rText = '';
          for (let ti = 0; ti < tElements.length; ti++) {
            rText += tElements[ti].textContent || '';
          }

          if (rText) {
            const normalized = normalizeMathSymbols(rText);
            pText += normalized;
            pBlocks.push({ type: 'text', text: normalized });
          }

          // Check DrawingML Images (<a:blip r:embed="rId...">)
          const blips = cEl.getElementsByTagNameNS('*', 'blip');
          for (let bi = 0; bi < blips.length; bi++) {
            const rEmbed = blips[bi].getAttribute('r:embed') || blips[bi].getAttribute('embed') || blips[bi].getAttribute('r:id');
            if (rEmbed && mediaMap[rEmbed]) {
              const url = mediaMap[rEmbed];
              mediaUrls.push(url);
              pBlocks.push({ type: 'image', url, rId: rEmbed });
            }
          }

          // Check VML / Shape Images (<v:imagedata r:id="rId...">)
          const imageDatas = cEl.getElementsByTagNameNS('*', 'imagedata');
          for (let ii = 0; ii < imageDatas.length; ii++) {
            const rId = imageDatas[ii].getAttribute('r:id') || imageDatas[ii].getAttribute('id');
            if (rId && mediaMap[rId]) {
              const url = mediaMap[rId];
              mediaUrls.push(url);
              pBlocks.push({ type: 'image', url, rId });
            }
          }
        } else if (cTag === 'oMath' || cTag === 'oMathPara') {
          // OMML Math Formula
          ommlCount++;
          hasMath = true;
          const latex = convertOmmlToLatex(cEl);
          if (latex) {
            const isBlock = cTag === 'oMathPara';
            const formatted = isBlock ? `$$\n${latex}\n$$` : `$${latex}$`;
            pText += ` ${formatted} `;
            pBlocks.push(
              isBlock
                ? { type: 'blockMath', latex }
                : { type: 'inlineMath', latex }
            );
          }
        } else if (cTag === 'drawing') {
          // Standalone drawing container
          const blips = cEl.getElementsByTagNameNS('*', 'blip');
          for (let bi = 0; bi < blips.length; bi++) {
            const rEmbed = blips[bi].getAttribute('r:embed') || blips[bi].getAttribute('embed');
            if (rEmbed && mediaMap[rEmbed]) {
              const url = mediaMap[rEmbed];
              mediaUrls.push(url);
              pBlocks.push({ type: 'image', url, rId: rEmbed });
            }
          }
        } else if (cTag === 'object' || cTag === 'pict') {
          // MathType / OLE Embedded Object
          mathTypeCount++;
          const imageDatas = cEl.getElementsByTagNameNS('*', 'imagedata');
          for (let ii = 0; ii < imageDatas.length; ii++) {
            const rId = imageDatas[ii].getAttribute('r:id') || imageDatas[ii].getAttribute('id');
            if (rId && mediaMap[rId]) {
              const url = mediaMap[rId];
              mediaUrls.push(url);
              pBlocks.push({ type: 'image', url, rId, alt: 'Công thức MathType' });
            }
          }
        }
      }

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

  // 4. Segment Sequential Blocks into Questions based on markers: "Câu 1.", "Câu 1:", "Bài 1."
  const questionSegments: {
    lines: string[];
    blocks: ContentBlock[];
    mediaUrls: string[];
  }[] = [];

  let currentSegment: {
    lines: string[];
    blocks: ContentBlock[];
    mediaUrls: string[];
  } | null = null;

  const questionHeaderRegex = /^(?:câu|bài|question)\s*(\d+)[\s.:\-–]/i;

  for (const block of sequentialBlocks) {
    const isNewQuestionStart = questionHeaderRegex.test(block.text);

    if (isNewQuestionStart) {
      if (currentSegment && currentSegment.lines.length > 0) {
        questionSegments.push(currentSegment);
      }
      currentSegment = {
        lines: [block.text],
        blocks: [...block.contentBlocks],
        mediaUrls: [...block.mediaUrls],
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
    });
  }

  // 5. Classify & Build Complete Question Objects
  const questions: Question[] = [];
  let mcqCount = 0;
  let tfCount = 0;
  let saCount = 0;
  let essayCount = 0;

  for (let qIdx = 0; qIdx < questionSegments.length; qIdx++) {
    const segment = questionSegments[qIdx];
    const fullText = segment.lines.join('\n');
    const qOrder = qIdx + 1;

    // Check for True/False indicators: a), b), c), d)
    const tfPattern = /(?:^|\n)\s*([abcdABCD])[\s.)\-]|\b([abcdABCD])\)/g;
    const tfMatches = Array.from(fullText.matchAll(tfPattern))
      .map((m) => m[1] || m[2])
      .map((s) => s.toLowerCase());
    const uniqueTf = Array.from(new Set(tfMatches));

    // Check for MCQ options: A., B., C., D.
    const mcqPattern = /(?:^|\n|\s{2,})([ABCD])[\s.:\-–]/g;
    const mcqMatches = Array.from(fullText.matchAll(mcqPattern)).map((m) => m[1]);
    const uniqueMcq = Array.from(new Set(mcqMatches));

    let type: QuestionType = 'mcq';
    let confidenceScore = 0.95;

    let stem = fullText;
    let solution = '';
    let correctAnswer: string | string[] | undefined = undefined;

    // Extract Solution / Answer block if present
    const solMatch = fullText.match(/(?:Lời giải|Hướng dẫn giải|Giải chi tiết|Đáp án)[\s.:\-–]([\s\S]*)/i);
    if (solMatch) {
      solution = solMatch[1].trim();
      stem = fullText.substring(0, solMatch.index).trim();
    }

    const media = segment.mediaUrls.map((url) => ({ type: 'image' as const, url }));

    // CLASSIFY TYPE 2: TRUE / FALSE
    if (uniqueTf.length >= 3 && uniqueTf.includes('a') && uniqueTf.includes('b') && uniqueTf.includes('c')) {
      type = 'true_false';
      tfCount++;

      const statements: TrueFalseStatement[] = [
        { id: 'a', statement: 'Mệnh đề a', isCorrect: true },
        { id: 'b', statement: 'Mệnh đề b', isCorrect: false },
        { id: 'c', statement: 'Mệnh đề c', isCorrect: true },
        { id: 'd', statement: 'Mệnh đề d', isCorrect: true },
      ];

      // Apply math delimiter wrapping
      stem = ensureMathDelimiters(stem);
      solution = ensureMathDelimiters(solution);

      const rawStatements = stem.split(/(?:^|\n)\s*([abcdABCD])[\s.)\-]/);
      if (rawStatements.length > 2) {
        stem = ensureMathDelimiters(rawStatements[0].trim());
        for (let i = 1; i < rawStatements.length; i += 2) {
          const letter = rawStatements[i].toLowerCase();
          const content = rawStatements[i + 1]?.trim() || '';
          const targetSt = statements.find((s) => s.id === letter);
          if (targetSt && content) {
            targetSt.statement = ensureMathDelimiters(content);
          }
        }
      }

      questions.push({
        id: `q-docx-${Date.now()}-${qOrder}`,
        lessonId,
        chapterId,
        type: 'true_false',
        difficulty: 'TH',
        order: qOrder,
        points: 1.0,
        stem,
        media,
        statements,
        solution,
        tags: ['Đúng Sai', 'Nhập từ Word'],
        confidenceScore,
      });
    }
    // CLASSIFY TYPE 1: MCQ (A, B, C, D)
    else if (uniqueMcq.length >= 2) {
      type = 'mcq';
      mcqCount++;

      const options: Option[] = [
        { id: 'A', text: 'Phương án A' },
        { id: 'B', text: 'Phương án B' },
        { id: 'C', text: 'Phương án C' },
        { id: 'D', text: 'Phương án D' },
      ];

      const rawOptions = stem.split(/(?:^|\n|\s{2,})([ABCD])[\s.:\-–]/);
      if (rawOptions.length > 2) {
        stem = ensureMathDelimiters(rawOptions[0].trim());
        for (let i = 1; i < rawOptions.length; i += 2) {
          const optLetter = rawOptions[i].toUpperCase();
          const optContent = rawOptions[i + 1]?.trim() || '';
          const targetOpt = options.find((o) => o.id === optLetter);
          if (targetOpt && optContent) {
            const mathified = ensureMathDelimiters(optContent);
            targetOpt.text = mathified;
            targetOpt.latex = mathified;
          }
        }
      } else {
        stem = ensureMathDelimiters(stem);
      }

      solution = ensureMathDelimiters(solution);

      // Check for answer indication (e.g. "Chọn A", "Đáp án: B", "*D.")
      const starMatch = fullText.match(/\*([ABCD])[\s.:\-–]/i);
      const ansMatch = (fullText + ' ' + solution).match(/(?:Chọn|Đáp án|Key)\s*([ABCD])/i);
      if (starMatch) {
        correctAnswer = starMatch[1].toUpperCase();
      } else if (ansMatch) {
        correctAnswer = ansMatch[1].toUpperCase();
      } else {
        correctAnswer = 'A';
      }

      questions.push({
        id: `q-docx-${Date.now()}-${qOrder}`,
        lessonId,
        chapterId,
        type: 'mcq',
        difficulty: 'NB',
        order: qOrder,
        points: 0.25,
        stem,
        media,
        options,
        correctAnswer,
        solution,
        tags: ['Trắc nghiệm', 'Nhập từ Word'],
        confidenceScore,
      });
    }
    // CLASSIFY TYPE 3: SHORT ANSWER OR ESSAY
    else if (/trả lời ngắn|kết quả là|nhập số/i.test(fullText)) {
      type = 'short_answer';
      saCount++;

      questions.push({
        id: `q-docx-${Date.now()}-${qOrder}`,
        lessonId,
        chapterId,
        type: 'short_answer',
        difficulty: 'VD',
        order: qOrder,
        points: 0.5,
        stem: ensureMathDelimiters(stem),
        media,
        shortAnswerKey: {
          acceptedValues: ['0'],
          isNumeric: true,
        },
        solution: ensureMathDelimiters(solution),
        tags: ['Trả lời ngắn', 'Nhập từ Word'],
        confidenceScore: 0.85,
      });
    } else {
      type = 'essay';
      essayCount++;

      questions.push({
        id: `q-docx-${Date.now()}-${qOrder}`,
        lessonId,
        chapterId,
        type: 'essay',
        difficulty: 'VDC',
        order: qOrder,
        points: 1.0,
        stem: ensureMathDelimiters(stem),
        media,
        solution: ensureMathDelimiters(solution),
        tags: ['Tự luận', 'Nhập từ Word'],
        confidenceScore: 0.85,
      });
    }
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
