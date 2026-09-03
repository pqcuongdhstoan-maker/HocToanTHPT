import mammoth from "mammoth";
import { Question, QuestionPartType, QuestionOption, TrueFalseStatement, CognitiveLevel } from "../types";

/**
 * Normalizes equations, math symbols and converts typical Word MathType / Unicode / OMML to LaTeX
 */
export function normalizeMathLatex(text: string): string {
  if (!text) return "";

  let cleaned = text
    // Strip MathType metadata tags if present
    .replace(/«MathType[^»]*»/gi, "")
    .replace(/«\/MathType»/gi, "")
    .replace(/<m:oMath[^>]*>/gi, "")
    .replace(/<\/m:oMath>/gi, "")
    // Standard Math symbols to LaTeX
    .replace(/≤/g, " \\le ")
    .replace(/≥/g, " \\ge ")
    .replace(/≠/g, " \\neq ")
    .replace(/±/g, " \\pm ")
    .replace(/∓/g, " \\mp ")
    .replace(/∈/g, " \\in ")
    .replace(/∉/g, " \\notin ")
    .replace(/⊂/g, " \\subset ")
    .replace(/⊃/g, " \\supset ")
    .replace(/∩/g, " \\cap ")
    .replace(/∪/g, " \\cup ")
    .replace(/∅/g, " \\emptyset ")
    .replace(/∀/g, " \\forall ")
    .replace(/∃/g, " \\exists ")
    .replace(/→/g, " \\to ")
    .replace(/⇒/g, " \\implies ")
    .replace(/⇔/g, " \\iff ")
    .replace(/∫/g, " \\int ")
    .replace(/∬/g, " \\iint ")
    .replace(/∞/g, " \\infty ")
    .replace(/≈/g, " \\approx ")
    .replace(/≡/g, " \\equiv ")
    .replace(/×/g, " \\times ")
    .replace(/·/g, " \\cdot ")
    .replace(/°/g, "^\\circ ")
    .replace(/π/g, "\\pi ")
    .replace(/α/g, "\\alpha ")
    .replace(/β/g, "\\beta ")
    .replace(/γ/g, "\\gamma ")
    .replace(/Δ/g, "\\Delta ")
    .replace(/δ/g, "\\delta ")
    .replace(/θ/g, "\\theta ")
    .replace(/λ/g, "\\lambda ")
    .replace(/μ/g, "\\mu ")
    .replace(/σ/g, "\\sigma ")
    .replace(/ω/g, "\\omega ")
    .replace(/Ω/g, "\\Omega ")
    .replace(/√\(([^)]+)\)/g, "\\sqrt{$1}")
    .replace(/√(\d+|\w+)/g, "\\sqrt{$1}")
    // Vectơ notation (e.g. vecto u, vecto AB, véc tơ a)
    .replace(/(?:vecto|véc tơ|vector)\s+([A-Z]{2})/gi, "\\vec{$1}")
    .replace(/(?:vecto|véc tơ|vector)\s+([a-z])/gi, "\\vec{$1}")
    .replace(/\s+/g, " ");

  return cleaned.trim();
}

/**
 * Extracts raw text from an uploaded DOCX file using mammoth
 */
export async function parseDocxFile(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

/**
 * Detects cognitive level from text hints, tags, or question content
 */
export function detectCognitiveLevel(text: string): CognitiveLevel {
  const lower = text.toLowerCase();
  if (lower.includes("[vdc]") || lower.includes("(vdc)") || lower.includes("vận dụng cao") || lower.includes("bài toán thực tế") || lower.includes("tối ưu hóa")) {
    return "Vận dụng cao";
  }
  if (lower.includes("[vd]") || lower.includes("(vd)") || lower.includes("vận dụng") || lower.includes("tìm tham số m") || lower.includes("xác suất")) {
    return "Vận dụng";
  }
  if (lower.includes("[th]") || lower.includes("(th)") || lower.includes("thông hiểu") || lower.includes("đồng biến trên khoảng") || lower.includes("khoảng cách")) {
    return "Thông hiểu";
  }
  if (lower.includes("[nb]") || lower.includes("(nb)") || lower.includes("nhận biết") || lower.includes("tập xác định") || lower.includes("vectơ pháp tuyến") || lower.includes("họ nguyên hàm")) {
    return "Nhận biết";
  }
  // Default heuristic based on question complexity
  if (lower.includes("thực tế") || lower.includes("chi phí") || lower.includes("lớn nhất") || lower.includes("nhỏ nhất")) {
    return "Vận dụng";
  }
  return "Thông hiểu";
}

/**
 * Detects topic tag / dạng toán from question content
 */
export function detectTopicTag(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes("đồng biến") || lower.includes("nghịch biến") || lower.includes("đơn điệu")) return "Tính đơn điệu hàm số";
  if (lower.includes("cực đại") || lower.includes("cực tiểu") || lower.includes("cực trị")) return "Cực trị hàm số";
  if (lower.includes("giá trị lớn nhất") || lower.includes("giá trị nhỏ nhất") || lower.includes("gtln") || lower.includes("gtnn")) return "GTLN & GTNN";
  if (lower.includes("tiệm cận") || lower.includes("tcđ") || lower.includes("tcn") || lower.includes("tiệm cận xiên")) return "Đường tiệm cận";
  if (lower.includes("khảo sát") || lower.includes("bảng biến thiên") || lower.includes("đồ thị")) return "Khảo sát & Đồ thị hàm số";
  if (lower.includes("oxyz") || lower.includes("mặt phẳng") || lower.includes("mặt cầu") || lower.includes("vectơ")) return "Phương pháp tọa độ Oxyz";
  if (lower.includes("nguyên hàm") || lower.includes("tích phân") || lower.includes("diện tích hình phẳng")) return "Nguyên hàm & Tích phân";
  if (lower.includes("xác suất") || lower.includes("bayes") || lower.includes("biến cố")) return "Xác suất có điều kiện";
  if (lower.includes("lượng giác") || lower.includes("sin") || lower.includes("cos")) return "Hàm số & Phương trình lượng giác";
  if (lower.includes("mũ") || lower.includes("logarit") || lower.includes("ln")) return "Hàm số mũ và Logarit";
  return "Toán THPT GDPT 2018";
}

/**
 * Helper to extract single-line options: e.g. "A. $1$   B. $2$   C. $3$   D. $4$"
 */
function extractInlineOptions(line: string): QuestionOption[] | null {
  const regex = /([A-D])[\.\)]\s*([^A-D\.\)]+)/g;
  const matches = [...line.matchAll(regex)];
  if (matches.length >= 2) {
    const opts: QuestionOption[] = [];
    for (const m of matches) {
      opts.push({
        id: m[1].toUpperCase(),
        text: normalizeMathLatex(m[2].trim()),
      });
    }
    if (opts.length >= 2) return opts;
  }
  return null;
}

/**
 * Helper to extract single-line True/False statements: e.g. "a) Đúng  b) Sai  c) Đúng  d) Sai"
 */
function extractInlineTrueFalse(line: string): TrueFalseStatement[] | null {
  const regex = /([a-d])[\.\)]\s*([^a-d\.\)]+)/gi;
  const matches = [...line.matchAll(regex)];
  if (matches.length >= 2) {
    const statements: TrueFalseStatement[] = [];
    for (const m of matches) {
      const id = m[1].toLowerCase();
      const rawStmt = m[2].trim();
      const isSai = rawStmt.toLowerCase().includes("[sai]") || rawStmt.toLowerCase().includes("(sai)") || rawStmt.toLowerCase().includes(": sai");
      statements.push({
        id,
        statement: normalizeMathLatex(rawStmt.replace(/\[(đúng|sai)\]/gi, "").replace(/\((đúng|sai)\)/gi, "").replace(/:\s*(đúng|sai)/gi, "").trim()),
        isCorrect: !isSai,
      });
    }
    return statements;
  }
  return null;
}

/**
 * Intelligently parse exam text into structured questions across 4 Parts (GDPT 2018 Format)
 */
export function parseExamQuestionsFromText(rawText: string): Question[] {
  const questions: Question[] = [];
  const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  let currentPart: QuestionPartType = "PART_I";
  let currentQ: Partial<Question> | null = null;
  let qCounter = 1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect Section / Part headers
    if (line.toUpperCase().includes("PHẦN I") || line.toUpperCase().includes("PHAN I") || line.toUpperCase().includes("TRẮC NGHIỆM NHIỀU PHƯƠNG ÁN")) {
      currentPart = "PART_I";
      continue;
    } else if (line.toUpperCase().includes("PHẦN II") || line.toUpperCase().includes("PHAN II") || line.toUpperCase().includes("ĐÚNG SAI") || line.toUpperCase().includes("ĐÚNG/SAI")) {
      currentPart = "PART_II";
      continue;
    } else if (line.toUpperCase().includes("PHẦN III") || line.toUpperCase().includes("PHAN III") || line.toUpperCase().includes("TRẢ LỜI NGẮN") || line.toUpperCase().includes("ĐIỀN KHUYẾT")) {
      currentPart = "PART_III";
      continue;
    } else if (line.toUpperCase().includes("PHẦN IV") || line.toUpperCase().includes("PHAN IV") || line.toUpperCase().includes("TỰ LUẬN")) {
      currentPart = "PART_IV";
      continue;
    }

    // Detect Question start: "Câu 1:", "Câu 1.", "Cau 1:" or "Bài 1:"
    const qMatch = line.match(/^(?:Câu|Cau|Bài)\s*(\d+)[\.\:|\s](.*)/i);
    if (qMatch) {
      if (currentQ && currentQ.content) {
        finalizeAndPushQuestion(currentQ, questions, currentPart);
      }

      const qNum = qMatch[1];
      const restOfLine = qMatch[2].trim();
      const detectedCog = detectCognitiveLevel(restOfLine || line);
      const detectedTopic = detectTopicTag(restOfLine || line);

      currentQ = {
        id: `imported_q_${Date.now()}_${qCounter++}`,
        partType: currentPart,
        title: `Câu ${qNum} (${detectedCog}):`,
        content: normalizeMathLatex(restOfLine || ""),
        points: currentPart === "PART_IV" ? 10 : currentPart === "PART_II" ? 4.0 : 2.5,
        standardSolution: "",
        cognitiveLevel: detectedCog,
        topicTag: detectedTopic,
        options: currentPart === "PART_I" ? [] : undefined,
        tfStatements: currentPart === "PART_II" ? [] : undefined,
      };

      // Check if inline options or inline true-false statements are on this same line
      if (currentPart === "PART_I") {
        const inlineOpts = extractInlineOptions(restOfLine);
        if (inlineOpts && inlineOpts.length >= 2) {
          currentQ.options = inlineOpts;
        }
      } else if (currentPart === "PART_II") {
        const inlineTf = extractInlineTrueFalse(restOfLine);
        if (inlineTf && inlineTf.length >= 2) {
          currentQ.tfStatements = inlineTf;
        }
      }
      continue;
    }

    if (!currentQ) {
      // Create initial question if text starts immediately
      const detectedCog = detectCognitiveLevel(line);
      const detectedTopic = detectTopicTag(line);
      currentQ = {
        id: `imported_q_${Date.now()}_${qCounter++}`,
        partType: currentPart,
        title: `Câu ${qCounter} (${detectedCog}):`,
        content: normalizeMathLatex(line),
        points: currentPart === "PART_IV" ? 10 : currentPart === "PART_II" ? 4.0 : 2.5,
        standardSolution: "",
        cognitiveLevel: detectedCog,
        topicTag: detectedTopic,
        options: currentPart === "PART_I" ? [] : undefined,
        tfStatements: currentPart === "PART_II" ? [] : undefined,
      };
      continue;
    }

    // Check for inline options on separate line (e.g. "A. 1   B. 2   C. 3   D. 4")
    if (currentPart === "PART_I") {
      const inlineOpts = extractInlineOptions(line);
      if (inlineOpts && inlineOpts.length >= 2) {
        if (!currentQ.options) currentQ.options = [];
        currentQ.options.push(...inlineOpts);
        continue;
      }

      // Single option per line: "A. ..."
      const optMatch = line.match(/^([A-D])[\.\)]\s*(.*)/);
      if (optMatch) {
        if (!currentQ.options) currentQ.options = [];
        currentQ.options.push({
          id: optMatch[1].toUpperCase(),
          text: normalizeMathLatex(optMatch[2]),
        });
        continue;
      }
    }

    // Parse True/False statements for PART_II (a) ..., b) ...)
    if (currentPart === "PART_II") {
      const inlineTf = extractInlineTrueFalse(line);
      if (inlineTf && inlineTf.length >= 2) {
        if (!currentQ.tfStatements) currentQ.tfStatements = [];
        currentQ.tfStatements.push(...inlineTf);
        continue;
      }

      const tfMatch = line.match(/^([a-d])[\.\)]\s*(.*)/i);
      if (tfMatch) {
        if (!currentQ.tfStatements) currentQ.tfStatements = [];
        const isMarkedFalse = tfMatch[2].toLowerCase().includes("[sai]") || tfMatch[2].toLowerCase().includes("(sai)") || tfMatch[2].toLowerCase().includes(": sai");
        currentQ.tfStatements.push({
          id: tfMatch[1].toLowerCase(),
          statement: normalizeMathLatex(tfMatch[2].replace(/\[(đúng|sai)\]/gi, "").replace(/\((đúng|sai)\)/gi, "").replace(/:\s*(đúng|sai)/gi, "").trim()),
          isCorrect: !isMarkedFalse,
        });
        continue;
      }
    }

    // Parse Answer Key line / Solution line / Short Answer for PART_III
    if (line.match(/^(Đáp án|Đáp số|Lời giải|Key|Huong dan giai|HDG)[\:\.]/i)) {
      currentQ.standardSolution = normalizeMathLatex(line);
      const optCorrect = line.match(/Chọn\s*([A-D])/i) || line.match(/Đáp án\s*:\s*([A-D])/i) || line.match(/^[A-D]$/);
      if (optCorrect && currentPart === "PART_I") {
        currentQ.correctOption = optCorrect[1].toUpperCase();
      }

      // Short answer extraction for PART_III (e.g. "Đáp số: 4.5" or "Đáp án: -2")
      if (currentPart === "PART_III") {
        const shortMatch = line.match(/^(?:Đáp án|Đáp số|Kết quả)[\:\.]\s*([^\n\r]+)/i);
        if (shortMatch) {
          currentQ.shortAnswerCorrect = shortMatch[1].trim();
        }
      }
      continue;
    }

    // Otherwise append to content
    currentQ.content = (currentQ.content ? currentQ.content + "\n" : "") + normalizeMathLatex(line);
  }

  if (currentQ && currentQ.content) {
    finalizeAndPushQuestion(currentQ, questions, currentPart);
  }

  return questions;
}

function finalizeAndPushQuestion(
  q: Partial<Question>,
  list: Question[],
  partType: QuestionPartType
) {
  // Infer / update cognitive level if not set
  if (!q.cognitiveLevel) {
    q.cognitiveLevel = detectCognitiveLevel(q.content || "");
  }
  if (!q.topicTag) {
    q.topicTag = detectTopicTag(q.content || "");
  }

  // Default fallbacks if options missing in Part I
  if (partType === "PART_I" && (!q.options || q.options.length === 0)) {
    q.options = [
      { id: "A", text: "Lựa chọn A" },
      { id: "B", text: "Lựa chọn B" },
      { id: "C", text: "Lựa chọn C" },
      { id: "D", text: "Lựa chọn D" },
    ];
    if (!q.correctOption) q.correctOption = "A";
  }

  if (partType === "PART_II" && (!q.tfStatements || q.tfStatements.length === 0)) {
    q.tfStatements = [
      { id: "a", statement: "Mệnh đề a", isCorrect: true },
      { id: "b", statement: "Mệnh đề b", isCorrect: true },
      { id: "c", statement: "Mệnh đề c", isCorrect: false },
      { id: "d", statement: "Mệnh đề d", isCorrect: false },
    ];
  }

  if (partType === "PART_III" && !q.shortAnswerCorrect) {
    q.shortAnswerCorrect = "0";
  }

  if (!q.standardSolution) {
    q.standardSolution = "Lời giải chi tiết đang được Thầy Cường cập nhật theo phương pháp chuẩn SGK Kết nối tri thức.";
  }

  list.push(q as Question);
}
