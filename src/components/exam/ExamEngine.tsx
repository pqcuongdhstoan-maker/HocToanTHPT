import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { MathContent } from '../common/MathContent';
import { api } from '../../services/api';
import { Question, Attempt, AttemptAnswer, QuestionType } from '../../types';
import {
  Clock,
  Save,
  Send,
  AlertTriangle,
  Flag,
  ChevronLeft,
  ChevronRight,
  Bot,
  HelpCircle,
  CheckCircle2,
  FileText,
  Upload,
  Image as ImageIcon,
  Loader2,
  ShieldAlert,
  ArrowLeft,
} from 'lucide-react';

export const ExamEngine: React.FC = () => {
  const {
    currentUser,
    activeAttempt,
    setActiveAttempt,
    activeQuestions,
    selectedLessonId,
    lessons,
    setActiveTab,
    showToast,
    refreshProgress,
  } = useApp();

  const [currentQIndex, setCurrentQIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, AttemptAnswer>>(activeAttempt?.answers || {});
  const [flaggedQIds, setFlaggedQIds] = useState<Record<string, boolean>>({});
  const [lastSavedTime, setLastSavedTime] = useState<string>('Vừa mới khởi tạo');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);

  // Timer state
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(45 * 60);
  const durationSpentRef = useRef<number>(activeAttempt?.durationSpentSeconds || 0);

  // Proctoring Violation State
  const [violationCount, setViolationCount] = useState<number>(activeAttempt?.violations?.length || 0);
  const [showViolationModal, setShowViolationModal] = useState<boolean>(false);
  const [violationMessage, setViolationMessage] = useState<string>('');

  // AI Hint Drawer State
  const [aiHint, setAiHint] = useState<string | null>(null);
  const [isHintLoading, setIsHintLoading] = useState<boolean>(false);
  const [hintLevel, setHintLevel] = useState<number>(1);
  const [showHintModal, setShowHintModal] = useState<boolean>(false);

  const currentLesson = lessons.find((l) => l.id === activeAttempt?.lessonId) || lessons[0];
  const currentQuestion = activeQuestions[currentQIndex] || activeQuestions[0];

  // ----------------------------------------------------
  // Timer Countdown and Expiry
  // ----------------------------------------------------
  useEffect(() => {
    if (!activeAttempt) return;

    // Calculate remaining seconds based on server expiry or 45 mins
    const interval = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSubmitExam(true); // Auto submit on timer expired
          return 0;
        }
        durationSpentRef.current += 1;
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeAttempt?.id]);

  // ----------------------------------------------------
  // Autosave Debounce (Sync every 10 seconds or on modification)
  // ----------------------------------------------------
  const handleAutosave = useCallback(async () => {
    if (!activeAttempt?.id) return;
    try {
      const savedAt = await api.autosaveAttempt(activeAttempt.id, answers, durationSpentRef.current);
      const timeStr = new Date(savedAt).toLocaleTimeString('vi-VN');
      setLastSavedTime(timeStr);
    } catch (err) {
      console.warn('Autosave error:', err);
    }
  }, [activeAttempt?.id, answers]);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleAutosave();
    }, 4000);
    return () => clearTimeout(timer);
  }, [answers, handleAutosave]);

  // ----------------------------------------------------
  // Proctoring: Tab Switch / Blur Detection
  // ----------------------------------------------------
  useEffect(() => {
    if (!activeAttempt || activeAttempt.status !== 'in_progress') return;

    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'hidden') {
        const nextCount = violationCount + 1;
        setViolationCount(nextCount);

        let actionTaken = 'warning';
        if (nextCount === 1) {
          setViolationMessage('Cảnh báo 1/3: Bạn vừa rời khỏi màn hình luyện tập! Vui lòng không chuyển tab hay ứng dụng.');
          setShowViolationModal(true);
        } else if (nextCount === 2) {
          setViolationMessage('Cảnh báo nghiêm trọng 2/3: Lần chuyển tab tiếp theo hệ thống sẽ tự động nộp bài và ghi nhận vi phạm.');
          setShowViolationModal(true);
        } else if (nextCount >= 3) {
          actionTaken = 'auto_submitted';
          setViolationMessage('Bạn đã vi phạm quy chế chuyển tab quá 3 lần. Hệ thống tự động thu bài thi.');
          setShowViolationModal(true);
          setTimeout(() => {
            handleSubmitExam(true);
          }, 3000);
        }

        await api.logProctorViolation(activeAttempt.id, 'tab_switch', actionTaken);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [activeAttempt?.id, violationCount]);

  // ----------------------------------------------------
  // Answer Update Handlers
  // ----------------------------------------------------
  const updateMcqAnswer = (qId: string, optionId: string) => {
    setAnswers((prev) => ({
      ...prev,
      [qId]: {
        ...prev[qId],
        questionId: qId,
        selectedOption: optionId,
        timeSpentSeconds: (prev[qId]?.timeSpentSeconds || 0) + 1,
      },
    }));
  };

  const updateTrueFalseAnswer = (qId: string, statementId: string, value: boolean) => {
    setAnswers((prev) => {
      const currentTf = prev[qId]?.tfAnswers || {};
      return {
        ...prev,
        [qId]: {
          ...prev[qId],
          questionId: qId,
          tfAnswers: {
            ...currentTf,
            [statementId]: value,
          },
        },
      };
    });
  };

  const updateShortAnswer = (qId: string, text: string) => {
    setAnswers((prev) => ({
      ...prev,
      [qId]: {
        ...prev[qId],
        questionId: qId,
        shortAnswerText: text,
      },
    }));
  };

  const updateEssayAnswer = (qId: string, content: string, attachments?: string[]) => {
    setAnswers((prev) => ({
      ...prev,
      [qId]: {
        ...prev[qId],
        questionId: qId,
        essayContent: content,
        essayAttachments: attachments || prev[qId]?.essayAttachments || [],
      },
    }));
  };

  // ----------------------------------------------------
  // Submit Exam Handler
  // ----------------------------------------------------
  const handleSubmitExam = async (isAuto = false) => {
    if (!activeAttempt?.id || isSubmitting) return;

    setIsSubmitting(true);
    try {
      showToast('Đang chấm điểm bài làm...', 'Đang tổng hợp điểm 4 dạng và kiểm tra chuẩn 80%...', 'info');
      const result = await api.submitAttempt(activeAttempt.id, answers, durationSpentRef.current, isAuto);

      setActiveAttempt(result.attempt);
      await refreshProgress();
      setShowSubmitModal(false);
      setActiveTab('exam-result');

      showToast('Nộp bài thành công!', `Điểm: ${result.attempt.totalScore}/${result.attempt.maxScore} (${result.attempt.masteryPercent}%)`, 'success');
    } catch (err) {
      console.error('Submit error:', err);
      showToast('Lỗi khi nộp bài', 'Vui lòng kiểm tra lại kết nối mạng.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ----------------------------------------------------
  // AI Socratic Hint Handler
  // ----------------------------------------------------
  const handleRequestAiHint = async () => {
    if (!currentQuestion) return;
    setIsHintLoading(true);
    setShowHintModal(true);
    try {
      const studentAnsStr = JSON.stringify(answers[currentQuestion.id] || '');
      const hint = await api.getSocraticHint(currentQuestion.stem, studentAnsStr, hintLevel);
      setAiHint(hint);
    } catch (err: any) {
      setAiHint(`⚠️ **Đã dừng do lỗi**: ${err?.message || '429 RESOURCE_EXHAUSTED'}\n\nVui lòng bấm vào nút "Lấy API key để sử dụng app" trên thanh điều hướng để nhập hoặc đổi API Key mới.`);
      showToast('Đã dừng do lỗi', err?.message || 'Không thể kết nối Gemini API.', 'error');
    } finally {
      setIsHintLoading(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Question answered check
  const isQuestionAnswered = (q: Question): boolean => {
    const ans = answers[q.id];
    if (!ans) return false;
    if (q.type === 'mcq') return !!ans.selectedOption;
    if (q.type === 'true_false') return !!ans.tfAnswers && Object.keys(ans.tfAnswers).length > 0;
    if (q.type === 'short_answer') return !!ans.shortAnswerText?.trim();
    if (q.type === 'essay') return !!ans.essayContent?.trim() || !!ans.essayAttachments?.length;
    return false;
  };

  const answeredCount = activeQuestions.filter(isQuestionAnswered).length;

  if (!activeAttempt || activeQuestions.length === 0) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-2xl border border-slate-200 text-center shadow-sm">
        <h3 className="text-lg font-bold text-slate-800">Chưa có bài thi đang diễn ra</h3>
        <p className="text-xs text-slate-500 mt-2 mb-6">
          Vui lòng chọn một bài học từ danh sách để bắt đầu luyện tập.
        </p>
        <button
          onClick={() => setActiveTab('lessons')}
          className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold transition shadow"
        >
          Quay lại danh sách bài học
        </button>
      </div>
    );
  }

  return (
    <div id="exam-engine-container" className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* Sticky Exam Top Bar */}
      <div className="sticky top-16 z-40 bg-white/95 backdrop-blur-md rounded-2xl border border-teal-200 p-4 sm:p-5 shadow-md flex flex-wrap items-center justify-between gap-4">
        {/* Left: Lesson title & exit */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setActiveTab('lessons')}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
            title="Tạm dừng và quay lại danh mục bài học"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="text-[11px] font-bold text-teal-800 uppercase tracking-wider">
              Bài {currentLesson.number}: {currentLesson.title}
            </div>
            <div className="text-xs text-slate-500 flex items-center space-x-2 mt-0.5">
              <span>Học sinh: <strong>{currentUser.fullName}</strong></span>
              <span>•</span>
              <span className="flex items-center gap-1 text-slate-400">
                <Save className="w-3 h-3 text-teal-600" /> Đã lưu: {lastSavedTime}
              </span>
            </div>
          </div>
        </div>

        {/* Center: Countdown Timer */}
        <div className="flex items-center space-x-2">
          <div
            id="exam-timer"
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-mono font-bold text-sm sm:text-base border shadow-xs ${
              timeLeftSeconds < 300
                ? 'bg-rose-50 border-rose-300 text-rose-700 animate-pulse'
                : 'bg-teal-50 border-teal-200 text-teal-900'
            }`}
          >
            <Clock className={`w-4 h-4 ${timeLeftSeconds < 300 ? 'text-rose-600' : 'text-teal-700'}`} />
            <span>{formatTimer(timeLeftSeconds)}</span>
          </div>

          {violationCount > 0 && (
            <div
              className="flex items-center space-x-1 px-2.5 py-1.5 bg-amber-100 border border-amber-300 text-amber-900 rounded-xl text-xs font-bold"
              title="Số lần vi phạm rời màn hình thi"
            >
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              <span>Vi phạm: {violationCount}/3</span>
            </div>
          )}
        </div>

        {/* Right: Submit Button */}
        <div className="flex items-center space-x-2">
          <button
            id="btn-submit-exam"
            onClick={() => setShowSubmitModal(true)}
            className="flex items-center space-x-1.5 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition active:scale-95"
          >
            <Send className="w-4 h-4" />
            <span>Nộp bài ({answeredCount}/{activeQuestions.length})</span>
          </button>
        </div>
      </div>

      {/* Main Layout: Question Canvas & Navigation Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column (3/4): Active Question Card */}
        <div className="lg:col-span-3 space-y-6">
          <div
            id={`question-card-${currentQuestion.id}`}
            className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6"
          >
            {/* Question Header & Tags */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-2.5">
                <span className="w-8 h-8 rounded-xl bg-teal-800 text-white font-bold text-sm flex items-center justify-center shadow-xs">
                  {currentQIndex + 1}
                </span>
                <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-lg">
                  {currentQuestion.type === 'mcq'
                    ? 'Trắc nghiệm 4 lựa chọn'
                    : currentQuestion.type === 'true_false'
                    ? 'Đúng / Sai (4 mệnh đề)'
                    : currentQuestion.type === 'short_answer'
                    ? 'Trả lời ngắn'
                    : 'Tự luận'}
                </span>
                <span className="text-xs text-teal-800 font-semibold bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200">
                  {currentQuestion.points || 1.0} điểm
                </span>
              </div>

              {/* Bookmark & AI Hint Actions */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleRequestAiHint}
                  className="flex items-center space-x-1 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-3 py-1.5 rounded-lg transition"
                >
                  <Bot className="w-3.5 h-3.5 text-teal-600" />
                  <span>Gợi ý AI</span>
                </button>

                <button
                  onClick={() =>
                    setFlaggedQIds((prev) => ({
                      ...prev,
                      [currentQuestion.id]: !prev[currentQuestion.id],
                    }))
                  }
                  className={`p-2 rounded-lg border transition ${
                    flaggedQIds[currentQuestion.id]
                      ? 'bg-amber-100 border-amber-300 text-amber-700'
                      : 'bg-white border-slate-200 text-slate-400 hover:text-slate-700'
                  }`}
                  title="Đánh dấu xem lại sau"
                >
                  <Flag className="w-4 h-4 fill-current" />
                </button>
              </div>
            </div>

            {/* Question Stem with LaTeX */}
            <div className="text-base text-slate-900 leading-relaxed">
              <MathContent content={currentQuestion.stem} />
            </div>

            {/* Attached media / diagrams */}
            {currentQuestion.media && currentQuestion.media.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-4">
                {currentQuestion.media.map((m, idx) => (
                  <div key={idx} className="p-2 border border-slate-200 rounded-xl bg-slate-50 flex items-center justify-center">
                    <img src={m.url} alt={`Hình vẽ câu ${currentQIndex + 1}`} className="max-h-64 object-contain rounded-lg" />
                  </div>
                ))}
              </div>
            )}

            {/* DYNAMIC ANSWER RENDERER BY QUESTION TYPE */}
            {/* TYPE 1: MCQ (4 Options) */}
            {currentQuestion.type === 'mcq' && currentQuestion.options && (
              <div className="space-y-3 pt-2">
                {currentQuestion.options.map((opt) => {
                  const isSelected = answers[currentQuestion.id]?.selectedOption === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => updateMcqAnswer(currentQuestion.id, opt.id)}
                      className={`w-full p-4 rounded-xl border text-left transition flex items-start space-x-3.5 ${
                        isSelected
                          ? 'bg-teal-50 border-teal-600 text-teal-950 font-medium shadow-xs ring-1 ring-teal-600'
                          : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-800'
                      }`}
                    >
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 ${
                          isSelected
                            ? 'bg-teal-700 text-white'
                            : 'border border-slate-300 text-slate-600 bg-slate-50'
                        }`}
                      >
                        {opt.id}
                      </div>
                      <div className="flex-1 text-sm pt-0.5">
                        <MathContent content={opt.text} inline />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* TYPE 2: TRUE / FALSE (Đúng / Sai 4 ý a, b, c, d) */}
            {currentQuestion.type === 'true_false' && currentQuestion.statements && (
              <div className="space-y-4 pt-2">
                <div className="text-xs text-slate-500 italic">
                  * Chọn Đúng hoặc Sai cho mỗi khẳng định bên dưới (Đúng 1 ý: 0.1đ | 2 ý: 0.25đ | 3 ý: 0.5đ | 4 ý: 1.0đ)
                </div>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
                  {currentQuestion.statements.map((st) => {
                    const userVal = answers[currentQuestion.id]?.tfAnswers?.[st.id];
                    return (
                      <div
                        key={st.id}
                        className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white"
                      >
                        <div className="flex items-start space-x-2.5 flex-1">
                          <span className="font-bold text-xs text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200 mt-0.5">
                            {st.id})
                          </span>
                          <div className="text-sm text-slate-800">
                            <MathContent content={st.statement} />
                          </div>
                        </div>

                        {/* True / False Toggle Buttons */}
                        <div className="flex items-center space-x-2 flex-shrink-0">
                          <button
                            onClick={() => updateTrueFalseAnswer(currentQuestion.id, st.id, true)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                              userVal === true
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
                            }`}
                          >
                            <span>Đúng</span>
                          </button>
                          <button
                            onClick={() => updateTrueFalseAnswer(currentQuestion.id, st.id, false)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                              userVal === false
                                ? 'bg-rose-600 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-700'
                            }`}
                          >
                            <span>Sai</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TYPE 3: SHORT ANSWER (Trả lời ngắn) */}
            {currentQuestion.type === 'short_answer' && (
              <div className="space-y-4 pt-2">
                <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-xl space-y-3">
                  <label className="text-xs font-bold text-purple-950 uppercase tracking-wide">
                    Nhập câu trả lời ngắn (Số thập phân, phân số hoặc biểu thức số):
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="text"
                      value={answers[currentQuestion.id]?.shortAnswerText || ''}
                      onChange={(e) => updateShortAnswer(currentQuestion.id, e.target.value)}
                      placeholder="Ví dụ: 3.5 hoặc -2 hoặc 3/4"
                      className="flex-1 px-4 py-3 bg-white border border-purple-300 rounded-xl text-base font-mono font-bold text-purple-950 focus:ring-2 focus:ring-purple-500 focus:outline-none shadow-inner"
                    />
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-purple-800">
                    <span>Phím tắt nhanh:</span>
                    <button
                      onClick={() => updateShortAnswer(currentQuestion.id, (answers[currentQuestion.id]?.shortAnswerText || '') + '/')}
                      className="px-2 py-1 bg-white border border-purple-200 rounded font-mono hover:bg-purple-100"
                    >
                      /
                    </button>
                    <button
                      onClick={() => updateShortAnswer(currentQuestion.id, (answers[currentQuestion.id]?.shortAnswerText || '') + '-')}
                      className="px-2 py-1 bg-white border border-purple-200 rounded font-mono hover:bg-purple-100"
                    >
                      -
                    </button>
                    <button
                      onClick={() => updateShortAnswer(currentQuestion.id, (answers[currentQuestion.id]?.shortAnswerText || '') + 'sqrt(')}
                      className="px-2 py-1 bg-white border border-purple-200 rounded font-mono hover:bg-purple-100"
                    >
                      √
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TYPE 4: ESSAY (Tự luận) */}
            {currentQuestion.type === 'essay' && (
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase">
                    Trình bày bài giải tự luận:
                  </label>
                  <textarea
                    rows={6}
                    value={answers[currentQuestion.id]?.essayContent || ''}
                    onChange={(e) => updateEssayAnswer(currentQuestion.id, e.target.value)}
                    placeholder="Gõ chi tiết các bước biến đổi, lập luận hoặc bảng biến thiên..."
                    className="w-full p-4 border border-slate-200 rounded-xl text-sm leading-relaxed focus:ring-2 focus:ring-teal-500 focus:outline-none font-sans"
                  />
                </div>

                {/* Optional Handwritten Solution Photo Attachment */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-teal-600" />
                      Đính kèm ảnh bài làm viết tay (Tùy chọn)
                    </span>
                    <label className="cursor-pointer inline-flex items-center space-x-1 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold shadow-xs">
                      <Upload className="w-3.5 h-3.5 text-slate-500" />
                      <span>Chọn ảnh</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (evt) => {
                              const base64 = evt.target?.result as string;
                              updateEssayAnswer(currentQuestion.id, answers[currentQuestion.id]?.essayContent || '', [base64]);
                              showToast('Đã đính kèm ảnh', 'Ảnh bài làm đã được lưu vào bài nộp.', 'success');
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </div>
                  {answers[currentQuestion.id]?.essayAttachments?.[0] && (
                    <div className="relative inline-block mt-2">
                      <img
                        src={answers[currentQuestion.id]?.essayAttachments?.[0]}
                        alt="Bài làm đính kèm"
                        className="max-h-40 rounded-lg border border-slate-200 shadow-xs"
                      />
                      <button
                        onClick={() => updateEssayAnswer(currentQuestion.id, answers[currentQuestion.id]?.essayContent || '', [])}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-rose-600 text-white rounded-full flex items-center justify-center text-xs shadow hover:bg-rose-700"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Bottom Navigation Buttons (Prev / Next) */}
            <div className="flex items-center justify-between border-t border-slate-100 pt-5">
              <button
                onClick={() => setCurrentQIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentQIndex === 0}
                className="flex items-center space-x-1.5 px-4 py-2 border border-slate-200 disabled:opacity-40 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Câu trước</span>
              </button>

              <div className="text-xs font-medium text-slate-500">
                Câu {currentQIndex + 1} / {activeQuestions.length}
              </div>

              <button
                onClick={() => setCurrentQIndex((prev) => Math.min(activeQuestions.length - 1, prev + 1))}
                disabled={currentQIndex === activeQuestions.length - 1}
                className="flex items-center space-x-1.5 px-4 py-2 bg-teal-700 disabled:opacity-40 hover:bg-teal-800 text-white rounded-xl text-xs font-semibold shadow transition"
              >
                <span>Câu kế tiếp</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column (1/4): Question Grid Palette */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Danh mục câu hỏi</h3>
              <span className="text-xs font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md">
                {answeredCount}/{activeQuestions.length} đã làm
              </span>
            </div>

            {/* Grid of question bubbles */}
            <div className="grid grid-cols-5 gap-2">
              {activeQuestions.map((q, idx) => {
                const isCurrent = idx === currentQIndex;
                const isAnswered = isQuestionAnswered(q);
                const isFlagged = flaggedQIds[q.id];

                let bgStyle = 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200';
                if (isCurrent) {
                  bgStyle = 'ring-2 ring-teal-600 bg-teal-800 text-white font-bold';
                } else if (isAnswered) {
                  bgStyle = 'bg-teal-100 border-teal-300 text-teal-950 font-bold';
                }

                return (
                  <button
                    key={q.id}
                    id={`nav-q-${idx + 1}`}
                    onClick={() => setCurrentQIndex(idx)}
                    className={`h-9 rounded-xl border text-xs font-medium flex items-center justify-center relative transition ${bgStyle}`}
                  >
                    <span>{idx + 1}</span>
                    {isFlagged && (
                      <span className="w-2 h-2 rounded-full bg-amber-500 absolute top-1 right-1" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="border-t border-slate-100 pt-3 space-y-2 text-[11px] text-slate-500">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded bg-teal-100 border border-teal-300" />
                <span>Đã làm câu này</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded bg-slate-100 border border-slate-200" />
                <span>Chưa trả lời</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span>Đã đánh dấu cờ</span>
              </div>
            </div>

            {/* Quick Finish CTA */}
            <button
              onClick={() => setShowSubmitModal(true)}
              className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-xl text-xs font-bold shadow transition active:scale-95"
            >
              Nộp bài thi
            </button>
          </div>
        </div>
      </div>

      {/* SUBMIT CONFIRMATION MODAL */}
      {showSubmitModal && (
        <div
          id="submit-confirm-modal"
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-teal-200">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Send className="w-5 h-5 text-teal-700" />
              Xác nhận nộp bài luyện tập
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Bạn đã trả lời <strong className="text-teal-800">{answeredCount}/{activeQuestions.length}</strong> câu hỏi.
              {answeredCount < activeQuestions.length && (
                <span className="block mt-1 text-amber-700 font-semibold">
                  ⚠️ Còn {activeQuestions.length - answeredCount} câu chưa trả lời. Bạn có chắc muốn nộp ngay?
                </span>
              )}
            </p>

            <div className="flex justify-end space-x-3 pt-3">
              <button
                onClick={() => setShowSubmitModal(false)}
                disabled={isSubmitting}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Làm tiếp
              </button>
              <button
                id="btn-confirm-submit"
                onClick={() => handleSubmitExam(false)}
                disabled={isSubmitting}
                className="px-5 py-2 bg-gradient-to-r from-teal-700 to-emerald-700 hover:from-teal-800 hover:to-emerald-800 text-white rounded-xl text-xs font-bold shadow transition flex items-center gap-1.5"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang chấm điểm...</span>
                  </>
                ) : (
                  <span>Nộp bài ngay</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PROCTORING VIOLATION WARNING MODAL */}
      {showViolationModal && (
        <div
          id="proctor-warning-modal"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border-2 border-rose-400">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-rose-900 text-center">
              Cảnh báo vi phạm quy chế thi
            </h3>
            <p className="text-xs text-slate-700 text-center leading-relaxed">
              {violationMessage}
            </p>
            <div className="pt-2 text-center">
              <button
                onClick={() => setShowViolationModal(false)}
                className="px-6 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow"
              >
                Tôi đã hiểu & Quay lại làm bài
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI SOCRATIC HINT MODAL */}
      {showHintModal && (
        <div
          id="ai-hint-modal"
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-teal-300">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2 text-teal-800 font-bold text-sm">
                <Bot className="w-4 h-4 text-teal-600" />
                <span>Gợi ý Socratic (Bước {hintLevel}/3)</span>
              </div>
              <button
                onClick={() => setShowHintModal(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-xl text-xs text-slate-800 leading-relaxed min-h-[100px]">
              {isHintLoading ? (
                <div className="flex items-center justify-center py-6 space-x-2 text-teal-700">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang tư duy gợi ý cho bạn...</span>
                </div>
              ) : (
                <MathContent content={aiHint || 'Hãy thử tính đạo hàm và xét dấu tam thức bậc hai!'} />
              )}
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                onClick={() => {
                  setHintLevel((prev) => Math.min(3, prev + 1));
                  handleRequestAiHint();
                }}
                disabled={hintLevel >= 3 || isHintLoading}
                className="text-xs text-teal-700 hover:text-teal-900 font-bold disabled:opacity-40"
              >
                Cần gợi ý sâu hơn (+ Bước {hintLevel + 1}) →
              </button>

              <button
                onClick={() => setShowHintModal(false)}
                className="px-4 py-2 bg-teal-700 text-white rounded-xl text-xs font-bold"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
