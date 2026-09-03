import React, { useState } from "react";
import { Chapter, Lesson, Question, GradeLevel } from "../types";
import { parseDocxFile, parseExamQuestionsFromText } from "../utils/docxParser";
import { MathRenderer } from "../utils/mathJaxHelper";
import { callGeminiWithFallback, parsePdfExamAi } from "../utils/geminiClient";
import { RichMathInput } from "./RichMathInput";
import {
  exportExamToWordDocx,
  exportExamToPresentationSlides,
  exportQuestionsToMoodleGift,
} from "../utils/exportHelpers";
import {
  Upload,
  FileText,
  Plus,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Bot,
  Sparkles,
  Users,
  Settings,
  BookOpen,
  ArrowDownToLine,
  Sliders,
  Download,
  Layers,
  FileCheck,
} from "lucide-react";

interface TeacherDashboardProps {
  chapters: Chapter[];
  onAddQuestionsToLesson: (lessonId: string, newQuestions: Question[]) => void;
  onCreateLesson: (chapterId: string, newLesson: Lesson) => void;
  currentGrade: GradeLevel;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  chapters,
  onAddQuestionsToLesson,
  onCreateLesson,
  currentGrade,
}) => {
  const [activeTab, setActiveTab] = useState<"UPLOAD_DOCX" | "CLASS_REPORTS" | "AI_GENERATOR">("UPLOAD_DOCX");
  const [selectedLessonId, setSelectedLessonId] = useState<string>("");
  const [rawText, setRawText] = useState<string>("");
  const [parsedPreviewQuestions, setParsedPreviewQuestions] = useState<Question[]>([]);
  const [isProcessingFile, setIsProcessingFile] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string>("");

  // AI Generator state
  const [aiTopic, setAiTopic] = useState<string>("Khảo sát sự biến thiên và vẽ đồ thị hàm số");
  const [aiDifficulty, setAiDifficulty] = useState<string>("Vận dụng");
  const [aiPartType, setAiPartType] = useState<string>("PART_I");
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);

  // Mock student roster for Thầy Cường to manage
  const mockStudents = [
    { name: "Nguyễn Văn An", code: "HS1201", completed: "5/6 bài", avgScore: 88, cheatAlerts: 0, status: "Đạt chuẩn" },
    { name: "Trần Thị Mai", code: "HS1202", completed: "6/6 bài", avgScore: 95, cheatAlerts: 0, status: "Xuất sắc" },
    { name: "Lê Hoàng Long", code: "HS1203", completed: "3/6 bài", avgScore: 68, cheatAlerts: 3, status: "Cảnh báo gian lận" },
    { name: "Phạm Minh Đức", code: "HS1204", completed: "4/6 bài", avgScore: 82, cheatAlerts: 1, status: "Đạt chuẩn" },
    { name: "Vũ Hải Yến", code: "HS1205", completed: "6/6 bài", avgScore: 92, cheatAlerts: 0, status: "Xuất sắc" },
  ];

  const gradeChapters = chapters.filter((c) => c.grade === currentGrade);
  const allLessons = gradeChapters.flatMap((c) => c.lessons);

  // Handle File Upload (.docx & .pdf)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    try {
      if (file.name.toLowerCase().endsWith(".pdf")) {
        const reader = new FileReader();
        reader.onload = async () => {
          try {
            const base64 = reader.result as string;
            const targetLesson = allLessons.find((l) => l.id === selectedLessonId);
            const res = await parsePdfExamAi({
              pdfBase64: base64,
              fileName: file.name,
              lessonTitle: targetLesson?.title || "Toán THPT",
              grade: currentGrade,
            });
            if (res?.questions && Array.isArray(res.questions)) {
              setParsedPreviewQuestions(res.questions);
              setSuccessMsg(`AI đã trích xuất thành công ${res.questions.length} câu hỏi từ file PDF "${file.name}"!`);
            } else {
              alert("Không thể trích xuất câu hỏi từ file PDF này.");
            }
          } catch (err: any) {
            console.error("Parse PDF error:", err);
            alert(`Lỗi đọc file PDF: ${err.message || "Không rõ nguyên nhân"}`);
          } finally {
            setIsProcessingFile(false);
          }
        };
        reader.readAsDataURL(file);
        return;
      }

      let extractedText = "";
      if (file.name.toLowerCase().endsWith(".docx")) {
        extractedText = await parseDocxFile(file);
      } else {
        extractedText = await file.text();
      }
      setRawText(extractedText);
      const parsed = parseExamQuestionsFromText(extractedText);
      setParsedPreviewQuestions(parsed);
      setSuccessMsg(`Đã trích xuất thành công ${parsed.length} câu hỏi từ file "${file.name}"!`);
    } catch (err: any) {
      console.error("Parse file error:", err);
      alert("Không thể đọc tệp này. Hãy kiểm tra định dạng .docx hoặc .pdf!");
    } finally {
      setIsProcessingFile(false);
    }
  };

  // Handle manual parse from textarea
  const handleParseText = () => {
    if (!rawText.trim()) return;
    const parsed = parseExamQuestionsFromText(rawText);
    setParsedPreviewQuestions(parsed);
    setSuccessMsg(`Đã phân tích ${parsed.length} câu hỏi theo chuẩn 4 phần GDPT 2018.`);
  };

  // Commit parsed questions to lesson
  const handleImportToLesson = () => {
    if (!selectedLessonId) {
      alert("Vui lòng chọn bài học muốn nạp câu hỏi vào!");
      return;
    }
    if (parsedPreviewQuestions.length === 0) {
      alert("Chưa có câu hỏi nào để nạp!");
      return;
    }

    onAddQuestionsToLesson(selectedLessonId, parsedPreviewQuestions);
    setSuccessMsg(`Đã thêm thành công ${parsedPreviewQuestions.length} câu hỏi vào bài học!`);
    setParsedPreviewQuestions([]);
    setRawText("");
  };

  // Generate question using client-side Gemini service with fallback
  const handleGenerateAiQuestion = async () => {
    setIsGeneratingAi(true);
    try {
      const prompt = `Hãy tạo 1 câu hỏi Toán THPT theo chương trình GDPT 2018 (SGK Kết nối tri thức).
Chủ đề: ${aiTopic || "Khảo sát hàm số"}
Lớp: ${currentGrade || 12}
Mức độ: ${aiDifficulty || "Vận dụng"}
Phần: ${aiPartType || "PART_I"}

Yêu cầu trả về JSON chuẩn theo schema:
{
  "content": "Nội dung câu hỏi với LaTeX $...$ hoặc $$...$$",
  "partType": "${aiPartType || "PART_I"}",
  "options": [
    {"id": "A", "text": "Lựa chọn A với LaTeX"},
    {"id": "B", "text": "Lựa chọn B với LaTeX"},
    {"id": "C", "text": "Lựa chọn C với LaTeX"},
    {"id": "D", "text": "Lựa chọn D với LaTeX"}
  ],
  "correctOption": "A",
  "explanation": "Lời giải chi tiết từng bước với chuẩn LaTeX $...$",
  "hint": "Gợi ý ngắn để học sinh tự suy nghĩ"
}`;

      const res = await callGeminiWithFallback({
        systemPrompt:
          "Bạn là chuyên gia ra đề thi Toán THPT của thầy Phan Quốc Cường. Luôn đảm bảo công thức chuẩn LaTeX $...$ và dữ liệu JSON hợp lệ.",
        prompt,
        responseMimeType: "application/json",
        temperature: 0.3,
      });

      let parsed: any = null;
      try {
        parsed = JSON.parse(res.text);
      } catch {
        const match = res.text.match(/\{[\s\S]*\}/);
        if (match) parsed = JSON.parse(match[0]);
      }

      if (parsed?.content) {
        const newQ: Question = {
          id: `ai_gen_${Date.now()}`,
          partType: parsed.partType || (aiPartType as any) || "PART_I",
          title: `Câu hỏi AI (${aiDifficulty}):`,
          content: parsed.content,
          options: parsed.options,
          correctOption: parsed.correctOption,
          standardSolution: parsed.explanation || "Lời giải do AI đề xuất.",
          points: 2.5,
          hint: parsed.hint,
        };
        setParsedPreviewQuestions((prev) => [newQ, ...prev]);
        setSuccessMsg(`AI (${res.modelUsed}) đã tạo thành công câu hỏi chuẩn LaTeX!`);
      }
    } catch (err: any) {
      console.error("AI Gen error:", err);
      alert(`[Lỗi AI] ${err.message || "Lỗi khi tạo câu hỏi từ AI. Hãy kiểm tra API Key!"}`);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 max-w-6xl mx-auto">
      {/* Teacher Top Header */}
      <div className="bg-gradient-to-r from-indigo-800 to-blue-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold text-indigo-200 mb-2">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Khu vực Giáo viên • Thầy Phan Quốc Cường</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Quản lý ngân hàng đề & Học sinh
          </h1>
          <p className="text-xs sm:text-sm text-indigo-100/80 mt-1 max-w-xl">
            Tải lên file Word (.docx), trích xuất công thức MathType sang LaTeX, giám sát lớp học và tạo câu hỏi tự động bằng AI.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-white/10 backdrop-blur-md p-1 rounded-2xl border border-white/20 self-start md:self-center">
          <button
            onClick={() => setActiveTab("UPLOAD_DOCX")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "UPLOAD_DOCX"
                ? "bg-white text-indigo-950 shadow-xs"
                : "text-indigo-100 hover:text-white"
            }`}
          >
            Nạp đề từ Word / DOCX
          </button>
          <button
            onClick={() => setActiveTab("AI_GENERATOR")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "AI_GENERATOR"
                ? "bg-white text-indigo-950 shadow-xs"
                : "text-indigo-100 hover:text-white"
            }`}
          >
            Trợ lý AI Ra Đề
          </button>
          <button
            onClick={() => setActiveTab("CLASS_REPORTS")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "CLASS_REPORTS"
                ? "bg-white text-indigo-950 shadow-xs"
                : "text-indigo-100 hover:text-white"
            }`}
          >
            Báo cáo Lớp học
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center justify-between">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg("")} className="text-emerald-900 underline">
            Đóng
          </button>
        </div>
      )}

      {/* ================= TAB 1: UPLOAD DOCX & WORD PARSER ================= */}
      {activeTab === "UPLOAD_DOCX" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left panel: Upload & Input */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-5">
            <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
              <Upload className="w-4 h-4 text-blue-600" />
              Tải file Word (.docx), PDF (.pdf) hoặc dán văn bản
            </h3>

            {/* Target Lesson Select */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Chọn bài học cần thêm câu hỏi:</label>
              <select
                value={selectedLessonId}
                onChange={(e) => setSelectedLessonId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">-- Chọn bài học đích --</option>
                {allLessons.map((l) => (
                  <option key={l.id} value={l.id}>
                    Toán {l.grade} - {l.title}
                  </option>
                ))}
              </select>
            </div>

            {/* File Drop Area */}
            <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center hover:border-blue-500 bg-slate-50 transition-colors">
              <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-700">Chọn file .docx hoặc .pdf đề thi</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Tự động trích xuất công thức MathType và chuẩn hóa sang LaTeX $...$</p>
              <label className="mt-3 inline-block cursor-pointer px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs">
                <span>{isProcessingFile ? "Đang đọc file..." : "Chọn file từ máy tính (.docx, .pdf)"}</span>
                <input
                  type="file"
                  accept=".docx,.pdf,.txt"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </label>
            </div>

            {/* Or Paste text */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">Hoặc dán nội dung văn bản đề:</label>
                <button
                  onClick={handleParseText}
                  className="text-xs text-blue-600 hover:text-blue-800 font-bold"
                >
                  Trích xuất câu hỏi
                </button>
              </div>
              <textarea
                rows={8}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder={`Ví dụ mẫu:\nPHẦN I: Câu 1: Cho hàm số y = f(x)... A. ... B. ... C. ... D. ...\nPHẦN II: Câu 2: Cho hàm số... a) ... b) ...`}
                className="w-full p-3 rounded-xl border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>
          </div>

          {/* Right panel: Parsed Questions Preview */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-slate-900 text-base">
                  Xem trước câu hỏi đã trích xuất ({parsedPreviewQuestions.length})
                </h3>
                {parsedPreviewQuestions.length > 0 && (
                  <button
                    onClick={() => setParsedPreviewQuestions([])}
                    className="text-xs text-rose-600 hover:text-rose-800 font-bold"
                  >
                    Xóa danh sách xem trước
                  </button>
                )}
              </div>

              {parsedPreviewQuestions.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs rounded-2xl bg-slate-50 border border-slate-100">
                  Chưa có câu hỏi nào được nạp. Hãy tải file Word hoặc dán nội dung ở bên trái.
                </div>
              ) : (
                <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                  {parsedPreviewQuestions.map((q, idx) => (
                    <div
                      key={q.id}
                      className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 text-xs space-y-2"
                    >
                      <div className="flex items-center justify-between font-bold text-slate-800">
                        <span>
                          {q.title || `Câu ${idx + 1}`} ({q.partType})
                        </span>
                        <span className="text-blue-700">{q.points} điểm</span>
                      </div>
                      <div className="text-slate-800 font-medium">
                        <MathRenderer content={q.content} />
                      </div>
                      {q.options && (
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          {q.options.map((o) => (
                            <div key={o.id} className="p-1.5 bg-white rounded-lg border border-slate-200">
                              <strong>{o.id}.</strong> <MathRenderer content={o.text} inline />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {parsedPreviewQuestions.length > 0 && (
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      exportExamToWordDocx(
                        "Đề thi Trích xuất Toán THPT",
                        parsedPreviewQuestions,
                        currentGrade,
                        45
                      )
                    }
                    className="py-2.5 px-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold text-xs border border-blue-200 flex items-center justify-center gap-1.5 transition-all"
                    title="Xuất đề thi ra Word (.doc) theo mẫu Bộ GD&ĐT"
                  >
                    <Download className="w-3.5 h-3.5 text-blue-600" />
                    <span>Xuất Word (.doc)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      exportExamToPresentationSlides(
                        "Đề thi Trích xuất Toán THPT",
                        parsedPreviewQuestions
                      )
                    }
                    className="py-2.5 px-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-800 font-bold text-xs border border-indigo-200 flex items-center justify-center gap-1.5 transition-all"
                    title="Xuất bài giảng dạng Slide PowerPoint"
                  >
                    <Layers className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Xuất Slide (.html)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      exportQuestionsToMoodleGift(
                        "Đề thi Trích xuất Toán THPT",
                        parsedPreviewQuestions
                      )
                    }
                    className="py-2.5 px-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs border border-amber-200 flex items-center justify-center gap-1.5 transition-all"
                    title="Xuất định dạng Moodle GIFT / Azota"
                  >
                    <FileCheck className="w-3.5 h-3.5 text-amber-600" />
                    <span>Xuất Moodle (GIFT)</span>
                  </button>
                </div>

                <button
                  id="import_questions_btn"
                  onClick={handleImportToLesson}
                  className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md transition-all active:scale-95"
                >
                  Xác nhận nạp {parsedPreviewQuestions.length} câu hỏi vào bài học
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 2: AI QUESTION GENERATOR ================= */}
      {activeTab === "AI_GENERATOR" && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-lg">
                Trợ lý AI Ra Đề Chuẩn GDPT 2018
              </h3>
              <p className="text-xs text-slate-500">
                Tạo câu hỏi phân hóa theo các mức độ Nhận biết, Thông hiểu, Vận dụng và Vận dụng cao với chuẩn MathJax LaTeX.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Chủ đề bài học:</label>
              <input
                type="text"
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Mức độ nhận thức:</label>
              <select
                value={aiDifficulty}
                onChange={(e) => setAiDifficulty(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="Nhận biết">Nhận biết</option>
                <option value="Thông hiểu">Thông hiểu</option>
                <option value="Vận dụng">Vận dụng</option>
                <option value="Vận dụng cao">Vận dụng cao</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Phần thi cấu trúc:</label>
              <select
                value={aiPartType}
                onChange={(e) => setAiPartType(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="PART_I">Phần I (Trắc nghiệm 4 lựa chọn)</option>
                <option value="PART_II">Phần II (Đúng / Sai 4 ý)</option>
                <option value="PART_III">Phần III (Trả lời ngắn)</option>
                <option value="PART_IV">Phần IV (Tự luận)</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleGenerateAiQuestion}
            disabled={isGeneratingAi}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-extrabold text-xs shadow-md hover:opacity-95 transition-all flex items-center gap-2"
          >
            <Bot className="w-4 h-4" />
            <span>{isGeneratingAi ? "AI đang tính toán và sinh đề..." : "Sinh câu hỏi mới bằng AI"}</span>
          </button>
        </div>
      )}

      {/* ================= TAB 3: CLASS REPORTS & ANTI-CHEAT AUDIT ================= */}
      {activeTab === "CLASS_REPORTS" && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                Danh sách theo dõi học sinh lớp 12A
              </h3>
              <p className="text-xs text-slate-500">
                Thống kê tiến độ hoàn thành, điểm trung bình và số lần cảnh báo gian lận chuyển tab
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl">
                Ngưỡng đạt: $\ge 80\%$
              </span>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                  <th className="p-3.5">Họ và tên</th>
                  <th className="p-3.5">Mã HS</th>
                  <th className="p-3.5">Tiến độ bài học</th>
                  <th className="p-3.5">Điểm TB</th>
                  <th className="p-3.5">Cảnh báo chuyển tab</th>
                  <th className="p-3.5">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {mockStudents.map((s, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80">
                    <td className="p-3.5 font-bold text-slate-900">{s.name}</td>
                    <td className="p-3.5 font-mono text-slate-500">{s.code}</td>
                    <td className="p-3.5">{s.completed}</td>
                    <td className="p-3.5 font-bold text-blue-700">{s.avgScore} / 100</td>
                    <td className="p-3.5">
                      {s.cheatAlerts > 0 ? (
                        <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold">
                          {s.cheatAlerts} lần
                        </span>
                      ) : (
                        <span className="text-emerald-600">0 lần</span>
                      )}
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`px-2.5 py-1 rounded-full font-bold ${
                          s.status === "Xuất sắc"
                            ? "bg-emerald-100 text-emerald-800"
                            : s.status === "Đạt chuẩn"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
