// Gemini Client Service with LocalStorage API Key & 3-Tier Auto-Fallback
// Strictly compliant with AI_INSTRUCTIONS.md

export const SUPPORTED_MODELS = [
  {
    id: "gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    tag: "Siêu tốc độ (Khuyên dùng)",
    description: "Tốc độ phản hồi cực nhanh (~1.5s), tối ưu hóa cho giải toán và LaTeX.",
    badge: "Mặc định (Siêu tốc)",
    color: "emerald",
  },
  {
    id: "gemini-3-flash-preview",
    name: "Gemini 3 Flash",
    tag: "Khuyên dùng",
    description: "Tốc độ phản hồi nhanh, tối ưu hóa cho suy luận Toán và LaTeX.",
    badge: "Flash",
    color: "blue",
  },
  {
    id: "gemini-3-pro-preview",
    name: "Gemini 3 Pro",
    tag: "Chuyên sâu",
    description: "Khả năng phân tích ma trận phức tạp và bài toán Vận dụng cao (VDC).",
    badge: "Mạnh mẽ",
    color: "indigo",
  },
] as const;

export type SupportedModelId = (typeof SUPPORTED_MODELS)[number]["id"];

const STORAGE_KEY_API_KEY = "GEMINI_API_KEY";
const STORAGE_KEY_MODEL = "GEMINI_SELECTED_MODEL";

export function getStoredApiKey(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(STORAGE_KEY_API_KEY)?.trim() || "";
}

export function setStoredApiKey(key: string): void {
  if (typeof window === "undefined") return;
  const cleaned = key.trim();
  if (cleaned) {
    localStorage.setItem(STORAGE_KEY_API_KEY, cleaned);
  } else {
    localStorage.removeItem(STORAGE_KEY_API_KEY);
  }
}

export function getStoredModel(): SupportedModelId {
  if (typeof window === "undefined") return "gemini-2.5-flash";
  const stored = localStorage.getItem(STORAGE_KEY_MODEL);
  if (stored && SUPPORTED_MODELS.some((m) => m.id === stored)) {
    return stored as SupportedModelId;
  }
  return "gemini-2.5-flash";
}

export function setStoredModel(model: SupportedModelId): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY_MODEL, model);
}

// Build fallback ladder prioritizing the selected model
export function getFallbackLadder(selectedModel: SupportedModelId): string[] {
  const defaultList: string[] = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-3-flash-preview",
    "gemini-3-pro-preview",
  ];
  return [selectedModel, ...defaultList.filter((m) => m !== selectedModel)];
}

export interface GeminiCallParams {
  systemPrompt?: string;
  prompt?: string;
  contents?: Array<{
    role: "user" | "model";
    parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }>;
  }>;
  responseMimeType?: "text/plain" | "application/json";
  temperature?: number;
}

export interface GeminiCallResult {
  text: string;
  modelUsed: SupportedModelId;
}

/**
 * Core calling function with auto-fallback & retry per AI_INSTRUCTIONS.md
 */
export async function callGeminiWithFallback(
  params: GeminiCallParams
): Promise<GeminiCallResult> {
  const apiKey = getStoredApiKey();
  const selectedModel = getStoredModel();
  const ladder = getFallbackLadder(selectedModel);

  // If no client API key is provided, check if local server is running (fallback for dev)
  if (!apiKey) {
    throw new Error(
      "MISSING_API_KEY: Chưa thiết lập API Key. Vui lòng vào Cài đặt (Settings) trên thanh điều hướng để nhập Gemini API Key (lấy miễn phí tại https://aistudio.google.com/api-keys)."
    );
  }

  let lastError: any = null;
  const attemptedModels: string[] = [];

  for (const model of ladder) {
    try {
      attemptedModels.push(model);
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      // Build contents array
      let requestContents = params.contents;
      if (!requestContents && params.prompt) {
        requestContents = [
          {
            role: "user",
            parts: [{ text: params.prompt }],
          },
        ];
      }

      const bodyPayload: Record<string, any> = {
        contents: requestContents || [],
        generationConfig: {
          temperature: params.temperature ?? 0.2,
          maxOutputTokens: 2048,
        },
      };

      if (params.systemPrompt) {
        bodyPayload.systemInstruction = {
          parts: [{ text: params.systemPrompt }],
        };
      }

      if (params.responseMimeType === "application/json") {
        bodyPayload.generationConfig.responseMimeType = "application/json";
      }

      // Fast timeout controller (10s max per model attempt to prevent hanging)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      try {
        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(bodyPayload),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          const errMsg =
            errorData?.error?.message ||
            `HTTP ${res.status} (${res.statusText || "Lỗi yêu cầu"})`;
          const errCode = errorData?.error?.code || res.status;
          const errStatus = errorData?.error?.status || "";

          throw new Error(`[${errCode} ${errStatus}] ${errMsg}`);
        }

        const data = await res.json();
        const generatedText =
          data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

        return {
          text: generatedText,
          modelUsed: model as any,
        };
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (err: any) {
      console.warn(`Model ${model} failed, attempting next model in ladder:`, err);
      lastError = err;
      // Continue to next model in ladder immediately
    }
  }

  // If all models failed
  const finalErrorMsg =
    lastError?.message ||
    "Tất cả các model (Flash, Pro, 2.5) đều không thể xử lý yêu cầu lúc này.";
  throw new Error(
    `TẤT CẢ MODEL ĐỀU THẤT BẠI (${attemptedModels.join(" ➔ ")}): ${finalErrorMsg}`
  );
}

/**
 * Ping test an API key against a model
 */
export async function testApiKeyConnection(
  testKey?: string,
  testModel?: SupportedModelId
): Promise<{ ok: boolean; message: string; model: string }> {
  const key = testKey?.trim() || getStoredApiKey();
  const model = testModel || getStoredModel();

  if (!key) {
    return {
      ok: false,
      message: "Chưa nhập API Key. Hãy lấy key tại https://aistudio.google.com/api-keys",
      model,
    };
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: "Hãy trả lời đúng 1 chữ: OK" }],
          },
        ],
      }),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      const code = errJson?.error?.code || res.status;
      const status = errJson?.error?.status || "";
      const msg = errJson?.error?.message || res.statusText;
      return {
        ok: false,
        message: `Lỗi kết nối [${code} ${status}]: ${msg}`,
        model,
      };
    }

    const data = await res.json();
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "OK";
    return {
      ok: true,
      message: `Kết nối thành công tới ${model}! Phản hồi: "${reply}"`,
      model,
    };
  } catch (err: any) {
    return {
      ok: false,
      message: `Lỗi mạng hoặc CORS: ${err.message || err}`,
      model,
    };
  }
}

// ==================== NGHIỆP VỤ SƯ PHẠM TOÁN ====================

const THAY_CUONG_SYSTEM_PROMPT = `Bạn là Thầy giáo Phan Quốc Cường - Chuyên gia Sư phạm Toán học cấp cao THPT (Chương trình GDPT 2018, SGK Kết nối tri thức).
Nhiệm vụ: Hướng dẫn, giải đáp và sư phạm chuẩn mực cho học sinh.
YÊU CẦU BẮT BUỘC:
1. Tất cả công thức Toán học PHẢI được viết chuẩn LaTeX, bọc trong dấu $...$ (inline) hoặc $$...$$ (block display). Ví dụ: $f'(x) = 3x^2 - 6x$, $\\int_0^1 x e^x dx$, $\\vec{u} = (1; 2; -3)$, $(\\alpha): 2x - y + 3z - 5 = 0$.
2. Phương pháp sư phạm ân cần, khích lệ: "Thầy chào em!", "Em hãy quan sát kỹ...", "Cố gắng lên em nhé!".
3. Trình bày lời giải mạch lạc: Phương pháp tư duy ➔ Các bước biến đổi ➔ Kết luận và mẹo tránh bẫy thường gặp của đề thi tốt nghiệp THPT.`;

/**
 * 1. Giải thích câu hỏi chi tiết từng bước
 */
export async function explainQuestionAi(params: {
  question: string;
  studentAnswer?: string;
  correctAnswer: string;
  partType?: string;
  chapterName?: string;
}): Promise<string> {
  const prompt = `Chương học: ${params.chapterName || "Toán THPT GDPT 2018"}
Dạng câu hỏi: ${params.partType || "Trắc nghiệm"}
Nội dung câu hỏi: ${params.question}
Đáp án đúng của đề: ${params.correctAnswer}
Lựa chọn / câu trả lời của học sinh: ${params.studentAnswer || "Chưa có"}

Hãy giải thích chi tiết cách giải, bản chất toán học, chỉ ra lỗi sai của học sinh nếu có và lời khuyên chuẩn mực sư phạm.`;

  const res = await callGeminiWithFallback({
    systemPrompt: THAY_CUONG_SYSTEM_PROMPT,
    prompt,
    temperature: 0.2,
  });

  return res.text;
}

/**
 * 2. Gợi ý Socratic phân tầng 3 nấc
 */
export async function getSocraticHintAi(params: {
  question: string;
  standardSolution?: string;
  hintLevel: 1 | 2 | 3;
}): Promise<string> {
  let levelDescription = "";
  if (params.hintLevel === 1) {
    levelDescription =
      "NẤC 1 (Nhắc nhớ kiến thức): CHỈ nhắc lại định lý, tính chất hoặc công thức toán học cốt lõi liên quan đến bài toán. TUYỆT ĐỐI KHÔNG giải thay cho học sinh.";
  } else if (params.hintLevel === 2) {
    levelDescription =
      "NẤC 2 (Định hướng phương pháp): Chỉ ra bước biến đổi then chốt đầu tiên hoặc cách đặt ẩn/vẽ hình phụ để học sinh tự làm tiếp các bước còn lại.";
  } else {
    levelDescription =
      "NẤC 3 (Lời giải chi tiết & Tránh bẫy): Trình bày lời giải mẫu từng bước hoàn chỉnh với chuẩn LaTeX và mẹo tránh bẫy.";
  }

  const prompt = `Bài toán: ${params.question}
Lời giải mẫu tham khảo: ${params.standardSolution || "Theo chuẩn SGK"}

Yêu cầu gợi ý theo: ${levelDescription}
Hãy dùng chuẩn LaTeX $...$ cho công thức toán học và xưng hô thân mật "Thầy - em".`;

  const res = await callGeminiWithFallback({
    systemPrompt: THAY_CUONG_SYSTEM_PROMPT,
    prompt,
    temperature: 0.3,
  });

  return res.text;
}

/**
 * 3. Chatbot Trợ lý Sư phạm Thầy Cường AI
 */
export async function chatWithThayCuongAi(params: {
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  studentName?: string;
  grade?: number;
}): Promise<string> {
  const contents = params.messages.map((m) => ({
    role: m.role === "assistant" ? ("model" as const) : ("user" as const),
    parts: [{ text: m.content }],
  }));

  const systemPrompt = `${THAY_CUONG_SYSTEM_PROMPT}
Học sinh đang trò chuyện tên là: ${params.studentName || "em"} (Học sinh lớp ${params.grade || 12}).
Luôn dẫn dắt học sinh tự tư duy, khen ngợi khi học sinh có tiến bộ.`;

  const res = await callGeminiWithFallback({
    systemPrompt,
    contents,
    temperature: 0.5,
  });

  return res.text;
}

/**
 * 4. Soạn đề thi theo Ma trận chuẩn Bộ GD&ĐT 2025+
 */
export async function generateMatrixExamAi(params: {
  matrix: any;
  lessonTitle?: string;
  chapterTitle?: string;
  grade?: number;
}): Promise<any> {
  const prompt = `Bạn là Thầy giáo Phan Quốc Cường - chuyên gia Sư phạm Toán học THPT.
Hãy biên soạn một đề thi Toán THPT hoàn chỉnh và chất lượng cao bám sát MA TRẬN ĐẶC TẢ GDPT 2018 sau:

=== THÔNG SỐ MA TRẬN ĐỀ THI ===
- Tên bài học / Chuyên đề: ${params.lessonTitle || params.matrix?.topic || "Toán THPT"}
- Chương: ${params.chapterTitle || ""} (Lớp ${params.grade || params.matrix?.grade || 12})
- Cấu trúc đề: ${params.matrix?.name || "Đề kiểm tra chuẩn ma trận"}
- Thời gian: ${params.matrix?.timeMinutes || 45} phút
- Số câu Phần I (Trắc nghiệm 4 lựa chọn): ${params.matrix?.part1Count || 4} câu
- Số câu Phần II (Đúng / Sai 4 ý a,b,c,d): ${params.matrix?.part2Count || 1} câu
- Số câu Phần III (Trả lời ngắn): ${params.matrix?.part3Count || 2} câu
- Số câu Phần IV (Tự luận): ${params.matrix?.part4Count || 1} câu
- Phân bố mức độ: Nhận biết ${params.matrix?.cognitiveDistribution?.recognition || 40}%, Thông hiểu ${params.matrix?.cognitiveDistribution?.comprehension || 30}%, Vận dụng ${params.matrix?.cognitiveDistribution?.application || 20}%, Vận dụng cao ${params.matrix?.cognitiveDistribution?.advanced || 10}%
- Yêu cầu bổ sung: ${params.matrix?.customRequirements || "Bám sát thực tiễn, số liệu đẹp, chuẩn SGK Kết nối tri thức."}
================================

YÊU CẦU BẮT BUỘC:
1. Mọi công thức toán học PHẢI dùng chuẩn LaTeX $...$ hoặc $$...$$.
2. Đảm bảo đúng số lượng câu hỏi cho từng Phần I, Phần II, Phần III, Phần IV theo đúng ma trận.
3. Phần I: Có 4 phương án A, B, C, D và đúng 1 correctOption.
4. Phần II: Mỗi câu có 4 ý a, b, c, d với boolean isCorrect và giải thích chi tiết.
5. Phần III: Câu hỏi trả lời ngắn ra 1 giá trị số/phân số/tọa độ cụ thể với shortAnswerCorrect.
6. Mỗi câu hỏi PHẢI có standardSolution đầy đủ, sư phạm.

Trả về định dạng JSON thuần túy theo schema:
{
  "matrixName": "${params.matrix?.name || "Đề thi theo ma trận"}",
  "topic": "${params.lessonTitle || params.matrix?.topic}",
  "totalQuestions": ${(params.matrix?.part1Count || 0) + (params.matrix?.part2Count || 0) + (params.matrix?.part3Count || 0) + (params.matrix?.part4Count || 0)},
  "questions": [
    {
      "id": "gen_q_1",
      "partType": "PART_I",
      "cognitiveLevel": "Nhận biết",
      "topicTag": "Đơn điệu hàm số",
      "title": "Câu 1 (Nhận biết):",
      "content": "Nội dung câu hỏi với LaTeX $...$",
      "options": [
        {"id": "A", "text": "Phương án A"},
        {"id": "B", "text": "Phương án B"},
        {"id": "C", "text": "Phương án C"},
        {"id": "D", "text": "Phương án D"}
      ],
      "correctOption": "A",
      "points": 2.5,
      "hint": "Gợi ý phương pháp",
      "standardSolution": "Lời giải chi tiết từng bước với LaTeX $...$"
    }
  ]
}`;

  const res = await callGeminiWithFallback({
    systemPrompt:
      "Bạn là Thầy Phan Quốc Cường - chuyên gia ra đề thi Toán THPT chất lượng cao theo chương trình GDPT 2018. Luôn xuất ra định dạng JSON hợp lệ với công thức LaTeX chuẩn.",
    prompt,
    responseMimeType: "application/json",
    temperature: 0.3,
  });

  try {
    return JSON.parse(res.text);
  } catch (err) {
    // Attempt extracting json block
    const match = res.text.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]);
    }
    throw new Error("Không thể phân tích phản hồi JSON từ AI: " + res.text.slice(0, 100));
  }
}

/**
 * 5. Phân tích tài liệu Word/MathType và chuẩn hóa LaTeX
 */
export async function parseMathTypeDocAi(params: {
  rawText: string;
  lessonTitle?: string;
  grade?: number;
}): Promise<any> {
  const prompt = `Bạn là Thầy Phan Quốc Cường - chuyên gia số hóa đề thi Toán THPT từ file Word / MathType.
Đề bài gốc được trích xuất từ file Word:
=== NỘI DUNG VĂN BẢN TRÍCH XUẤT ===
${params.rawText.slice(0, 8000)}
===================================
Chủ đề bài học: ${params.lessonTitle || "Toán THPT GDPT 2018"} (Lớp ${params.grade || 12})

Nhiệm vụ:
1. Nhận diện TỪNG CÂU HỎI và phân loại đúng dạng câu hỏi (partType: PART_I, PART_II, PART_III, PART_IV).
2. Tự động xác định Mức độ nhận thức (cognitiveLevel: "Nhận biết" | "Thông hiểu" | "Vận dụng" | "Vận dụng cao").
3. Chuyển đổi toàn bộ công thức MathType sang chuẩn LaTeX $...$ hoặc $$...$$.
4. Trích xuất đáp án đúng và sinh lời giải chi tiết (standardSolution) từng bước cho mỗi câu.

Trả về JSON array danh sách câu hỏi:
{
  "questions": [
    {
      "id": "mathtype_q_1",
      "partType": "PART_I",
      "cognitiveLevel": "Nhận biết",
      "topicTag": "Chủ đề câu hỏi",
      "title": "Câu 1:",
      "content": "Nội dung câu hỏi với LaTeX $...$",
      "options": [
        {"id": "A", "text": "Lựa chọn A"},
        {"id": "B", "text": "Lựa chọn B"},
        {"id": "C", "text": "Lựa chọn C"},
        {"id": "D", "text": "Lựa chọn D"}
      ],
      "correctOption": "A",
      "tfStatements": [
        {"id": "a", "statement": "Mệnh đề a", "isCorrect": true, "explanation": "Giải thích"}
      ],
      "shortAnswerCorrect": "4.5",
      "points": 2.5,
      "hint": "Gợi ý tư duy",
      "standardSolution": "Lời giải chi tiết chuẩn mực phương pháp SGK với LaTeX $...$"
    }
  ]
}`;

  const res = await callGeminiWithFallback({
    systemPrompt:
      "Bạn là chuyên gia chuyển đổi đề thi Toán THPT sang LaTeX chuẩn mực. Luôn đảm bảo công thức Toán bọc trong $...$ và dữ liệu JSON hợp lệ.",
    prompt,
    responseMimeType: "application/json",
    temperature: 0.2,
  });

  try {
    return JSON.parse(res.text);
  } catch {
    const match = res.text.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error("Lỗi đọc JSON từ AI.");
  }
}

/**
 * 6. Trích xuất đề thi từ file PDF (Multimodal) chuẩn hóa công thức LaTeX & 4 phần GDPT 2018
 */
export async function parsePdfExamAi(params: {
  pdfBase64: string;
  fileName?: string;
  lessonTitle?: string;
  grade?: number;
}): Promise<any> {
  const cleanBase64 = params.pdfBase64.replace(/^data:application\/pdf;base64,/, "");

  const promptText = `Bạn là Thầy Phan Quốc Cường - chuyên gia số hóa đề thi Toán THPT từ file PDF theo chương trình GDPT 2018.
Tài liệu đính kèm là file PDF đề thi môn Toán (Lớp ${params.grade || 12} - Bài học: ${params.lessonTitle || "Toán THPT"}).

Nhiệm vụ:
1. Đọc toàn bộ nội dung trong file PDF, trích xuất tất cả các câu hỏi và bài toán.
2. Chuẩn hóa toàn bộ công thức toán học sang chuẩn LaTeX inline $...$ hoặc block $$...$$.
3. Phân loại cấu trúc đề thi theo 4 Phần chuẩn Bộ GD&ĐT:
   - PART_I: Trắc nghiệm 4 lựa chọn (A, B, C, D)
   - PART_II: Trắc nghiệm Đúng / Sai (gồm 4 mệnh đề a, b, c, d với isCorrect: true/false)
   - PART_III: Trắc nghiệm Trả lời ngắn (kết quả dạng số nguyên, thập phân hoặc phân số)
   - PART_IV: Tự luận (đề bài, thang điểm, lời giải mẫu từng bước)
4. Xác định Mức độ nhận thức (cognitiveLevel: "Nhận biết" | "Thông hiểu" | "Vận dụng" | "Vận dụng cao").
5. Cung cấp đáp án đúng và lời giải chi tiết (standardSolution) chuẩn mực cho từng câu.

Trả về JSON thuần túy (không bọc text ngoài JSON):
{
  "questions": [
    {
      "id": "pdf_q_1",
      "partType": "PART_I",
      "cognitiveLevel": "Nhận biết",
      "topicTag": "${params.lessonTitle || "Toán THPT"}",
      "title": "Câu 1:",
      "content": "Nội dung câu hỏi với LaTeX $...$",
      "options": [
        {"id": "A", "text": "Lựa chọn A"},
        {"id": "B", "text": "Lựa chọn B"},
        {"id": "C", "text": "Lựa chọn C"},
        {"id": "D", "text": "Lựa chọn D"}
      ],
      "correctOption": "A",
      "points": 0.25,
      "hint": "Gợi ý phương pháp",
      "standardSolution": "Lời giải chi tiết với LaTeX $...$"
    }
  ]
}`;

  const res = await callGeminiWithFallback({
    systemPrompt:
      "Bạn là Thầy Phan Quốc Cường. Luôn xuất ra định dạng JSON hợp lệ phân tích đề thi Toán THPT với công thức LaTeX chuẩn.",
    contents: [
      {
        role: "user",
        parts: [
          {
            inlineData: {
              mimeType: "application/pdf",
              data: cleanBase64,
            },
          },
          { text: promptText },
        ],
      },
    ],
    responseMimeType: "application/json",
    temperature: 0.2,
  });

  try {
    return JSON.parse(res.text);
  } catch {
    const match = res.text.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error("Không thể phân tích phản hồi JSON từ AI khi đọc file PDF.");
  }
}

/**
 * 7. Chấm điểm bài Tự luận (Phần IV)
 */
export async function gradeEssayAi(params: {
  questionContent: string;
  standardSolution?: string;
  studentSubmissionText?: string;
  imageBase64?: string;
}): Promise<any> {
  const parts: any[] = [];

  if (params.imageBase64) {
    const cleanBase64 = params.imageBase64.replace(/^data:image\/\w+;base64,/, "");
    parts.push({
      inlineData: {
        mimeType: "image/jpeg",
        data: cleanBase64,
      },
    });
  }

  const promptText = `Bạn là Thầy Phan Quốc Cường đang chấm bài tự luận Toán của học sinh.
Đề bài: ${params.questionContent}
Đáp án & Thang điểm chuẩn: ${params.standardSolution || "Theo chuẩn SGK GDPT 2018"}
Bài làm của học sinh (văn bản): ${params.studentSubmissionText || "Xem ảnh đính kèm"}

Hãy chấm điểm bài làm theo thang điểm 10 và nhận xét chi tiết:
1. Điểm số (0 - 10)
2. Các bước làm đúng
3. Các lỗi sai hoặc thiếu sót trong lập luận / trình bày / đơn vị
4. Lời khuyên cụ thể để đạt điểm tối đa
5. Lời giải mẫu chuẩn LaTeX

Trả về JSON:
{
  "score": 8.5,
  "maxScore": 10,
  "passed": true,
  "feedback": "Nhận xét tổng quan của Thầy Cường",
  "correctSteps": ["Bước 1...", "Bước 2..."],
  "mistakes": ["Lỗi ở bước..."],
  "standardSolutionLatex": "Lời giải mẫu với $...$"
}`;

  parts.push({ text: promptText });

  const res = await callGeminiWithFallback({
    systemPrompt: THAY_CUONG_SYSTEM_PROMPT,
    contents: [{ role: "user", parts }],
    responseMimeType: "application/json",
    temperature: 0.2,
  });

  try {
    return JSON.parse(res.text);
  } catch {
    const match = res.text.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error("Lỗi phân tích JSON chấm bài tự luận.");
  }
}
