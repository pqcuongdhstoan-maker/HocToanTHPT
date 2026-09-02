import React, { useState, useEffect } from 'react';
import { Question, QuestionType, DifficultyLevel, Lesson } from '../../types';
import { MathFormulaInput } from '../common/MathFormulaInput';
import { MathText } from '../MathText';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import {
  Plus,
  Trash2,
  Copy,
  Save,
  Eye,
  Edit3,
  CheckCircle2,
  Sparkles,
  Layers,
  HelpCircle,
  FileQuestion,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  RefreshCw,
} from 'lucide-react';

interface QuestionEditorStudioProps {
  lessonId: string;
  initialQuestions?: Question[];
  onSaveSuccess?: (questions: Question[]) => void;
}

export const QuestionEditorStudio: React.FC<QuestionEditorStudioProps> = ({
  lessonId,
  initialQuestions,
  onSaveSuccess,
}) => {
  const { lessons, chapters, showToast, reloadCurriculum } = useApp();
  const [questions, setQuestions] = useState<Question[]>(initialQuestions || []);
  const [activeQIndex, setActiveQIndex] = useState<number>(0);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [previewMode, setPreviewMode] = useState<boolean>(false);

  const currentLesson = lessons.find((l) => l.id === lessonId) || lessons[0];

  // Load questions for the selected lesson if not provided
  useEffect(() => {
    if (initialQuestions && initialQuestions.length > 0) {
      setQuestions(initialQuestions);
      setActiveQIndex(0);
      return;
    }

    const fetchLessonQuestions = async () => {
      setIsLoading(true);
      try {
        const res = await api.getQuestions(lessonId);
        if (res && res.length > 0) {
          setQuestions(res);
          setActiveQIndex(0);
        } else {
          // If no questions, create default sample question
          const defaultQ: Question = {
            id: `q-${Date.now()}-1`,
            lessonId: lessonId,
            chapterId: currentLesson?.chapterId || 'chap-1',
            type: 'mcq',
            difficulty: 'NB',
            order: 1,
            points: 0.25,
            stem: 'Cho hàm số $y = f(x)$ có đạo hàm $f\'(x) = x^2 - 1$. Tìm các khoảng đồng biến của hàm số.',
            options: [
              { id: 'A', text: '$(-\\infty; -1)$ và $(1; +\\infty)$', latex: '(-\\infty; -1)' },
              { id: 'B', text: '$(-1; 1)$', latex: '(-1; 1)' },
              { id: 'C', text: '$(0; +\\infty)$', latex: '(0; +\\infty)' },
              { id: 'D', text: '$(-\\infty; 0)$', latex: '(-\\infty; 0)' },
            ],
            correctAnswer: 'A',
            solution: 'Ta có $f\'(x) = 0 \\iff x = \\pm 1$. Bảng xét dấu cho thấy $f\'(x) > 0$ khi $x \\in (-\\infty; -1) \\cup (1; +\\infty)$. Chọn A.',
            tags: ['Đồng biến', 'Đạo hàm'],
          };
          setQuestions([defaultQ]);
          setActiveQIndex(0);
        }
      } catch (err) {
        console.error('Fetch questions error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLessonQuestions();
  }, [lessonId, initialQuestions]);

  const currentQ = questions[activeQIndex] || questions[0];

  // Update current active question
  const updateCurrentQuestion = (updated: Partial<Question>) => {
    setQuestions((prev) => {
      const next = [...prev];
      next[activeQIndex] = { ...next[activeQIndex], ...updated };
      return next;
    });
  };

  // Add a new question
  const handleAddNewQuestion = (type: QuestionType = 'mcq') => {
    const newQ: Question = {
      id: `q-${Date.now()}-${questions.length + 1}`,
      lessonId: lessonId,
      chapterId: currentLesson?.chapterId || 'chap-1',
      type: type,
      difficulty: 'TH',
      order: questions.length + 1,
      points: type === 'true_false' ? 1.0 : type === 'essay' ? 2.0 : 0.25,
      stem: 'Nhập nội dung câu hỏi mới tại đây...',
      options:
        type === 'mcq'
          ? [
              { id: 'A', text: 'Phương án A' },
              { id: 'B', text: 'Phương án B' },
              { id: 'C', text: 'Phương án C' },
              { id: 'D', text: 'Phương án D' },
            ]
          : undefined,
      statements:
        type === 'true_false'
          ? [
              { id: 'a', statement: 'Mệnh đề a)', isCorrect: true, explanation: 'Giải thích ý a' },
              { id: 'b', statement: 'Mệnh đề b)', isCorrect: false, explanation: 'Giải thích ý b' },
              { id: 'c', statement: 'Mệnh đề c)', isCorrect: true, explanation: 'Giải thích ý c' },
              { id: 'd', statement: 'Mệnh đề d)', isCorrect: false, explanation: 'Giải thích ý d' },
            ]
          : undefined,
      shortAnswerKey:
        type === 'short_answer'
          ? { exactValue: '0', acceptedValues: ['0'] }
          : undefined,
      correctAnswer: type === 'mcq' ? 'A' : undefined,
      solution: 'Hướng dẫn giải chi tiết...',
      tags: ['Tự luyện'],
    };

    setQuestions((prev) => [...prev, newQ]);
    setActiveQIndex(questions.length);
    showToast('Đã thêm câu hỏi', `Đã tạo câu hỏi mới dạng ${type.toUpperCase()}.`, 'info');
  };

  // Duplicate question
  const handleDuplicateQuestion = () => {
    if (!currentQ) return;
    const duplicated: Question = {
      ...currentQ,
      id: `q-${Date.now()}-copy`,
      order: questions.length + 1,
    };
    setQuestions((prev) => [...prev, duplicated]);
    setActiveQIndex(questions.length);
    showToast('Đã nhân bản', `Đã sao chép Câu ${activeQIndex + 1}.`, 'success');
  };

  // Delete question
  const handleDeleteQuestion = () => {
    if (questions.length <= 1) {
      showToast('Không thể xóa', 'Đề thi cần có ít nhất 1 câu hỏi.', 'warning');
      return;
    }
    const nextQuestions = questions.filter((_, idx) => idx !== activeQIndex);
    setQuestions(nextQuestions);
    setActiveQIndex(Math.max(0, activeQIndex - 1));
    showToast('Đã xóa câu hỏi', 'Đã loại bỏ câu hỏi khỏi danh sách.', 'info');
  };

  // Save all questions to database
  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      showToast('Đang lưu câu hỏi...', 'Đang cập nhật ngân hàng đề thi...', 'info');
      await api.saveQuestionsBatch(lessonId, questions);
      await reloadCurriculum();
      if (onSaveSuccess) onSaveSuccess(questions);
      showToast('Lưu thành công!', `Đã lưu ${questions.length} câu hỏi vào bài học.`, 'success');
    } catch (err: any) {
      console.error('Save questions error:', err);
      showToast('Lỗi lưu câu hỏi', err?.message || 'Vui lòng thử lại.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
            <FileQuestion className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>Soạn Thảo Đề Thi &amp; Quản Lý Câu Hỏi</span>
              <span className="text-xs bg-teal-50 text-teal-700 font-semibold px-2.5 py-0.5 rounded-full border border-teal-200">
                {questions.length} câu hỏi
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Bài {currentLesson?.number}: {currentLesson?.title}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Preview vs Edit Mode Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setPreviewMode(false)}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                !previewMode ? 'bg-white text-teal-900 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Chế độ Soạn thảo</span>
            </button>
            <button
              type="button"
              onClick={() => setPreviewMode(true)}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                previewMode ? 'bg-white text-teal-900 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Xem trước như học sinh</span>
            </button>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSaveAll}
            disabled={isSaving}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center space-x-1.5"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Đang lưu...' : 'Lưu ngân hàng đề'}</span>
          </button>
        </div>
      </div>

      {/* Main Studio Grid: Left Question Navigator + Right Question Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Question List Navigator (3 cols) */}
        <div className="lg:col-span-3 space-y-3">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800 border-b border-slate-100 pb-2">
              <span>Danh sách câu hỏi</span>
              <span className="text-teal-700 font-mono">#{activeQIndex + 1}/{questions.length}</span>
            </div>

            {/* Question Badges Grid */}
            <div className="grid grid-cols-4 gap-2 max-h-[380px] overflow-y-auto p-1">
              {questions.map((q, idx) => {
                const isActive = idx === activeQIndex;
                return (
                  <button
                    key={q.id || idx}
                    onClick={() => setActiveQIndex(idx)}
                    className={`h-11 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center relative ${
                      isActive
                        ? 'bg-teal-700 text-white shadow-md ring-2 ring-teal-500/50'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                  >
                    <span>Câu {idx + 1}</span>
                    <span className={`text-[9px] uppercase font-mono ${isActive ? 'text-teal-200' : 'text-slate-400'}`}>
                      {q.type === 'mcq' ? 'MCQ' : q.type === 'true_false' ? 'Đ/S' : q.type === 'short_answer' ? 'TLN' : 'TL'}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Add Question Dropdown / Buttons */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                + Thêm câu hỏi mới:
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => handleAddNewQuestion('mcq')}
                  className="px-2 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200 rounded-lg text-[11px] font-bold transition text-left"
                >
                  + Trắc nghiệm (A,B,C,D)
                </button>
                <button
                  onClick={() => handleAddNewQuestion('true_false')}
                  className="px-2 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 rounded-lg text-[11px] font-bold transition text-left"
                >
                  + Đúng / Sai (a,b,c,d)
                </button>
                <button
                  onClick={() => handleAddNewQuestion('short_answer')}
                  className="px-2 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 rounded-lg text-[11px] font-bold transition text-left"
                >
                  + Trả lời ngắn
                </button>
                <button
                  onClick={() => handleAddNewQuestion('essay')}
                  className="px-2 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-200 rounded-lg text-[11px] font-bold transition text-left"
                >
                  + Tự luận
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Active Question Editor / Live Student Preview (9 cols) */}
        <div className="lg:col-span-9">
          {currentQ ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
              {/* Question Header Configuration Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div className="flex items-center space-x-3">
                  <span className="w-8 h-8 rounded-xl bg-teal-700 text-white font-black text-sm flex items-center justify-center shadow-xs">
                    {activeQIndex + 1}
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Soạn thảo Câu {activeQIndex + 1}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Tất cả các ô nhập đều hỗ trợ nút "∑ Chèn công thức" trực quan
                    </p>
                  </div>
                </div>

                {/* Question Metadata Controls */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {/* Question Type */}
                  <select
                    value={currentQ.type}
                    onChange={(e) => {
                      const newType = e.target.value as QuestionType;
                      updateCurrentQuestion({
                        type: newType,
                        options:
                          newType === 'mcq'
                            ? currentQ.options || [
                                { id: 'A', text: 'Phương án A' },
                                { id: 'B', text: 'Phương án B' },
                                { id: 'C', text: 'Phương án C' },
                                { id: 'D', text: 'Phương án D' },
                              ]
                            : undefined,
                        statements:
                          newType === 'true_false'
                            ? currentQ.statements || [
                                { id: 'a', statement: 'Mệnh đề a)', isCorrect: true },
                                { id: 'b', statement: 'Mệnh đề b)', isCorrect: false },
                                { id: 'c', statement: 'Mệnh đề c)', isCorrect: true },
                                { id: 'd', statement: 'Mệnh đề d)', isCorrect: false },
                              ]
                            : undefined,
                      });
                    }}
                    className="bg-slate-50 border border-slate-300 font-bold text-slate-800 rounded-xl px-2.5 py-1.5 focus:ring-1 focus:ring-teal-500"
                  >
                    <option value="mcq">1. Trắc nghiệm 4 lựa chọn</option>
                    <option value="true_false">2. Đúng / Sai 4 ý</option>
                    <option value="short_answer">3. Trả lời ngắn</option>
                    <option value="essay">4. Tự luận</option>
                  </select>

                  {/* Difficulty Level */}
                  <select
                    value={currentQ.difficulty}
                    onChange={(e) => updateCurrentQuestion({ difficulty: e.target.value as DifficultyLevel })}
                    className="bg-slate-50 border border-slate-300 font-bold text-slate-800 rounded-xl px-2.5 py-1.5 focus:ring-1 focus:ring-teal-500"
                  >
                    <option value="NB">Nhận biết (NB)</option>
                    <option value="TH">Thông hiểu (TH)</option>
                    <option value="VD">Vận dụng (VD)</option>
                    <option value="VDC">Vận dụng cao (VDC)</option>
                  </select>

                  {/* Points */}
                  <div className="flex items-center space-x-1">
                    <span className="text-slate-500">Điểm:</span>
                    <input
                      type="number"
                      step="0.05"
                      min="0.1"
                      max="10"
                      value={currentQ.points || 0.25}
                      onChange={(e) => updateCurrentQuestion({ points: parseFloat(e.target.value) || 0.25 })}
                      className="w-16 px-2 py-1 bg-slate-50 border border-slate-300 rounded-xl text-center font-bold"
                    />
                  </div>

                  {/* Actions */}
                  <button
                    onClick={handleDuplicateQuestion}
                    className="p-1.5 text-slate-500 hover:text-teal-700 bg-slate-50 hover:bg-teal-50 border border-slate-200 rounded-xl transition"
                    title="Nhân bản câu này"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleDeleteQuestion}
                    className="p-1.5 text-slate-500 hover:text-rose-700 bg-slate-50 hover:bg-rose-50 border border-slate-200 rounded-xl transition"
                    title="Xóa câu này"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* MODE 1: LIVE STUDENT PREVIEW */}
              {previewMode ? (
                <div className="space-y-6 animate-fadeIn">
                  <div className="p-4 bg-teal-50/50 rounded-2xl border border-teal-200 text-xs text-teal-900 font-bold flex items-center justify-between">
                    <span>👁️ Bản xem trước hiển thị thời gian thực theo góc nhìn học sinh:</span>
                    <span className="font-mono">{currentQ.points} Điểm</span>
                  </div>

                  {/* Question Stem Render */}
                  <div className="p-5 bg-white rounded-2xl border border-slate-200 text-sm text-slate-900 leading-relaxed shadow-2xs">
                    <MathText>{currentQ.stem}</MathText>
                  </div>

                  {/* Options Preview */}
                  {currentQ.type === 'mcq' && currentQ.options && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {currentQ.options.map((opt) => (
                        <div
                          key={opt.id}
                          className={`p-3.5 rounded-xl border text-xs flex items-start space-x-2.5 ${
                            currentQ.correctAnswer === opt.id
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-semibold'
                              : 'bg-white border-slate-200 text-slate-800'
                          }`}
                        >
                          <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center font-bold flex-shrink-0">
                            {opt.id}
                          </span>
                          <div className="flex-1 pt-0.5">
                            <MathText inline>{opt.text}</MathText>
                          </div>
                          {currentQ.correctAnswer === opt.id && (
                            <span className="text-[10px] bg-emerald-600 text-white font-bold px-1.5 py-0.5 rounded">
                              Đáp án đúng
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* True/False Statements Preview */}
                  {currentQ.type === 'true_false' && currentQ.statements && (
                    <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
                      {currentQ.statements.map((st) => (
                        <div key={st.id} className="p-4 flex items-center justify-between gap-4 text-xs">
                          <div className="flex items-start space-x-2.5 flex-1">
                            <span className="font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                              {st.id})
                            </span>
                            <div className="text-slate-800">
                              <MathText>{st.statement}</MathText>
                            </div>
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold ${
                              st.isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {st.isCorrect ? 'Đúng' : 'Sai'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Short Answer Preview */}
                  {currentQ.type === 'short_answer' && (
                    <div className="p-4 bg-purple-50 rounded-2xl border border-purple-200 text-xs space-y-2">
                      <div className="font-bold text-purple-950">Đáp án chấp nhận:</div>
                      <div className="font-mono text-sm font-bold text-purple-900">
                        {currentQ.shortAnswerKey?.acceptedValues?.join(' ; ') || 'Chưa thiết lập'}
                      </div>
                    </div>
                  )}

                  {/* Solution Preview */}
                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2">
                    <div className="font-bold text-teal-950 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-teal-600" />
                      <span>Hướng dẫn giải chi tiết:</span>
                    </div>
                    <div className="text-slate-700 leading-relaxed">
                      <MathText>{currentQ.solution || 'Chưa cập nhật lời giải.'}</MathText>
                    </div>
                  </div>
                </div>
              ) : (
                /* MODE 2: TEACHER VISUAL EDITING MODE */
                <div className="space-y-6 animate-fadeIn">
                  {/* 1. Question Stem (Nội dung câu hỏi) */}
                  <MathFormulaInput
                    label="Nội dung câu hỏi (Đề bài):"
                    value={currentQ.stem}
                    onChange={(val) => updateCurrentQuestion({ stem: val })}
                    placeholder="Nhập đề bài câu hỏi hoặc bấm '∑ Chèn công thức'..."
                    rows={4}
                    required
                  />

                  {/* 2. DYNAMIC INPUTS ACCORDING TO QUESTION TYPE */}
                  {/* TYPE 1: MCQ (4 Options A, B, C, D) */}
                  {currentQ.type === 'mcq' && (
                    <div className="space-y-4 pt-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                          4 Phương án trắc nghiệm:
                        </label>
                        <span className="text-[11px] text-slate-500">
                          * Tích chọn nút tròn ở phương án đúng
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {(currentQ.options || []).map((opt) => {
                          const isCorrect = currentQ.correctAnswer === opt.id;
                          return (
                            <div
                              key={opt.id}
                              className={`p-3.5 rounded-2xl border transition-all ${
                                isCorrect
                                  ? 'bg-emerald-50/40 border-emerald-300 ring-1 ring-emerald-400'
                                  : 'bg-white border-slate-200'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-bold text-xs text-slate-800">
                                  Phương án {opt.id}
                                </span>
                                <label className="flex items-center space-x-1.5 cursor-pointer text-xs font-semibold">
                                  <input
                                    type="radio"
                                    name={`correct-${currentQ.id}`}
                                    checked={isCorrect}
                                    onChange={() => updateCurrentQuestion({ correctAnswer: opt.id })}
                                    className="w-4 h-4 accent-emerald-600"
                                  />
                                  <span className={isCorrect ? 'text-emerald-800 font-bold' : 'text-slate-500'}>
                                    {isCorrect ? '✓ Đáp án đúng' : 'Chọn đúng'}
                                  </span>
                                </label>
                              </div>

                              <MathFormulaInput
                                value={opt.text}
                                onChange={(val) => {
                                  const updatedOpts = (currentQ.options || []).map((o) =>
                                    o.id === opt.id ? { ...o, text: val, latex: val } : o
                                  );
                                  updateCurrentQuestion({ options: updatedOpts });
                                }}
                                placeholder={`Nhập nội dung phương án ${opt.id}...`}
                                rows={2}
                                isSingleLine={false}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* TYPE 2: TRUE / FALSE (4 Statements a, b, c, d) */}
                  {currentQ.type === 'true_false' && (
                    <div className="space-y-4 pt-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                          4 Khẳng định Đúng / Sai (a, b, c, d):
                        </label>
                        <span className="text-[11px] text-slate-500">
                          * Tích chọn Đúng hoặc Sai cho từng khẳng định
                        </span>
                      </div>

                      <div className="space-y-4">
                        {(currentQ.statements || []).map((st) => (
                          <div key={st.id} className="p-4 bg-slate-50/60 rounded-2xl border border-slate-200 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs text-teal-900 bg-teal-100 px-2 py-0.5 rounded-md">
                                Khẳng định {st.id})
                              </span>
                              <div className="flex items-center space-x-4 text-xs font-bold">
                                <label className="flex items-center space-x-1.5 cursor-pointer">
                                  <input
                                    type="radio"
                                    name={`tf-${currentQ.id}-${st.id}`}
                                    checked={st.isCorrect === true}
                                    onChange={() => {
                                      const updatedSts = (currentQ.statements || []).map((s) =>
                                        s.id === st.id ? { ...s, isCorrect: true } : s
                                      );
                                      updateCurrentQuestion({ statements: updatedSts });
                                    }}
                                    className="w-4 h-4 accent-emerald-600"
                                  />
                                  <span className="text-emerald-800">ĐÚNG</span>
                                </label>
                                <label className="flex items-center space-x-1.5 cursor-pointer">
                                  <input
                                    type="radio"
                                    name={`tf-${currentQ.id}-${st.id}`}
                                    checked={st.isCorrect === false}
                                    onChange={() => {
                                      const updatedSts = (currentQ.statements || []).map((s) =>
                                        s.id === st.id ? { ...s, isCorrect: false } : s
                                      );
                                      updateCurrentQuestion({ statements: updatedSts });
                                    }}
                                    className="w-4 h-4 accent-rose-600"
                                  />
                                  <span className="text-rose-800">SAI</span>
                                </label>
                              </div>
                            </div>

                            <MathFormulaInput
                              value={st.statement}
                              onChange={(val) => {
                                const updatedSts = (currentQ.statements || []).map((s) =>
                                  s.id === st.id ? { ...s, statement: val } : s
                                );
                                updateCurrentQuestion({ statements: updatedSts });
                              }}
                              placeholder={`Nhập nội dung mệnh đề ${st.id})...`}
                              rows={2}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* TYPE 3: SHORT ANSWER */}
                  {currentQ.type === 'short_answer' && (
                    <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-2xl space-y-3">
                      <label className="text-xs font-bold text-purple-950 uppercase tracking-wide">
                        Khóa đáp án trả lời ngắn (Cách nhau bằng dấu chấm phẩy ;):
                      </label>
                      <MathFormulaInput
                        value={currentQ.shortAnswerKey?.acceptedValues?.join(' ; ') || ''}
                        onChange={(val) => {
                          const values = val.split(';').map((v) => v.trim()).filter(Boolean);
                          updateCurrentQuestion({
                            shortAnswerKey: {
                              exactValue: values[0] || '',
                              acceptedValues: values,
                            },
                          });
                        }}
                        placeholder="Ví dụ: 3.5 ; 7/2 ; 3,5"
                        rows={1}
                        isSingleLine
                      />
                    </div>
                  )}

                  {/* 3. Detailed Solution (Lời giải chi tiết) */}
                  <div className="pt-2 border-t border-slate-100">
                    <MathFormulaInput
                      label="Hướng dẫn giải chi tiết & Gợi ý chấm:"
                      value={currentQ.solution || ''}
                      onChange={(val) => updateCurrentQuestion({ solution: val })}
                      placeholder="Trình bày các bước giải chi tiết hoặc bấm '∑ Chèn công thức'..."
                      rows={4}
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-400">
              Chưa có câu hỏi nào. Bấm nút "+ Thêm câu hỏi" để bắt đầu soạn đề!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
