import JSZip from 'jszip';
import { Question, QuestionType, Option, TrueFalseStatement, DocxParseReport, DocxParseWarning } from '../types';

/**
 * Converts OMML (Office Math Markup Language) XML string to clean LaTeX
 */
export function convertOmmlToLatex(ommlNode: Element): string {
  if (!ommlNode) return '';

  function parseNode(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent || '';
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return '';

    const el = node as Element;
    const tagName = el.localName || el.tagName.replace(/^m:/, '');

    switch (tagName) {
      case 'oMathPara':
      case 'oMath': {
        const children = Array.from(el.childNodes).map(parseNode).join('');
        return children;
      }
      case 't': {
        // Text inside math run
        const text = el.textContent || '';
        return normalizeMathSymbols(text);
      }
      case 'r': {
        // Math run
        return Array.from(el.childNodes).map(parseNode).join('');
      }
      case 'f': {
        // Fraction: <m:fPr>, <m:num>, <m:den>
        const num = el.getElementsByTagNameNS('*', 'num')[0] || el.querySelector('num, [nodeName="m:num"]');
        const den = el.getElementsByTagNameNS('*', 'den')[0] || el.querySelector('den, [nodeName="m:den"]');
        const numLatex = num ? Array.from(num.childNodes).map(parseNode).join('') : '';
        const denLatex = den ? Array.from(den.childNodes).map(parseNode).join('') : '';
        return `\\frac{${numLatex.trim()}}{${denLatex.trim()}}`;
      }
      case 'rad': {
        // Radical (sqrt / nth root): <m:radPr>, <m:deg>, <m:e>
        const deg = el.getElementsByTagNameNS('*', 'deg')[0] || el.querySelector('deg, [nodeName="m:deg"]');
        const e = el.getElementsByTagNameNS('*', 'e')[0] || el.querySelector('e, [nodeName="m:e"]');
        const eLatex = e ? Array.from(e.childNodes).map(parseNode).join('') : '';
        const degLatex = deg ? Array.from(deg.childNodes).map(parseNode).join('').trim() : '';
        if (degLatex && degLatex.length > 0) {
          return `\\sqrt[${degLatex}]{${eLatex.trim()}}`;
        }
        return `\\sqrt{${eLatex.trim()}}`;
      }
      case 'sSub': {
        // Subscript: <m:e>, <m:sub>
        const e = el.getElementsByTagNameNS('*', 'e')[0] || el.querySelector('e');
        const sub = el.getElementsByTagNameNS('*', 'sub')[0] || el.querySelector('sub');
        const eLatex = e ? Array.from(e.childNodes).map(parseNode).join('') : '';
        const subLatex = sub ? Array.from(sub.childNodes).map(parseNode).join('') : '';
        return `${eLatex}_{${subLatex.trim()}}`;
      }
      case 'sSup': {
        // Superscript: <m:e>, <m:sup>
        const e = el.getElementsByTagNameNS('*', 'e')[0] || el.querySelector('e');
        const sup = el.getElementsByTagNameNS('*', 'sup')[0] || el.querySelector('sup');
        const eLatex = e ? Array.from(e.childNodes).map(parseNode).join('') : '';
        const supLatex = sup ? Array.from(sup.childNodes).map(parseNode).join('') : '';
        return `${eLatex}^{${supLatex.trim()}}`;
      }
      case 'sSubSup': {
        // Sub-Superscript: <m:e>, <m:sub>, <m:sup>
        const e = el.getElementsByTagNameNS('*', 'e')[0] || el.querySelector('e');
        const sub = el.getElementsByTagNameNS('*', 'sub')[0] || el.querySelector('sub');
        const sup = el.getElementsByTagNameNS('*', 'sup')[0] || el.querySelector('sup');
        const eLatex = e ? Array.from(e.childNodes).map(parseNode).join('') : '';
        const subLatex = sub ? Array.from(sub.childNodes).map(parseNode).join('') : '';
        const supLatex = sup ? Array.from(sup.childNodes).map(parseNode).join('') : '';
        return `${eLatex}_{${subLatex.trim()}}^{${supLatex.trim()}}`;
      }
      case 'd': {
        // Delimiters (brackets / parentheses): <m:e>
        const e = el.getElementsByTagNameNS('*', 'e')[0] || el.querySelector('e');
        const content = e ? Array.from(e.childNodes).map(parseNode).join('') : '';
        return `\\left(${content.trim()}\\right)`;
      }
      case 'nary': {
        // Integrals, Sums, Products
        const naryPr = el.getElementsByTagNameNS('*', 'naryPr')[0] || el.querySelector('naryPr');
        const chr = naryPr?.getElementsByTagNameNS('*', 'chr')[0]?.getAttribute('m:val') || '∫';
        const sub = el.getElementsByTagNameNS('*', 'sub')[0] || el.querySelector('sub');
        const sup = el.getElementsByTagNameNS('*', 'sup')[0] || el.querySelector('sup');
        const e = el.getElementsByTagNameNS('*', 'e')[0] || el.querySelector('e');

        let symbol = '\\int';
        if (chr === '∑' || chr === 'sum') symbol = '\\sum';
        if (chr === '∏' || chr === 'prod') symbol = '\\prod';

        const subLatex = sub ? Array.from(sub.childNodes).map(parseNode).join('').trim() : '';
        const supLatex = sup ? Array.from(sup.childNodes).map(parseNode).join('').trim() : '';
        const eLatex = e ? Array.from(e.childNodes).map(parseNode).join('') : '';

        let limitStr = '';
        if (subLatex) limitStr += `_{${subLatex}}`;
        if (supLatex) limitStr += `^{${supLatex}}`;

        return `${symbol}${limitStr} ${eLatex}`;
      }
      case 'acc': {
        // Accent: vector, bar, hat
        const accPr = el.getElementsByTagNameNS('*', 'accPr')[0] || el.querySelector('accPr');
        const chr = accPr?.getElementsByTagNameNS('*', 'chr')[0]?.getAttribute('m:val') || '→';
        const e = el.getElementsByTagNameNS('*', 'e')[0] || el.querySelector('e');
        const eLatex = e ? Array.from(e.childNodes).map(parseNode).join('').trim() : '';

        if (chr === '→' || chr === '⃗') return `\\vec{${eLatex}}`;
        if (chr === '¯' || chr === '–') return `\\overline{${eLatex}}`;
        if (chr === '^' || chr === '̂') return `\\hat{${eLatex}}`;
        return `\\vec{${eLatex}}`;
      }
      default: {
        return Array.from(el.childNodes).map(parseNode).join('');
      }
    }
  }

  return parseNode(ommlNode);
}

/**
 * Normalizes Unicode mathematical symbols to standard LaTeX macros
 */
function normalizeMathSymbols(raw: string): string {
  return raw
    .replace(/≤/g, ' \\le ')
    .replace(/≥/g, ' \\ge ')
    .replace(/≠/g, ' \\ne ')
    .replace(/±/g, ' \\pm ')
    .replace(/∈/g, ' \\in ')
    .replace(/∉/g, ' \\notin ')
    .replace(/⊂/g, ' \\subset ')
    .replace(/∪/g, ' \\cup ')
    .replace(/∩/g, ' \\cap ')
    .replace(/∅/g, ' \\emptyset ')
    .replace(/∞/g, ' \\infty ')
    .replace(/→/g, ' \\to ')
    .replace(/⇒/g, ' \\implies ')
    .replace(/⇔/g, ' \\iff ')
    .replace(/α/g, '\\alpha ')
    .replace(/β/g, '\\beta ')
    .replace(/γ/g, '\\gamma ')
    .replace(/Δ/g, '\\Delta ')
    .replace(/δ/g, '\\delta ')
    .replace(/π/g, '\\pi ')
    .replace(/θ/g, '\\theta ')
    .replace(/λ/g, '\\lambda ')
    .replace(/μ/g, '\\mu ')
    .replace(/σ/g, '\\sigma ')
    .replace(/φ/g, '\\varphi ')
    .replace(/ω/g, '\\omega ')
    .replace(/ℝ/g, '\\mathbb{R}')
    .replace(/ℤ/g, '\\mathbb{Z}')
    .replace(/ℕ/g, '\\mathbb{N}')
    .replace(/ℚ/g, '\\mathbb{Q}')
    .replace(/·/g, ' \\cdot ');
}

/**
 * Main DOCX File Parser Pipeline
 */
export async function parseDocxFile(
  file: File,
  lessonId: string = 'lesson-1',
  chapterId: string = 'chap-1'
): Promise<{ report: DocxParseReport; questions: Question[] }> {
  const zip = new JSZip();
  const zipContents = await zip.loadAsync(file);

  const warnings: DocxParseWarning[] = [];
  const unparsedParagraphs: string[] = [];

  // 1. Read document relationships for media
  const relsXmlStr = await zipContents.file('word/_rels/document.xml.rels')?.async('text') || '';
  const mediaMap: Record<string, string> = {};

  if (relsXmlStr) {
    const parser = new DOMParser();
    const relsDoc = parser.parseFromString(relsXmlStr, 'application/xml');
    const rels = relsDoc.getElementsByTagName('Relationship');
    for (let i = 0; i < rels.length; i++) {
      const id = rels[i].getAttribute('Id');
      const target = rels[i].getAttribute('Target');
      const type = rels[i].getAttribute('Type') || '';
      if (id && target && type.includes('image')) {
        const mediaPath = target.startsWith('media/') ? `word/${target}` : `word/${target.replace(/^\//, '')}`;
        const imageFile = zipContents.file(mediaPath);
        if (imageFile) {
          const mimeType = mediaPath.endsWith('.png') ? 'image/png' : mediaPath.endsWith('.jpg') || mediaPath.endsWith('.jpeg') ? 'image/jpeg' : 'image/png';
          const base64 = await imageFile.async('base64');
          mediaMap[id] = `data:${mimeType};base64,${base64}`;
        }
      }
    }
  }

  // 2. Read word/document.xml
  const docXmlStr = await zipContents.file('word/document.xml')?.async('text');
  if (!docXmlStr) {
    throw new Error('Không tìm thấy file word/document.xml trong file DOCX. File có thể bị hỏng.');
  }

  const parser = new DOMParser();
  const docXml = parser.parseFromString(docXmlStr, 'application/xml');
  const body = docXml.getElementsByTagNameNS('*', 'body')[0] || docXml.querySelector('body');

  if (!body) {
    throw new Error('Không thể đọc cấu trúc nội dung tài liệu Word.');
  }

  let formulaCount = 0;
  let imageCount = Object.keys(mediaMap).length;
  let tableCount = body.getElementsByTagNameNS('*', 'tbl').length;

  // Extract all paragraphs with preserved Math / text / images
  const paragraphs: { text: string; hasMath: boolean; imageRIds: string[] }[] = [];
  const pElements = Array.from(body.childNodes).filter((n) => n.nodeType === Node.ELEMENT_NODE) as Element[];

  for (const el of pElements) {
    const tagName = el.localName || el.tagName.replace(/^w:/, '');
    if (tagName === 'p') {
      let pText = '';
      let hasMath = false;
      const imageRIds: string[] = [];

      for (const child of Array.from(el.childNodes)) {
        const cEl = child as Element;
        const cTag = cEl.localName || cEl.tagName.replace(/^[wm]:/, '');

        if (cTag === 'r') {
          // Regular text run or drawing
          const t = cEl.getElementsByTagNameNS('*', 't')[0]?.textContent || '';
          pText += t;

          // Check for blip image relationship
          const blip = cEl.getElementsByTagNameNS('*', 'blip')[0];
          const rEmbed = blip?.getAttribute('r:embed') || blip?.getAttribute('embed');
          if (rEmbed && mediaMap[rEmbed]) {
            imageRIds.push(rEmbed);
          }
        } else if (cTag === 'oMath' || cTag === 'oMathPara') {
          // OMML math element!
          hasMath = true;
          formulaCount++;
          const mathLatex = convertOmmlToLatex(cEl);
          if (mathLatex) {
            pText += `$${mathLatex}$`;
          }
        }
      }

      const trimmed = pText.trim();
      if (trimmed || imageRIds.length > 0) {
        paragraphs.push({ text: trimmed, hasMath, imageRIds });
      }
    }
  }

  // 3. Segment into Questions based on markers: "Câu 1.", "Câu 1:", "Bài 1."
  const questionBlocks: { rawText: string; lines: string[]; imageRIds: string[] }[] = [];
  let currentBlock: { lines: string[]; imageRIds: string[] } | null = null;

  const questionStartRegex = /^(câu|bài|question)\s*(\d+)[\s.:\-–]/i;

  for (let idx = 0; idx < paragraphs.length; idx++) {
    const { text, imageRIds } = paragraphs[idx];
    if (questionStartRegex.test(text)) {
      if (currentBlock && currentBlock.lines.length > 0) {
        questionBlocks.push({
          rawText: currentBlock.lines.join('\n'),
          lines: currentBlock.lines,
          imageRIds: currentBlock.imageRIds,
        });
      }
      currentBlock = { lines: [text], imageRIds: [...imageRIds] };
    } else {
      if (currentBlock) {
        currentBlock.lines.push(text);
        currentBlock.imageRIds.push(...imageRIds);
      } else {
        unparsedParagraphs.push(text);
      }
    }
  }

  if (currentBlock && currentBlock.lines.length > 0) {
    questionBlocks.push({
      rawText: currentBlock.lines.join('\n'),
      lines: currentBlock.lines,
      imageRIds: currentBlock.imageRIds,
    });
  }

  // If no "Câu X" markers were found, treat each paragraph group as questions or fallback
  if (questionBlocks.length === 0 && paragraphs.length > 0) {
    warnings.push({
      lineOrIndex: 0,
      code: 'NO_QUESTION_MARKERS',
      message: 'Không tìm thấy định dạng "Câu 1.", "Câu 2:" chuẩn. Hệ thống tự động phân tách theo đoạn văn.',
      severity: 'medium',
    });
    questionBlocks.push({
      rawText: paragraphs.map((p) => p.text).join('\n'),
      lines: paragraphs.map((p) => p.text),
      imageRIds: paragraphs.flatMap((p) => p.imageRIds),
    });
  }

  // 4. Classify each question into 4 types
  const questions: Question[] = [];
  let mcqCount = 0;
  let tfCount = 0;
  let saCount = 0;
  let essayCount = 0;

  for (let qIdx = 0; qIdx < questionBlocks.length; qIdx++) {
    const block = questionBlocks[qIdx];
    const fullText = block.lines.join('\n');
    const qOrder = qIdx + 1;

    // Check for True/False indicators (a), b), c), d) or a., b., c., d.)
    const tfPattern = /(?:^|\n)\s*([abcdABCD])[\s.)\-]|\b([abcdABCD])\)/g;
    const tfMatches = Array.from(fullText.matchAll(tfPattern)).map((m) => m[1] || m[2]).map((s) => s.toLowerCase());
    const uniqueTf = Array.from(new Set(tfMatches));

    // Check for MCQ options A., B., C., D.
    const mcqPattern = /(?:^|\n|\s{2,})([ABCD])[\s.:\-–]/g;
    const mcqMatches = Array.from(fullText.matchAll(mcqPattern)).map((m) => m[1]);
    const uniqueMcq = Array.from(new Set(mcqMatches));

    // Check for Short Answer keyword
    const isShortAnswer = /trả lời ngắn|kết quả là|nhập số|giá trị bằng/i.test(fullText);

    // Check for Essay keyword
    const isEssay = /tự luận|chứng minh rằng|trình bày bài giải|lập bảng biến thiên/i.test(fullText);

    let type: QuestionType = 'mcq';
    let confidenceScore = 0.9;
    const media = block.imageRIds.map((rId) => ({ type: 'image' as const, url: mediaMap[rId] }));

    let stem = fullText;
    let solution = '';
    let correctAnswer: string | string[] | undefined = undefined;

    // Extract Solution / Answer if present
    const solMatch = fullText.match(/(?:Lời giải|Hướng dẫn giải|Giải chi tiết|Đáp án)[\s.:\-–]([\s\S]*)/i);
    if (solMatch) {
      solution = solMatch[1].trim();
      stem = fullText.substring(0, solMatch.index).trim();
    }

    if (uniqueTf.length >= 3 && (uniqueTf.includes('a') && uniqueTf.includes('b') && uniqueTf.includes('c'))) {
      // Classified as True/False (Đúng / Sai)
      type = 'true_false';
      tfCount++;
      confidenceScore = 0.95;

      const statements: TrueFalseStatement[] = [
        { id: 'a', statement: 'Mệnh đề a', isCorrect: true },
        { id: 'b', statement: 'Mệnh đề b', isCorrect: false },
        { id: 'c', statement: 'Mệnh đề c', isCorrect: true },
        { id: 'd', statement: 'Mệnh đề d', isCorrect: true },
      ];

      // Parse individual sub-statements
      const rawStatements = stem.split(/(?:^|\n)\s*([abcdABCD])[\s.)\-]/);
      if (rawStatements.length > 2) {
        stem = rawStatements[0].trim();
        for (let i = 1; i < rawStatements.length; i += 2) {
          const letter = rawStatements[i].toLowerCase();
          const content = rawStatements[i + 1]?.trim() || '';
          const targetSt = statements.find((s) => s.id === letter);
          if (targetSt) {
            targetSt.statement = content;
            targetSt.isCorrect = !/sai|không đúng/i.test(content);
          }
        }
      }

      questions.push({
        id: `q-parsed-${Date.now()}-${qOrder}`,
        lessonId,
        chapterId,
        type: 'true_false',
        difficulty: 'VD',
        order: qOrder,
        points: 1.0,
        stem,
        media: media.length > 0 ? media : undefined,
        statements,
        solution: solution || 'Xem lời giải chi tiết từng ý a, b, c, d.',
        tags: ['Đúng Sai', 'Imported DOCX'],
        confidenceScore,
      });
    } else if (uniqueMcq.length >= 2 || type === 'mcq') {
      // Classified as MCQ (Trắc nghiệm nhiều lựa chọn)
      type = 'mcq';
      mcqCount++;

      const options: Option[] = [
        { id: 'A', text: 'Phương án A' },
        { id: 'B', text: 'Phương án B' },
        { id: 'C', text: 'Phương án C' },
        { id: 'D', text: 'Phương án D' },
      ];

      // Parse options
      const optSplit = stem.split(/(?:^|\n|\s{2,})([ABCD])[\s.:\-–]/);
      if (optSplit.length > 2) {
        stem = optSplit[0].trim();
        for (let i = 1; i < optSplit.length; i += 2) {
          const optLetter = optSplit[i].toUpperCase();
          const optContent = optSplit[i + 1]?.trim() || '';
          const targetOpt = options.find((o) => o.id === optLetter);
          if (targetOpt) {
            targetOpt.text = optContent;
          }
        }
      }

      // Check for answer hint in solution
      const ansMatch = solution.match(/(?:Chọn|Đáp án)[\s:]([ABCD])/i);
      if (ansMatch) {
        correctAnswer = ansMatch[1].toUpperCase();
      } else {
        correctAnswer = 'A';
      }

      questions.push({
        id: `q-parsed-${Date.now()}-${qOrder}`,
        lessonId,
        chapterId,
        type: 'mcq',
        difficulty: 'TH',
        order: qOrder,
        points: 0.25,
        stem,
        media: media.length > 0 ? media : undefined,
        options,
        correctAnswer,
        solution: solution || 'Lời giải chi tiết câu hỏi trắc nghiệm.',
        tags: ['Trắc nghiệm', 'Imported DOCX'],
        confidenceScore,
      });
    } else if (isShortAnswer) {
      type = 'short_answer';
      saCount++;
      questions.push({
        id: `q-parsed-${Date.now()}-${qOrder}`,
        lessonId,
        chapterId,
        type: 'short_answer',
        difficulty: 'VD',
        order: qOrder,
        points: 0.5,
        stem,
        media: media.length > 0 ? media : undefined,
        shortAnswerKey: {
          acceptedValues: ['0', '1'],
          isNumeric: true,
          tolerance: 0.01,
        },
        solution: solution || 'Kết quả câu trả lời ngắn.',
        tags: ['Trả lời ngắn', 'Imported DOCX'],
        confidenceScore: 0.85,
      });
    } else {
      type = 'essay';
      essayCount++;
      questions.push({
        id: `q-parsed-${Date.now()}-${qOrder}`,
        lessonId,
        chapterId,
        type: 'essay',
        difficulty: 'VD',
        order: qOrder,
        points: 2.0,
        stem,
        media: media.length > 0 ? media : undefined,
        rubric: [
          { id: 'r1', criterion: 'Trình bày phương pháp giải', maxPoints: 1.0, description: 'Đúng hướng và biến đổi' },
          { id: 'r2', criterion: 'Kết quả và kết luận', maxPoints: 1.0, description: 'Tính toán chính xác' },
        ],
        solution: solution || 'Hướng dẫn giải chi tiết bài toán tự luận.',
        tags: ['Tự luận', 'Imported DOCX'],
        confidenceScore: 0.8,
      });
    }
  }

  const report: DocxParseReport = {
    fileName: file.name,
    fileSize: file.size,
    totalDetectedQuestions: questions.length,
    formulaCount,
    imageCount,
    tableCount,
    mcqCount,
    tfCount,
    saCount,
    essayCount,
    warnings,
    unparsedParagraphs,
    parsedAt: new Date().toISOString(),
    version: 1,
  };

  return { report, questions };
}
