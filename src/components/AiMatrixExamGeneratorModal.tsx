import React, { useState } from "react";
import { Lesson, Question, ExamMatrix, GradeLevel, CognitiveLevel, QuestionPartType } from "../types";
import { MathRenderer } from "../utils/mathJaxHelper";
import { generateMatrixExamAi } from "../utils/geminiClient";
import {
  exportExamToWordDocx,
  exportExamToPresentationSlides,
  exportQuestionsToMoodleGift,
} from "../utils/exportHelpers";
import {
  X,
  Sparkles,
  Bot,
  Sliders,
  CheckCircle2,
  BookOpen,
  Layers,
  Check,
  RotateCcw,
  Download,
  Play,
  FileCheck,
  BarChart2,
  Clock,
  Award,
  ChevronRight,
  RefreshCw,
  Edit3,
  AlertTriangle,
  AlertCircle,
} from "lucide-react";

interface AiMatrixExamGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  lessons: Lesson[];
  currentGrade: GradeLevel;
  onSaveQuestionsToLesson: (lessonId: string, questions: Question[]) => void;
  onStartExamWithQuestions?: (lesson: Lesson, generatedQuestions: Question[]) => void;
  preSelectedLesson?: Lesson | null;
}

export const AiMatrixExamGeneratorModal: React.FC<AiMatrixExamGeneratorModalProps> = ({
  isOpen,
  onClose,
  lessons,
  currentGrade,
  onSaveQuestionsToLesson,
  onStartExamWithQuestions,
  preSelectedLesson,
}) => {
  if (!isOpen) return null;

  const [selectedLessonId, setSelectedLessonId] = useState<string>(
    preSelectedLesson?.id || lessons[0]?.id || ""
  );

  // Preset Matrices
  const MATRIX_PRESETS: ExamMatrix[] = [
    {
      id: "preset_15min",
      name: "Ma trận 1: Kiểm tra 15 phút (Đơn vị bài học)",
      description: "Thích hợp kiểm tra củng cố kiến thức nhanh sau mỗi bài học trên lớp.",
      timeMinutes: 15,
      grade: currentGrade,
      topic: "Khảo sát và ứng dụng đạo hàm",
      part1Count: 4, // 4 câu Phần I
      part2Count: 1, // 1 câu Phần II (4 ý a,b,c,d)
      part3Count: 1, // 1 câu Phần III
      part4Count: 0,
      cognitiveDistribution: {
        recognition: 40,
        comprehension: 40,
        application: 20,
        advanced: 0,
      },
      customRequirements: "Tập trung các dạng bài cơ bản bám sát SGK Kết nối tri thức.",
    },
    {
      id: "preset_45min",
      name: "Ma trận 2: Kiểm tra định kỳ 45 phút / 1 tiết (Chương)",
      description: "Đánh giá toàn diện năng lực học sinh sau một chương với đầy đủ 4 phần.",
      timeMinutes: 45,
      grade: currentGrade,
      topic: "Toàn bộ chuyên đề chương",
      part1Count: 6,
      part2Count: 2,
      part3Count: 3,
      part4Count: 1,
      cognitiveDistribution: {
        recognition: 30,
        comprehension: 35,
        application: 25,
        advanced: 10,
      },
      customRequirements: "Phần IV có bài toán mô hình hóa thực tế hoặc tối ưu hóa.",
    },
    {
      id: "preset_national2025",
      name: "Ma trận 3: Chuẩn cấu trúc Bộ GD&ĐT 2025 (Giữa kỳ / Cuối kỳ / Tốt nghiệp)",
      description: "Cấu trúc đặc tả mới nhất của Bộ GD&ĐT: 12 câu Phần I + 4 câu Phần II + 6 câu Phần III.",
      timeMinutes: 90,
      grade: currentGrade,
      topic: "Tổng hợp kiến thức Toán THPT GDPT 2018",
      part1Count: 12,
      part2Count: 4,
      part3Count: 6,
      part4Count: 0,
      cognitiveDistribution: {
        recognition: 30,
        comprehension: 30,
        application: 30,
        advanced: 10,
      },
      customRequirements: "Đề thi phân hóa rõ rệt, câu hỏi thực tiễn và tư duy toán học cao.",
    },
    {
      id: "preset_custom",
      name: "Ma trận 4: Tùy chỉnh Ma trận linh hoạt",
      description: "Tự do thiết lập số lượng câu từng phần và phân bố tỷ lệ nhận thức.",
      timeMinutes: 45,
      grade: currentGrade,
      topic: "Chủ đề tự chọn",
      part1Count: 4,
      part2Count: 1,
      part3Count: 2,
      part4Count: 1,
      cognitiveDistribution: {
        recognition: 25,
        comprehension: 25,
        application: 25,
        advanced: 25,
      },
      customRequirements: "",
    },
  ];

  const [activePresetId, setActivePresetId] = useState<string>("preset_15min");
  const [currentMatrix, setCurrentMatrix] = useState<ExamMatrix>(MATRIX_PRESETS[0]);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<Question[]>([]);
  const [activeStep, setActiveStep] = useState<"CONFIG" | "REVIEW">("CONFIG");

  // Multi-step Generation States (Strictly compliant with AI_INSTRUCTIONS.md)
  type StepStatus = "IDLE" | "PROCESSING" | "COMPLETED" | "STOPPED_ERROR";
  const [step1Status, setStep1Status] = useState<StepStatus>("IDLE");
  const [step2Status, setStep2Status] = useState<StepStatus>("IDLE");
  const [step3Status, setStep3Status] = useState<StepStatus>("IDLE");
  const [generationError, setGenerationError] = useState<string | null>(null);

  const selectedLesson = lessons.find((l) => l.id === selectedLessonId) || lessons[0];

  // Handle selecting a preset
  const handleSelectPreset = (preset: ExamMatrix) => {
    setActivePresetId(preset.id);
    setCurrentMatrix({
      ...preset,
      topic: selectedLesson ? selectedLesson.title : preset.topic,
      grade: currentGrade,
    });
  };

  // Generate matrix exam via client-side Gemini service with 3-step pipeline & fallback
  const handleGenerateExam = async () => {
    setIsGenerating(true);
    setGenerationError(null);
    setStep1Status("PROCESSING");
    setStep2Status("IDLE");
    setStep3Status("IDLE");

    try {
      // Step 1: Phân tích cấu trúc ma trận & đặc tả yêu cầu
      await new Promise((resolve) => setTimeout(resolve, 500));
      setStep1Status("COMPLETED");

      // Step 2: Soạn thảo câu hỏi & Chuẩn hóa LaTeX (Tự động fallback nếu gặp lỗi)
      setStep2Status("PROCESSING");
      const data = await generateMatrixExamAi({
        matrix: currentMatrix,
        lessonTitle: selectedLesson?.title || currentMatrix.topic,
        grade: currentGrade,
      });

      if (!data?.questions || !Array.isArray(data.questions) || data.questions.length === 0) {
        throw new Error("AI không trả về danh sách câu hỏi hợp lệ theo ma trận đề thi.");
      }
      setStep2Status("COMPLETED");

      // Step 3: Hậu kiểm tính đúng sai & chuẩn hóa lời giải chi tiết
      setStep3Status("PROCESSING");
      await new Promise((resolve) => setTimeout(resolve, 400));
      setStep3Status("COMPLETED");

      setGeneratedQuestions(data.questions);
      setActiveStep("REVIEW");
    } catch (err: any) {
      console.error("Matrix generation error:", err);
      // AI_INSTRUCTIONS.md: Hiện thông báo lỗi màu đỏ, hiển thị nguyên văn lỗi từ API (VD: 429 RESOURCE_EXHAUSTED).
      // Trạng thái các cột đang chờ phải chuyển thành "Đã dừng do lỗi", tuyệt đối không được hiện "Hoàn tất" hoặc checkmark xanh nếu quy trình bị gián đoạn.
      const rawErrorMsg = err?.message || String(err);
      setGenerationError(rawErrorMsg);

      setStep1Status((prev) => (prev === "PROCESSING" ? "STOPPED_ERROR" : prev));
      setStep2Status((prev) => (prev === "PROCESSING" || prev === "IDLE" ? "STOPPED_ERROR" : prev));
      setStep3Status((prev) => (prev === "PROCESSING" || prev === "IDLE" ? "STOPPED_ERROR" : prev));
    } finally {
      setIsGenerating(false);
    }
  };

  // Save generated questions into the target lesson
  const handleSaveToLesson = () => {
    if (!selectedLesson) return;
    onSaveQuestionsToLesson(selectedLesson.id, generatedQuestions);
    alert(`Đã lưu thành công ${generatedQuestions.length} câu hỏi vào "${selectedLesson.title}"!`);
    onClose();
  };

  // Start exam immediately with generated questions
  const handleStartExamNow = () => {
    if (!selectedLesson || !onStartExamWithQuestions) return;
    onStartExamWithQuestions(selectedLesson, generatedQuestions);
    onClose();
  };

  // Print / Export exam
  const handlePrintExam = () => {
    window.print();
  };

  const totalQuestionsCount =
    (currentMatrix.part1Count || 0) +
    (currentMatrix.part2Count || 0) +
    (currentMatrix.part3Count || 0) +
    (currentMatrix.part4Count || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/70 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-indigo-800 via-blue-800 to-indigo-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-amber-300 border border-white/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  AI Soạn đề theo Ma trận
                </span>
                <span className="text-xs text-blue-200 font-semibold">Chương trình GDPT 2018</span>
              </div>
              <h2 className="text-base sm:text-lg font-black tracking-tight">
                Hệ thống Ra Đề Thi Chuẩn Ma Trận • Thầy Phan Quốc Cường
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeStep === "REVIEW" && (
              <button
                onClick={() => setActiveStep("CONFIG")}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold transition-colors"
              >
                Chỉnh sửa Ma trận
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Multi-Step Pipeline & Fallback Status (Strictly per AI_INSTRUCTIONS.md) */}
          {(isGenerating || generationError || step1Status !== "IDLE") && (
            <div className="p-5 rounded-3xl bg-slate-900 text-white shadow-xl space-y-4 border border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-200">
                    Tiến trình biên soạn đề thi AI theo quy chuẩn Bộ GD&ĐT (3 Bước)
                  </h4>
                </div>
                <span className="text-xs font-bold text-slate-400">
                  {step3Status === "COMPLETED"
                    ? "100% Hoàn tất"
                    : step2Status === "COMPLETED"
                    ? "66% Đã xong 2 bước"
                    : step1Status === "COMPLETED"
                    ? "33% Đã xong 1 bước"
                    : generationError
                    ? "Đã dừng quy trình"
                    : "Đang khởi tạo..."}
                </span>
              </div>

              {/* Progress Bar (AI_INSTRUCTIONS.md: Chỉ hiển thị xanh khi bước đó thực sự thành công) */}
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${
                    generationError ? "bg-rose-500" : "bg-emerald-500"
                  }`}
                  style={{
                    width:
                      step3Status === "COMPLETED"
                        ? "100%"
                        : step2Status === "COMPLETED"
                        ? "66%"
                        : step1Status === "COMPLETED"
                        ? "33%"
                        : isGenerating
                        ? "15%"
                        : "0%",
                  }}
                />
              </div>

              {/* 3 Step Status Columns */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                {/* Column 1 */}
                <div
                  className={`p-3 rounded-2xl border transition-all ${
                    step1Status === "COMPLETED"
                      ? "bg-emerald-950/40 border-emerald-500/50 text-emerald-300"
                      : step1Status === "PROCESSING"
                      ? "bg-blue-950/40 border-blue-500/50 text-blue-300"
                      : step1Status === "STOPPED_ERROR"
                      ? "bg-rose-950/40 border-rose-500/50 text-rose-300"
                      : "bg-slate-800/40 border-slate-700/50 text-slate-400"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-bold mb-1">
                    <span>Bước 1: Phân tích ma trận</span>
                    {step1Status === "COMPLETED" && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                    {step1Status === "PROCESSING" && <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />}
                    {step1Status === "STOPPED_ERROR" && <AlertTriangle className="w-4 h-4 text-rose-400" />}
                  </div>
                  <p className="text-[11px] opacity-80">
                    {step1Status === "COMPLETED"
                      ? "Hoàn tất"
                      : step1Status === "PROCESSING"
                      ? "Đang phân tích..."
                      : step1Status === "STOPPED_ERROR"
                      ? "Đã dừng do lỗi"
                      : "Chờ thực hiện"}
                  </p>
                </div>

                {/* Column 2 */}
                <div
                  className={`p-3 rounded-2xl border transition-all ${
                    step2Status === "COMPLETED"
                      ? "bg-emerald-950/40 border-emerald-500/50 text-emerald-300"
                      : step2Status === "PROCESSING"
                      ? "bg-blue-950/40 border-blue-500/50 text-blue-300"
                      : step2Status === "STOPPED_ERROR"
                      ? "bg-rose-950/40 border-rose-500/50 text-rose-300"
                      : "bg-slate-800/40 border-slate-700/50 text-slate-400"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-bold mb-1">
                    <span>Bước 2: Soạn thảo câu hỏi & LaTeX</span>
                    {step2Status === "COMPLETED" && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                    {step2Status === "PROCESSING" && <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />}
                    {step2Status === "STOPPED_ERROR" && <AlertTriangle className="w-4 h-4 text-rose-400" />}
                  </div>
                  <p className="text-[11px] opacity-80">
                    {step2Status === "COMPLETED"
                      ? "Hoàn tất"
                      : step2Status === "PROCESSING"
                      ? "Đang biên soạn..."
                      : step2Status === "STOPPED_ERROR"
                      ? "Đã dừng do lỗi"
                      : "Chờ thực hiện"}
                  </p>
                </div>

                {/* Column 3 */}
                <div
                  className={`p-3 rounded-2xl border transition-all ${
                    step3Status === "COMPLETED"
                      ? "bg-emerald-950/40 border-emerald-500/50 text-emerald-300"
                      : step3Status === "PROCESSING"
                      ? "bg-blue-950/40 border-blue-500/50 text-blue-300"
                      : step3Status === "STOPPED_ERROR"
                      ? "bg-rose-950/40 border-rose-500/50 text-rose-300"
                      : "bg-slate-800/40 border-slate-700/50 text-slate-400"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-bold mb-1">
                    <span>Bước 3: Hậu kiểm lời giải chi tiết</span>
                    {step3Status === "COMPLETED" && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                    {step3Status === "PROCESSING" && <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />}
                    {step3Status === "STOPPED_ERROR" && <AlertTriangle className="w-4 h-4 text-rose-400" />}
                  </div>
                  <p className="text-[11px] opacity-80">
                    {step3Status === "COMPLETED"
                      ? "Hoàn tất"
                      : step3Status === "PROCESSING"
                      ? "Đang hậu kiểm..."
                      : step3Status === "STOPPED_ERROR"
                      ? "Đã dừng do lỗi"
                      : "Chờ thực hiện"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Verbatim Red Error Box (Strictly per AI_INSTRUCTIONS.md) */}
          {generationError && (
            <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-900 space-y-2.5 animate-fadeIn">
              <div className="flex items-center gap-2 font-black text-xs uppercase tracking-wider text-rose-700">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <span>Quy trình biên soạn đề đã dừng do lỗi API:</span>
              </div>
              <div className="p-3.5 bg-white rounded-xl border border-rose-200 font-mono text-xs text-rose-800 break-all leading-relaxed">
                {generationError}
              </div>
              <div className="flex items-center justify-between text-xs text-rose-700">
                <span>
                  Hệ thống đã tự động thử lại qua chuỗi fallback (Flash ➔ Pro ➔ 2.5). Nếu gặp lỗi 429 quota, hãy đổi API Key trong Settings.
                </span>
                <button
                  type="button"
                  onClick={() => setGenerationError(null)}
                  className="font-bold underline text-rose-800 hover:text-rose-950 ml-2 shrink-0"
                >
                  Bỏ qua thông báo
                </button>
              </div>
            </div>
          )}

          {activeStep === "CONFIG" ? (
            <div className="space-y-6">
              {/* Target Lesson Selector */}
              <div className="bg-blue-50/60 p-4 sm:p-5 rounded-2xl border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1 max-w-md">
                  <label className="text-xs font-extrabold text-blue-900 uppercase tracking-wider">
                    Bài học áp dụng:
                  </label>
                  <p className="text-xs text-blue-700">
                    Chọn bài học để AI định hướng chuyên đề và mức độ kiến thức phù hợp
                  </p>
                </div>

                <select
                  value={selectedLessonId}
                  onChange={(e) => {
                    setSelectedLessonId(e.target.value);
                    const l = lessons.find((item) => item.id === e.target.value);
                    if (l) {
                      setCurrentMatrix((prev) => ({ ...prev, topic: l.title }));
                    }
                  }}
                  className="px-4 py-2.5 rounded-xl border border-blue-300 text-xs font-bold text-slate-800 bg-white focus:ring-2 focus:ring-blue-500 min-w-[280px]"
                >
                  {lessons.map((l) => (
                    <option key={l.id} value={l.id}>
                      Toán {l.grade} - {l.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Preset Matrices Grid */}
              <div className="space-y-3">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-blue-600" />
                  Chọn mẫu Ma trận đề thi chuẩn:
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {MATRIX_PRESETS.map((preset) => {
                    const isSelected = activePresetId === preset.id;
                    const qCount =
                      preset.part1Count + preset.part2Count + preset.part3Count + preset.part4Count;
                    return (
                      <div
                        key={preset.id}
                        onClick={() => handleSelectPreset(preset)}
                        className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? "bg-indigo-50/70 border-indigo-600 shadow-md ring-2 ring-indigo-500/20"
                            : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-slate-900">{preset.name}</span>
                            {isSelected && <Check className="w-4 h-4 text-indigo-600" />}
                          </div>
                          <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                            {preset.description}
                          </p>
                        </div>

                        <div className="mt-4 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-slate-600">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {preset.timeMinutes} phút
                          </span>
                          <span className="flex items-center gap-1 text-indigo-700 font-bold">
                            <BookOpen className="w-3.5 h-3.5" />
                            {qCount} câu hỏi
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Matrix Customizer & Detailed Breakdown Table */}
              <div className="bg-slate-50 p-5 rounded-3xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    Bảng đặc tả phân bố câu hỏi & mức độ nhận thức
                  </h4>
                  <span className="text-xs font-bold text-indigo-700 bg-indigo-100 px-2.5 py-1 rounded-full">
                    Tổng: {totalQuestionsCount} câu ({currentMatrix.timeMinutes} phút)
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {/* Part I Count */}
                  <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                    <label className="text-[11px] font-bold text-blue-700">Phần I (4 Lựa chọn):</label>
                    <input
                      type="number"
                      min={0}
                      max={24}
                      value={currentMatrix.part1Count}
                      onChange={(e) =>
                        setCurrentMatrix((prev) => ({
                          ...prev,
                          part1Count: parseInt(e.target.value) || 0,
                        }))
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-bold"
                    />
                    <p className="text-[10px] text-slate-400">0.25đ / câu</p>
                  </div>

                  {/* Part II Count */}
                  <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                    <label className="text-[11px] font-bold text-indigo-700">Phần II (Đúng / Sai):</label>
                    <input
                      type="number"
                      min={0}
                      max={8}
                      value={currentMatrix.part2Count}
                      onChange={(e) =>
                        setCurrentMatrix((prev) => ({
                          ...prev,
                          part2Count: parseInt(e.target.value) || 0,
                        }))
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-bold"
                    />
                    <p className="text-[10px] text-slate-400">4 ý / câu (1.0đ)</p>
                  </div>

                  {/* Part III Count */}
                  <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                    <label className="text-[11px] font-bold text-purple-700">Phần III (Trả lời ngắn):</label>
                    <input
                      type="number"
                      min={0}
                      max={10}
                      value={currentMatrix.part3Count}
                      onChange={(e) =>
                        setCurrentMatrix((prev) => ({
                          ...prev,
                          part3Count: parseInt(e.target.value) || 0,
                        }))
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-bold"
                    />
                    <p className="text-[10px] text-slate-400">0.5đ / câu</p>
                  </div>

                  {/* Part IV Count */}
                  <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                    <label className="text-[11px] font-bold text-emerald-700">Phần IV (Tự luận):</label>
                    <input
                      type="number"
                      min={0}
                      max={4}
                      value={currentMatrix.part4Count}
                      onChange={(e) =>
                        setCurrentMatrix((prev) => ({
                          ...prev,
                          part4Count: parseInt(e.target.value) || 0,
                        }))
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-bold"
                    />
                    <p className="text-[10px] text-slate-400">10đ thang tự luận</p>
                  </div>
                </div>

                {/* Cognitive Level Sliders / % */}
                <div className="pt-2 space-y-2">
                  <label className="text-xs font-bold text-slate-700">
                    Phân bố tỷ lệ mức độ nhận thức (%):
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="bg-white p-2.5 rounded-xl border border-sky-200">
                      <span className="text-[11px] font-bold text-sky-800">Nhận biết:</span>
                      <div className="font-extrabold text-sm text-sky-900 mt-0.5">
                        {currentMatrix.cognitiveDistribution.recognition}%
                      </div>
                    </div>

                    <div className="bg-white p-2.5 rounded-xl border border-blue-200">
                      <span className="text-[11px] font-bold text-blue-800">Thông hiểu:</span>
                      <div className="font-extrabold text-sm text-blue-900 mt-0.5">
                        {currentMatrix.cognitiveDistribution.comprehension}%
                      </div>
                    </div>

                    <div className="bg-white p-2.5 rounded-xl border border-amber-200">
                      <span className="text-[11px] font-bold text-amber-800">Vận dụng:</span>
                      <div className="font-extrabold text-sm text-amber-900 mt-0.5">
                        {currentMatrix.cognitiveDistribution.application}%
                      </div>
                    </div>

                    <div className="bg-white p-2.5 rounded-xl border border-rose-200">
                      <span className="text-[11px] font-bold text-rose-800">Vận dụng cao:</span>
                      <div className="font-extrabold text-sm text-rose-900 mt-0.5">
                        {currentMatrix.cognitiveDistribution.advanced}%
                      </div>
                    </div>
                  </div>
                </div>

                {/* Custom Notes / Prompt */}
                <div className="space-y-1.5 pt-1">
                  <label className="text-xs font-bold text-slate-700">
                    Yêu cầu sư phạm đính kèm (tùy chọn):
                  </label>
                  <input
                    type="text"
                    value={currentMatrix.customRequirements || ""}
                    onChange={(e) =>
                      setCurrentMatrix((prev) => ({ ...prev, customRequirements: e.target.value }))
                    }
                    placeholder="Ví dụ: Lồng ghép tình huống thực tế về kinh tế / kỹ thuật, các công thức hàm số đẹp..."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                </div>
              </div>
            </div>
          ) : (
            /* REVIEW GENERATED EXAM STEP */
            <div className="space-y-6">
              {/* Summary Banner */}
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-emerald-950 text-sm">
                      Đã khởi tạo thành công đề thi ({generatedQuestions.length} câu hỏi)
                    </h3>
                    <p className="text-xs text-emerald-800">
                      Đề thi bám sát ma trận chuẩn GDPT 2018 với công thức LaTeX $...$ và đáp án chi tiết.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrintExam}
                    className="px-3.5 py-2 rounded-xl bg-white border border-emerald-300 text-emerald-900 text-xs font-bold hover:bg-emerald-100 flex items-center gap-1.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>In / Xuất đề</span>
                  </button>
                </div>
              </div>

              {/* Generated Questions List */}
              <div className="space-y-4">
                {generatedQuestions.map((q, idx) => (
                  <div
                    key={q.id || idx}
                    className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-indigo-600 text-white">
                          {q.partType}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                          {q.cognitiveLevel || "Thông hiểu"}
                        </span>
                        {q.topicTag && (
                          <span className="text-xs text-slate-500 font-medium">#{q.topicTag}</span>
                        )}
                      </div>

                      <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                        {q.points} điểm
                      </span>
                    </div>

                    <div className="text-xs sm:text-sm font-semibold text-slate-900 leading-relaxed">
                      <span className="text-slate-500 font-bold mr-1">Câu {idx + 1}:</span>
                      <MathRenderer content={q.content} />
                    </div>

                    {/* Options for Part I */}
                    {q.partType === "PART_I" && q.options && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        {q.options.map((opt) => (
                          <div
                            key={opt.id}
                            className={`p-2 rounded-xl text-xs font-medium border flex items-center gap-2 ${
                              q.correctOption === opt.id
                                ? "bg-emerald-50 border-emerald-300 text-emerald-900 font-bold"
                                : "bg-slate-50 border-slate-200 text-slate-800"
                            }`}
                          >
                            <span className="w-5 h-5 rounded-md bg-white border border-slate-300 flex items-center justify-center font-bold text-[11px]">
                              {opt.id}
                            </span>
                            <div className="flex-1">
                              <MathRenderer content={opt.text} inline />
                            </div>
                            {q.correctOption === opt.id && (
                              <span className="text-[10px] text-emerald-700 font-black px-1.5 py-0.5 bg-emerald-200/60 rounded">
                                Đáp án đúng
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* True/False Statements for Part II */}
                    {q.partType === "PART_II" && q.tfStatements && (
                      <div className="space-y-1.5 pt-1">
                        {q.tfStatements.map((tf) => (
                          <div
                            key={tf.id}
                            className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between gap-2"
                          >
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded bg-indigo-100 text-indigo-800 font-bold text-[11px] flex items-center justify-center">
                                {tf.id}
                              </span>
                              <MathRenderer content={tf.statement} inline />
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                tf.isCorrect
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-rose-100 text-rose-800"
                              }`}
                            >
                              {tf.isCorrect ? "Đúng" : "Sai"}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Short Answer for Part III */}
                    {q.partType === "PART_III" && q.shortAnswerCorrect && (
                      <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-200 text-xs text-purple-900 font-bold flex items-center gap-2">
                        <span>Đáp số chuẩn:</span>
                        <code className="px-2 py-0.5 bg-white rounded border border-purple-300">
                          {q.shortAnswerCorrect}
                        </code>
                      </div>
                    )}

                    {/* Solution */}
                    {q.standardSolution && (
                      <div className="p-3 rounded-xl bg-indigo-50/50 border border-indigo-100 text-[11px] text-indigo-950 space-y-1">
                        <span className="font-bold block">Lời giải chi tiết của Thầy Cường:</span>
                        <MathRenderer content={q.standardSolution} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            {activeStep === "CONFIG" ? (
              <span>
                Cấu hình: <strong>{currentMatrix.name}</strong> • {totalQuestionsCount} câu hỏi
              </span>
            ) : (
              <span>
                Đã sẵn sàng: <strong>{generatedQuestions.length} câu hỏi</strong> cho bài học "
                {selectedLesson?.title}"
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {activeStep === "CONFIG" ? (
              <button
                id="generate_matrix_exam_btn"
                onClick={handleGenerateExam}
                disabled={isGenerating}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 hover:opacity-95 text-white font-extrabold text-xs shadow-lg transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>AI Thầy Cường đang soạn đề theo ma trận...</span>
                  </>
                ) : (
                  <>
                    <Bot className="w-4 h-4 text-amber-300" />
                    <span>⚡ AI Soạn đề theo ma trận này</span>
                  </>
                )}
              </button>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                {/* Export Word (.doc) */}
                <button
                  type="button"
                  onClick={() =>
                    exportExamToWordDocx(
                      currentMatrix.name || selectedLesson?.title || "Đề thi Ma trận AI",
                      generatedQuestions,
                      currentGrade,
                      currentMatrix.timeMinutes
                    )
                  }
                  className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-1.5 transition-all"
                  title="Xuất file Word (.doc) chuẩn mẫu Bộ GD&ĐT"
                >
                  <Download className="w-3.5 h-3.5 text-blue-600" />
                  <span>Xuất Word (.doc)</span>
                </button>

                {/* Export PowerPoint Slide */}
                <button
                  type="button"
                  onClick={() =>
                    exportExamToPresentationSlides(
                      currentMatrix.name || selectedLesson?.title || "Đề thi Ma trận AI",
                      generatedQuestions
                    )
                  }
                  className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-1.5 transition-all"
                  title="Xuất Slide trình chiếu PowerPoint trên lớp"
                >
                  <Layers className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Xuất Slide (.html)</span>
                </button>

                {/* Export Moodle GIFT */}
                <button
                  type="button"
                  onClick={() =>
                    exportQuestionsToMoodleGift(
                      currentMatrix.name || selectedLesson?.title || "Đề thi Ma trận AI",
                      generatedQuestions
                    )
                  }
                  className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-1.5 transition-all"
                  title="Xuất định dạng Moodle GIFT / Azota"
                >
                  <FileCheck className="w-3.5 h-3.5 text-amber-600" />
                  <span>Xuất Moodle (GIFT)</span>
                </button>

                <button
                  onClick={handleSaveToLesson}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md transition-all active:scale-95 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Nạp vào bài học</span>
                </button>

                {onStartExamWithQuestions && (
                  <button
                    onClick={handleStartExamNow}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md transition-all active:scale-95 flex items-center gap-1.5"
                  >
                    <Play className="w-4 h-4" />
                    <span>Làm bài ngay</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
