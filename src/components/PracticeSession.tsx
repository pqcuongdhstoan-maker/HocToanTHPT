import React, { useState, useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import {
  Lesson,
  Question,
  QuestionPartType,
  AntiCheatEvent,
  ExamSessionState,
} from "../types";
import { MathRenderer } from "../utils/mathJaxHelper";
import {
  explainQuestionAi,
  gradeEssayAi,
  getSocraticHintAi,
} from "../utils/geminiClient";
import { exportExamToWordDocx } from "../utils/exportHelpers";
import { DigitalScratchpad } from "./DigitalScratchpad";
import {
  ArrowLeft,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  Sparkles,
  HelpCircle,
  Send,
  Upload,
  Bot,
  RotateCcw,
  Check,
  X,
  Maximize2,
  BookOpen,
  Calculator,
  Eye,
  ShieldAlert,
  Edit3,
  Download,
  Lightbulb,
} from "lucide-react";

interface PracticeSessionProps {
  lesson: Lesson;
  onBack: () => void;
  onComplete: (scorePercentage: number, tabViolations: number) => void;
}

export const PracticeSession: React.FC<PracticeSessionProps> = ({
  lesson,
  onBack,
  onComplete,
}) => {
  // Session State
  const [activeTab, setActiveTab] = useState<"ALL" | QuestionPartType>("ALL");
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [isAutoSubmittedDueToCheat, setIsAutoSubmittedDueToCheat] = useState<boolean>(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(lesson.durationMinutes * 60);

  // Anti-Cheat State
  const [tabSwitches, setTabSwitches] = useState<number>(0);
  const [showCheatWarningModal, setShowCheatWarningModal] = useState<boolean>(false);
  const [antiCheatLogs, setAntiCheatLogs] = useState<AntiCheatEvent[]>([]);
  const MAX_TAB_SWITCHES = 3;

  // AI Explanation State
  const [explainingQuestionId, setExplainingQuestionId] = useState<string | null>(null);
  const [aiExplanations, setAiExplanations] = useState<Record<string, string>>({});
  const [loadingAiExplain, setLoadingAiExplain] = useState<boolean>(false);

  // Essay Upload & AI Grading State
  const [essayTexts, setEssayTexts] = useState<Record<string, string>>({});
  const [essayImages, setEssayImages] = useState<Record<string, string>>({});
  const [essayGrades, setEssayGrades] = useState<Record<string, any>>({});
  const [gradingEssayId, setGradingEssayId] = useState<string | null>(null);

  // Formula Cheatsheet Drawer
  const [showFormulaSheet, setShowFormulaSheet] = useState<boolean>(false);

  // Digital Scratchpad State
  const [showScratchpad, setShowScratchpad] = useState<boolean>(false);

  // Socratic Stepped Hints State (Level 1, 2, 3)
  const [socraticHints, setSocraticHints] = useState<Record<string, { [level: number]: string }>>({});
  const [loadingSocraticHint, setLoadingSocraticHint] = useState<Record<string, number | null>>({});

  // Anti-Cheat: Listen to visibilitychange & blur
  useEffect(() => {
    if (isSubmitted) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        handleViolation("TAB_SWITCH", "Rời khỏi tab trình duyệt");
      }
    };

    const handleWindowBlur = () => {
      handleViolation("WINDOW_BLUR", "Mất tiêu điểm cửa sổ làm bài");
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
    };
  }, [isSubmitted, tabSwitches]);

  // Timer countdown
  useEffect(() => {
    if (isSubmitted || timeRemaining <= 0) return;
    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSubmitExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isSubmitted, timeRemaining]);

  const handleViolation = (type: AntiCheatEvent["type"], details: string) => {
    if (isSubmitted) return;

    const newCount = tabSwitches + 1;
    setTabSwitches(newCount);

    const log: AntiCheatEvent = {
      timestamp: new Date().toLocaleTimeString(),
      type,
      details,
    };
    setAntiCheatLogs((prev) => [...prev, log]);

    if (newCount >= MAX_TAB_SWITCHES) {
      setIsAutoSubmittedDueToCheat(true);
      handleSubmitExam(true);
    } else {
      setShowCheatWarningModal(true);
    }
  };

  // Format timer
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Answer handler
  const handleSelectOption = (qId: string, optionId: string) => {
    if (isSubmitted) return;
    setAnswers((prev) => ({ ...prev, [qId]: optionId }));
  };

  const handleSelectTrueFalse = (qId: string, statementId: string, value: boolean) => {
    if (isSubmitted) return;
    setAnswers((prev) => {
      const qAns = prev[qId] || {};
      return {
        ...prev,
        [qId]: {
          ...qAns,
          [statementId]: value,
        },
      };
    });
  };

  const handleShortAnswerChange = (qId: string, value: string) => {
    if (isSubmitted) return;
    setAnswers((prev) => ({ ...prev, [qId]: value }));
  };

  // Calculate scores
  const calculateResult = () => {
    let earnedPoints = 0;
    let totalMaxPoints = 0;

    lesson.questions.forEach((q) => {
      totalMaxPoints += q.points;
      const userAns = answers[q.id];

      if (q.partType === "PART_I") {
        if (userAns && userAns === q.correctOption) {
          earnedPoints += q.points;
        }
      } else if (q.partType === "PART_II") {
        if (q.tfStatements && userAns) {
          // In standard GDPT 2018:
          // 1 correct statement = 0.1 * total, 2 = 0.25, 3 = 0.5, 4 = 1.0 of question points
          let correctCount = 0;
          q.tfStatements.forEach((stmt) => {
            if (userAns[stmt.id] === stmt.isCorrect) {
              correctCount++;
            }
          });
          if (correctCount === 4) earnedPoints += q.points;
          else if (correctCount === 3) earnedPoints += q.points * 0.5;
          else if (correctCount === 2) earnedPoints += q.points * 0.25;
          else if (correctCount === 1) earnedPoints += q.points * 0.1;
        }
      } else if (q.partType === "PART_III") {
        if (userAns && q.shortAnswerCorrect) {
          const cleanUser = String(userAns).trim().replace(",", ".");
          const cleanKey = String(q.shortAnswerCorrect).trim().replace(",", ".");
          if (cleanUser === cleanKey) {
            earnedPoints += q.points;
          } else if (q.shortAnswerTolerance) {
            const numUser = parseFloat(cleanUser);
            const numKey = parseFloat(cleanKey);
            if (!isNaN(numUser) && !isNaN(numKey) && Math.abs(numUser - numKey) <= q.shortAnswerTolerance) {
              earnedPoints += q.points;
            }
          }
        }
      } else if (q.partType === "PART_IV") {
        const grade = essayGrades[q.id];
        if (grade && typeof grade.score === "number") {
          earnedPoints += (grade.score / 10) * q.points;
        } else if (essayTexts[q.id]) {
          // Default baseline for attempting essay
          earnedPoints += q.points * 0.5;
        }
      }
    });

    const percentage = totalMaxPoints > 0 ? Math.round((earnedPoints / totalMaxPoints) * 100) : 0;
    return { earnedPoints: Math.round(earnedPoints * 10) / 10, totalMaxPoints, percentage };
  };

  const handleSubmitExam = (isCheatAuto = false) => {
    setIsSubmitted(true);
    setShowCheatWarningModal(false);

    const result = calculateResult();
    const passed = result.percentage >= lesson.requiredPassPercentage;

    if (passed && !isCheatAuto) {
      // Trigger confetti celebration
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {
        console.log("Confetti trigger error:", e);
      }
    }

    onComplete(result.percentage, tabSwitches);
  };

  // Request AI Explanation for a question (Direct Client-side with Fallback)
  const handleRequestAiExplanation = async (q: Question) => {
    setExplainingQuestionId(q.id);
    setLoadingAiExplain(true);

    try {
      let studentAnsText = "";
      const userAns = answers[q.id];
      if (q.partType === "PART_I") {
        studentAnsText = `Chọn đáp án ${userAns || "Chưa chọn"}`;
      } else if (q.partType === "PART_II") {
        studentAnsText = JSON.stringify(userAns || {});
      } else if (q.partType === "PART_III") {
        studentAnsText = `Điền: ${userAns || "Trống"}`;
      } else {
        studentAnsText = essayTexts[q.id] || "Tự luận";
      }

      let correctAnsText = "";
      if (q.partType === "PART_I") correctAnsText = `Đáp án đúng là ${q.correctOption}`;
      else if (q.partType === "PART_III") correctAnsText = `Đáp án đúng là ${q.shortAnswerCorrect}`;
      else if (q.partType === "PART_II") correctAnsText = "Xem tính đúng sai của từng ý a, b, c, d";
      else correctAnsText = q.standardSolution;

      const explanation = await explainQuestionAi({
        question: q.content,
        studentAnswer: studentAnsText,
        correctAnswer: correctAnsText,
        partType: q.partType,
        chapterName: lesson.title,
      });

      setAiExplanations((prev) => ({
        ...prev,
        [q.id]: explanation || "Không thể tải lời giải chi tiết lúc này.",
      }));
    } catch (err: any) {
      setAiExplanations((prev) => ({
        ...prev,
        [q.id]: `[Lỗi AI] ${err.message || "Không thể kết nối Gemini API. Hãy kiểm tra API Key trong Settings!"}`,
      }));
    } finally {
      setLoadingAiExplain(false);
    }
  };

  // Request Socratic Stepped Hint (Level 1, 2, 3)
  const handleRequestSocraticHint = async (q: Question, level: 1 | 2 | 3) => {
    setLoadingSocraticHint((prev) => ({ ...prev, [q.id]: level }));

    try {
      const hint = await getSocraticHintAi({
        question: q.content,
        standardSolution: q.standardSolution,
        hintLevel: level,
      });

      setSocraticHints((prev) => ({
        ...prev,
        [q.id]: {
          ...(prev[q.id] || {}),
          [level]: hint,
        },
      }));
    } catch (err: any) {
      setSocraticHints((prev) => ({
        ...prev,
        [q.id]: {
          ...(prev[q.id] || {}),
          [level]: `[Lỗi gợi ý] ${err.message || "Vui lòng kiểm tra lại API Key"}`,
        },
      }));
    } finally {
      setLoadingSocraticHint((prev) => ({ ...prev, [q.id]: null }));
    }
  };

  // Grade Essay with AI
  const handleGradeEssayWithAi = async (q: Question) => {
    setGradingEssayId(q.id);
    const text = essayTexts[q.id] || "";
    const img = essayImages[q.id] || "";

    try {
      const result = await gradeEssayAi({
        questionContent: q.content,
        standardSolution: q.standardSolution,
        studentSubmissionText: text,
        imageBase64: img,
      });

      setEssayGrades((prev) => ({
        ...prev,
        [q.id]: result,
      }));
    } catch (err: any) {
      console.error("Essay grading error:", err);
      alert(`Không thể chấm bài tự luận: ${err.message || err}`);
    } finally {
      setGradingEssayId(null);
    }
  };

  // Handle Photo upload for Part IV
  const handleImageUpload = (qId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setEssayImages((prev) => ({
        ...prev,
        [qId]: reader.result as string,
      }));
    };
    reader.readAsDataURL(file);
  };

  const { earnedPoints, totalMaxPoints, percentage } = calculateResult();
  const passed = percentage >= lesson.requiredPassPercentage;

  // Filter questions by active tab
  const displayedQuestions = lesson.questions.filter((q) => {
    if (activeTab === "ALL") return true;
    return q.partType === activeTab;
  });

  return (
    <div className="space-y-6 pb-20 max-w-5xl mx-auto">
      {/* Top Header Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-18 z-30 backdrop-blur-md bg-white/95">
        <div className="flex items-center gap-3">
          <button
            id="back_to_dashboard_btn"
            onClick={onBack}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base sm:text-lg font-black text-slate-900 line-clamp-1">
              {lesson.title}
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Chuẩn 4 phần GDPT 2018 • Mục tiêu: $\ge {lesson.requiredPassPercentage}\%$
            </p>
          </div>
        </div>

        {/* Status Indicators: Timer & Anti-cheat Badge */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Anti-cheat tab counter badge */}
          <div
            id="anti_cheat_badge"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
              tabSwitches === 0
                ? "bg-slate-50 text-slate-700 border-slate-200"
                : tabSwitches < MAX_TAB_SWITCHES
                ? "bg-amber-50 text-amber-800 border-amber-300 animate-pulse"
                : "bg-rose-50 text-rose-800 border-rose-300"
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>
              Chuyển tab: {tabSwitches}/{MAX_TAB_SWITCHES}
            </span>
          </div>

          {/* Countdown Clock */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-800 text-xs font-bold border border-blue-200">
            <Clock className="w-4 h-4 text-blue-600" />
            <span>{formatTime(timeRemaining)}</span>
          </div>

          {/* Digital Scratchpad Button (SKILL EDUCATION) */}
          <button
            type="button"
            onClick={() => setShowScratchpad(!showScratchpad)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
              showScratchpad
                ? "bg-amber-500 text-white border-amber-600 shadow-xs"
                : "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
            }`}
            title="Mở bảng nháp kỹ thuật số để tính toán"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Bảng nháp</span>
          </button>

          {/* Export to Word (.doc) Button (SKILL EDUCATION) */}
          <button
            type="button"
            onClick={() =>
              exportExamToWordDocx(
                lesson.title,
                lesson.questions,
                lesson.grade,
                lesson.durationMinutes
              )
            }
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200 hover:bg-blue-100 transition-colors"
            title="Xuất toàn bộ đề thi & đáp án ra file Word (.doc) chuẩn mẫu Bộ GD&ĐT"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden md:inline">Xuất Word</span>
          </button>

          {/* Quick Formula Cheatsheet */}
          <button
            onClick={() => setShowFormulaSheet(!showFormulaSheet)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 text-purple-700 text-xs font-bold border border-purple-200 hover:bg-purple-100 transition-colors"
          >
            <Calculator className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Tra cứu công thức</span>
          </button>

          {!isSubmitted ? (
            <button
              id="submit_exam_top_btn"
              onClick={() => handleSubmitExam(false)}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-sm active:scale-95 transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Nộp bài</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setIsSubmitted(false);
                setTimeRemaining(lesson.durationMinutes * 60);
              }}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm active:scale-95 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Luyện lại</span>
            </button>
          )}
        </div>
      </div>

      {/* Anti-Cheat Violation Warning Modal */}
      {showCheatWarningModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-amber-200 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-black text-slate-900">
                Cảnh báo giám sát thi cử!
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Hệ thống phát hiện em vừa chuyển tab hoặc rời khỏi ứng dụng{" "}
                <strong className="text-amber-700 font-bold font-mono">({tabSwitches}/{MAX_TAB_SWITCHES} lần)</strong>.
              </p>
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 text-left">
                ⚠️ <strong>Quy định:</strong> Nếu chuyển tab quá {MAX_TAB_SWITCHES} lần, bài thi sẽ bị tự động khóa và thu bài ngay lập tức!
              </div>
            </div>

            <button
              id="acknowledge_cheat_warning_btn"
              onClick={() => setShowCheatWarningModal(false)}
              className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md transition-all"
            >
              Em đã hiểu và tiếp tục làm bài
            </button>
          </div>
        </div>
      )}

      {/* Auto-Submitted Cheat Banner */}
      {isAutoSubmittedDueToCheat && (
        <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-4 text-rose-800 flex items-start gap-3">
          <ShieldAlert className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-sm">Bài làm đã bị tự động thu do vi phạm chuyển tab quá 3 lần!</h4>
            <p className="text-xs text-rose-700">
              Biên bản giám sát đã ghi nhận thời gian và các lần mất tiêu điểm màn hình. Hãy rút kinh nghiệm ở lần tự luyện sau nhé!
            </p>
          </div>
        </div>
      )}

      {/* Post-Submission Result Card */}
      {isSubmitted && (
        <div
          id="practice_result_card"
          className={`rounded-3xl p-6 sm:p-8 border shadow-lg transition-all ${
            passed
              ? "bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100/60 border-emerald-300 text-emerald-950"
              : "bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100/60 border-amber-300 text-amber-950"
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 text-xs font-extrabold border border-emerald-200/60">
                {passed ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>XUẤT SẮC ĐẠT CHỈ TIÊU ( $\ge 80\%$ )</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>CHƯA ĐẠT CHỈ TIÊU ( Cần $\ge 80\%$ )</span>
                  </>
                )}
              </div>

              <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                Điểm số của em: <span className="underline decoration-emerald-500 font-mono">{percentage}%</span> ({earnedPoints}/{totalMaxPoints} điểm)
              </h2>

              <p className="text-xs sm:text-sm text-slate-700 max-w-xl leading-relaxed">
                {passed
                  ? "🎉 Chúc mừng em! Em đã hoàn thành xuất sắc bài học và mở khóa bài tiếp theo trên lộ trình của Thầy Cường!"
                  : "💪 Đừng nản lòng! Em hãy xem kỹ phần lời giải chi tiết và bấm 'Hỏi Thầy Cường AI' ở các câu làm sai để hiểu sâu bản chất nhé!"}
              </p>
            </div>

            <div className="flex flex-col sm:items-end gap-2">
              <button
                onClick={onBack}
                className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs sm:text-sm font-extrabold shadow-md hover:bg-slate-800 transition-all"
              >
                Trở về lộ trình bài học
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Formula Cheat Sheet Drawer (if opened) */}
      {showFormulaSheet && (
        <div className="bg-purple-50/80 rounded-2xl p-5 border border-purple-200 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-purple-900 flex items-center gap-2">
              <Calculator className="w-4 h-4 text-purple-700" />
              Sổ tay công thức cốt lõi của bài học
            </h3>
            <button
              onClick={() => setShowFormulaSheet(false)}
              className="text-xs text-purple-700 hover:text-purple-900 font-bold"
            >
              Đóng
            </button>
          </div>
          {lesson.theorySummaryLatex ? (
            <MathRenderer content={lesson.theorySummaryLatex} className="text-xs text-purple-950" />
          ) : (
            <MathRenderer
              content={"Công thức đạo hàm: $(u \\cdot v)' = u'v + uv'$, $(\\frac{u}{v})' = \\frac{u'v - uv'}{v^2}$."}
              className="text-xs text-purple-800"
            />
          )}
        </div>
      )}

      {/* Part Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: "ALL", label: "Tất cả các câu" },
          { id: "PART_I", label: "Phần I: 4 Lựa chọn" },
          { id: "PART_II", label: "Phần II: Đúng / Sai" },
          { id: "PART_III", label: "Phần III: Trả lời ngắn" },
          { id: "PART_IV", label: "Phần IV: Tự luận" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3.5 py-1.5 text-xs font-extrabold rounded-xl transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Questions List */}
      <div className="space-y-6">
        {displayedQuestions.map((q, qIndex) => {
          const userAns = answers[q.id];
          const isExpOpen = explainingQuestionId === q.id;

          return (
            <div
              key={q.id}
              id={`question_box_${q.id}`}
              className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-5 transition-all"
            >
              {/* Question Header */}
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-lg bg-blue-100 text-blue-800 font-black text-xs">
                    {q.title || `Câu ${qIndex + 1}`}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    ({q.partType === "PART_I"
                      ? "Phần I • Trắc nghiệm 4 lựa chọn"
                      : q.partType === "PART_II"
                      ? "Phần II • Đúng / Sai 4 ý"
                      : q.partType === "PART_III"
                      ? "Phần III • Trả lời ngắn"
                      : "Phần IV • Tự luận"})
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500">
                    {q.points} điểm
                  </span>
                  {/* Ask AI button for this question */}
                  <button
                    onClick={() => handleRequestAiExplanation(q)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-all"
                  >
                    <Bot className="w-3.5 h-3.5" />
                    <span>Hỏi Thầy Cường AI</span>
                  </button>
                </div>
              </div>

              {/* Question Content (with MathJax) */}
              <div className="text-slate-900 text-sm sm:text-base font-medium leading-relaxed">
                <MathRenderer content={q.content} />
              </div>

              {/* ================= PART I: Multiple Choice Options ================= */}
              {q.partType === "PART_I" && q.options && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {q.options.map((opt) => {
                    const isSelected = userAns === opt.id;
                    const isCorrect = opt.id === q.correctOption;

                    let btnStyle = "bg-slate-50/80 border-slate-200 hover:bg-slate-100/80 text-slate-800";
                    if (isSubmitted) {
                      if (isCorrect) {
                        btnStyle = "bg-emerald-100/90 border-emerald-400 text-emerald-950 font-bold";
                      } else if (isSelected && !isCorrect) {
                        btnStyle = "bg-rose-100/90 border-rose-400 text-rose-950";
                      }
                    } else if (isSelected) {
                      btnStyle = "bg-blue-600 border-blue-600 text-white font-bold shadow-xs";
                    }

                    return (
                      <button
                        key={opt.id}
                        id={`opt_${q.id}_${opt.id}`}
                        disabled={isSubmitted}
                        onClick={() => handleSelectOption(q.id, opt.id)}
                        className={`p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-all ${btnStyle}`}
                      >
                        <span
                          className={`w-6 h-6 rounded-lg flex items-center justify-center font-black text-xs shrink-0 ${
                            isSelected && !isSubmitted
                              ? "bg-white text-blue-700"
                              : "bg-white/80 border border-slate-300 text-slate-700"
                          }`}
                        >
                          {opt.id}
                        </span>
                        <div className="text-xs sm:text-sm font-medium flex-1 pt-0.5">
                          <MathRenderer content={opt.text} inline />
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* ================= PART II: True / False Statements ================= */}
              {q.partType === "PART_II" && q.tfStatements && (
                <div className="space-y-3 pt-2">
                  {q.tfStatements.map((stmt) => {
                    const chosen = userAns ? userAns[stmt.id] : undefined;
                    const isRightChoice = chosen === stmt.isCorrect;

                    return (
                      <div
                        key={stmt.id}
                        className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          isSubmitted
                            ? isRightChoice
                              ? "bg-emerald-50/70 border-emerald-200"
                              : "bg-rose-50/70 border-rose-200"
                            : "bg-slate-50/60 border-slate-200"
                        }`}
                      >
                        <div className="flex items-start gap-2.5 flex-1">
                          <span className="font-bold text-xs text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-md shrink-0">
                            {stmt.id})
                          </span>
                          <div className="text-xs sm:text-sm text-slate-800 leading-snug">
                            <MathRenderer content={stmt.statement} inline />
                          </div>
                        </div>

                        {/* True / False toggle buttons */}
                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          <button
                            disabled={isSubmitted}
                            onClick={() => handleSelectTrueFalse(q.id, stmt.id, true)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                              chosen === true
                                ? "bg-emerald-600 border-emerald-600 text-white shadow-xs"
                                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                            }`}
                          >
                            Đúng
                          </button>
                          <button
                            disabled={isSubmitted}
                            onClick={() => handleSelectTrueFalse(q.id, stmt.id, false)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                              chosen === false
                                ? "bg-rose-600 border-rose-600 text-white shadow-xs"
                                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                            }`}
                          >
                            Sai
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ================= PART III: Short Answer ================= */}
              {q.partType === "PART_III" && (
                <div className="space-y-3 pt-2">
                  <label className="text-xs font-bold text-slate-700 block">
                    Nhập câu trả lời của em (số thực, phân số hoặc tọa độ):
                  </label>
                  <div className="flex items-center gap-3 max-w-md">
                    <input
                      id={`short_ans_input_${q.id}`}
                      disabled={isSubmitted}
                      type="text"
                      placeholder="Ví dụ: 4.47 hoặc 2/3..."
                      value={userAns || ""}
                      onChange={(e) => handleShortAnswerChange(q.id, e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-mono focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>
                  {isSubmitted && (
                    <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-800">
                      <strong>Đáp án chính xác:</strong> <span className="font-mono font-bold text-blue-700">{q.shortAnswerCorrect}</span>
                    </div>
                  )}
                </div>
              )}

              {/* ================= PART IV: Essay / Extended Response ================= */}
              {q.partType === "PART_IV" && (
                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 block">
                      Trình bày bài giải tự luận hoặc tải ảnh bài làm:
                    </label>
                    <textarea
                      disabled={isSubmitted}
                      rows={4}
                      value={essayTexts[q.id] || ""}
                      onChange={(e) => setEssayTexts({ ...essayTexts, [q.id]: e.target.value })}
                      placeholder="Trình bày các bước lập luận, biến đổi công thức và đáp số..."
                      className="w-full p-3.5 rounded-2xl border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white"
                    />
                  </div>

                  {/* Photo upload option */}
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Đính kèm ảnh bài làm viết tay</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageUpload(q.id, e)}
                      />
                    </label>
                    {essayImages[q.id] && (
                      <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Đã đính kèm ảnh
                      </span>
                    )}

                    <button
                      onClick={() => handleGradeEssayWithAi(q)}
                      disabled={gradingEssayId === q.id}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold hover:opacity-95 shadow-xs"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{gradingEssayId === q.id ? "Đang chấm..." : "AI Chấm & Nhận xét"}</span>
                    </button>
                  </div>

                  {/* AI Grading Feedback Box */}
                  {essayGrades[q.id] && (
                    <div className="p-4 rounded-2xl bg-indigo-50/80 border border-indigo-200 space-y-2 text-xs text-slate-800">
                      <div className="flex items-center justify-between font-bold text-indigo-900">
                        <span>Đánh giá từ Thầy Cường AI:</span>
                        <span className="text-sm font-black text-indigo-700">
                          {essayGrades[q.id].score} / 10 điểm
                        </span>
                      </div>
                      <p className="text-slate-700">{essayGrades[q.id].feedback}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Socratic Stepped Hints (SKILL EDUCATION: ai-agents-architect) */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                    <span>Gợi ý sư phạm Socratic:</span>
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleRequestSocraticHint(q, 1)}
                      disabled={loadingSocraticHint[q.id] === 1}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                        socraticHints[q.id]?.[1]
                          ? "bg-amber-100 text-amber-900 border-amber-300"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-amber-50"
                      }`}
                    >
                      {loadingSocraticHint[q.id] === 1 ? "Đang tải..." : "Nấc 1: Định lý"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRequestSocraticHint(q, 2)}
                      disabled={loadingSocraticHint[q.id] === 2}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                        socraticHints[q.id]?.[2]
                          ? "bg-blue-100 text-blue-900 border-blue-300"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-blue-50"
                      }`}
                    >
                      {loadingSocraticHint[q.id] === 2 ? "Đang tải..." : "Nấc 2: Hướng giải"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRequestSocraticHint(q, 3)}
                      disabled={loadingSocraticHint[q.id] === 3}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                        socraticHints[q.id]?.[3]
                          ? "bg-emerald-100 text-emerald-900 border-emerald-300"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-emerald-50"
                      }`}
                    >
                      {loadingSocraticHint[q.id] === 3 ? "Đang tải..." : "Nấc 3: Chi tiết"}
                    </button>
                  </div>
                </div>

                {/* Socratic Hint Content Box */}
                {socraticHints[q.id] && Object.keys(socraticHints[q.id]).length > 0 && (
                  <div className="mt-2.5 space-y-2">
                    {socraticHints[q.id][1] && (
                      <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-950">
                        <strong className="text-amber-800 font-bold block mb-1">
                          💡 Gợi ý Nấc 1 (Định lý & Công thức cốt lõi):
                        </strong>
                        <MathRenderer content={socraticHints[q.id][1]} />
                      </div>
                    )}
                    {socraticHints[q.id][2] && (
                      <div className="p-3 rounded-xl bg-blue-50/80 border border-blue-200 text-xs text-blue-950">
                        <strong className="text-blue-800 font-bold block mb-1">
                          🎯 Gợi ý Nấc 2 (Phương pháp & Bước then chốt):
                        </strong>
                        <MathRenderer content={socraticHints[q.id][2]} />
                      </div>
                    )}
                    {socraticHints[q.id][3] && (
                      <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200 text-xs text-emerald-950">
                        <strong className="text-emerald-800 font-bold block mb-1">
                          ✨ Gợi ý Nấc 3 (Lời giải chi tiết & Tránh bẫy):
                        </strong>
                        <MathRenderer content={socraticHints[q.id][3]} />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Standard Solution Breakdown (shown after submit) */}
              {isSubmitted && q.standardSolution && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-2">
                  <h5 className="text-xs font-extrabold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                    Hướng dẫn giải chuẩn mực từ Thầy Cường:
                  </h5>
                  <div className="text-xs sm:text-sm text-slate-800">
                    <MathRenderer content={q.standardSolution} />
                  </div>
                </div>
              )}

              {/* AI Pedagogical Explanation Panel (if requested) */}
              {aiExplanations[q.id] && (
                <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50 via-purple-50 to-white border border-indigo-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-extrabold text-indigo-900 flex items-center gap-2">
                      <Bot className="w-4 h-4 text-indigo-600 animate-bounce" />
                      Lời khuyên sư phạm chi tiết từ Thầy Cường AI:
                    </h5>
                    <button
                      onClick={() => setAiExplanations((prev) => ({ ...prev, [q.id]: "" }))}
                      className="text-xs text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-xs sm:text-sm text-slate-800 leading-relaxed">
                    <MathRenderer content={aiExplanations[q.id]} />
                  </div>
                </div>
              )}

              {loadingAiExplain && explainingQuestionId === q.id && (
                <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 flex items-center justify-center gap-2 text-xs font-bold text-indigo-700">
                  <Bot className="w-4 h-4 animate-spin text-indigo-600" />
                  <span>Thầy Cường AI đang phân tích và chuẩn bị lời giải cho em...</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom Submit Action */}
      {!isSubmitted && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-lg text-center space-y-3">
          <h4 className="text-base font-extrabold text-slate-900">
            Em đã hoàn thành tất cả các câu hỏi?
          </h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Kiểm tra kỹ lưỡng các phần thi trước khi nộp bài để đạt trên $80\%$ và mở khóa level tiếp theo nhé!
          </p>
          <button
            id="submit_exam_bottom_btn"
            onClick={() => handleSubmitExam(false)}
            className="px-8 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-extrabold text-sm shadow-md hover:shadow-lg transition-all active:scale-95"
          >
            Nộp bài & Xem kết quả
          </button>
        </div>
      )}

      {/* Digital Scratchpad (Whiteboard) */}
      <DigitalScratchpad
        isOpen={showScratchpad}
        onClose={() => setShowScratchpad(false)}
      />
    </div>
  );
};
