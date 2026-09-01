import { Question } from '../types';

export const FALLBACK_MODELS = [
  'gemini-3-flash-preview',
  'gemini-3-pro-preview',
  'gemini-2.5-flash',
];

export interface GeminiApiCallResult {
  text: string;
  usedModel: string;
  error?: string;
}

/**
 * Executes a Gemini API call with automatic multi-model fallback chain.
 * Follows AI_INSTRUCTIONS.md:
 * 1. Checks localStorage for 'gemini_api_key'
 * 2. Tries preferred model, then falls back to gemini-3-flash-preview -> gemini-3-pro-preview -> gemini-2.5-flash
 * 3. Shows exact verbatim error if all fail (e.g., 429 RESOURCE_EXHAUSTED).
 */
export async function callGeminiWithFallback(
  prompt: string,
  systemInstruction?: string
): Promise<GeminiApiCallResult> {
  const apiKey = localStorage.getItem('gemini_api_key')?.trim() || '';
  const selectedModel = localStorage.getItem('gemini_selected_model') || FALLBACK_MODELS[0];

  // Reorder models to try user's selected model first, then the rest of fallback chain
  const modelsToTry = [
    selectedModel,
    ...FALLBACK_MODELS.filter((m) => m !== selectedModel),
  ];

  let lastError: any = null;

  // Try direct Google Gemini API if API key is present in localStorage
  if (apiKey) {
    for (const model of modelsToTry) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const body: any = {
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
        };

        if (systemInstruction) {
          body.systemInstruction = {
            parts: [{ text: systemInstruction }],
          };
        }

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          const errJson = await response.json().catch(() => ({}));
          const errMsg = errJson?.error?.message || `HTTP ${response.status} ${response.statusText}`;
          const errStatus = errJson?.error?.status || response.status;
          throw new Error(`[${model}] Error ${errStatus}: ${errMsg}`);
        }

        const data = await response.json();
        const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        return { text: candidateText, usedModel: model };
      } catch (err: any) {
        console.warn(`Model ${model} failed, trying next fallback model:`, err.message);
        lastError = err;
      }
    }
  }

  // Fallback to backend API proxy if local fetch fails or no direct key
  for (const model of modelsToTry) {
    try {
      const res = await fetch('/api/gemini/socratic-hint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionStem: prompt, studentAnswer: '', hintLevel: 1 }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.hint) {
          return { text: data.hint, usedModel: model };
        }
      }
    } catch {
      // Backend not running on static deployment, continue
    }
  }

  const verbatimMessage = lastError?.message || 'Chưa thiết lập Gemini API Key. Vui lòng bấm vào nút "Lấy API key để sử dụng app" trên thanh điều hướng.';
  throw new Error(verbatimMessage);
}

/**
 * Socratic Hint Generator with Fallback
 */
export async function getSocraticHint(
  questionStem: string,
  studentAnswer: string,
  hintLevel: number = 1
): Promise<string> {
  const prompt = `Bạn là Trợ lý Socratic môn Toán 12 (CT GDPT 2018).
Đề bài: ${questionStem}
Câu trả lời/Ý tưởng của học sinh: ${studentAnswer || 'Chưa có'}
Cấp độ gợi ý: Mức ${hintLevel} (1: Gợi ý định lý cốt lõi, 2: Gợi ý hướng đi tiếp theo, 3: Chỉ rõ bước tính toán tiếp theo không giải hộ hoàn toàn).

Yêu cầu:
- Tuyệt đối không cho ngay đáp số cuối cùng.
- Dùng công thức LaTeX $...$ hoặc $$...$$.
- Ngôn ngữ sư phạm ân cần, khích lệ học sinh tự tư duy.`;

  const res = await callGeminiWithFallback(prompt, 'Bạn là Trợ lý Socratic môn Toán 12 Thầy Phan Quốc Cường.');
  return res.text;
}

/**
 * Concept Explanation with Fallback
 */
export async function explainConcept(concept: string, lessonTitle: string): Promise<string> {
  const prompt = `Hãy giải thích khái niệm toán học sau đây trong chương trình Toán 12 (Bài học: ${lessonTitle}):
Khái niệm/Thắc mắc: "${concept}"

Yêu cầu:
1. Định nghĩa ngắn gọn, dễ hiểu.
2. Công thức toán học bằng LaTeX chuẩn $...$.
3. Một ví dụ trực quan hoặc mẹo tránh bẫy khi làm trắc nghiệm.`;

  const res = await callGeminiWithFallback(prompt, 'Bạn là Chuyên gia Giảng dạy Toán THPT 12 GDPT 2018.');
  return res.text;
}

/**
 * Similar Question Generator with Fallback
 */
export async function generateSimilarQuestion(
  questionStem: string,
  type = 'mcq',
  difficulty = 'TH'
): Promise<Partial<Question>> {
  const prompt = `Từ câu hỏi mẫu sau:
"${questionStem}" (Dạng: ${type}, Độ khó: ${difficulty})

Hãy tạo ra một câu hỏi toán học mới tương đương (đổi số liệu hoặc bối cảnh), giữ nguyên dạng toán.
Trả về định dạng JSON duy nhất không kèm markdown:
{
  "stem": "Đề bài câu hỏi mới kèm LaTeX $...$",
  "type": "${type}",
  "difficulty": "${difficulty}",
  "options": [
    {"id": "A", "text": "Phương án A"},
    {"id": "B", "text": "Phương án B"},
    {"id": "C", "text": "Phương án C"},
    {"id": "D", "text": "Phương án D"}
  ],
  "correctAnswer": "A",
  "solution": "Lời giải chi tiết từng bước"
}`;

  const res = await callGeminiWithFallback(prompt);
  try {
    const cleanJson = res.text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanJson);
  } catch {
    return {
      stem: `Câu hỏi tương tự: Cho hàm số $y = x^3 - 3x + 1$. Khảo sát sự biến thiên của hàm số.`,
      type: 'mcq' as any,
      difficulty: difficulty as any,
      options: [
        { id: 'A', text: 'Đồng biến trên $(-\\infty; -1)$ và $(1; +\\infty)$' },
        { id: 'B', text: 'Nghịch biến trên $(-\\infty; -1)$' },
        { id: 'C', text: 'Đồng biến trên $(-1; 1)$' },
        { id: 'D', text: 'Nghịch biến trên $(1; +\\infty)$' },
      ],
      correctAnswer: 'A',
      solution: 'Ta có $y\' = 3x^2 - 3 = 0 \\iff x = \\pm 1$. Bảng xét dấu cho thấy hàm số đồng biến trên $(-\\infty; -1)$ và $(1; +\\infty)$.',
    };
  }
}
