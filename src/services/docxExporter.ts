import JSZip from 'jszip';
import { Question, Lesson, Chapter } from '../types';

export interface DocxExportOptions {
  lessonTitle: string;
  chapterTitle?: string;
  schoolName?: string;
  teacherName?: string;
  examCode?: string;
  durationMinutes?: number;
  includeAnswers?: boolean;
  includeSolutions?: boolean;
  questions: Question[];
}

/**
 * Strips LaTeX tags or formats them cleanly for Word document text.
 */
function cleanLatexForDocx(text: string): string {
  if (!text) return '';
  return text
    .replace(/\$\$(.*?)\$\$/g, '$1')
    .replace(/\$(.*?)\$/g, '$1')
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)')
    .replace(/\\sqrt\{([^}]+)\}/g, '√($1)')
    .replace(/\\int_\{([^}]+)\}\^\{([^}]+)\}/g, '∫[$1 to $2]')
    .replace(/\\left|\\right/g, '')
    .replace(/\\ge|\\geq/g, '≥')
    .replace(/\\le|\\leq/g, '≤')
    .replace(/\\ne|\\neq/g, '≠')
    .replace(/\\pm/g, '±')
    .replace(/\\times/g, '×')
    .replace(/\\cdot/g, '·')
    .replace(/\\in/g, '∈')
    .replace(/\\notin/g, '∉')
    .replace(/\\subset/g, '⊂')
    .replace(/\\cup/g, '∪')
    .replace(/\\cap/g, '∩')
    .replace(/\\infty/g, '∞')
    .replace(/\\alpha/g, 'α')
    .replace(/\\beta/g, 'β')
    .replace(/\\pi/g, 'π')
    .replace(/\\Delta/g, 'Δ')
    .replace(/\\vec\{([^}]+)\}/g, 'vec($1)')
    .replace(/\\implies/g, '⇒')
    .replace(/\\iff/g, '⇔')
    .replace(/\\circ/g, '°')
    .replace(/\\\\/g, '\n')
    .replace(/\\,/g, ' ')
    .replace(/\\;/g, ' ');
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Builds standard OpenXML Word Document Structure (.docx)
 */
export async function exportExamToDocx(options: DocxExportOptions): Promise<Blob> {
  const {
    lessonTitle,
    chapterTitle = 'Toán 12 – CT GDPT 2018',
    schoolName = 'TRƯỜNG THPT CHUYÊN – HỆ THỐNG TỰ LUYỆN TOÁN 12',
    teacherName = 'Thầy Phan Quốc Cường',
    examCode = '101',
    durationMinutes = 45,
    includeAnswers = true,
    includeSolutions = true,
    questions,
  } = options;

  const zip = new JSZip();

  // 1. [Content_Types].xml
  zip.file(
    '[Content_Types].xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`
  );

  // 2. _rels/.rels
  zip.file(
    '_rels/.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`
  );

  // 3. word/_rels/document.xml.rels
  zip.file(
    'word/_rels/document.xml.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`
  );

  // 4. word/styles.xml
  zip.file(
    'word/styles.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault>
      <w:rPr>
        <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/>
        <w:sz w:val="24"/>
        <w:szCs w:val="24"/>
        <w:lang w:val="vi-VN"/>
      </w:rPr>
    </w:rPrDefault>
  </w:docDefaults>
</w:styles>`
  );

  // Group questions by 4 types
  const mcqQuestions = questions.filter((q) => q.type === 'mcq');
  const tfQuestions = questions.filter((q) => q.type === 'true_false');
  const saQuestions = questions.filter((q) => q.type === 'short_answer');
  const essayQuestions = questions.filter((q) => q.type === 'essay');

  // Build document.xml body paragraphs
  let bodyXml = '';

  // Header Table: School Name and Exam Title
  bodyXml += `
    <w:tbl>
      <w:tblPr>
        <w:tblW w:w="0" w:type="auto"/>
        <w:tblBorders>
          <w:top w:val="none"/><w:left w:val="none"/><w:bottom w:val="none"/><w:right w:val="none"/>
          <w:insideH w:val="none"/><w:insideV w:val="none"/>
        </w:tblBorders>
      </w:tblPr>
      <w:tr>
        <w:tc>
          <w:tcPr><w:tcW w:w="4500" w:type="dxa"/></w:tcPr>
          <w:p>
            <w:pPr><w:jc w:val="center"/></w:pPr>
            <w:r><w:rPr><w:b/><w:sz w:val="22"/></w:rPr><w:t>${escapeXml(schoolName)}</w:t></w:r>
          </w:p>
          <w:p>
            <w:pPr><w:jc w:val="center"/></w:pPr>
            <w:r><w:rPr><w:i/><w:sz w:val="22"/></w:rPr><w:t>Giáo viên: ${escapeXml(teacherName)}</w:t></w:r>
          </w:p>
          <w:p>
            <w:pPr><w:jc w:val="center"/></w:pPr>
            <w:r><w:rPr><w:b/><w:sz w:val="22"/></w:rPr><w:t>MÃ ĐỀ THI: ${escapeXml(examCode)}</w:t></w:r>
          </w:p>
        </w:tc>
        <w:tc>
          <w:tcPr><w:tcW w:w="5000" w:type="dxa"/></w:tcPr>
          <w:p>
            <w:pPr><w:jc w:val="center"/></w:pPr>
            <w:r><w:rPr><w:b/><w:sz w:val="24"/></w:rPr><w:t>ĐỀ KIỂM TRA ĐÁNH GIÁ NĂNG LỰC TOÁN 12</w:t></w:r>
          </w:p>
          <w:p>
            <w:pPr><w:jc w:val="center"/></w:pPr>
            <w:r><w:rPr><w:b/><w:sz w:val="22"/></w:rPr><w:t>${escapeXml(lessonTitle.toUpperCase())}</w:t></w:r>
          </w:p>
          <w:p>
            <w:pPr><w:jc w:val="center"/></w:pPr>
            <w:r><w:rPr><w:i/><w:sz w:val="20"/></w:rPr><w:t>Thời gian làm bài: ${durationMinutes} phút (Không kể thời gian phát đề)</w:t></w:r>
          </w:p>
        </w:tc>
      </w:tr>
    </w:tbl>
    <w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:b/></w:rPr><w:t>----------------------------------------------------------------------------------------------------</w:t></w:r></w:p>
    <w:p><w:r><w:rPr><w:i/></w:rPr><w:t>Họ và tên thí sinh: .................................................................... Lớp: ............. SBD: ....................</w:t></w:r></w:p>
    <w:p/>
  `;

  let qNumber = 1;

  // PHẦN I: TRẮC NGHIỆM NHIỀU LỰA CHỌN
  if (mcqQuestions.length > 0) {
    bodyXml += `
      <w:p>
        <w:pPr><w:spacing w:before="240" w:after="120"/></w:pPr>
        <w:r><w:rPr><w:b/><w:sz w:val="26"/><w:color w:val="0F766E"/></w:rPr><w:t>PHẦN I. Câu trắc nghiệm nhiều phương án lựa chọn (Thí sinh trả lời từ câu ${qNumber} đến câu ${qNumber + mcqQuestions.length - 1}. Mỗi câu hỏi thí sinh chỉ chọn một phương án).</w:t></w:r>
      </w:p>
    `;

    mcqQuestions.forEach((q) => {
      const stem = cleanLatexForDocx(q.stem || '');
      bodyXml += `
        <w:p>
          <w:pPr><w:spacing w:before="120" w:after="60"/></w:pPr>
          <w:r><w:rPr><w:b/></w:rPr><w:t>Câu ${qNumber}: </w:t></w:r>
          <w:r><w:t>${escapeXml(stem)}</w:t></w:r>
        </w:p>
      `;

      if (q.options && q.options.length > 0) {
        q.options.forEach((opt) => {
          const optText = cleanLatexForDocx(opt.text || '');
          bodyXml += `
            <w:p>
              <w:pPr><w:ind w:left="400"/><w:spacing w:after="40"/></w:pPr>
              <w:r><w:rPr><w:b/></w:rPr><w:t>${escapeXml(opt.id)}. </w:t></w:r>
              <w:r><w:t>${escapeXml(optText)}</w:t></w:r>
            </w:p>
          `;
        });
      }
      qNumber++;
    });
  }

  // PHẦN II: TRẮC NGHIỆM ĐÚNG / SAI
  if (tfQuestions.length > 0) {
    const startTf = qNumber;
    bodyXml += `
      <w:p>
        <w:pPr><w:spacing w:before="240" w:after="120"/></w:pPr>
        <w:r><w:rPr><w:b/><w:sz w:val="26"/><w:color w:val="0F766E"/></w:rPr><w:t>PHẦN II. Câu trắc nghiệm đúng sai (Thí sinh trả lời từ câu ${startTf} đến câu ${startTf + tfQuestions.length - 1}. Trong mỗi ý a), b), c), d) ở mỗi câu, thí sinh chọn đúng hoặc sai).</w:t></w:r>
      </w:p>
    `;

    tfQuestions.forEach((q) => {
      const stem = cleanLatexForDocx(q.stem || '');
      bodyXml += `
        <w:p>
          <w:pPr><w:spacing w:before="120" w:after="60"/></w:pPr>
          <w:r><w:rPr><w:b/></w:rPr><w:t>Câu ${qNumber}: </w:t></w:r>
          <w:r><w:t>${escapeXml(stem)}</w:t></w:r>
        </w:p>
      `;

      if (q.statements && q.statements.length > 0) {
        q.statements.forEach((stmt) => {
          const stmtText = cleanLatexForDocx(stmt.statement || '');
          bodyXml += `
            <w:p>
              <w:pPr><w:ind w:left="400"/><w:spacing w:after="40"/></w:pPr>
              <w:r><w:rPr><w:b/></w:rPr><w:t>${escapeXml(stmt.id)}) </w:t></w:r>
              <w:r><w:t>${escapeXml(stmtText)}</w:t></w:r>
            </w:p>
          `;
        });
      }
      qNumber++;
    });
  }

  // PHẦN III: TRẢ LỜI NGẮN
  if (saQuestions.length > 0) {
    const startSa = qNumber;
    bodyXml += `
      <w:p>
        <w:pPr><w:spacing w:before="240" w:after="120"/></w:pPr>
        <w:r><w:rPr><w:b/><w:sz w:val="26"/><w:color w:val="0F766E"/></w:rPr><w:t>PHẦN III. Câu trắc nghiệm trả lời ngắn (Thí sinh trả lời từ câu ${startSa} đến câu ${startSa + saQuestions.length - 1}. Viết kết quả vào phiếu trả lời).</w:t></w:r>
      </w:p>
    `;

    saQuestions.forEach((q) => {
      const stem = cleanLatexForDocx(q.stem || '');
      bodyXml += `
        <w:p>
          <w:pPr><w:spacing w:before="120" w:after="60"/></w:pPr>
          <w:r><w:rPr><w:b/></w:rPr><w:t>Câu ${qNumber}: </w:t></w:r>
          <w:r><w:t>${escapeXml(stem)}</w:t></w:r>
        </w:p>
        <w:p>
          <w:pPr><w:ind w:left="400"/><w:spacing w:after="60"/></w:pPr>
          <w:r><w:rPr><w:i/></w:rPr><w:t>Đáp số: ....................................................................</w:t></w:r>
        </w:p>
      `;
      qNumber++;
    });
  }

  // PHẦN IV: TỰ LUẬN
  if (essayQuestions.length > 0) {
    const startEs = qNumber;
    bodyXml += `
      <w:p>
        <w:pPr><w:spacing w:before="240" w:after="120"/></w:pPr>
        <w:r><w:rPr><w:b/><w:sz w:val="26"/><w:color w:val="0F766E"/></w:rPr><w:t>PHẦN IV. Tự luận (Thí sinh trình bày chi tiết lời giải vào giấy làm bài).</w:t></w:r>
      </w:p>
    `;

    essayQuestions.forEach((q) => {
      const stem = cleanLatexForDocx(q.stem || '');
      bodyXml += `
        <w:p>
          <w:pPr><w:spacing w:before="120" w:after="60"/></w:pPr>
          <w:r><w:rPr><w:b/></w:rPr><w:t>Câu ${qNumber} (${q.points || 2.0} điểm): </w:t></w:r>
          <w:r><w:t>${escapeXml(stem)}</w:t></w:r>
        </w:p>
      `;
      qNumber++;
    });
  }

  // BẢNG ĐÁP ÁN & LỜI GIẢI CHI TIẾT (Nếu bật)
  if (includeAnswers || includeSolutions) {
    bodyXml += `
      <w:p><w:pPr><w:pageBreakBefore/></w:pPr></w:p>
      <w:p>
        <w:pPr><w:jc w:val="center"/><w:spacing w:before="240" w:after="120"/></w:pPr>
        <w:r><w:rPr><w:b/><w:sz w:val="28"/><w:color w:val="0F766E"/></w:rPr><w:t>HƯỚNG DẪN CHẤM &amp; LỜI GIẢI CHI TIẾT</w:t></w:r>
      </w:p>
    `;

    // Answer Key Table
    if (includeAnswers) {
      bodyXml += `
        <w:p><w:r><w:rPr><w:b/><w:sz w:val="24"/></w:rPr><w:t>I. BẢNG ĐÁP ÁN NHANH</w:t></w:r></w:p>
      `;

      let curNum = 1;
      questions.forEach((q) => {
        let ans = '';
        if (q.type === 'mcq') ans = Array.isArray(q.correctAnswer) ? q.correctAnswer.join(', ') : q.correctAnswer || 'A';
        else if (q.type === 'true_false') ans = q.statements?.map((s) => `${s.id}: ${s.isCorrect ? 'Đúng' : 'Sai'}`).join(' | ') || '';
        else if (q.type === 'short_answer') ans = q.shortAnswerKey?.acceptedValues.join(' hoặc ') || '';
        else if (q.type === 'essay') ans = 'Theo barem tự luận';

        bodyXml += `
          <w:p>
            <w:pPr><w:ind w:left="300"/><w:spacing w:after="40"/></w:pPr>
            <w:r><w:rPr><w:b/></w:rPr><w:t>Câu ${curNum}: </w:t></w:r>
            <w:r><w:rPr><w:b/><w:color w:val="0F766E"/></w:rPr><w:t>${escapeXml(ans)}</w:t></w:r>
          </w:p>
        `;
        curNum++;
      });
    }

    // Step-by-step Detailed Solutions
    if (includeSolutions) {
      bodyXml += `
        <w:p><w:pPr><w:spacing w:before="240" w:after="120"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="24"/></w:rPr><w:t>II. LỜI GIẢI CHI TIẾT TỪNG CÂU</w:t></w:r></w:p>
      `;

      let curNum = 1;
      questions.forEach((q) => {
        const sol = cleanLatexForDocx(q.solution || 'Đang cập nhật lời giải...');
        bodyXml += `
          <w:p>
            <w:pPr><w:spacing w:before="120" w:after="40"/></w:pPr>
            <w:r><w:rPr><w:b/><w:color w:val="0F766E"/></w:rPr><w:t>Câu ${curNum}: </w:t></w:r>
            <w:r><w:t>${escapeXml(sol)}</w:t></w:r>
          </w:p>
        `;
        curNum++;
      });
    }
  }

  // 5. word/document.xml
  zip.file(
    'word/document.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
            xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math">
  <w:body>
    ${bodyXml}
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134"/>
    </w:sectPr>
  </w:body>
</w:document>`
  );

  return await zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
}

/**
 * Triggers browser download of the generated DOCX exam.
 */
export async function downloadExamDocx(options: DocxExportOptions, filename?: string) {
  const blob = await exportExamToDocx(options);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `De_Toan_12_${options.lessonTitle.replace(/[^a-zA-Z0-9]/g, '_')}.docx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
