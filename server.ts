import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

// Lazy initialization of Gemini client
function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured in environment variables.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", app: "Tu-Luyen-Toan-THPT-Phan-Quoc-Cuong" });
});

// AI Step-by-Step Explanation
app.post("/api/gemini/explain", async (req, res) => {
  try {
    const { question, studentAnswer, correctAnswer, partType, chapterName } = req.body;
    const ai = getGenAI();

    const systemPrompt = `Bạn là Thầy giáo Phan Quốc Cường - Chuyên gia Sư phạm Toán học cấp cao THPT (Chương trình GDPT 2018).
Nhiệm vụ của bạn là giải thích chi tiết, sư phạm, ân cần và chuẩn xác cho học sinh về câu hỏi Toán sau.
YÊU CẦU BẮT BUỘC:
1. Tất cả công thức toán học PHẢI được viết chuẩn LaTeX, bọc trong dấu $...$ (inline) hoặc $$...$$ (block display). Ví dụ: $f'(x) = 3x^2 - 6x$, $\\int_0^1 x e^x dx$, $\\vec{u} = (1; 2; -3)$.
2. Chỉ ra rõ học sinh sai ở bước tư duy nào (nếu học sinh chọn sai).
3. Hướng dẫn phương pháp giải theo từng bước (Step-by-step): Phương pháp tư duy -> Các bước biến đổi -> Kết luận và mẹo tránh bẫy.
4. Giọng điệu thân thiện, khích lệ, đúng phong cách thầy Cường: "Thầy chào em! Đừng lo lắng...", "Hãy nhớ rằng...", "Cố gắng lên em nhé!".`;

    const prompt = `Chương học: ${chapterName || "Toán THPT GDPT 2018"}
Dạng câu hỏi: ${partType || "Trắc nghiệm"}
Nội dung câu hỏi: ${question}
Đáp án đúng của đề: ${correctAnswer}
Lựa chọn / câu trả lời của học sinh: ${studentAnswer || "Chưa có"}

Hãy giải thích chi tiết cách giải, bản chất toán học và lời khuyên cho học sinh bằng tiếng Việt chuẩn mực sư phạm.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        systemInstruction: systemPrompt,
      },
    });

    res.json({ explanation: response.text });
  } catch (error: any) {
    console.error("Gemini explain error:", error);
    res.status(500).json({
      error: error.message || "Không thể tạo lời giải từ AI",
      fallback: "Để giải bài toán này, em cần xác định rõ giả thiết, lập luận theo định lý và công thức chuẩn trong SGK Kết nối tri thức.",
    });
  }
});

// Adaptive Question Generator
app.post("/api/gemini/adaptive-question", async (req, res) => {
  try {
    const { topic, grade, difficulty, partType } = req.body;
    const ai = getGenAI();

    const prompt = `Hãy tạo 1 câu hỏi Toán THPT theo chương trình GDPT 2018 (SGK Kết nối tri thức).
Chủ đề: ${topic || "Khảo sát hàm số"}
Lớp: ${grade || 12}
Mức độ: ${difficulty || "Vận dụng"}
Phần: ${partType || "Phần I (Trắc nghiệm 4 lựa chọn)"}

Yêu cầu trả về định dạng JSON thuần túy (không bọc trong markdown codeblock nếu có thể, hoặc chuẩn JSON) với cấu trúc:
{
  "content": "Nội dung câu hỏi với LaTeX $...$ hoặc $$...$$",
  "partType": "${partType || "PART_I"}",
  "options": [
    {"id": "A", "text": "Lựa chọn A với LaTeX"},
    {"id": "B", "text": "Lựa chọn B với LaTeX"},
    {"id": "C", "text": "Lựa chọn C với LaTeX"},
    {"id": "D", "text": "Lựa chọn D với LaTeX"}
  ],
  "correctAnswer": "A",
  "explanation": "Lời giải chi tiết từng bước với chuẩn LaTeX $...$",
  "hint": "Gợi ý ngắn để học sinh tự suy nghĩ"
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        systemInstruction: "Bạn là chuyên gia ra đề thi Toán THPT của thầy Phan Quốc Cường. Luôn đảm bảo công thức chuẩn LaTeX $...$ và câu hỏi bám sát ma trận đề Bộ GD&ĐT 2025+.",
        responseMimeType: "application/json",
      },
    });

    try {
      const parsed = JSON.parse(response.text || "{}");
      res.json({ question: parsed });
    } catch {
      res.json({ raw: response.text });
    }
  } catch (error: any) {
    console.error("Adaptive question error:", error);
    res.status(500).json({ error: error.message || "Lỗi tạo câu hỏi thích ứng" });
  }
});

// AI Intelligent Word/MathType Document Parser & Question Classifier
app.post("/api/gemini/parse-mathtype-doc", async (req, res) => {
  try {
    const { rawText, lessonTitle, grade } = req.body;
    const ai = getGenAI();

    const prompt = `Bạn là Thầy Phan Quốc Cường - chuyên gia số hóa đề thi Toán THPT từ file Word / MathType.
Đề bài gốc được trích xuất từ file Word (có thể chứa các ký hiệu MathType chưa chuẩn hóa, thiếu dấu $, hoặc định dạng rời rạc):

=== NỘI DUNG VĂN BẢN TRÍCH XUẤT ===
${rawText}
===================================
Chủ đề bài học: ${lessonTitle || "Toán THPT GDPT 2018"} (Lớp ${grade || 12})

Nhiệm vụ của bạn:
1. Phân tích văn bản và nhận diện TỪNG CÂU HỎI.
2. Tự động nhận diện dạng câu hỏi (partType):
   - PART_I: Trắc nghiệm nhiều phương án (4 lựa chọn A, B, C, D).
   - PART_II: Trắc nghiệm Đúng / Sai (gồm 4 ý a, b, c, d).
   - PART_III: Trắc nghiệm trả lời ngắn (kết quả số, phân số, tọa độ).
   - PART_IV: Tự luận (bài toán có lời giải nhiều bước hoặc đồ thị/mô hình hóa).
3. Tự động phân loại Mức độ nhận thức (cognitiveLevel): "Nhận biết" | "Thông hiểu" | "Vận dụng" | "Vận dụng cao".
4. Tự động xác định Dạng toán / Chủ đề (topicTag): ví dụ "Tính đơn điệu hàm số", "Cực trị", "Tiệm cận", "Tọa độ Oxyz", "Xác suất", v.v.
5. Chuyển đổi toàn bộ công thức MathType sang chuẩn LaTeX $...$ hoặc $$...$$.
6. Trích xuất đáp án đúng và sinh lời giải chi tiết (standardSolution) từng bước cho mỗi câu.

Hãy trả về JSON array danh sách câu hỏi theo schema:
{
  "questions": [
    {
      "id": "mathtype_q_1",
      "partType": "PART_I",
      "cognitiveLevel": "Nhận biết",
      "topicTag": "Đơn điệu hàm số",
      "title": "Câu 1 (Nhận biết):",
      "content": "Nội dung câu hỏi với LaTeX $y = f(x)$...",
      "options": [
        {"id": "A", "text": "Lựa chọn A"},
        {"id": "B", "text": "Lựa chọn B"},
        {"id": "C", "text": "Lựa chọn C"},
        {"id": "D", "text": "Lựa chọn D"}
      ],
      "correctOption": "A",
      "tfStatements": [
        {"id": "a", "statement": "Mệnh đề a", "isCorrect": true, "explanation": "Giải thích"},
        {"id": "b", "statement": "Mệnh đề b", "isCorrect": false, "explanation": "Giải thích"},
        {"id": "c", "statement": "Mệnh đề c", "isCorrect": true, "explanation": "Giải thích"},
        {"id": "d", "statement": "Mệnh đề d", "isCorrect": false, "explanation": "Giải thích"}
      ],
      "shortAnswerCorrect": "4.5",
      "points": 2.5,
      "hint": "Gợi ý tư duy",
      "standardSolution": "Lời giải chi tiết chuẩn mực phương pháp SGK với LaTeX $...$"
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        systemInstruction: "Bạn là chuyên gia chuyển đổi đề thi Toán THPT sang LaTeX chuẩn mực. Luôn đảm bảo công thức Toán bọc trong $...$ và dữ liệu JSON hợp lệ.",
        responseMimeType: "application/json",
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json(parsed);
  } catch (error: any) {
    console.error("Parse mathtype doc error:", error);
    res.status(500).json({ error: error.message || "Lỗi phân tích file Word bằng AI" });
  }
});

// AI Exam Generator by Matrix (Soạn đề theo Ma trận chuẩn GDPT 2018)
app.post("/api/gemini/generate-matrix-exam", async (req, res) => {
  try {
    const { matrix, lessonTitle, chapterTitle, grade } = req.body;
    const ai = getGenAI();

    const prompt = `Bạn là Thầy giáo Phan Quốc Cường - chuyên gia Sư phạm Toán học THPT.
Hãy biên soạn một đề thi Toán THPT hoàn chỉnh và chất lượng cao bám sát MA TRẬN ĐẶC TẢ GDPT 2018 sau:

=== THÔNG SỐ MA TRẬN ĐỀ THI ===
- Tên bài học / Chuyên đề: ${lessonTitle || matrix?.topic || "Toán THPT"}
- Chương: ${chapterTitle || ""} (Lớp ${grade || matrix?.grade || 12})
- Tên cấu trúc: ${matrix?.name || "Đề kiểm tra chuẩn ma trận"}
- Thời gian làm bài: ${matrix?.timeMinutes || 45} phút
- Số câu Phần I (Trắc nghiệm 4 lựa chọn): ${matrix?.part1Count || 4} câu
- Số câu Phần II (Đúng / Sai 4 ý): ${matrix?.part2Count || 1} câu (mỗi câu 4 mệnh đề a, b, c, d)
- Số câu Phần III (Trả lời ngắn): ${matrix?.part3Count || 2} câu
- Số câu Phần IV (Tự luận): ${matrix?.part4Count || 1} câu
- Phân bố mức độ nhận thức:
  + Nhận biết: ${matrix?.cognitiveDistribution?.recognition || 40}%
  + Thông hiểu: ${matrix?.cognitiveDistribution?.comprehension || 30}%
  + Vận dụng: ${matrix?.cognitiveDistribution?.application || 20}%
  + Vận dụng cao: ${matrix?.cognitiveDistribution?.advanced || 10}%
- Yêu cầu bổ sung của giáo viên: ${matrix?.customRequirements || "Đảm bảo tính thực tiễn, số liệu đẹp, không đánh đố vô lý, chuẩn SGK Kết nối tri thức."}
================================

YÊU CẦU BẮT BUỘC:
1. Mọi công thức toán học PHẢI dùng chuẩn LaTeX $...$ hoặc $$...$$.
2. Đảm bảo đúng số lượng câu hỏi cho từng Phần I, Phần II, Phần III, Phần IV theo đúng ma trận.
3. Phần I: Mỗi câu có 4 phương án A, B, C, D và 1 đáp án đúng (correctOption).
4. Phần II: Mỗi câu có 4 ý a, b, c, d rõ ràng với boolean isCorrect và giải thích chi tiết cho từng ý.
5. Phần III: Câu hỏi yêu cầu tính toán ra một giá trị cụ thể (số nguyên, số thập phân hoặc phân số tối giản) với shortAnswerCorrect.
6. Phần IV: Bài toán tự luận có tình huống thực tế hoặc khảo sát chuyên sâu kèm rubric thang điểm chuẩn từng bước.
7. Mỗi câu hỏi PHẢI có standardSolution đầy đủ, sư phạm, chuẩn mực.

Trả về JSON theo cấu trúc:
{
  "matrixName": "${matrix?.name || "Đề thi theo ma trận"}",
  "topic": "${lessonTitle || matrix?.topic}",
  "totalQuestions": ${(matrix?.part1Count || 0) + (matrix?.part2Count || 0) + (matrix?.part3Count || 0) + (matrix?.part4Count || 0)},
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

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        systemInstruction: "Bạn là Thầy Phan Quốc Cường - chuyên gia ra đề thi Toán THPT chất lượng cao theo chương trình GDPT 2018. Luôn xuất ra định dạng JSON hợp lệ với LaTeX hoàn hảo.",
        responseMimeType: "application/json",
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json(parsed);
  } catch (error: any) {
    console.error("Generate matrix exam error:", error);
    res.status(500).json({ error: error.message || "Lỗi tạo đề thi theo ma trận từ AI" });
  }
});

// Essay Evaluation (Phần IV Tự luận)
app.post("/api/gemini/grade-essay", async (req, res) => {
  try {
    const { questionContent, standardSolution, studentSubmissionText, imageBase64 } = req.body;
    const ai = getGenAI();

    const parts: any[] = [];
    if (imageBase64) {
      // Clean data url if needed
      const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");
      parts.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: cleanBase64,
        },
      });
    }

    const promptText = `Bạn là Thầy Phan Quốc Cường đang chấm bài tự luận Toán của học sinh.
Đề bài: ${questionContent}
Đáp án & Thang điểm chuẩn: ${standardSolution || "Theo chuẩn SGK GDPT 2018"}
Bài làm của học sinh (văn bản): ${studentSubmissionText || "Xem ảnh đính kèm"}

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

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: { parts },
      config: {
        responseMimeType: "application/json",
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json(parsed);
  } catch (error: any) {
    console.error("Grade essay error:", error);
    res.status(500).json({ error: error.message || "Lỗi chấm bài tự luận" });
  }
});

// AI Chatbot with Thầy Phan Quốc Cường Persona
app.post("/api/gemini/chat", async (req, res) => {
  try {
    const { messages, studentName } = req.body;
    const ai = getGenAI();

    const systemPrompt = `Bạn là Thầy giáo Phan Quốc Cường - giáo viên dạy Toán THPT nhiệt huyết, giàu kinh nghiệm, chuyên luyện thi Toán 10, 11, 12 theo Chương trình GDPT 2018 (SGK Kết nối tri thức).
Học sinh đang trò chuyện tên là: ${studentName || "em"}.
Phong cách của Thầy:
- Xưng hô "Thầy" và gọi "em" hoặc tên học sinh.
- Luôn ân cần, giải thích cặn kẽ bản chất hình học/đại số, không chỉ đưa ra đáp án cụt lủn mà dẫn dắt học sinh tự tư duy.
- Bắt buộc dùng LaTeX cho mọi biểu thức Toán học, bọc trong $...$ hoặc $$...$$.
- Khi học sinh nản lòng, hãy động viên và nhắc nhở mục tiêu vượt 80% để mở khóa level tiếp theo.`;

    const chatMessages = (messages || []).map((m: any) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const chat = ai.chats.create({
      model: "gemini-3.7-flash",
      config: {
        systemInstruction: systemPrompt,
      },
    });

    const lastMsg = chatMessages.length > 0 ? chatMessages[chatMessages.length - 1].parts[0].text : "Chào thầy Cường ạ!";
    const response = await chat.sendMessage({ message: lastMsg });

    res.json({ reply: response.text });
  } catch (error: any) {
    console.error("Gemini chat error:", error);
    res.status(500).json({
      error: error.message || "Lỗi giao tiếp AI",
      reply: "Thầy chào em! Hiện tại kết nối mạng đang gián đoạn một chút. Em hãy kiểm tra lại câu hỏi hoặc thử lại sau nhé!",
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server "Tự luyện Toán THPT - Phan Quốc Cường" is running on port ${PORT}`);
  });
}

startServer();
