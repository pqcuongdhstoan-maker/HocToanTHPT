import { Question, Option, TrueFalseStatement } from '../types';

export interface ExamDictionaries {
  mathMap: Record<string, string>; // math_1 -> latex
  imageMap: Record<string, string>; // image_1 -> url
  tableMap: Record<string, string>; // table_1 -> latexArray
}

let mathIdCounter = 1;
let imageIdCounter = 1;
let tableIdCounter = 1;

export const resetDictionaryCounters = () => {
  mathIdCounter = 1;
  imageIdCounter = 1;
  tableIdCounter = 1;
};

/**
 * Converts a string with LaTeX and images into text with internal tokens [math:math_x], [image:image_x], [table:table_x]
 */
export function tokenizeStringToInternalSource(
  rawText: string = '',
  dict: ExamDictionaries
): string {
  if (!rawText) return '';

  let text = rawText;

  // 1. Tokenize display math $$...$$ and \[...\]
  text = text.replace(/(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\])/g, (match) => {
    let clean = match;
    if (clean.startsWith('$$') && clean.endsWith('$$')) clean = clean.slice(2, -2).trim();
    if (clean.startsWith('\\[') && clean.endsWith('\\]')) clean = clean.slice(2, -2).trim();

    // Check if it's a table \begin{array}
    if (clean.includes('\\begin{array}')) {
      const tableId = `table_${tableIdCounter++}`;
      dict.tableMap[tableId] = clean;
      return `\n[table:${tableId}]\n`;
    }

    const mathId = `math_${mathIdCounter++}`;
    dict.mathMap[mathId] = clean;
    return `[math:${mathId}]`;
  });

  // 2. Tokenize inline math $...$ and \(...\)
  text = text.replace(/((?<!\\)\$(?!\$)[^\$\n]+?(?<!\\)\$|\\\([\s\S]*?\\\))/g, (match) => {
    let clean = match;
    if (clean.startsWith('$') && clean.endsWith('$')) clean = clean.slice(1, -1).trim();
    if (clean.startsWith('\\(') && clean.endsWith('\\)')) clean = clean.slice(2, -2).trim();

    const mathId = `math_${mathIdCounter++}`;
    dict.mathMap[mathId] = clean;
    return `[math:${mathId}]`;
  });

  return text;
}

/**
 * Converts an array of Question objects into clean editable Source Text + Dictionaries
 */
export function convertQuestionsToSourceText(
  questions: Question[]
): { sourceText: string; dictionaries: ExamDictionaries } {
  resetDictionaryCounters();
  const dict: ExamDictionaries = {
    mathMap: {},
    imageMap: {},
    tableMap: {},
  };

  const lines: string[] = [];

  // Group by question type
  const mcqQuestions = questions.filter((q) => q.type === 'mcq');
  const tfQuestions = questions.filter((q) => q.type === 'true_false');
  const saQuestions = questions.filter((q) => q.type === 'short_answer');
  const essayQuestions = questions.filter((q) => q.type === 'essay');

  let currentQuestionIndex = 1;

  if (mcqQuestions.length > 0) {
    lines.push('PHẦN I. Câu trắc nghiệm nhiều phương án lựa chọn. Mỗi câu hỏi thí sinh chỉ chọn một phương án.');
    lines.push('');

    for (const q of mcqQuestions) {
      lines.push(`Câu ${currentQuestionIndex++}. ${tokenizeStringToInternalSource(q.stem, dict)}`);

      // Add attached images
      if (q.media && q.media.length > 0) {
        for (const m of q.media) {
          const imgId = `image_${imageIdCounter++}`;
          dict.imageMap[imgId] = m.url;
          lines.push(`[image:${imgId}]`);
        }
      }

      // Add options A, B, C, D
      if (q.options && q.options.length > 0) {
        for (const opt of q.options) {
          const isCorrect = q.correctAnswer === opt.id;
          const prefix = isCorrect ? `*${opt.id}.` : `${opt.id}.`;
          lines.push(`${prefix} ${tokenizeStringToInternalSource(opt.text, dict)}`);
        }
      }

      if (q.solution) {
        lines.push('[solution]');
        lines.push(tokenizeStringToInternalSource(q.solution, dict));
        lines.push('[/solution]');
      }

      lines.push('');
    }
  }

  if (tfQuestions.length > 0) {
    lines.push('PHẦN II. Câu trắc nghiệm đúng sai. Trong mỗi ý a), b), c), d) ở mỗi câu, thí sinh chọn đúng hoặc sai.');
    lines.push('');

    for (const q of tfQuestions) {
      lines.push(`Câu ${currentQuestionIndex++}. ${tokenizeStringToInternalSource(q.stem, dict)}`);

      if (q.media && q.media.length > 0) {
        for (const m of q.media) {
          const imgId = `image_${imageIdCounter++}`;
          dict.imageMap[imgId] = m.url;
          lines.push(`[image:${imgId}]`);
        }
      }

      if (q.statements && q.statements.length > 0) {
        for (const st of q.statements) {
          const tag = st.isCorrect ? '[ĐÚNG]' : '[SAI]';
          lines.push(`${st.id}) ${tokenizeStringToInternalSource(st.statement, dict)} ${tag}`);
        }
      }

      if (q.solution) {
        lines.push('[solution]');
        lines.push(tokenizeStringToInternalSource(q.solution, dict));
        lines.push('[/solution]');
      }

      lines.push('');
    }
  }

  if (saQuestions.length > 0) {
    lines.push('PHẦN III. Câu trắc nghiệm trả lời ngắn.');
    lines.push('');

    for (const q of saQuestions) {
      lines.push(`Câu ${currentQuestionIndex++}. ${tokenizeStringToInternalSource(q.stem, dict)}`);

      if (q.media && q.media.length > 0) {
        for (const m of q.media) {
          const imgId = `image_${imageIdCounter++}`;
          dict.imageMap[imgId] = m.url;
          lines.push(`[image:${imgId}]`);
        }
      }

      const val = q.shortAnswerKey?.acceptedValues?.[0] || '0';
      lines.push(`[key: ${val}]`);

      if (q.solution) {
        lines.push('[solution]');
        lines.push(tokenizeStringToInternalSource(q.solution, dict));
        lines.push('[/solution]');
      }

      lines.push('');
    }
  }

  if (essayQuestions.length > 0) {
    lines.push('PHẦN IV. Câu hỏi tự luận.');
    lines.push('');

    for (const q of essayQuestions) {
      lines.push(`Câu ${currentQuestionIndex++}. ${tokenizeStringToInternalSource(q.stem, dict)}`);

      if (q.media && q.media.length > 0) {
        for (const m of q.media) {
          const imgId = `image_${imageIdCounter++}`;
          dict.imageMap[imgId] = m.url;
          lines.push(`[image:${imgId}]`);
        }
      }

      if (q.solution) {
        lines.push('[solution]');
        lines.push(tokenizeStringToInternalSource(q.solution, dict));
        lines.push('[/solution]');
      }

      lines.push('');
    }
  }

  return {
    sourceText: lines.join('\n'),
    dictionaries: dict,
  };
}

/**
 * Replaces internal tokens [math:math_x], [image:image_x], [table:table_x] in a text
 * with clean LaTeX strings ($...$ / $$...$$) for MathJax visual rendering.
 */
export function detokenizeInternalSource(
  source: string,
  dict: ExamDictionaries
): string {
  if (!source) return '';

  let text = source;

  // Replace [math:id]
  text = text.replace(/\[math:([a-zA-Z0-9_]+)\]/g, (_, id) => {
    const latex = dict.mathMap[id];
    return latex ? `$${latex}$` : '';
  });

  // Replace [table:id]
  text = text.replace(/\[table:([a-zA-Z0-9_]+)\]/g, (_, id) => {
    const tableLatex = dict.tableMap[id];
    return tableLatex ? `\n$$\n${tableLatex}\n$$\n` : '';
  });

  return text;
}

/**
 * Parses Source Text + Dictionaries back into Question[] array
 */
export function parseSourceTextToQuestions(
  sourceText: string,
  dict: ExamDictionaries,
  defaultLessonId: string = 'lesson-1',
  defaultChapterId: string = 'chap-1'
): Question[] {
  if (!sourceText.trim()) return [];

  const rawLines = sourceText.split('\n');
  const questionSegments: { lines: string[]; lineStart: number }[] = [];

  let currentLines: string[] = [];
  let currentStart = 1;

  const questionStartRegex = /^(?:câu|bài|question)\s*(\d+)[\s.:\-–]/i;

  rawLines.forEach((line, index) => {
    if (questionStartRegex.test(line.trim())) {
      if (currentLines.length > 0) {
        questionSegments.push({ lines: currentLines, lineStart: currentStart });
      }
      currentLines = [line];
      currentStart = index + 1;
    } else {
      if (currentLines.length > 0) {
        currentLines.push(line);
      }
    }
  });

  if (currentLines.length > 0) {
    questionSegments.push({ lines: currentLines, lineStart: currentStart });
  }

  const questions: Question[] = [];

  questionSegments.forEach((segment, qIdx) => {
    const textBlock = segment.lines.join('\n');
    const qOrder = qIdx + 1;

    // Check for images
    const imgMatches = Array.from(textBlock.matchAll(/\[image:([a-zA-Z0-9_]+)\]/g));
    const media = imgMatches
      .map((m) => {
        const url = dict.imageMap[m[1]];
        return url ? { type: 'image' as const, url } : null;
      })
      .filter(Boolean) as { type: 'image'; url: string }[];

    // Extract Solution [solution]...[/solution]
    let stem = textBlock;
    let solution = '';
    const solMatch = textBlock.match(/\[solution\]([\s\S]*?)\[\/solution\]/i);
    if (solMatch) {
      solution = detokenizeInternalSource(solMatch[1].trim(), dict);
      stem = stem.replace(/\[solution\][\s\S]*?\[\/solution\]/i, '').trim();
    }

    // Check True / False
    const hasTfTags = /\[(?:ĐÚNG|SAI)\]/i.test(stem) || /(?:^|\n)\s*[abcdABCD]\)/.test(stem);

    // Check MCQ options A., B., C., D. or *A., *B.
    const mcqMatches = Array.from(stem.matchAll(/(?:^|\n)\s*(\*?)([ABCD])[\s.:\-–]([^\n]*)/g));

    // Check Short Answer
    const saMatch = stem.match(/\[answer:([^\]]+)\]/i);

    if (hasTfTags && !mcqMatches.length) {
      // True / False
      const statements: TrueFalseStatement[] = [
        { id: 'a', statement: 'Mệnh đề a', isCorrect: true },
        { id: 'b', statement: 'Mệnh đề b', isCorrect: false },
        { id: 'c', statement: 'Mệnh đề c', isCorrect: true },
        { id: 'd', statement: 'Mệnh đề d', isCorrect: true },
      ];

      const stMatches = Array.from(stem.matchAll(/(?:^|\n)\s*([abcdABCD])\)\s*([\s\S]*?)(?:\[(ĐÚNG|SAI)\]|$)/g));
      if (stMatches.length > 0) {
        // Strip statements from stem
        const firstStIndex = stem.search(/(?:^|\n)\s*[abcdABCD]\)/);
        if (firstStIndex > 0) {
          stem = stem.substring(0, firstStIndex).trim();
        }

        stMatches.forEach((m) => {
          const letter = m[1].toLowerCase();
          const content = m[2]?.trim() || '';
          const isCorrect = (m[3] || '').toUpperCase() === 'ĐÚNG';
          const target = statements.find((s) => s.id === letter);
          if (target && content) {
            target.statement = detokenizeInternalSource(content, dict);
            target.isCorrect = isCorrect;
          }
        });
      }

      questions.push({
        id: `q-tp-${Date.now()}-${qOrder}`,
        lessonId: defaultLessonId,
        chapterId: defaultChapterId,
        type: 'true_false',
        difficulty: 'TH',
        order: qOrder,
        points: 1.0,
        stem: detokenizeInternalSource(stem, dict),
        media,
        statements,
        solution,
        tags: ['Đúng Sai'],
      });
    } else if (mcqMatches.length >= 2) {
      // MCQ
      const options: Option[] = [
        { id: 'A', text: 'Phương án A' },
        { id: 'B', text: 'Phương án B' },
        { id: 'C', text: 'Phương án C' },
        { id: 'D', text: 'Phương án D' },
      ];

      let correctAnswer = 'A';

      // Strip options from stem
      const firstOptIndex = stem.search(/(?:^|\n)\s*\*?[ABCD][\s.:\-–]/);
      if (firstOptIndex > 0) {
        stem = stem.substring(0, firstOptIndex).trim();
      }

      mcqMatches.forEach((m) => {
        const isStar = m[1] === '*';
        const letter = m[2].toUpperCase();
        const content = m[3]?.trim() || '';

        if (isStar) {
          correctAnswer = letter;
        }

        const target = options.find((o) => o.id === letter);
        if (target && content) {
          target.text = detokenizeInternalSource(content, dict);
          target.latex = target.text;
        }
      });

      questions.push({
        id: `q-tp-${Date.now()}-${qOrder}`,
        lessonId: defaultLessonId,
        chapterId: defaultChapterId,
        type: 'mcq',
        difficulty: 'NB',
        order: qOrder,
        points: 0.25,
        stem: detokenizeInternalSource(stem, dict),
        media,
        options,
        correctAnswer,
        solution,
        tags: ['Trắc nghiệm'],
      });
    } else if (saMatch) {
      // Short Answer
      const acceptedValues = saMatch[1].split(';').map((v) => v.trim());
      stem = stem.replace(/\[answer:[^\]]+\]/i, '').trim();

      questions.push({
        id: `q-tp-${Date.now()}-${qOrder}`,
        lessonId: defaultLessonId,
        chapterId: defaultChapterId,
        type: 'short_answer',
        difficulty: 'VD',
        order: qOrder,
        points: 0.5,
        stem: detokenizeInternalSource(stem, dict),
        media,
        shortAnswerKey: {
          acceptedValues,
          isNumeric: true,
        },
        solution,
        tags: ['Trả lời ngắn'],
      });
    } else {
      // Essay
      questions.push({
        id: `q-tp-${Date.now()}-${qOrder}`,
        lessonId: defaultLessonId,
        chapterId: defaultChapterId,
        type: 'essay',
        difficulty: 'VDC',
        order: qOrder,
        points: 1.0,
        stem: detokenizeInternalSource(stem, dict),
        media,
        solution,
        tags: ['Tự luận'],
      });
    }
  });

  return questions;
}
