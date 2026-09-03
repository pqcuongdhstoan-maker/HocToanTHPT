import React, { useState } from "react";
import { Lesson, PracticeTest, Question } from "../types";
import {
  X,
  BookOpen,
  Upload,
  Play,
  Plus,
  Trash2,
  Edit3,
  Clock,
  CheckCircle2,
  FileText,
  Sparkles,
  Layers,
  ChevronRight,
  Check,
} from "lucide-react";

interface LessonPracticeTestsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lesson: Lesson | null;
  onStartPractice: (lesson: Lesson, test: PracticeTest) => void;
  onOpenImport: (lesson: Lesson, test: PracticeTest) => void;
  onAddTest?: (lessonId: string, newTest: PracticeTest) => void;
  onDeleteTest?: (lessonId: string, testId: string) => void;
  onUpdateTest?: (lessonId: string, updatedTest: PracticeTest) => void;
}

export const LessonPracticeTestsModal: React.FC<LessonPracticeTestsModalProps> = ({
  isOpen,
  onClose,
  lesson,
  onStartPractice,
  onOpenImport,
  onAddTest,
  onDeleteTest,
  onUpdateTest,
}) => {
  if (!isOpen || !lesson) return null;

  // Derive initial tests if not present
  const defaultTests: PracticeTest[] = [
    {
      id: "test_1",
      title: "Đề luyện tập 1 (Tiêu chuẩn)",
      description: "Đề thi rèn luyện tổng hợp 4 phần chuẩn Bộ GD&ĐT",
      durationMinutes: lesson.durationMinutes || 45,
      questions: lesson.questions || [],
      createdAt: "2026-09-01",
    },
    {
      id: "test_2",
      title: "Đề luyện tập 2 (Phát triển năng lực)",
      description: "Đề thi tăng cường câu hỏi vận dụng thực tế và tư duy giải tích",
      durationMinutes: lesson.durationMinutes || 45,
      questions: [],
      createdAt: "2026-09-02",
    },
  ];

  const tests: PracticeTest[] =
    lesson.practiceTests && lesson.practiceTests.length > 0
      ? lesson.practiceTests
      : defaultTests;

  // State for creating a new test
  const [isAddingNew, setIsAddingNew] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>("");
  const [newDuration, setNewDuration] = useState<number>(45);

  // State for editing test title/duration
  const [editingTestId, setEditingTestId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState<string>("");
  const [editDuration, setEditDuration] = useState<number>(45);

  const handleCreateTest = (e: React.FormEvent) => {
    e.preventDefault();
    const title = newTitle.trim() || `Đề luyện tập ${tests.length + 1}`;
    const newTest: PracticeTest = {
      id: `test_${Date.now()}`,
      title: title,
      description: "Đề tự luyện thi môn Toán THPT GDPT 2018",
      durationMinutes: newDuration > 0 ? newDuration : 45,
      questions: [],
      createdAt: new Date().toISOString().split("T")[0],
    };

    if (onAddTest) {
      onAddTest(lesson.id, newTest);
    }
    setIsAddingNew(false);
    setNewTitle("");
    setNewDuration(45);
  };

  const handleStartEdit = (t: PracticeTest) => {
    setEditingTestId(t.id);
    setEditTitle(t.title);
    setEditDuration(t.durationMinutes);
  };

  const handleSaveEdit = (testId: string) => {
    const existing = tests.find((t) => t.id === testId);
    if (!existing) return;
    const updated: PracticeTest = {
      ...existing,
      title: editTitle.trim() || existing.title,
      durationMinutes: editDuration > 0 ? editDuration : existing.durationMinutes,
    };
    if (onUpdateTest) {
      onUpdateTest(lesson.id, updated);
    }
    setEditingTestId(null);
  };

  const handleDelete = (testId: string) => {
    if (tests.length <= 1) {
      alert("Bài học cần có ít nhất 1 đề luyện tập!");
      return;
    }
    if (confirm("Thầy/bạn có chắc chắn muốn xóa đề luyện tập này không?")) {
      if (onDeleteTest) {
        onDeleteTest(lesson.id, testId);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-900 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-white border border-white/20">
              <Layers className="w-5 h-5 text-blue-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/40 text-blue-100 border border-blue-400/30">
                  Toán {lesson.grade} GDPT 2018
                </span>
                <span className="text-xs text-blue-200 font-medium">Kho đề tự luyện</span>
              </div>
              <h2 className="text-base sm:text-lg font-black tracking-tight">{lesson.title}</h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Subtitle / Intro banner */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-blue-50/60 rounded-2xl border border-blue-200/80">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                <span>Mỗi bài học có nhiều đề luyện tập khác nhau</span>
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Thầy/bạn có thể làm từng đề, hoặc nạp thêm đề mới từ file Word (.docx), PDF (.pdf) và soạn câu hỏi trực quan.
              </p>
            </div>

            {/* Add new practice test button */}
            {!isAddingNew && (
              <button
                type="button"
                onClick={() => setIsAddingNew(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>+ Thêm đề luyện tập mới</span>
              </button>
            )}
          </div>

          {/* New Test Creation Form */}
          {isAddingNew && (
            <form
              onSubmit={handleCreateTest}
              className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-3 animate-fadeIn"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-indigo-950 uppercase tracking-wider">
                  Tạo đề luyện tập mới cho bài học này
                </span>
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  ✕ Hủy
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Tên đề luyện tập:</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder={`Ví dụ: Đề luyện tập ${tests.length + 1}, Đề nâng cao 9+...`}
                    className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-indigo-400 outline-none"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Thời gian (phút):</label>
                  <input
                    type="number"
                    value={newDuration}
                    onChange={(e) => setNewDuration(parseInt(e.target.value) || 45)}
                    className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-xs font-bold focus:ring-2 focus:ring-indigo-400 outline-none"
                    min={5}
                    max={180}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs active:scale-95"
                >
                  Tạo đề ngay
                </button>
              </div>
            </form>
          )}

          {/* List of Practice Tests */}
          <div className="space-y-3.5">
            {tests.map((test, index) => {
              const isEditing = editingTestId === test.id;
              const qCount = test.questions ? test.questions.length : 0;
              const hasQuestions = qCount > 0;

              return (
                <div
                  key={test.id || index}
                  className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-blue-300 transition-all space-y-3.5 group"
                >
                  {/* Top line: Index, Title, Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 flex-1 min-w-[200px]">
                      <span className="w-8 h-8 rounded-xl bg-blue-100 text-blue-800 font-black text-xs flex items-center justify-center shrink-0">
                        {index + 1}
                      </span>

                      {!isEditing ? (
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-extrabold text-slate-900 text-sm sm:text-base">
                              {test.title}
                            </h4>
                            <button
                              type="button"
                              onClick={() => handleStartEdit(test)}
                              className="text-slate-400 hover:text-blue-600 p-1 rounded-md"
                              title="Đổi tên đề hoặc thời gian"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          {test.description && (
                            <p className="text-[11px] text-slate-500">{test.description}</p>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="px-2.5 py-1 bg-white border border-blue-400 rounded-lg text-xs font-bold flex-1"
                          />
                          <input
                            type="number"
                            value={editDuration}
                            onChange={(e) => setEditDuration(parseInt(e.target.value) || 45)}
                            className="w-16 px-2 py-1 bg-white border border-blue-400 rounded-lg text-xs font-bold"
                            title="Số phút"
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(test.id)}
                            className="p-1 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                            title="Lưu thay đổi"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold">
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span>{test.durationMinutes} phút</span>
                      </span>

                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${
                          hasQuestions
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : "bg-amber-50 text-amber-800 border border-amber-200"
                        }`}
                      >
                        <FileText className="w-3 h-3" />
                        <span>{hasQuestions ? `${qCount} câu hỏi` : "Chưa có câu hỏi"}</span>
                      </span>

                      {/* Delete button */}
                      <button
                        type="button"
                        onClick={() => handleDelete(test.id)}
                        className="text-slate-300 hover:text-rose-600 p-1.5 rounded-lg transition-colors"
                        title="Xóa đề này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Actions for this specific practice test */}
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                    <div className="text-[11px] text-slate-500">
                      Cấu trúc 4 phần chuẩn Bộ GD&ĐT (Phần I, II, III, IV)
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Button: Nạp đề (Word & PDF) & Soạn đề riêng cho đề này */}
                      <button
                        type="button"
                        onClick={() => onOpenImport(lesson, test)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold border border-slate-300 active:scale-95 transition-all"
                        title="Nạp file Word, PDF hoặc mở soạn thảo công thức Toán cho đề này"
                      >
                        <Upload className="w-3.5 h-3.5 text-blue-600" />
                        <span>Nạp đề (Word/PDF) & Soạn đề</span>
                      </button>

                      {/* Button: Vào làm bài */}
                      <button
                        type="button"
                        onClick={() => onStartPractice(lesson, test)}
                        className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-black shadow-xs active:scale-95 transition-all ${
                          hasQuestions
                            ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                            : "bg-blue-600 hover:bg-blue-700 text-white"
                        }`}
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>{hasQuestions ? "Làm bài ngay" : "Bắt đầu làm bài"}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Tổng cộng: <strong className="text-slate-800">{tests.length} đề tự luyện</strong> cho bài học này
          </span>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
