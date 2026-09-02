import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Question,
  QuestionType,
  DifficultyLevel,
  Option,
  TrueFalseStatement,
  DocxParseReport,
} from '../../types';
import {
  convertQuestionsToSourceText,
  parseSourceTextToQuestions,
  ExamDictionaries,
  detokenizeInternalSource,
} from '../../utils/docxSourceFormat';
import { MathContent, MathText } from '../MathText';
import { VisualMathEditorModal } from '../common/VisualMathEditorModal';
import { VisualRichMathEditor } from '../common/VisualRichMathEditor';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Save,
  Eye,
  Edit3,
  Trash2,
  Copy,
  Plus,
  ArrowRight,
  ArrowLeft,
  Search,
  RotateCcw,
  RotateCw,
  Upload,
  Layers,
  Settings,
  HelpCircle,
  X,
  Volume2,
  Check,
  Calculator,
  Sliders,
  Maximize2,
  Minimize2,
  ExternalLink,
  ChevronDown,
  Loader2,
} from 'lucide-react';

export interface TwoPaneDocxEditorProps {
  initialQuestions: Question[];
  report?: DocxParseReport;
  lessonId: string;
  chapterId?: string;
  onSaveToBank: (questions: Question[]) => Promise<void> | void;
  onReuploadClick?: () => void;
}

export interface ValidationErrorItem {
  questionIndex: number;
  questionNumber: number;
  type: 'error' | 'warning';
  message: string;
}

export const TwoPaneDocxEditor: React.FC<TwoPaneDocxEditorProps> = ({
  initialQuestions,
  report,
  lessonId,
  chapterId = 'chap-1',
  onSaveToBank,
  onReuploadClick,
}) => {
  // 1. Core State: Dictionaries & Source Text
  const [dictionaries, setDictionaries] = useState<ExamDictionaries>(() => {
    const { dictionaries } = convertQuestionsToSourceText(initialQuestions);
    return dictionaries;
  });

  const [sourceText, setSourceText] = useState<string>(() => {
    const { sourceText } = convertQuestionsToSourceText(initialQuestions);
    return sourceText;
  });

  // Undo / Redo history stack
  const [history, setHistory] = useState<string[]>([sourceText]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  // Parsed Questions representing Left Visual Preview
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);

  // Active Selected Question Index for Synchronized Scrolling
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState<number>(0);

  // Search in Right Pane
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals & States
  const [isFormulaModalOpen, setIsFormulaModalOpen] = useState<boolean>(false);
  const [activeEditingMathId, setActiveEditingMathId] = useState<string | null>(null);
  const [isStudentViewOpen, setIsStudentViewOpen] = useState<boolean>(false);
  const [isValidationModalOpen, setIsValidationModalOpen] = useState<boolean>(false);
  const [isPointsModalOpen, setIsPointsModalOpen] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveToastMessage, setSaveToastMessage] = useState<string | null>(null);

  // Exam Meta
  const [examTitle, setExamTitle] = useState<string>(
    report?.fileName?.replace(/\.docx$/i, '') || 'Đề Kiểm Tra Toán 12'
  );
  const [examDuration, setExamDuration] = useState<number>(45);

  // Refs for scrolling synchronization
  const leftCardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const rightTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 2. Debounced Source Text Sync -> Left Preview
  const handleSourceChange = (newText: string, recordHistory: boolean = true) => {
    setSourceText(newText);

    if (recordHistory) {
      const nextHistory = history.slice(0, historyIndex + 1);
      nextHistory.push(newText);
      setHistory(nextHistory);
      setHistoryIndex(nextHistory.length - 1);
    }

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      try {
        const parsed = parseSourceTextToQuestions(newText, dictionaries, lessonId, chapterId);
        if (parsed.length > 0) {
          setQuestions(parsed);
        }
      } catch (err) {
        console.error('Lỗi khi đồng bộ nguồn:', err);
      }
    }, 350);
  };

  // Undo / Redo Handlers
  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIdx = historyIndex - 1;
      setHistoryIndex(newIdx);
      handleSourceChange(history[newIdx], false);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIdx = historyIndex + 1;
      setHistoryIndex(newIdx);
      handleSourceChange(history[newIdx], false);
    }
  };

  // 3. Sync from Left Card Edits -> Right Source Text
  const updateQuestionsAndSyncSource = useCallback(
    (newQuestions: Question[]) => {
      setQuestions(newQuestions);
      const { sourceText: newSource, dictionaries: newDict } = convertQuestionsToSourceText(newQuestions);
      setDictionaries(newDict);
      setSourceText(newSource);

      const nextHistory = history.slice(0, historyIndex + 1);
      nextHistory.push(newSource);
      setHistory(nextHistory);
      setHistoryIndex(nextHistory.length - 1);
    },
    [history, historyIndex]
  );

  // Left Card: Select MCQ Option
  const handleSelectCorrectOption = (qIdx: number, optionId: string) => {
    const updated = questions.map((q, idx) => (idx === qIdx ? { ...q, correctAnswer: optionId } : q));
    updateQuestionsAndSyncSource(updated);
  };

  // Left Card: Toggle True/False Statement
  const handleToggleTrueFalse = (qIdx: number, statementId: string) => {
    const updated = questions.map((q, idx) => {
      if (idx === qIdx && q.statements) {
        const nextStatements = q.statements.map((st) =>
          st.id === statementId ? { ...st, isCorrect: !st.isCorrect } : st
        );
        return { ...q, statements: nextStatements };
      }
      return q;
    });
    updateQuestionsAndSyncSource(updated);
  };

  // Left Card: Update Points
  const handleUpdatePoints = (qIdx: number, points: number) => {
    const updated = questions.map((q, idx) => (idx === qIdx ? { ...q, points } : q));
    updateQuestionsAndSyncSource(updated);
  };

  // Left Card: Delete Question
  const handleDeleteQuestion = (qIdx: number) => {
    if (questions.length <= 1) {
      alert('Đề thi phải có tối thiểu 1 câu hỏi.');
      return;
    }
    const updated = questions.filter((_, idx) => idx !== qIdx);
    updateQuestionsAndSyncSource(updated);
  };

  // Left Card: Duplicate Question
  const handleDuplicateQuestion = (qIdx: number) => {
    const target = questions[qIdx];
    const duplicated: Question = {
      ...target,
      id: `q-dup-${Date.now()}`,
      order: target.order + 1,
    };
    const nextQuestions = [...questions];
    nextQuestions.splice(qIdx + 1, 0, duplicated);
    updateQuestionsAndSyncSource(nextQuestions);
  };

  // Open MathLive for specific formula
  const handleOpenFormulaEditor = (mathId?: string) => {
    setActiveEditingMathId(mathId || null);
    setIsFormulaModalOpen(true);
  };

  const handleSaveFormulaModal = (latex: string) => {
    let clean = latex.trim();
    if (clean.startsWith('$$') && clean.endsWith('$$')) clean = clean.slice(2, -2).trim();
    if (clean.startsWith('$') && clean.endsWith('$')) clean = clean.slice(1, -1).trim();

    if (activeEditingMathId && dictionaries.mathMap[activeEditingMathId]) {
      // Update existing math token
      const nextDict = {
        ...dictionaries,
        mathMap: { ...dictionaries.mathMap, [activeEditingMathId]: clean },
      };
      setDictionaries(nextDict);
      // Re-parse with updated dictionary
      const parsed = parseSourceTextToQuestions(sourceText, nextDict, lessonId, chapterId);
      setQuestions(parsed);
    } else {
      // Insert new math token at end of source text or active cursor
      const nextMathId = `math_${Date.now()}`;
      const nextDict = {
        ...dictionaries,
        mathMap: { ...dictionaries.mathMap, [nextMathId]: clean },
      };
      setDictionaries(nextDict);
      handleSourceChange(sourceText + ` [math:${nextMathId}]`);
    }

    setIsFormulaModalOpen(false);
    setActiveEditingMathId(null);
  };

  // Points Distributor Logic (Equalize points e.g. total 10 points)
  const handleDistributeEqualPoints = (totalTargetScore: number = 10) => {
    if (questions.length === 0) return;
    const pointPerQuestion = Math.round((totalTargetScore / questions.length) * 100) / 100;
    const updated = questions.map((q) => ({ ...q, points: pointPerQuestion }));
    updateQuestionsAndSyncSource(updated);
    setIsPointsModalOpen(false);
  };

  // Validation Logic (Kiểm tra lỗi)
  const validationErrors: ValidationErrorItem[] = useMemo(() => {
    const errors: ValidationErrorItem[] = [];

    questions.forEach((q, idx) => {
      const qNum = idx + 1;
      if (!q.stem || q.stem.trim().length === 0) {
        errors.push({
          questionIndex: idx,
          questionNumber: qNum,
          type: 'error',
          message: `Câu ${qNum} chưa có nội dung đề bài.`,
        });
      }

      if (q.type === 'mcq') {
        if (!q.options || q.options.length < 4) {
          errors.push({
            questionIndex: idx,
            questionNumber: qNum,
            type: 'error',
            message: `Câu ${qNum} (Trắc nghiệm) chưa đủ 4 phương án A, B, C, D.`,
          });
        }
        if (!q.correctAnswer) {
          errors.push({
            questionIndex: idx,
            questionNumber: qNum,
            type: 'warning',
            message: `Câu ${qNum} chưa chọn đáp án đúng.`,
          });
        }
      }

      if (q.type === 'true_false') {
        if (!q.statements || q.statements.length < 4) {
          errors.push({
            questionIndex: idx,
            questionNumber: qNum,
            type: 'warning',
            message: `Câu ${qNum} (Đúng/Sai) nên có đủ 4 mệnh đề a, b, c, d.`,
          });
        }
      }

      if (q.points <= 0) {
        errors.push({
          questionIndex: idx,
          questionNumber: qNum,
          type: 'warning',
          message: `Câu ${qNum} có số điểm bằng 0.`,
        });
      }
    });

    return errors;
  }, [questions]);

  // Jump to Question
  const handleJumpToQuestion = (qIdx: number) => {
    setSelectedQuestionIndex(qIdx);
    leftCardsRef.current[qIdx]?.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Find approximate line in textarea
    if (rightTextareaRef.current) {
      const qPattern = new RegExp(`Câu\\s*${qIdx + 1}[\\s.:\\-–]`, 'i');
      const match = qPattern.exec(sourceText);
      if (match && match.index !== undefined) {
        rightTextareaRef.current.focus();
        rightTextareaRef.current.setSelectionRange(match.index, match.index + match[0].length);
      }
    }
  };

  // Publish / Save to Bank
  const handlePublishExam = async () => {
    if (validationErrors.some((e) => e.type === 'error')) {
      setIsValidationModalOpen(true);
      return;
    }

    setIsSaving(true);
    try {
      await onSaveToBank(questions);
      setSaveToastMessage(`Đã xuất bản thành công ${questions.length} câu hỏi vào ngân hàng!`);
      setTimeout(() => setSaveToastMessage(null), 4000);
    } catch (err: any) {
      alert(`Lỗi khi xuất bản: ${err.message || 'Vui lòng thử lại.'}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate Line Numbers for Source Textarea
  const sourceLineCount = useMemo(() => sourceText.split('\n').length, [sourceText]);

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] min-h-[600px] bg-slate-100 rounded-3xl overflow-hidden border border-slate-300 shadow-xl relative">
      {/* 🌟 1. STICKY TOP TOOLBAR */}
      <div className="bg-white border-b border-slate-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 shadow-xs z-20">
        {/* Left Toolbar Group: Metadata & Question Jump */}
        <div className="flex items-center space-x-2">
          {/* Exam Title & Type Badge */}
          <div className="flex items-center space-x-2">
            <span className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
              ∑
            </span>
            <div>
              <div className="flex items-center space-x-1.5">
                <input
                  type="text"
                  value={examTitle}
                  onChange={(e) => setExamTitle(e.target.value)}
                  className="font-black text-sm text-slate-900 bg-transparent hover:bg-slate-100 px-1.5 py-0.5 rounded-lg border-b border-transparent focus:border-teal-500 focus:outline-none transition max-w-[240px] truncate"
                  title="Bấm để đổi tên đề thi"
                />
                <span className="text-[10px] bg-teal-100 text-teal-800 font-bold px-2 py-0.5 rounded-full border border-teal-200">
                  {questions.length} câu
                </span>
              </div>
            </div>
          </div>

          {/* Jump to Question Dropdown */}
          <div className="hidden sm:flex items-center space-x-1 pl-2 border-l border-slate-200">
            <span className="text-xs text-slate-500 font-semibold">Đi đến:</span>
            <select
              value={selectedQuestionIndex}
              onChange={(e) => handleJumpToQuestion(parseInt(e.target.value))}
              className="bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-800 rounded-xl px-2.5 py-1.5 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              {questions.map((_, idx) => (
                <option key={idx} value={idx}>
                  Câu {idx + 1}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Center Toolbar Group: Quick Action Buttons */}
        <div className="flex items-center space-x-1.5">
          {/* Points Distributor Button */}
          <button
            onClick={() => setIsPointsModalOpen(true)}
            className="px-3 py-1.5 bg-slate-100 hover:bg-teal-50 text-slate-700 hover:text-teal-900 border border-slate-200 rounded-xl text-xs font-bold transition flex items-center space-x-1"
            title="Tự động chia đều điểm cho các câu hỏi (Tổng 10 điểm)"
          >
            <Calculator className="w-3.5 h-3.5 text-teal-600" />
            <span className="hidden md:inline">Chia điểm</span>
          </button>

          {/* MathLive Formula Modal Button */}
          <button
            onClick={() => handleOpenFormulaEditor()}
            className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200 rounded-xl text-xs font-black transition flex items-center space-x-1 shadow-2xs"
            title="Mở bảng soạn thảo công thức trực quan 5 tab (MathLive)"
          >
            <span className="text-sm font-black">∑</span>
            <span>Chèn công thức</span>
          </button>

          {/* Error Validator Button */}
          <button
            onClick={() => setIsValidationModalOpen(true)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center space-x-1.5 ${
              validationErrors.some((e) => e.type === 'error')
                ? 'bg-rose-50 hover:bg-rose-100 text-rose-800 border-rose-300 animate-pulse'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
            }`}
          >
            {validationErrors.length > 0 ? (
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            )}
            <span>Kiểm tra lỗi ({validationErrors.length})</span>
          </button>

          {/* Re-upload button if available */}
          {onReuploadClick && (
            <button
              onClick={onReuploadClick}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition flex items-center space-x-1"
              title="Tải lại file Word khác"
            >
              <Upload className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden lg:inline">Upload lại</span>
            </button>
          )}
        </div>

        {/* Right Toolbar Group: Student View & Publish Buttons */}
        <div className="flex items-center space-x-2">
          {/* Fullscreen Student Preview Modal Button */}
          <button
            onClick={() => setIsStudentViewOpen(true)}
            className="px-4 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 rounded-xl text-xs font-bold transition flex items-center space-x-1.5"
            title="Xem toàn bộ đề thi dưới góc nhìn học sinh làm bài"
          >
            <Eye className="w-3.5 h-3.5 text-indigo-600" />
            <span>Xem như học sinh</span>
          </button>

          {/* Final Publish Button */}
          <button
            onClick={handlePublishExam}
            disabled={isSaving}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-black rounded-xl transition flex items-center space-x-1.5 shadow"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Xuất bản ({questions.length} câu)</span>
          </button>
        </div>
      </div>

      {/* Toast notification */}
      {saveToastMessage && (
        <div className="absolute top-16 right-6 z-50 bg-emerald-600 text-white font-bold text-xs px-4 py-2.5 rounded-2xl shadow-xl flex items-center space-x-2 animate-slideDown">
          <Check className="w-4 h-4" />
          <span>{saveToastMessage}</span>
        </div>
      )}

      {/* 🌟 2. MAIN TWO-PANE WORKSPACE */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-300 overflow-hidden">
        {/* 👈 LEFT PANE: VISUAL LIVE PREVIEW (Bản xem trước trực quan) */}
        <div className="flex flex-col h-full bg-slate-50 overflow-hidden">
          {/* Left Header */}
          <div className="px-4 py-2 bg-slate-100/90 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-700">
            <span className="flex items-center gap-1.5 text-teal-900">
              <Eye className="w-4 h-4 text-teal-700" />
              <span>BẢN XEM TRƯỚC TRỰC QUAN (MATHJAX / WYSIWYG)</span>
            </span>
            <span className="text-[11px] text-slate-500">
              * Bấm trực tiếp vào phương án để chọn đáp án đúng
            </span>
          </div>

          {/* Left Cards Scroll Area */}
          <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-5">
            {questions.map((q, idx) => {
              const isSelected = selectedQuestionIndex === idx;
              return (
                <div
                  key={q.id || idx}
                  ref={(el) => (leftCardsRef.current[idx] = el)}
                  onClick={() => setSelectedQuestionIndex(idx)}
                  className={`bg-white rounded-3xl border p-5 transition-all space-y-4 shadow-sm relative ${
                    isSelected
                      ? 'border-teal-500 ring-2 ring-teal-400/40 shadow-md'
                      : 'border-slate-200 hover:border-teal-300'
                  }`}
                >
                  {/* Card Top Header: Question Number, Points, Badges, Action Icons */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2">
                    <div className="flex flex-wrap items-center space-x-2">
                      {/* [Câu X.] Badge */}
                      <span className="border border-blue-400 text-blue-700 bg-white font-bold px-3 py-1 rounded-lg text-xs shadow-2xs">
                        Câu {idx + 1}.
                      </span>

                      {/* [Nhập điểm] */}
                      <div className="flex items-center space-x-1 border border-slate-300 bg-white px-2.5 py-1 rounded-lg text-xs">
                        <span className="text-slate-600 font-semibold">Nhập điểm:</span>
                        <input
                          type="number"
                          step="0.05"
                          min="0.1"
                          max="10"
                          value={q.points || 0.25}
                          onChange={(e) => handleUpdatePoints(idx, parseFloat(e.target.value) || 0.25)}
                          className="w-12 bg-transparent text-xs font-bold text-blue-800 text-center focus:outline-none"
                        />
                      </div>

                      {/* [📎Audio] */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          alert(`Đính kèm Audio cho Câu ${idx + 1}`);
                        }}
                        className="border border-slate-300 bg-white hover:bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-xs font-semibold flex items-center space-x-1 transition"
                      >
                        <Volume2 className="w-3.5 h-3.5 text-blue-600" />
                        <span>Audio</span>
                      </button>

                      {/* [Trắc nghiệm ▾] Type Selector */}
                      <select
                        value={q.type}
                        onChange={(e) => {
                          const newType = e.target.value as QuestionType;
                          const updated = questions.map((item, qIndex) =>
                            qIndex === idx ? { ...item, type: newType } : item
                          );
                          updateQuestionsAndSyncSource(updated);
                        }}
                        className="border border-slate-300 bg-white text-slate-600 px-2.5 py-1 rounded-lg text-xs font-semibold focus:outline-none"
                      >
                        <option value="mcq">Trắc nghiệm</option>
                        <option value="true_false">Đúng / Sai</option>
                        <option value="short_answer">Trả lời ngắn</option>
                        <option value="essay">Tự luận</option>
                      </select>

                      {/* [🏷️] Tag Icon */}
                      <span className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                        <Sliders className="w-3.5 h-3.5 text-blue-600" />
                      </span>

                      {/* [🔄 Đổi câu khác] */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDuplicateQuestion(idx);
                        }}
                        className="text-blue-600 hover:text-blue-800 text-xs font-semibold flex items-center space-x-1 px-1.5 py-1 transition"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                        <span>Đổi câu khác</span>
                      </button>
                    </div>

                    {/* Right Action Icons on Card */}
                    <div className="flex items-center space-x-1 text-slate-400">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteQuestion(idx);
                        }}
                        className="p-1 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Xóa câu này"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Question Stem Box (Bordered rectangular box) */}
                  <div className="p-4 bg-white rounded-xl border border-slate-300 text-slate-900 text-sm leading-relaxed font-sans shadow-2xs">
                    <MathContent content={q.stem} />
                  </div>

                  {/* Attached Media Images if any */}
                  {q.media && q.media.filter((m) => m && m.url && m.url.trim().length > 10).length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-1">
                      {q.media
                        .filter((m) => m && m.url && m.url.trim().length > 10)
                        .map((m, mi) => (
                          <div
                            key={mi}
                            className="p-2 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col items-center"
                          >
                            <img
                              src={m.url}
                              alt=""
                              className="max-h-48 object-contain rounded-xl shadow-2xs"
                              onError={(e) => {
                                const target = e.currentTarget;
                                if (target.parentElement) target.parentElement.style.display = 'none';
                              }}
                            />
                          </div>
                        ))}
                    </div>
                  )}

                  {/* MCQ Options A, B, C, D (Vertical Rows with Letter Box, Formula Box & Checkmark) */}
                  {q.type === 'mcq' && q.options && (
                    <div className="space-y-2.5 pt-1">
                      {q.options.map((opt) => {
                        const isCorrect = q.correctAnswer === opt.id;
                        return (
                          <div
                            key={opt.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectCorrectOption(idx, opt.id);
                            }}
                            className="flex items-center space-x-2.5 cursor-pointer group"
                            title="Bấm để chọn làm đáp án đúng"
                          >
                            {/* Checkmark icon on the left */}
                            <div className="w-5 flex items-center justify-center">
                              {isCorrect ? (
                                <Check className="w-4 h-4 text-blue-600 font-black" strokeWidth={3} />
                              ) : (
                                <span className="w-4 h-4" />
                              )}
                            </div>

                            {/* Square Letter Badge [ A ] */}
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs border transition ${
                                isCorrect
                                  ? 'border-blue-600 text-blue-800 bg-blue-50/60 shadow-2xs'
                                  : 'border-slate-400 text-slate-800 bg-white group-hover:border-blue-400'
                              }`}
                            >
                              {opt.id}
                            </div>

                            {/* Rectangular Formula Box [ (-\infty; 1). ] */}
                            <div
                              className={`px-4 py-1.5 rounded-lg border text-sm font-medium transition-all ${
                                isCorrect
                                  ? 'border-blue-600 text-blue-900 bg-blue-50/40 ring-1 ring-blue-400/30'
                                  : 'border-slate-300 text-slate-900 bg-white group-hover:border-slate-400'
                              }`}
                            >
                              <MathContent content={opt.text} inline />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* True / False Statements a, b, c, d */}
                  {q.type === 'true_false' && q.statements && (
                    <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white">
                      {q.statements.map((st) => (
                        <div
                          key={st.id}
                          className="p-3.5 flex items-center justify-between gap-3 text-xs hover:bg-slate-50 transition"
                        >
                          <div className="flex items-start space-x-2 flex-1">
                            <span className="font-bold text-teal-900 bg-teal-50 px-2 py-0.5 rounded-lg border border-teal-200">
                              {st.id})
                            </span>
                            <div className="text-slate-800 pt-0.5">
                              <MathContent content={st.statement} />
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleTrueFalse(idx, st.id);
                            }}
                            className={`px-3 py-1 rounded-xl text-xs font-bold transition flex items-center space-x-1 ${
                              st.isCorrect
                                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-2xs'
                                : 'bg-rose-100 text-rose-900 border border-rose-300 shadow-2xs'
                            }`}
                          >
                            <span>{st.isCorrect ? 'ĐÚNG' : 'SAI'}</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Short Answer Key */}
                  {q.type === 'short_answer' && (
                    <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-2xl text-xs space-y-1">
                      <div className="font-bold text-purple-950">Đáp án chấp nhận:</div>
                      <div className="font-mono text-sm font-bold text-purple-900">
                        {q.shortAnswerKey?.acceptedValues?.join(' ; ') || 'Chưa thiết lập'}
                      </div>
                    </div>
                  )}

                  {/* Solution Preview */}
                  {q.solution && (
                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1 text-slate-700 leading-relaxed">
                      <strong className="text-teal-950 block font-bold">Lời giải chi tiết:</strong>
                      <MathContent content={q.solution} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 👉 RIGHT PANE: SOURCE TEXT SYNTAX EDITOR (Khung bên phải) */}
        <div className="flex flex-col h-full bg-slate-900 text-slate-100 overflow-hidden font-mono">
          {/* Right Header with Search & Undo/Redo */}
          <div className="px-4 py-2 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-bold text-teal-400 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-teal-400" />
              <span>TRÌNH BIÊN TẬP NGUỒN WORD (ĐỒNG BỘ HAI CHIỀU)</span>
            </span>

            {/* Search Input & Action Icons */}
            <div className="flex items-center space-x-2">
              {/* Search input */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-slate-800 text-slate-200 placeholder:text-slate-500 pl-8 pr-2.5 py-1 rounded-xl text-xs border border-slate-700 focus:outline-none focus:border-teal-400 w-32 sm:w-40"
                />
              </div>

              {/* Undo / Redo */}
              <button
                onClick={handleUndo}
                disabled={historyIndex <= 0}
                className="p-1 hover:bg-slate-800 text-slate-300 disabled:opacity-30 rounded-lg transition"
                title="Hoàn tác (Undo)"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleRedo}
                disabled={historyIndex >= history.length - 1}
                className="p-1 hover:bg-slate-800 text-slate-300 disabled:opacity-30 rounded-lg transition"
                title="Làm lại (Redo)"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Editor Body with Line Numbers Gutter */}
          <div className="flex-1 flex overflow-hidden relative">
            {/* Line Numbers Gutter */}
            <div className="w-10 bg-slate-950/80 text-slate-600 text-right pr-2 py-3 select-none text-xs leading-6 font-mono border-r border-slate-800">
              {Array.from({ length: Math.max(sourceLineCount, 30) }, (_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>

            {/* Source Textarea */}
            <textarea
              ref={rightTextareaRef}
              value={sourceText}
              onChange={(e) => handleSourceChange(e.target.value)}
              className="flex-1 p-3 bg-transparent text-slate-200 text-xs leading-6 font-mono resize-none focus:outline-none overflow-y-auto whitespace-pre selection:bg-teal-700 selection:text-white"
              spellCheck={false}
              placeholder="Nội dung nguồn Word đã nhận diện..."
            />
          </div>

          {/* Right Bottom Status Bar */}
          <div className="px-4 py-2 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>Dòng: {sourceLineCount} • Ký tự: {sourceText.length}</span>
            <span className="text-teal-400">Tự động đồng bộ: 300ms</span>
          </div>
        </div>
      </div>

      {/* 🌟 3. VALIDATION MODAL (Kiểm tra lỗi trước khi xuất bản) */}
      {isValidationModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <span>Báo Cáo Kiểm Tra Lỗi Đề Thi</span>
              </h3>
              <button
                onClick={() => setIsValidationModalOpen(false)}
                className="p-1 hover:bg-slate-100 rounded-full text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-2 text-xs">
              {validationErrors.length === 0 ? (
                <div className="p-4 bg-emerald-50 text-emerald-900 font-bold rounded-2xl flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>Đề thi hoàn hảo! Không có lỗi cú pháp hoặc thiếu phương án nào.</span>
                </div>
              ) : (
                validationErrors.map((err, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setIsValidationModalOpen(false);
                      handleJumpToQuestion(err.questionIndex);
                    }}
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                      err.type === 'error'
                        ? 'bg-rose-50 border-rose-200 text-rose-900 hover:bg-rose-100'
                        : 'bg-amber-50 border-amber-200 text-amber-900 hover:bg-amber-100'
                    }`}
                  >
                    <span>{err.message}</span>
                    <span className="text-[10px] font-bold underline text-teal-800">Đi đến câu →</span>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsValidationModalOpen(false)}
                className="px-5 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🌟 4. POINTS DISTRIBUTOR MODAL (Chia đều điểm) */}
      {isPointsModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scaleUp">
            <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-teal-600" />
              <span>Tự Động Chia Đều Điểm</span>
            </h3>
            <p className="text-xs text-slate-500">
              Tổng số câu: <strong>{questions.length} câu</strong>. Chọn mức tổng điểm đề thi:
            </p>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleDistributeEqualPoints(10)}
                className="p-3 bg-teal-50 hover:bg-teal-100 text-teal-950 font-bold rounded-2xl border border-teal-200 text-center"
              >
                Thang điểm 10<br />
                <span className="text-[11px] font-normal text-teal-700">
                  {Math.round((10 / questions.length) * 100) / 100} đ/câu
                </span>
              </button>

              <button
                onClick={() => handleDistributeEqualPoints(100)}
                className="p-3 bg-slate-50 hover:bg-slate-100 text-slate-900 font-bold rounded-2xl border border-slate-200 text-center"
              >
                Thang điểm 100<br />
                <span className="text-[11px] font-normal text-slate-500">
                  {Math.round((100 / questions.length) * 100) / 100} đ/câu
                </span>
              </button>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsPointsModalOpen(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-200"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🌟 5. STUDENT FULLSCREEN VIEW MODAL (Xem như học sinh) */}
      {isStudentViewOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
          <div className="bg-white rounded-3xl max-w-4xl w-full h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-scaleUp">
            {/* Modal Top Bar */}
            <div className="p-4 bg-teal-800 text-white flex items-center justify-between">
              <div>
                <h3 className="font-black text-sm uppercase tracking-wider">{examTitle}</h3>
                <p className="text-xs text-teal-100">
                  Chế độ mô phỏng giao diện làm bài của học sinh ({questions.length} câu • {examDuration} phút)
                </p>
              </div>
              <button
                onClick={() => setIsStudentViewOpen(false)}
                className="p-1.5 bg-teal-900/60 hover:bg-teal-900 rounded-full text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Test Content */}
            <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-slate-50">
              {questions.map((q, idx) => (
                <div key={idx} className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                  <div className="font-bold text-xs text-teal-900 uppercase">
                    Câu {idx + 1} ({q.points} điểm):
                  </div>
                  <div className="text-slate-900 text-sm leading-relaxed">
                    <MathContent content={q.stem} />
                  </div>

                  {q.media && q.media.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {q.media.map((m, mi) => (
                        <img key={mi} src={m.url} alt="" className="max-h-48 object-contain rounded-xl" />
                      ))}
                    </div>
                  )}

                  {q.type === 'mcq' && q.options && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {q.options.map((opt) => (
                        <div key={opt.id} className="p-3 bg-white border border-slate-200 rounded-xl text-xs flex items-start space-x-2">
                          <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center font-bold flex-shrink-0">
                            {opt.id}
                          </span>
                          <div className="flex-1 pt-0.5">
                            <MathContent content={opt.text} inline />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 🌟 6. MATHLIVE FORMULA EDITOR MODAL */}
      <VisualMathEditorModal
        isOpen={isFormulaModalOpen}
        initialLatex={activeEditingMathId ? dictionaries.mathMap[activeEditingMathId] || '' : ''}
        onClose={() => {
          setIsFormulaModalOpen(false);
          setActiveEditingMathId(null);
        }}
        onInsert={(latex) => handleSaveFormulaModal(latex)}
      />
    </div>
  );
};
