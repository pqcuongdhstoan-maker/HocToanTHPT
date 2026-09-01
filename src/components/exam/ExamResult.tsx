import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { useApp } from '../../context/AppContext';
import { MathContent } from '../common/MathContent';
import { api } from '../../services/api';
import { Question, Attempt } from '../../types';
import { gradeSingleQuestion } from '../../services/gradingEngine';
import { diagnoseAttemptMisconceptions, DiagnosticResult } from '../../services/aiDiagnosticAgent';
import { downloadExamDocx } from '../../services/docxExporter';
import {
  Award,
  CheckCircle2,
  XCircle,
  Sparkles,
  RotateCcw,
  ArrowRight,
  BookOpen,
  Bot,
  HelpCircle,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Download,
  AlertTriangle,
  FileText,
  Lightbulb,
} from 'lucide-react';

export const ExamResult: React.FC = () => {
  const {
    activeAttempt,
    activeQuestions,
    lessons,
    setSelectedLessonId,
    setActiveTab,
    setActiveAttempt,
    setActiveQuestions,
    currentUser,
    showToast,
  } = useApp();

  const [expandedSolutions, setExpandedSolutions] = useState<Record<string, boolean>>({});
  const [similarQuestions, setSimilarQuestions] = useState<Record<string, Partial<Question>>>({});
  const [generatingSimilarId, setGeneratingSimilarId] = useState<string | null>(null);
  const [diagnosticResult, setDiagnosticResult] = useState<DiagnosticResult | null>(null);
  const [isExportingDocx, setIsExportingDocx] = useState<boolean>(false);

  const currentLesson = lessons.find((l) => l.id === activeAttempt?.lessonId) || lessons[0];
  const mastery = activeAttempt?.masteryPercent || 0;
  const isPassed = mastery >= 80;

  // Run AI Diagnostic when attempt is loaded
  useEffect(() => {
    if (activeAttempt && activeQuestions.length > 0) {
      diagnoseAttemptMisconceptions(activeAttempt, activeQuestions).then((res) => {
        setDiagnosticResult(res);
      });
    }
  }, [activeAttempt?.id, activeQuestions.length]);

  // Trigger confetti when score is >= 80%
  useEffect(() => {
    if (isPassed) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#0D9488', '#14B8A6', '#F59E0B', '#10B981'],
      });
    }
  }, [isPassed]);

  const handleExportDocx = async () => {
    if (!activeAttempt) return;
    setIsExportingDocx(true);
    try {
      showToast('Đang tạo file Word...', 'Đang xuất bài làm và lời giải chi tiết...', 'info');
      await downloadExamDocx({
        lessonTitle: `Bài ${currentLesson.number}: ${currentLesson.title}`,
        schoolName: 'HỆ THỐNG TỰ LUYỆN TOÁN 12 - GDPT 2018',
        teacherName: 'Thầy Phan Quốc Cường',
        durationMinutes: 45,
        includeAnswers: true,
        includeSolutions: true,
        questions: activeQuestions,
      });
      showToast('Tải Word thành công!', 'File lời giải chi tiết đã được lưu về máy.', 'success');
    } catch (err: any) {
      showToast('Lỗi xuất Word', err?.message || 'Không thể tạo file Word.', 'error');
    } finally {
      setIsExportingDocx(false);
    }
  };

  const toggleSolution = (qId: string) => {
    setExpandedSolutions((prev) => ({
      ...prev,
      [qId]: !prev[qId],
    }));
  };

  const handleRetake = async () => {
    if (!activeAttempt?.lessonId) return;
    try {
      showToast('Khởi tạo lượt luyện mới...', 'Đang nạp đề thi...', 'info');
      const { attempt, questions } = await api.startAttempt(activeAttempt.lessonId, currentUser.id);
      setActiveAttempt(attempt);
      setActiveQuestions(questions);
      setActiveTab('exam');
    } catch (err) {
      console.error('Error retaking:', err);
    }
  };

  const handleGenerateSimilar = async (q: Question) => {
    setGeneratingSimilarId(q.id);
    try {
      const generated = await api.generateSimilarQuestion(q.stem, q.type, q.difficulty);
      setSimilarQuestions((prev) => ({
        ...prev,
        [q.id]: generated,
      }));
      showToast('Đã tạo câu tương tự', 'Bạn có thể luyện tập câu hỏi tương tự do AI vừa sinh!', 'success');
    } catch (err) {
      console.error('Generate similar error:', err);
    } finally {
      setGeneratingSimilarId(null);
    }
  };

  if (!activeAttempt) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-2xl border text-center shadow-sm">
        <h3 className="text-lg font-bold text-slate-800">Chưa có kết quả thi</h3>
        <button
          onClick={() => setActiveTab('lessons')}
          className="mt-4 px-5 py-2.5 bg-teal-700 text-white rounded-xl text-xs font-bold"
        >
          Quay lại danh mục bài học
        </button>
      </div>
    );
  }

  return (
    <div id="exam-result-container" className="max-w-4xl mx-auto space-y-8 pb-20">
      {/* Top Score Banner */}
      <div
        className={`rounded-3xl p-6 sm:p-8 text-white shadow-xl border relative overflow-hidden ${
          isPassed
            ? 'bg-gradient-to-br from-teal-900 via-teal-800 to-emerald-950 border-emerald-500/40'
            : 'bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 border-teal-700/50'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-2 bg-white/10 backdrop-blur-md">
              <Award className="w-3.5 h-3.5 text-amber-300" />
              <span>Kết quả bài luyện tập</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold">
              Bài {currentLesson.number}: {currentLesson.title}
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-teal-200">
              Học sinh: <strong>{activeAttempt.userName}</strong> • Lớp {activeAttempt.userClass}
            </p>
          </div>

          {/* Large Score Circle */}
          <div className="flex items-center space-x-4 bg-black/20 p-4 rounded-2xl border border-white/10 backdrop-blur-md">
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-extrabold font-mono text-amber-300">
                {activeAttempt.totalScore}
                <span className="text-lg text-teal-200 font-sans font-normal">/{activeAttempt.maxScore}</span>
              </div>
              <div className="text-[11px] uppercase tracking-wider text-teal-200 font-semibold mt-0.5">
                Điểm số ({mastery}%)
              </div>
            </div>
          </div>
        </div>

        {/* 80% Benchmark Status Banner */}
        <div className="mt-6 pt-5 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            {isPassed ? (
              <div className="flex items-center space-x-2 text-emerald-300 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>Chúc mừng! Bạn đã đạt chuẩn thành thạo (≥ 80%) và mở khóa bài học kế tiếp.</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2 text-amber-300 font-medium text-sm">
                <span>Bạn đạt {mastery}%. Cần đạt ít nhất 80% để mở khóa bài học tiếp theo. Hãy xem lại lời giải chi tiết và luyện tập lại nhé!</span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportDocx}
              disabled={isExportingDocx}
              className="flex items-center space-x-1.5 px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-400/40 rounded-xl text-xs font-bold transition"
              title="Xuất bài thi và lời giải ra Microsoft Word"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Xuất Lời Giải (.docx)</span>
            </button>
            <button
              onClick={handleRetake}
              className="flex items-center space-x-1.5 px-4 py-2 bg-white/15 hover:bg-white/25 text-white rounded-xl text-xs font-bold transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Luyện lại</span>
            </button>
            <button
              onClick={() => setActiveTab('lessons')}
              className="flex items-center space-x-1.5 px-4 py-2 bg-teal-500 hover:bg-teal-400 text-teal-950 rounded-xl text-xs font-bold transition shadow"
            >
              <span>Xem danh sách bài</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* AI Diagnostic Tutor Misconception Card */}
      {diagnosticResult && (
        <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-lg border border-indigo-800/80 space-y-4 animate-fadeIn">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/60 flex items-center justify-center border border-indigo-400/40 shadow">
              <Bot className="w-6 h-6 text-indigo-200" />
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-300">
                Trợ Lý Chẩn Đoán AI Socratic
              </div>
              <h3 className="text-lg font-black text-white">
                Phân Tích Lỗ Hổng Kiến Thức &amp; Bẫy Tư Duy
              </h3>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-indigo-100 leading-relaxed">
            {diagnosticResult.overallAssessment}
          </p>

          {/* Identified Misconceptions */}
          {diagnosticResult.identifiedMisconceptions.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Các bẫy toán học bạn cần lưu ý:</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {diagnosticResult.identifiedMisconceptions.map((m, idx) => (
                  <div key={idx} className="p-4 bg-indigo-900/60 border border-indigo-700/60 rounded-2xl space-y-2 text-xs">
                    <div className="font-bold text-amber-300">{m.title}</div>
                    <p className="text-indigo-200 text-[11px]">{m.description}</p>
                    <div className="p-2.5 bg-slate-900/80 rounded-xl border border-indigo-600/40 text-emerald-300 font-mono text-[11px]">
                      💡 <strong>Mẹo khắc phục:</strong> {m.recoveryTip}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4 Question Types Score Matrix */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase">Trắc nghiệm</div>
          <div className="text-xl font-bold font-mono text-teal-800 mt-1">
            {activeAttempt.mcqScore} đ
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase">Đúng / Sai</div>
          <div className="text-xl font-bold font-mono text-blue-800 mt-1">
            {activeAttempt.tfScore} đ
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase">Trả lời ngắn</div>
          <div className="text-xl font-bold font-mono text-purple-800 mt-1">
            {activeAttempt.saScore} đ
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase">Tự luận</div>
          <div className="text-xl font-bold font-mono text-rose-800 mt-1">
            {activeAttempt.essayScore} đ
          </div>
        </div>
      </div>

      {/* Question by Question Detailed Review */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-teal-700" />
            Chi tiết từng câu & Lời giải chuẩn
          </h2>
          <span className="text-xs text-slate-500">
            {activeQuestions.length} câu hỏi
          </span>
        </div>

        <div className="space-y-6">
          {activeQuestions.map((q, idx) => {
            const userAns = activeAttempt.answers?.[q.id];
            const { earnedPoints, isCorrect, partialDetail } = gradeSingleQuestion(q, userAns);
            const isExpanded = !!expandedSolutions[q.id];
            const similarQ = similarQuestions[q.id];

            return (
              <div
                key={q.id}
                id={`review-q-${q.id}`}
                className={`border rounded-2xl overflow-hidden transition ${
                  isCorrect
                    ? 'border-emerald-200 bg-emerald-50/10'
                    : earnedPoints > 0
                    ? 'border-amber-200 bg-amber-50/10'
                    : 'border-rose-200 bg-rose-50/10'
                }`}
              >
                {/* Header */}
                <div className="p-4 sm:p-5 flex items-start justify-between gap-4 border-b border-slate-100 bg-white">
                  <div className="flex items-center space-x-2.5">
                    <span
                      className={`w-7 h-7 rounded-xl font-bold text-xs flex items-center justify-center ${
                        isCorrect
                          ? 'bg-emerald-600 text-white'
                          : earnedPoints > 0
                          ? 'bg-amber-500 text-white'
                          : 'bg-rose-600 text-white'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <div>
                      <div className="text-xs font-bold text-slate-800">
                        {q.type === 'mcq'
                          ? 'Trắc nghiệm'
                          : q.type === 'true_false'
                          ? 'Đúng / Sai'
                          : q.type === 'short_answer'
                          ? 'Trả lời ngắn'
                          : 'Tự luận'}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {partialDetail || (isCorrect ? 'Đúng hoàn toàn' : 'Chưa chính xác')}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span className="font-mono font-bold text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800">
                      +{earnedPoints}/{q.points || 1.0} đ
                    </span>
                    <button
                      onClick={() => toggleSolution(q.id)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Question Stem */}
                <div className="p-5 text-sm text-slate-800 bg-white">
                  <MathContent content={q.stem} />
                </div>

                {/* User Answer vs Key Review */}
                <div className="px-5 pb-4 space-y-3 text-xs bg-white border-t border-slate-50">
                  {q.type === 'mcq' && (
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="text-slate-500">Bạn chọn:</span>
                        <strong className={isCorrect ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'}>
                          {userAns?.selectedOption || 'Chưa làm'}
                        </strong>
                        <span className="text-slate-500">• Đáp án đúng:</span>
                        <strong className="text-emerald-700 font-bold">{q.correctAnswer}</strong>
                      </div>
                      {q.options && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-100">
                          {q.options.map((opt) => {
                            const isChosen = userAns?.selectedOption === opt.id;
                            const isOptCorrect = q.correctAnswer === opt.id;
                            return (
                              <div
                                key={opt.id}
                                className={`p-2.5 rounded-xl border text-xs flex items-start space-x-2 ${
                                  isOptCorrect
                                    ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-medium'
                                    : isChosen
                                    ? 'bg-rose-50 border-rose-300 text-rose-950'
                                    : 'bg-slate-50 border-slate-200 text-slate-700'
                                }`}
                              >
                                <span className="font-bold flex-shrink-0">{opt.id}.</span>
                                <div className="flex-1">
                                  <MathContent content={opt.text} inline />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {q.type === 'true_false' && q.statements && (
                    <div className="space-y-2 mt-2">
                      <div className="text-[11px] font-semibold text-slate-600">Đánh giá từng khẳng định:</div>
                      <div className="space-y-2">
                        {q.statements.map((st) => {
                          const userVal = userAns?.tfAnswers?.[st.id];
                          const stCorrect = userVal === st.isCorrect;
                          return (
                            <div
                              key={st.id}
                              className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs ${
                                stCorrect
                                  ? 'bg-emerald-50/50 border-emerald-200'
                                  : 'bg-rose-50/50 border-rose-200'
                              }`}
                            >
                              <div className="flex items-start space-x-2 flex-1">
                                <span className="font-bold text-teal-900 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                                  {st.id})
                                </span>
                                <div className="flex-1 text-slate-800">
                                  <MathContent content={st.statement} />
                                </div>
                              </div>
                              <div className="flex items-center space-x-2 flex-shrink-0 text-[11px]">
                                <span className="text-slate-500">Bạn chọn:</span>
                                <span className={userVal === true ? 'text-emerald-700 font-bold' : userVal === false ? 'text-rose-700 font-bold' : 'text-slate-400'}>
                                  {userVal === true ? 'Đúng' : userVal === false ? 'Sai' : 'Chưa chọn'}
                                </span>
                                <span className="text-slate-400">|</span>
                                <span className="text-slate-500">Khóa:</span>
                                <span className="font-bold text-emerald-800">{st.isCorrect ? 'Đúng' : 'Sai'}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {q.type === 'short_answer' && (
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-slate-500">Bạn đã nhập:</span>
                      <strong className={isCorrect ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'}>
                        {userAns?.shortAnswerText || 'Trống'}
                      </strong>
                      <span className="text-slate-500">• Đáp án chấp nhận:</span>
                      <strong className="text-emerald-700">{q.shortAnswerKey?.acceptedValues.join(' ; ')}</strong>
                    </div>
                  )}
                </div>

                {/* Collapsible Detailed Solution */}
                {isExpanded && (
                  <div className="p-5 border-t border-slate-100 bg-slate-50/80 space-y-4 text-xs">
                    <div className="font-bold text-teal-900 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-teal-600" />
                      <span>Hướng dẫn giải chi tiết:</span>
                    </div>
                    <div className="p-4 bg-white rounded-xl border border-slate-200 text-slate-700 leading-relaxed">
                      <MathContent content={q.solution || 'Chưa cập nhật lời giải.'} />
                    </div>

                    {/* AI Similar Question Generator */}
                    <div className="pt-2 flex items-center justify-between">
                      <button
                        onClick={() => handleGenerateSimilar(q)}
                        disabled={generatingSimilarId === q.id}
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-lg text-xs font-semibold transition"
                      >
                        <Bot className="w-3.5 h-3.5 text-teal-600" />
                        <span>{generatingSimilarId === q.id ? 'Đang tạo...' : 'Luyện câu tương tự bằng AI'}</span>
                      </button>
                    </div>

                    {similarQ && (
                      <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl space-y-2 mt-2">
                        <div className="font-bold text-teal-950">Câu hỏi tương tự AI đã tạo:</div>
                        <MathContent content={similarQ.stem || ''} />
                        <div className="font-semibold text-teal-800">Đáp án: {similarQ.correctAnswer}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
