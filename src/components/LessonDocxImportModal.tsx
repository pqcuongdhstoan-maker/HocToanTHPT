import React, { useState } from "react";
import { Lesson, Question, CognitiveLevel, QuestionPartType } from "../types";
import { parseDocxFile, parseExamQuestionsFromText } from "../utils/docxParser";
import { MathRenderer } from "../utils/mathJaxHelper";
import { parseMathTypeDocAi, parsePdfExamAi } from "../utils/geminiClient";
import { RichMathInput } from "./RichMathInput";
import {
  X,
  Upload,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Trash2,
  Plus,
  RefreshCw,
  BookOpen,
  ArrowRight,
  Layers,
  Wand2,
  AlertTriangle,
  Edit3,
  Eye,
  Check,
  FileDown,
  Copy,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface LessonDocxImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  lesson: Lesson | null;
  onImportQuestions: (lessonId: string, questions: Question[]) => void;
}

export const LessonDocxImportModal: React.FC<LessonDocxImportModalProps> = ({
  isOpen,
  onClose,
  lesson,
  onImportQuestions,
}) => {
  if (!isOpen || !lesson) return null;

  const [rawText, setRawText] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [parsedQuestions, setParsedQuestions] = useState<Question[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isAiClassifying, setIsAiClassifying] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  // Multi-step Pipeline & Error States (Strictly per AI_INSTRUCTIONS.md)
  type StepStatus = "IDLE" | "PROCESSING" | "COMPLETED" | "STOPPED_ERROR";
  const [step1Status, setStep1Status] = useState<StepStatus>("IDLE");
  const [step2Status, setStep2Status] = useState<StepStatus>("IDLE");
  const [step3Status, setStep3Status] = useState<StepStatus>("IDLE");
  const [rawApiError, setRawApiError] = useState<string | null>(null);

  // Editing state for in-place question customization
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"EDIT" | "PREVIEW">("EDIT");

  // Handle local File Upload (Supports both .docx and .pdf)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsProcessing(true);
    setRawApiError(null);
    setStatusMsg({ type: "info", text: `Đang xử lý và đọc nội dung từ tệp "${file.name}"...` });

    try {
      if (file.name.toLowerCase().endsWith(".pdf")) {
        // PDF File parsing via Multimodal Gemini AI
        setStatusMsg({ type: "info", text: `Đang tải tệp PDF "${file.name}" và dùng AI trích xuất câu hỏi...` });
        setStep1Status("PROCESSING");
        setStep2Status("IDLE");
        setStep3Status("IDLE");

        const reader = new FileReader();
        reader.onload = async () => {
          try {
            const base64Data = reader.result as string;
            setStep1Status("COMPLETED");

            setStep2Status("PROCESSING");
            const result = await parsePdfExamAi({
              pdfBase64: base64Data,
              fileName: file.name,
              lessonTitle: lesson.title,
              grade: lesson.grade,
            });

            if (!result?.questions || !Array.isArray(result.questions) || result.questions.length === 0) {
              throw new Error("AI không tìm thấy câu hỏi hợp lệ trong tệp PDF này.");
            }

            setStep2Status("COMPLETED");
            setStep3Status("PROCESSING");
            await new Promise((r) => setTimeout(r, 250));
            setStep3Status("COMPLETED");

            setParsedQuestions(result.questions);
            setStatusMsg({
              type: "success",
              text: `AI đã trích xuất và chuẩn hóa thành công ${result.questions.length} câu hỏi từ file PDF "${file.name}"!`,
            });
          } catch (err: any) {
            console.error("PDF parse error:", err);
            const msg = err.message || String(err);
            setRawApiError(msg);
            setStep1Status((prev) => (prev === "PROCESSING" ? "STOPPED_ERROR" : prev));
            setStep2Status((prev) => (prev === "PROCESSING" || prev === "IDLE" ? "STOPPED_ERROR" : prev));
            setStep3Status((prev) => (prev === "PROCESSING" || prev === "IDLE" ? "STOPPED_ERROR" : prev));
            setStatusMsg({
              type: "error",
              text: `Lỗi đọc file PDF: ${msg}. Bạn có thể dán nội dung hoặc thêm câu hỏi thủ công.`,
            });
          } finally {
            setIsProcessing(false);
          }
        };
        reader.readAsDataURL(file);
      } else {
        // Word (.docx) or Text file
        let extracted = "";
        if (file.name.toLowerCase().endsWith(".docx")) {
          extracted = await parseDocxFile(file);
        } else {
          extracted = await file.text();
        }
        setRawText(extracted);

        // Fast regex-based parse
        const quickParsed = parseExamQuestionsFromText(extracted);
        setParsedQuestions(quickParsed);
        setStatusMsg({
          type: "success",
          text: `Đã trích xuất ${quickParsed.length} câu hỏi từ "${file.name}". Thầy có thể sửa trực tiếp hoặc bấm "AI Nhận diện chuyên sâu"!`,
        });
        setIsProcessing(false);
      }
    } catch (err: any) {
      console.error("File parse error:", err);
      setStatusMsg({
        type: "error",
        text: "Không thể đọc tệp này. Hãy kiểm tra tệp có đúng định dạng .docx hoặc .pdf không.",
      });
      setIsProcessing(false);
    }
  };

  // Fast client-side parse from raw text
  const handleQuickParse = () => {
    if (!rawText.trim()) {
      setStatusMsg({ type: "error", text: "Vui lòng nhập hoặc dán nội dung văn bản đề thi!" });
      return;
    }

    const questions = parseExamQuestionsFromText(rawText);
    setParsedQuestions(questions);
    setStatusMsg({
      type: "success",
      text: `Đã nhận diện ${questions.length} câu hỏi theo cấu trúc chuẩn GDPT 2018!`,
    });
  };

  // AI-powered Deep MathType & Cognitive Level Classifier (3-Step Pipeline)
  const handleAiDeepClassify = async () => {
    if (!rawText.trim()) {
      setStatusMsg({
        type: "error",
        text: "Vui lòng tải file Word hoặc dán nội dung văn bản trước khi phân loại AI!",
      });
      return;
    }

    setIsAiClassifying(true);
    setRawApiError(null);
    setStep1Status("PROCESSING");
    setStep2Status("IDLE");
    setStep3Status("IDLE");
    setStatusMsg({
      type: "info",
      text: "Thầy Cường AI đang chuẩn hóa công thức MathType sang LaTeX và phân loại dạng câu hỏi...",
    });

    try {
      // Step 1: Trích xuất cấu trúc văn bản thô
      await new Promise((resolve) => setTimeout(resolve, 300));
      setStep1Status("COMPLETED");

      // Step 2: Chuẩn hóa công thức MathType sang LaTeX $...$
      setStep2Status("PROCESSING");
      const data = await parseMathTypeDocAi({
        rawText: rawText.slice(0, 8000),
        lessonTitle: lesson.title,
        grade: lesson.grade,
      });

      if (!data?.questions || !Array.isArray(data.questions) || data.questions.length === 0) {
        throw new Error("Không thể trích xuất danh sách câu hỏi hợp lệ từ văn bản.");
      }
      setStep2Status("COMPLETED");

      // Step 3: Phân loại theo 4 phần thi chuẩn GDPT 2018
      setStep3Status("PROCESSING");
      await new Promise((resolve) => setTimeout(resolve, 300));
      setStep3Status("COMPLETED");

      setParsedQuestions(data.questions);
      setStatusMsg({
        type: "success",
        text: `AI đã chuẩn hóa thành công ${data.questions.length} câu hỏi với công thức MathJax LaTeX hoàn chỉnh!`,
      });
    } catch (err: any) {
      console.error("AI classify error:", err);
      const rawErrorMsg = err?.message || String(err);
      setRawApiError(rawErrorMsg);

      // AI_INSTRUCTIONS.md: Trạng thái các cột đang chờ phải chuyển thành "Đã dừng do lỗi", tuyệt đối không được hiện "Hoàn tất"
      setStep1Status((prev) => (prev === "PROCESSING" ? "STOPPED_ERROR" : prev));
      setStep2Status((prev) => (prev === "PROCESSING" || prev === "IDLE" ? "STOPPED_ERROR" : prev));
      setStep3Status((prev) => (prev === "PROCESSING" || prev === "IDLE" ? "STOPPED_ERROR" : prev));

      setStatusMsg({
        type: "error",
        text: `Quy trình AI đã dừng do lỗi API: ${rawErrorMsg}`,
      });
      handleQuickParse();
    } finally {
      setIsAiClassifying(false);
    }
  };

  // Add a new question manually
  const handleAddNewQuestion = (partType: QuestionPartType = "PART_I") => {
    const newId = `custom_q_${Date.now()}`;
    const newQ: Question = {
      id: newId,
      partType: partType,
      cognitiveLevel: "Thông hiểu",
      title: `Câu ${parsedQuestions.length + 1}:`,
      content: "Nhập nội dung câu hỏi tại đây... (Ví dụ: Cho hàm số $y = f(x)$...)",
      options:
        partType === "PART_I"
          ? [
              { id: "A", text: "Phương án A" },
              { id: "B", text: "Phương án B" },
              { id: "C", text: "Phương án C" },
              { id: "D", text: "Phương án D" },
            ]
          : undefined,
      correctOption: partType === "PART_I" ? "A" : undefined,
      tfStatements:
        partType === "PART_II"
          ? [
              { id: "a", statement: "Mệnh đề a)", isCorrect: true },
              { id: "b", statement: "Mệnh đề b)", isCorrect: false },
              { id: "c", statement: "Mệnh đề c)", isCorrect: true },
              { id: "d", statement: "Mệnh đề d)", isCorrect: false },
            ]
          : undefined,
      shortAnswerKey: partType === "PART_III" ? "10" : undefined,
      points: partType === "PART_I" ? 0.25 : partType === "PART_II" ? 1.0 : partType === "PART_III" ? 0.5 : 2.0,
      standardSolution: "Lời giải chi tiết từng bước với chuẩn LaTeX $...$",
      hint: "Gợi ý phương pháp giải nhanh",
    };

    setParsedQuestions((prev) => [...prev, newQ]);
    setEditingIndex(parsedQuestions.length);
    setStatusMsg({
      type: "info",
      text: `Đã thêm 1 câu hỏi mới (${getPartBadge(partType).label}). Thầy hãy soạn thảo nội dung và chèn công thức nhé!`,
    });
  };

  // Update a question in place
  const handleUpdateQuestion = (index: number, updatedFields: Partial<Question>) => {
    setParsedQuestions((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...updatedFields };
      return next;
    });
  };

  // Remove a question
  const handleRemoveQuestion = (index: number) => {
    if (editingIndex === index) setEditingIndex(null);
    setParsedQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  // Duplicate a question
  const handleDuplicateQuestion = (index: number) => {
    const q = parsedQuestions[index];
    if (!q) return;
    const duplicated: Question = {
      ...q,
      id: `copy_${Date.now()}`,
      title: `${q.title} (Bản sao)`,
    };
    setParsedQuestions((prev) => [...prev.slice(0, index + 1), duplicated, ...prev.slice(index + 1)]);
  };

  // Commit questions to lesson
  const handleConfirmImport = () => {
    if (parsedQuestions.length === 0) {
      alert("Chưa có câu hỏi nào để nạp vào bài học!");
      return;
    }

    onImportQuestions(lesson.id, parsedQuestions);
    alert(`Đã thêm thành công ${parsedQuestions.length} câu hỏi vào "${lesson.title}"!`);
    onClose();
  };

  const getCognitiveColor = (level?: CognitiveLevel) => {
    switch (level) {
      case "Nhận biết":
        return "bg-emerald-100 text-emerald-800 border-emerald-300";
      case "Thông hiểu":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "Vận dụng":
        return "bg-amber-100 text-amber-800 border-amber-300";
      case "Vận dụng cao":
        return "bg-rose-100 text-rose-800 border-rose-300";
      default:
        return "bg-slate-100 text-slate-800 border-slate-300";
    }
  };

  const getPartBadge = (part: QuestionPartType) => {
    switch (part) {
      case "PART_I":
        return { label: "Phần I: 4 Lựa chọn", color: "bg-blue-600 text-white" };
      case "PART_II":
        return { label: "Phần II: Đúng / Sai", color: "bg-indigo-600 text-white" };
      case "PART_III":
        return { label: "Phần III: Trả lời ngắn", color: "bg-purple-600 text-white" };
      case "PART_IV":
        return { label: "Phần IV: Tự luận", color: "bg-emerald-600 text-white" };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-700 via-indigo-800 to-indigo-950 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-white border border-white/20">
              <Upload className="w-5 h-5 text-blue-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/40 text-blue-100 border border-blue-400/30">
                  Nạp đề từng bài học (Word & PDF)
                </span>
                <span className="text-xs text-blue-200 font-medium">Toán {lesson.grade}</span>
              </div>
              <h2 className="text-base sm:text-lg font-black tracking-tight">{lesson.title}</h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="bg-white/15 p-1 rounded-xl flex items-center gap-1 text-xs">
              <button
                type="button"
                onClick={() => setViewMode("EDIT")}
                className={`px-3 py-1 rounded-lg font-bold transition-colors ${
                  viewMode === "EDIT" ? "bg-white text-blue-900 shadow-xs" : "text-white/80 hover:text-white"
                }`}
              >
                Soạn thảo
              </button>
              <button
                type="button"
                onClick={() => setViewMode("PREVIEW")}
                className={`px-3 py-1 rounded-lg font-bold transition-colors ${
                  viewMode === "PREVIEW" ? "bg-white text-blue-900 shadow-xs" : "text-white/80 hover:text-white"
                }`}
              >
                Xem trước như học sinh
              </button>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Status Message */}
          {statusMsg && (
            <div
              className={`p-3.5 rounded-2xl text-xs font-bold flex items-center justify-between gap-2.5 border ${
                statusMsg.type === "success"
                  ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                  : statusMsg.type === "error"
                  ? "bg-rose-50 text-rose-800 border-rose-300"
                  : "bg-blue-50 text-blue-800 border-blue-300"
              }`}
            >
              <div className="flex items-center gap-2">
                {statusMsg.type === "success" && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                {statusMsg.type === "error" && <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
                {statusMsg.type === "info" && <RefreshCw className="w-4 h-4 text-blue-600 animate-spin shrink-0" />}
                <span>{statusMsg.text}</span>
              </div>
              <button
                type="button"
                onClick={() => setStatusMsg(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>
          )}

          {/* 3-Step Pipeline Status (Strictly per AI_INSTRUCTIONS.md) */}
          {(isAiClassifying || rawApiError || step1Status !== "IDLE") && (
            <div className="p-4 rounded-2xl bg-slate-900 text-white shadow-lg space-y-3 border border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-slate-300">
                  Tiến trình chuẩn hóa AI & trích xuất MathType (3 Bước)
                </span>
                <span className="text-[11px] font-bold text-slate-400">
                  {step3Status === "COMPLETED"
                    ? "100% Hoàn tất"
                    : step2Status === "COMPLETED"
                    ? "66% Đã xong 2 bước"
                    : step1Status === "COMPLETED"
                    ? "33% Đã xong 1 bước"
                    : rawApiError
                    ? "Đã dừng quy trình"
                    : "Đang khởi tạo..."}
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${
                    rawApiError ? "bg-rose-500" : "bg-emerald-500"
                  }`}
                  style={{
                    width:
                      step3Status === "COMPLETED"
                        ? "100%"
                        : step2Status === "COMPLETED"
                        ? "66%"
                        : step1Status === "COMPLETED"
                        ? "33%"
                        : isAiClassifying
                        ? "15%"
                        : "0%",
                  }}
                />
              </div>

              {/* 3 Columns */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                <div
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                    step1Status === "COMPLETED"
                      ? "bg-emerald-950/40 border-emerald-500/50 text-emerald-300"
                      : step1Status === "PROCESSING"
                      ? "bg-blue-950/40 border-blue-500/50 text-blue-300"
                      : step1Status === "STOPPED_ERROR"
                      ? "bg-rose-950/40 border-rose-500/50 text-rose-300"
                      : "bg-slate-800/40 border-slate-700/50 text-slate-400"
                  }`}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span>Bước 1: Trích xuất thô</span>
                    {step1Status === "COMPLETED" && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                    {step1Status === "PROCESSING" && <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-400" />}
                    {step1Status === "STOPPED_ERROR" && <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />}
                  </div>
                  <span className="text-[10px] opacity-80 font-normal">
                    {step1Status === "COMPLETED"
                      ? "Hoàn tất"
                      : step1Status === "PROCESSING"
                      ? "Đang xử lý..."
                      : step1Status === "STOPPED_ERROR"
                      ? "Đã dừng do lỗi"
                      : "Chờ thực hiện"}
                  </span>
                </div>

                <div
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                    step2Status === "COMPLETED"
                      ? "bg-emerald-950/40 border-emerald-500/50 text-emerald-300"
                      : step2Status === "PROCESSING"
                      ? "bg-blue-950/40 border-blue-500/50 text-blue-300"
                      : step2Status === "STOPPED_ERROR"
                      ? "bg-rose-950/40 border-rose-500/50 text-rose-300"
                      : "bg-slate-800/40 border-slate-700/50 text-slate-400"
                  }`}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span>Bước 2: MathType ➔ LaTeX</span>
                    {step2Status === "COMPLETED" && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                    {step2Status === "PROCESSING" && <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-400" />}
                    {step2Status === "STOPPED_ERROR" && <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />}
                  </div>
                  <span className="text-[10px] opacity-80 font-normal">
                    {step2Status === "COMPLETED"
                      ? "Hoàn tất"
                      : step2Status === "PROCESSING"
                      ? "Đang chuyển đổi..."
                      : step2Status === "STOPPED_ERROR"
                      ? "Đã dừng do lỗi"
                      : "Chờ thực hiện"}
                  </span>
                </div>

                <div
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                    step3Status === "COMPLETED"
                      ? "bg-emerald-950/40 border-emerald-500/50 text-emerald-300"
                      : step3Status === "PROCESSING"
                      ? "bg-blue-950/40 border-blue-500/50 text-blue-300"
                      : step3Status === "STOPPED_ERROR"
                      ? "bg-rose-950/40 border-rose-500/50 text-rose-300"
                      : "bg-slate-800/40 border-slate-700/50 text-slate-400"
                  }`}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span>Bước 3: Phân loại 4 phần</span>
                    {step3Status === "COMPLETED" && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                    {step3Status === "PROCESSING" && <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-400" />}
                    {step3Status === "STOPPED_ERROR" && <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />}
                  </div>
                  <span className="text-[10px] opacity-80 font-normal">
                    {step3Status === "COMPLETED"
                      ? "Hoàn tất"
                      : step3Status === "PROCESSING"
                      ? "Đang phân loại..."
                      : step3Status === "STOPPED_ERROR"
                      ? "Đã dừng do lỗi"
                      : "Chờ thực hiện"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Verbatim Red Error Banner (Strictly per AI_INSTRUCTIONS.md) */}
          {rawApiError && (
            <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-900 space-y-2 animate-fadeIn">
              <div className="flex items-center gap-2 font-black text-xs uppercase tracking-wider text-rose-700">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <span>Quy trình xử lý AI đã dừng do lỗi API:</span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-rose-200 font-mono text-xs text-rose-800 break-all leading-relaxed">
                {rawApiError}
              </div>
              <p className="text-[11px] text-rose-700">
                Hệ thống đã tự động thử lại qua chuỗi model dự phòng (Flash ➔ Pro ➔ 2.5). Bạn có thể kiểm tra hoặc đổi API Key tại nút Settings trên Header.
              </p>
            </div>
          )}

          {/* Upload & Parse Action Area */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            {/* Left: File input (Supports Word & PDF) & Paste box */}
            <div className="md:col-span-6 space-y-4">
              {/* File Dropzone */}
              <div className="border-2 border-dashed border-blue-200 hover:border-blue-400 rounded-2xl p-5 bg-blue-50/40 text-center transition-colors">
                <Upload className="w-7 h-7 text-blue-600 mx-auto mb-1.5" />
                <p className="text-xs font-bold text-slate-800">
                  {fileName ? `File đã chọn: ${fileName}` : "Tải lên file Word (.docx) hoặc file PDF (.pdf)"}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Tự động chuyển đổi MathType, OMML hoặc trích xuất đề từ PDF sang LaTeX $...$
                </p>
                <label className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer active:scale-95 transition-all">
                  <FileText className="w-3.5 h-3.5" />
                  <span>{isProcessing ? "Đang xử lý..." : "Chọn file .docx hoặc .pdf"}</span>
                  <input
                    type="file"
                    accept=".docx,.pdf,.txt"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </label>
              </div>

              {/* Textarea Paste */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">Hoặc dán nội dung văn bản đề:</label>
                  <span className="text-[11px] text-slate-400 font-mono">{rawText.length} ký tự</span>
                </div>
                <textarea
                  rows={4}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder={`Ví dụ:\nCâu 1 (Nhận biết): Cho hàm số y = f(x)... A. ... B. ... C. ... D. ...\nĐáp án: A\nCâu 2 (Đúng/Sai): Cho hàm số... a) ... b) ...`}
                  className="w-full p-3 rounded-xl border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleQuickParse}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold border border-slate-300 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Layers className="w-3.5 h-3.5 text-slate-600" />
                  <span>Trích xuất nhanh (Regex)</span>
                </button>

                <button
                  type="button"
                  onClick={handleAiDeepClassify}
                  disabled={isAiClassifying}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-95 text-white text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>{isAiClassifying ? "AI đang phân loại..." : "AI Nhận diện chuyên sâu"}</span>
                </button>
              </div>
            </div>

            {/* Right: Quick Manual Addition & Format Rules */}
            <div className="md:col-span-6 bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-extrabold text-slate-900 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-teal-600" />
                  Thêm câu hỏi thủ công vào bài học
                </h4>
                <span className="text-[11px] text-teal-700 font-bold bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                  Kèm ∑ Chèn công thức
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleAddNewQuestion("PART_I")}
                  className="p-2.5 rounded-xl bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-left text-xs font-bold text-slate-700 transition-all shadow-2xs flex items-center gap-2"
                >
                  <span className="w-6 h-6 rounded bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-black">I</span>
                  <span>+ Phần I (4 Lựa chọn)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAddNewQuestion("PART_II")}
                  className="p-2.5 rounded-xl bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-left text-xs font-bold text-slate-700 transition-all shadow-2xs flex items-center gap-2"
                >
                  <span className="w-6 h-6 rounded bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-black">II</span>
                  <span>+ Phần II (Đúng / Sai)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAddNewQuestion("PART_III")}
                  className="p-2.5 rounded-xl bg-white hover:bg-purple-50 border border-slate-200 hover:border-purple-300 text-left text-xs font-bold text-slate-700 transition-all shadow-2xs flex items-center gap-2"
                >
                  <span className="w-6 h-6 rounded bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-black">III</span>
                  <span>+ Phần III (Trả lời ngắn)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAddNewQuestion("PART_IV")}
                  className="p-2.5 rounded-xl bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-left text-xs font-bold text-slate-700 transition-all shadow-2xs flex items-center gap-2"
                >
                  <span className="w-6 h-6 rounded bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-black">IV</span>
                  <span>+ Phần IV (Tự luận)</span>
                </button>
              </div>

              {/* Format Guide */}
              <div className="pt-2 border-t border-slate-200 text-xs text-slate-600 space-y-1.5">
                <p className="font-bold text-slate-800 flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
                  Mẹo tạo đề thi chuẩn GDPT 2018:
                </p>
                <p className="text-[11px] leading-relaxed">
                  Tại mỗi câu hỏi, Thầy có thể bấm <strong>"Chỉnh sửa"</strong> để mở trình soạn thảo với nút <strong>"∑ Chèn công thức"</strong> trên thanh công cụ. Toàn bộ công thức MathLive sẽ được chuyển thành chuẩn LaTeX và render trực quan bằng MathJax 3 cho học sinh.
                </p>
              </div>
            </div>
          </div>

          {/* Questions Section: Edit Mode vs Student Preview Mode */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                <span>Danh sách câu hỏi đề thi ({parsedQuestions.length} câu)</span>
              </h3>

              <div className="flex items-center gap-2">
                {parsedQuestions.length > 0 && (
                  <button
                    onClick={() => setParsedQuestions([])}
                    className="text-xs text-rose-600 hover:text-rose-800 font-bold px-2 py-1"
                  >
                    Xóa tất cả
                  </button>
                )}
              </div>
            </div>

            {parsedQuestions.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-400 space-y-2">
                <p>Chưa có câu hỏi nào trong danh sách.</p>
                <p className="text-slate-500 font-medium">
                  Hãy tải file Word (.docx), file PDF (.pdf) hoặc bấm một trong các nút "+ Phần I, II, III, IV" ở trên để nhập câu hỏi thủ công.
                </p>
              </div>
            ) : viewMode === "PREVIEW" ? (
              /* STUDENT PREVIEW MODE (Pure MathJax 3 Rendering, no raw LaTeX visible) */
              <div className="space-y-4 max-h-[460px] overflow-y-auto pr-1">
                {parsedQuestions.map((q, idx) => {
                  const partInfo = getPartBadge(q.partType);
                  return (
                    <div
                      key={q.id || idx}
                      className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3.5"
                    >
                      {/* Header Badge */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black ${partInfo.color}`}>
                            {partInfo.label}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${getCognitiveColor(q.cognitiveLevel)}`}>
                            {q.cognitiveLevel || "Thông hiểu"}
                          </span>
                        </div>
                        <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                          {q.points} điểm
                        </span>
                      </div>

                      {/* Content */}
                      <div className="text-sm font-semibold text-slate-900 leading-relaxed">
                        <span className="text-blue-700 font-black mr-1.5">Câu {idx + 1}:</span>
                        <MathRenderer math={q.content} />
                      </div>

                      {/* Part I: Options */}
                      {q.partType === "PART_I" && q.options && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                          {q.options.map((opt) => (
                            <div
                              key={opt.id}
                              className={`p-2.5 rounded-xl text-xs flex items-center gap-2 border ${
                                q.correctOption === opt.id
                                  ? "bg-emerald-50 border-emerald-300 text-emerald-900 font-bold"
                                  : "bg-slate-50 border-slate-200 text-slate-800"
                              }`}
                            >
                              <span className="w-5 h-5 rounded-full bg-white border border-slate-300 flex items-center justify-center font-bold text-[11px]">
                                {opt.id}
                              </span>
                              <div className="flex-1">
                                <MathRenderer math={opt.text} />
                              </div>
                              {q.correctOption === opt.id && (
                                <span className="text-[10px] bg-emerald-200 text-emerald-800 px-1.5 py-0.5 rounded font-bold">
                                  Đáp án đúng
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Part II: True / False */}
                      {q.partType === "PART_II" && q.tfStatements && (
                        <div className="space-y-1.5 pt-1">
                          {q.tfStatements.map((tf) => (
                            <div
                              key={tf.id}
                              className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between gap-2"
                            >
                              <div className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded bg-indigo-100 text-indigo-800 font-bold text-[11px] flex items-center justify-center">
                                  {tf.id}
                                </span>
                                <MathRenderer math={tf.statement} />
                              </div>
                              <span
                                className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                  tf.isCorrect ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                                }`}
                              >
                                {tf.isCorrect ? "Đúng" : "Sai"}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Part III: Short answer */}
                      {q.partType === "PART_III" && q.shortAnswerKey && (
                        <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-200 text-xs text-purple-900 flex items-center gap-2">
                          <span className="font-bold">Đáp án ngắn:</span>
                          <span className="font-mono font-black bg-white px-2 py-0.5 rounded border border-purple-300">
                            {q.shortAnswerKey}
                          </span>
                        </div>
                      )}

                      {/* Solution */}
                      {q.standardSolution && (
                        <div className="p-3 rounded-xl bg-indigo-50/50 border border-indigo-100 text-xs text-indigo-900 space-y-1">
                          <span className="font-bold">Lời giải chi tiết:</span>
                          <MathRenderer math={q.standardSolution} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              /* EDIT MODE (Includes RichMathInput & ∑ Chèn công thức for every field) */
              <div className="space-y-4 max-h-[460px] overflow-y-auto pr-1">
                {parsedQuestions.map((q, idx) => {
                  const isEditingThis = editingIndex === idx;
                  const partInfo = getPartBadge(q.partType);

                  return (
                    <div
                      key={q.id || idx}
                      className={`p-4 rounded-2xl border transition-all ${
                        isEditingThis
                          ? "bg-white border-2 border-teal-500 shadow-md"
                          : "bg-white border-slate-200/90 shadow-xs hover:border-blue-300"
                      }`}
                    >
                      {/* Top Bar */}
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black ${partInfo.color}`}>
                            {partInfo.label}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${getCognitiveColor(q.cognitiveLevel)}`}>
                            {q.cognitiveLevel || "Thông hiểu"}
                          </span>
                          <span className="text-xs font-bold text-slate-500">
                            Câu {idx + 1} ({q.points}đ)
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setEditingIndex(isEditingThis ? null : idx)}
                            className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${
                              isEditingThis
                                ? "bg-teal-600 text-white shadow-xs"
                                : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                            }`}
                            title={isEditingThis ? "Thu gọn chỉnh sửa" : "Mở trình soạn thảo câu hỏi này"}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>{isEditingThis ? "Thu gọn" : "Chỉnh sửa"}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDuplicateQuestion(idx)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                            title="Sao chép câu này"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRemoveQuestion(idx)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                            title="Xóa câu này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* If in Collapsed Mode: Quick view */}
                      {!isEditingThis ? (
                        <div
                          onDoubleClick={() => setEditingIndex(idx)}
                          className="space-y-2 cursor-pointer"
                          title="Bấm đúp để chỉnh sửa nhanh"
                        >
                          <div className="text-xs sm:text-sm font-semibold text-slate-800">
                            <MathRenderer math={q.content} />
                          </div>
                          {q.partType === "PART_I" && q.options && (
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              {q.options.map((opt) => (
                                <div
                                  key={opt.id}
                                  className={`p-1.5 rounded-lg border text-[11px] flex items-center gap-1.5 ${
                                    q.correctOption === opt.id
                                      ? "bg-emerald-50 border-emerald-300 font-bold text-emerald-900"
                                      : "bg-slate-50 border-slate-200 text-slate-700"
                                  }`}
                                >
                                  <strong>{opt.id}.</strong>
                                  <MathRenderer math={opt.text} />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        /* If in Expanded Edit Mode: Full RichMathInput for every field */
                        <div className="space-y-4 pt-2 border-t border-slate-100 animate-fadeIn">
                          {/* Question Settings: Cognitive Level & Points */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                            <div>
                              <label className="block font-bold text-slate-700 mb-1">Mức độ nhận thức:</label>
                              <select
                                value={q.cognitiveLevel || "Thông hiểu"}
                                onChange={(e) =>
                                  handleUpdateQuestion(idx, { cognitiveLevel: e.target.value as CognitiveLevel })
                                }
                                className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                              >
                                <option value="Nhận biết">Nhận biết</option>
                                <option value="Thông hiểu">Thông hiểu</option>
                                <option value="Vận dụng">Vận dụng</option>
                                <option value="Vận dụng cao">Vận dụng cao</option>
                              </select>
                            </div>

                            <div>
                              <label className="block font-bold text-slate-700 mb-1">Thang điểm:</label>
                              <input
                                type="number"
                                step="0.25"
                                value={q.points || 0.25}
                                onChange={(e) =>
                                  handleUpdateQuestion(idx, { points: parseFloat(e.target.value) || 0.25 })
                                }
                                className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                              />
                            </div>
                          </div>

                          {/* Question Content Input */}
                          <RichMathInput
                            label="Nội dung đề bài / Câu hỏi:"
                            value={q.content}
                            onChange={(val) => handleUpdateQuestion(idx, { content: val })}
                            rows={3}
                            placeholder="Nhập nội dung đề bài (Bấm nút '∑ Chèn công thức' ở trên để chèn phân số, căn, tích phân...)"
                          />

                          {/* PART I: 4 Options Inputs */}
                          {q.partType === "PART_I" && (
                            <div className="space-y-3 p-3 bg-blue-50/50 rounded-2xl border border-blue-200">
                              <span className="text-xs font-extrabold text-blue-900 block">
                                4 Phương án lựa chọn (A, B, C, D) & Chọn đáp án đúng:
                              </span>

                              {(q.options || [
                                { id: "A", text: "" },
                                { id: "B", text: "" },
                                { id: "C", text: "" },
                                { id: "D", text: "" },
                              ]).map((opt, optIdx) => (
                                <div key={opt.id} className="flex items-start gap-2 bg-white p-2.5 rounded-xl border border-blue-100">
                                  <label className="flex items-center gap-1.5 pt-2 text-xs font-black text-blue-800 cursor-pointer shrink-0">
                                    <input
                                      type="radio"
                                      name={`correct_${q.id}`}
                                      checked={q.correctOption === opt.id}
                                      onChange={() => handleUpdateQuestion(idx, { correctOption: opt.id })}
                                      className="text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                                    />
                                    <span>{opt.id}.</span>
                                  </label>
                                  <div className="flex-1">
                                    <RichMathInput
                                      value={opt.text}
                                      onChange={(val) => {
                                        const nextOpts = [...(q.options || [])];
                                        nextOpts[optIdx] = { ...nextOpts[optIdx], text: val };
                                        handleUpdateQuestion(idx, { options: nextOpts });
                                      }}
                                      isSingleLine
                                      placeholder={`Nhập phương án ${opt.id}...`}
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* PART II: 4 True/False Substatements */}
                          {q.partType === "PART_II" && (
                            <div className="space-y-3 p-3 bg-indigo-50/50 rounded-2xl border border-indigo-200">
                              <span className="text-xs font-extrabold text-indigo-900 block">
                                4 Mệnh đề Đúng / Sai (a, b, c, d):
                              </span>

                              {(q.tfStatements || [
                                { id: "a", statement: "", isCorrect: true },
                                { id: "b", statement: "", isCorrect: false },
                                { id: "c", statement: "", isCorrect: true },
                                { id: "d", statement: "", isCorrect: false },
                              ]).map((tf, tfIdx) => (
                                <div key={tf.id} className="flex items-start gap-2 bg-white p-2.5 rounded-xl border border-indigo-100">
                                  <span className="pt-2 text-xs font-black text-indigo-800 shrink-0">
                                    {tf.id})
                                  </span>
                                  <div className="flex-1">
                                    <RichMathInput
                                      value={tf.statement}
                                      onChange={(val) => {
                                        const nextTf = [...(q.tfStatements || [])];
                                        nextTf[tfIdx] = { ...nextTf[tfIdx], statement: val };
                                        handleUpdateQuestion(idx, { tfStatements: nextTf });
                                      }}
                                      isSingleLine
                                      placeholder={`Nhập mệnh đề ${tf.id})...`}
                                    />
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const nextTf = [...(q.tfStatements || [])];
                                      nextTf[tfIdx] = { ...nextTf[tfIdx], isCorrect: !tf.isCorrect };
                                      handleUpdateQuestion(idx, { tfStatements: nextTf });
                                    }}
                                    className={`mt-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-colors ${
                                      tf.isCorrect
                                        ? "bg-emerald-600 text-white hover:bg-emerald-700"
                                        : "bg-rose-600 text-white hover:bg-rose-700"
                                    }`}
                                  >
                                    {tf.isCorrect ? "Đúng" : "Sai"}
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* PART III: Short answer */}
                          {q.partType === "PART_III" && (
                            <div className="p-3 bg-purple-50/50 rounded-2xl border border-purple-200">
                              <RichMathInput
                                label="Đáp án ngắn (Số nguyên / số thập phân):"
                                value={q.shortAnswerKey || ""}
                                onChange={(val) => handleUpdateQuestion(idx, { shortAnswerKey: val })}
                                isSingleLine
                                placeholder="Ví dụ: 12.5 hoặc -3"
                              />
                            </div>
                          )}

                          {/* PART IV: Essay Solution & Standard Solution */}
                          <div className="space-y-3">
                            <RichMathInput
                              label="Lời giải chi tiết / Hướng dẫn chấm tự luận:"
                              value={q.standardSolution || ""}
                              onChange={(val) => handleUpdateQuestion(idx, { standardSolution: val })}
                              rows={3}
                              placeholder="Nhập lời giải chi tiết (Bấm '∑ Chèn công thức' để chèn công thức giải...)"
                            />

                            <RichMathInput
                              label="Gợi ý phương pháp (Hint):"
                              value={q.hint || ""}
                              onChange={(val) => handleUpdateQuestion(idx, { hint: val })}
                              rows={2}
                              placeholder="Nhập gợi ý ngắn..."
                            />
                          </div>

                          <div className="flex justify-end pt-1">
                            <button
                              type="button"
                              onClick={() => setEditingIndex(null)}
                              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
                            >
                              <Check className="w-4 h-4" />
                              <span>Hoàn tất sửa câu {idx + 1}</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Tổng số câu hỏi: <strong className="text-slate-800">{parsedQuestions.length}</strong> câu
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 transition-colors"
            >
              Hủy bỏ
            </button>

            <button
              id="confirm_lesson_import_btn"
              onClick={handleConfirmImport}
              disabled={parsedQuestions.length === 0}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Nạp {parsedQuestions.length} câu vào bài học</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
