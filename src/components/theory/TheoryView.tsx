import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { MathContent } from '../common/MathContent';
import { api } from '../../services/api';
import { TheorySection, TheoryExample, MiniQuizItem } from '../../types';
import { InteractiveGraphPlotter } from '../common/InteractiveGraphPlotter';
import { Oxyz3DExplorer } from '../common/Oxyz3DExplorer';
import { downloadLessonPptx } from '../../services/pptxExporter';
import {
  Sparkles,
  BookOpen,
  HelpCircle,
  Play,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  XCircle,
  Bot,
  Send,
  Loader2,
  Bookmark,
  FilePresentation,
  TrendingUp,
  Compass,
  Download,
  FileText,
} from 'lucide-react';

export const TheoryView: React.FC = () => {
  const {
    lessons,
    chapters,
    selectedLessonId,
    setSelectedLessonId,
    setActiveTab,
    setActiveAttempt,
    setActiveQuestions,
    currentUser,
    showToast,
  } = useApp();

  const [theorySection, setTheorySection] = useState<TheorySection | null>(null);
  const [examples, setExamples] = useState<TheoryExample[]>([]);
  const [miniQuiz, setMiniQuiz] = useState<MiniQuizItem[]>([]);
  const [expandedExampleIds, setExpandedExampleIds] = useState<Record<string, boolean>>({
    'ex-1-1': true,
    'ex-1-2': true,
  });

  // View sub-mode
  const [viewMode, setViewMode] = useState<'theory' | 'graph2d' | 'oxyz3d'>('theory');

  // Mini quiz student selections & state
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  // AI Socratic Drawer state
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isExportingPptx, setIsExportingPptx] = useState(false);

  const currentLesson = lessons.find((l) => l.id === selectedLessonId) || lessons[0];
  const currentChapter = chapters.find((c) => c.id === currentLesson?.chapterId) || chapters[0];

  useEffect(() => {
    const fetchTheory = async () => {
      try {
        const data = await api.getTheory(selectedLessonId);
        setTheorySection(data.section);
        setExamples(data.examples || []);
        setMiniQuiz(data.miniQuiz || []);
        setQuizAnswers({});
        setQuizSubmitted(false);
      } catch (err) {
        console.error('Error fetching theory:', err);
      }
    };

    fetchTheory();
  }, [selectedLessonId]);

  const toggleExample = (id: string) => {
    setExpandedExampleIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleStartExam = async () => {
    try {
      showToast('Đang khởi tạo bài luyện tập...', 'Đang nạp bộ câu hỏi bài học...', 'info');
      const { attempt, questions } = await api.startAttempt(selectedLessonId, currentUser.id);
      setActiveAttempt(attempt);
      setActiveQuestions(questions);
      setActiveTab('exam');
    } catch (err) {
      console.error('Error starting attempt:', err);
      showToast('Lỗi', 'Không thể khởi tạo bài luyện tập', 'error');
    }
  };

  const handleExportPptx = async () => {
    if (!theorySection) return;
    setIsExportingPptx(true);
    try {
      showToast('Đang tạo bài giảng PowerPoint...', 'Đang đóng gói slide thuyết trình PPTX...', 'info');
      await downloadLessonPptx({
        lessonTitle: `Bài ${currentLesson.number}: ${currentLesson.title}`,
        chapterTitle: currentChapter.title,
        teacherName: 'Thầy Phan Quốc Cường',
        section: theorySection,
        examples,
        miniQuiz,
      });
      showToast('Tải về thành công!', 'File slide bài giảng PPTX đã sẵn sàng.', 'success');
    } catch (err: any) {
      console.error('PPTX export error:', err);
      showToast('Lỗi xuất PowerPoint', err?.message || 'Không thể tạo file PPTX.', 'error');
    } finally {
      setIsExportingPptx(false);
    }
  };

  const handleAskAi = async (customPrompt?: string) => {
    const promptToAsk = customPrompt || aiQuestion;
    if (!promptToAsk.trim()) return;

    setIsAiLoading(true);
    setIsAiOpen(true);
    try {
      const resp = await api.explainConcept(promptToAsk, currentLesson?.title || '');
      setAiResponse(resp);
    } catch (err: any) {
      console.error('AI concept explanation error:', err);
      setAiResponse(`⚠️ **Đã dừng do lỗi**: ${err?.message || '429 RESOURCE_EXHAUSTED'}\n\nVui lòng kiểm tra lại API Key trên Header hoặc đổi sang model khác.`);
      showToast('Đã dừng do lỗi', err?.message || 'Lỗi kết nối Gemini API.', 'error');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleQuizAnswer = (quizId: string, answer: string) => {
    if (quizSubmitted) return;
    setQuizAnswers((prev) => ({
      ...prev,
      [quizId]: answer,
    }));
  };

  return (
    <div id="theory-view-container" className="max-w-7xl mx-auto space-y-6 pb-20 animate-fadeIn">
      {/* Top Header & Lesson Selector Toolbar */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-teal-800 text-xs font-bold uppercase tracking-wider mb-1">
            <BookOpen className="w-4 h-4 text-teal-600" />
            <span>Chương trình Toán 12 GDPT 2018</span>
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
            Bài {currentLesson.number}: {currentLesson.title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {currentChapter.title} • Thời lượng: {currentLesson.durationMinutes || 45} phút
          </p>
        </div>

        {/* Action Buttons: Lesson Switcher & Slide Export */}
        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={selectedLessonId}
            onChange={(e) => setSelectedLessonId(e.target.value)}
            className="p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            {lessons.map((l) => (
              <option key={l.id} value={l.id}>
                Bài {l.number}: {l.title}
              </option>
            ))}
          </select>

          {/* Export PPTX Button */}
          <button
            onClick={handleExportPptx}
            disabled={isExportingPptx}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-sm active:scale-95 flex-shrink-0"
            title="Tải slide bài giảng PowerPoint (.pptx)"
          >
            {isExportingPptx ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            <span>Tạo Slide PPTX</span>
          </button>

          <button
            onClick={handleStartExam}
            className="px-5 py-2.5 bg-gradient-to-r from-teal-700 to-teal-800 hover:from-teal-800 hover:to-teal-900 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-md active:scale-95 flex-shrink-0"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Luyện tập bài này</span>
          </button>
        </div>
      </div>

      {/* Mode Switcher Tabs: Core Theory vs 2D Plotter vs 3D Oxyz */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-3 overflow-x-auto text-xs font-bold">
        <button
          onClick={() => setViewMode('theory')}
          className={`px-4 py-2 rounded-xl transition flex items-center space-x-2 ${
            viewMode === 'theory'
              ? 'bg-teal-700 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Lý thuyết &amp; Ví dụ mẫu</span>
        </button>

        <button
          onClick={() => setViewMode('graph2d')}
          className={`px-4 py-2 rounded-xl transition flex items-center space-x-2 ${
            viewMode === 'graph2d'
              ? 'bg-teal-700 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <TrendingUp className="w-4 h-4 text-teal-400" />
          <span>Phòng Thí Nghiệm Đồ Thị 2D (Tham số m)</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </button>

        <button
          onClick={() => setViewMode('oxyz3d')}
          className={`px-4 py-2 rounded-xl transition flex items-center space-x-2 ${
            viewMode === 'oxyz3d'
              ? 'bg-teal-700 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Compass className="w-4 h-4 text-blue-400" />
          <span>Khám Phá Không Gian 3D Oxyz</span>
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
        </button>
      </div>

      {/* ------------------------------------------------------------------------- */}
      {/* MODE 1: CORE THEORY & WORKED EXAMPLES */}
      {/* ------------------------------------------------------------------------- */}
      {viewMode === 'theory' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main 8 Cols: Theory Body, Formulas, Examples */}
          <div className="lg:col-span-8 space-y-6">
            {/* Section 1: Summary & Core Content */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
              <div className="flex items-center space-x-2 text-teal-800 text-xs font-bold uppercase tracking-wider">
                <Bookmark className="w-4 h-4 text-teal-600" />
                <span>I. Tóm tắt kiến thức trọng tâm</span>
              </div>
              <h3 className="text-xl font-black text-slate-900">
                {theorySection?.title || 'Kiến thức cốt lõi'}
              </h3>

              {theorySection?.summary && (
                <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-2xl text-xs text-teal-950 font-medium leading-relaxed">
                  {theorySection.summary}
                </div>
              )}

              {/* Rich LaTeX Math Content */}
              <div className="text-slate-800 text-sm leading-relaxed pt-2">
                <MathContent content={theorySection?.contentLatex || ''} />
              </div>
            </div>

            {/* Section 2: Core Formulas Cards */}
            {theorySection?.formulas && theorySection.formulas.length > 0 && (
              <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
                <div className="flex items-center space-x-2 text-teal-800 text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-teal-600" />
                  <span>II. Hệ thống công thức &amp; Định lý cốt lõi</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {theorySection.formulas.map((f, idx) => (
                    <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                      <div className="font-bold text-xs text-teal-950">{f.title}</div>
                      <div className="bg-white p-3 rounded-xl border border-slate-200 text-center font-mono text-xs overflow-x-auto">
                        <MathContent content={`$$${f.latex}$$`} />
                      </div>
                      {f.note && <div className="text-[11px] text-slate-500 italic">{f.note}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Section 3: Worked Examples with Accordion Steps */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
              <div className="flex items-center space-x-2 text-teal-800 text-xs font-bold uppercase tracking-wider">
                <Lightbulb className="w-4 h-4 text-teal-600" />
                <span>III. Các dạng bài tập &amp; Ví dụ mẫu tiêu biểu</span>
              </div>

              <div className="space-y-4">
                {examples.map((ex) => {
                  const isExpanded = expandedExampleIds[ex.id];
                  return (
                    <div key={ex.id} className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                      <div
                        onClick={() => toggleExample(ex.id)}
                        className="p-4 bg-slate-50 hover:bg-slate-100/80 cursor-pointer flex items-center justify-between transition"
                      >
                        <div className="flex items-center space-x-2.5">
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                            ex.difficulty === 'NB' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                            ex.difficulty === 'TH' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                            ex.difficulty === 'VD' ? 'bg-amber-100 text-amber-800 border-amber-300' :
                            'bg-rose-100 text-rose-800 border-rose-300'
                          }`}>
                            {ex.difficulty === 'NB' ? 'Nhận biết' : ex.difficulty === 'TH' ? 'Thông hiểu' : ex.difficulty === 'VD' ? 'Vận dụng' : 'VDC'}
                          </span>
                          <span className="font-bold text-xs sm:text-sm text-slate-900">{ex.title}</span>
                        </div>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                      </div>

                      {isExpanded && (
                        <div className="p-5 bg-white space-y-4 text-xs">
                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                            <strong className="text-slate-900 block mb-1">Đề bài:</strong>
                            <MathContent content={ex.stemLatex} />
                          </div>

                          <div className="space-y-3">
                            <strong className="text-teal-900 text-xs uppercase tracking-wider block">
                              Các bước giải chi tiết:
                            </strong>
                            {ex.solutionSteps.map((step) => (
                              <div key={step.step} className="p-3 bg-teal-50/40 rounded-xl border border-teal-200 space-y-1.5">
                                <div className="font-bold text-teal-950 flex items-center gap-1.5">
                                  <span className="w-5 h-5 rounded-full bg-teal-700 text-white flex items-center justify-center text-[10px]">
                                    {step.step}
                                  </span>
                                  <span>{step.title}</span>
                                </div>
                                <div className="text-slate-800 pl-6">
                                  <MathContent content={step.latex} />
                                </div>
                                {step.explanation && (
                                  <div className="text-[11px] text-slate-500 italic pl-6">
                                    💡 {step.explanation}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right 4 Cols: AI Socratic Tutor & Mini Quiz */}
          <div className="lg:col-span-4 space-y-6">
            {/* AI Socratic Assistant Card */}
            <div className="bg-gradient-to-br from-teal-900 via-teal-800 to-teal-950 text-white rounded-3xl p-6 shadow-xl border border-teal-700/80 space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-teal-600/60 flex items-center justify-center border border-teal-400/40">
                  <Bot className="w-5 h-5 text-teal-200" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">Trợ Lý Socratic Toán 12</h4>
                  <p className="text-[11px] text-teal-300">Giải đáp thắc mắc khái niệm &amp; bẫy toán học</p>
                </div>
              </div>

              <div className="space-y-2">
                <input
                  type="text"
                  value={aiQuestion}
                  onChange={(e) => setAiQuestion(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAskAi()}
                  placeholder="Ví dụ: Khi nào hàm số có tiệm cận xiên?..."
                  className="w-full p-3 bg-teal-950/80 border border-teal-600/80 rounded-2xl text-xs text-white placeholder-teal-400/60 focus:ring-2 focus:ring-teal-400 focus:outline-none"
                />
                <button
                  onClick={() => handleAskAi()}
                  disabled={isAiLoading}
                  className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-teal-950 font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow"
                >
                  {isAiLoading ? <Loader2 className="w-4 h-4 animate-spin text-teal-950" /> : <Send className="w-3.5 h-3.5" />}
                  <span>Hỏi Trợ Lý AI</span>
                </button>
              </div>

              {aiResponse && (
                <div className="p-4 bg-teal-950/90 border border-teal-600/80 rounded-2xl text-xs text-teal-100 space-y-2 animate-fadeIn max-h-60 overflow-y-auto">
                  <div className="font-bold text-teal-300 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> Giải đáp của AI:
                  </div>
                  <MathContent content={aiResponse} />
                </div>
              )}
            </div>

            {/* Quick Practice CTA */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center mx-auto">
                <Play className="w-6 h-6 fill-teal-700" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Sẵn sàng kiểm tra năng lực?</h4>
              <p className="text-xs text-slate-500">
                Đạt $\ge 80\%$ điểm bài luyện tập để mở khóa bài học kế tiếp.
              </p>
              <button
                onClick={handleStartExam}
                className="w-full py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl text-xs transition shadow"
              >
                Bắt đầu làm bài thi ngay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------------- */}
      {/* MODE 2: 2D FUNCTION GRAPH PLOTTER */}
      {/* ------------------------------------------------------------------------- */}
      {viewMode === 'graph2d' && <InteractiveGraphPlotter />}

      {/* ------------------------------------------------------------------------- */}
      {/* MODE 3: 3D OXYZ EXPLORER */}
      {/* ------------------------------------------------------------------------- */}
      {viewMode === 'oxyz3d' && <Oxyz3DExplorer />}
    </div>
  );
};
