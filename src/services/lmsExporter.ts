import { Question } from '../types';

function escapeXml(unsafe: string): string {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Converts question bank to Moodle XML format for direct import into Moodle LMS.
 */
export function exportToMoodleXml(questions: Question[], categoryName = 'Toán 12 - GDPT 2018'): string {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<quiz>
  <!-- Category Info -->
  <question type="category">
    <category>
      <text>$course$/${escapeXml(categoryName)}</text>
    </category>
  </question>
`;

  questions.forEach((q, idx) => {
    const qName = `Câu ${idx + 1} (${q.type.toUpperCase()} - ${q.difficulty})`;
    const stem = q.stem || '';
    const sol = q.solution || '';

    if (q.type === 'mcq') {
      xml += `
  <question type="multichoice">
    <name><text>${escapeXml(qName)}</text></name>
    <questiontext format="html">
      <text><![CDATA[<p>${stem}</p>]]></text>
    </questiontext>
    <generalfeedback format="html">
      <text><![CDATA[<p>${sol}</p>]]></text>
    </generalfeedback>
    <defaultgrade>${q.points || 1.0}</defaultgrade>
    <single>true</single>
    <shuffleanswers>true</shuffleanswers>
    <answernumbering>ABCD</answernumbering>
`;
      q.options?.forEach((opt) => {
        const isCorrect = opt.id === q.correctAnswer;
        const fraction = isCorrect ? '100' : '0';
        xml += `
    <answer fraction="${fraction}" format="html">
      <text><![CDATA[<p>${opt.text}</p>]]></text>
      <feedback format="html"><text><![CDATA[<p>${isCorrect ? 'Chính xác!' : 'Chưa đúng'}</p>]]></text></feedback>
    </answer>
`;
      });
      xml += `  </question>\n`;
    } else if (q.type === 'short_answer') {
      xml += `
  <question type="shortanswer">
    <name><text>${escapeXml(qName)}</text></name>
    <questiontext format="html">
      <text><![CDATA[<p>${stem}</p>]]></text>
    </questiontext>
    <generalfeedback format="html">
      <text><![CDATA[<p>${sol}</p>]]></text>
    </generalfeedback>
    <defaultgrade>${q.points || 1.0}</defaultgrade>
    <usecase>0</usecase>
`;
      q.shortAnswerKey?.acceptedValues.forEach((val) => {
        xml += `
    <answer fraction="100" format="plain_text">
      <text>${val}</text>
      <feedback format="html"><text><![CDATA[<p>Đúng!</p>]]></text></feedback>
    </answer>
`;
      });
      xml += `  </question>\n`;
    } else if (q.type === 'essay') {
      xml += `
  <question type="essay">
    <name><text>${escapeXml(qName)}</text></name>
    <questiontext format="html">
      <text><![CDATA[<p>${stem}</p>]]></text>
    </questiontext>
    <generalfeedback format="html">
      <text><![CDATA[<p>${sol}</p>]]></text>
    </generalfeedback>
    <defaultgrade>${q.points || 2.0}</defaultgrade>
    <responseformat>editor</responseformat>
    <responserequired>1</responserequired>
  </question>\n`;
    }
  });

  xml += `</quiz>`;
  return xml;
}

/**
 * Converts question bank to standard GIFT text format.
 */
export function exportToGiftFormat(questions: Question[]): string {
  let gift = `// BỘ ĐỀ TOÁN 12 - CHUẨN ĐỊNH DẠNG GIFT LMS\n\n`;

  questions.forEach((q, idx) => {
    const qName = `::Câu ${idx + 1} - ${q.difficulty}::`;
    const stem = (q.stem || '').replace(/[\{\}\~\=\#]/g, '\\$&');

    if (q.type === 'mcq') {
      gift += `${qName} ${stem} {\n`;
      q.options?.forEach((opt) => {
        const isCorrect = opt.id === q.correctAnswer;
        const prefix = isCorrect ? '=' : '~';
        gift += `  ${prefix}${opt.text.replace(/[\{\}\~\=\#]/g, '\\$&')}\n`;
      });
      gift += `}\n\n`;
    } else if (q.type === 'short_answer') {
      const keys = q.shortAnswerKey?.acceptedValues.map((k) => `=${k}`).join(' ') || '';
      gift += `${qName} ${stem} {${keys}}\n\n`;
    }
  });

  return gift;
}

/**
 * Triggers client-side download of Moodle XML file.
 */
export function downloadMoodleXml(questions: Question[], filename = 'Ngan_Hang_De_Toan_12_Moodle.xml') {
  const xml = exportToMoodleXml(questions);
  const blob = new Blob([xml], { type: 'application/xml;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Triggers client-side download of GIFT format file.
 */
export function downloadGiftFile(questions: Question[], filename = 'De_Toan_12_GIFT.txt') {
  const gift = exportToGiftFormat(questions);
  const blob = new Blob([gift], { type: 'text/plain;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
