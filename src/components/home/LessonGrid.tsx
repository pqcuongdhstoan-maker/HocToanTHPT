import React from 'react';
import { useApp } from '../../context/AppContext';
import { LessonCard } from './LessonCard';
import { api } from '../../services/api';
import { BookOpen, SearchX } from 'lucide-react';

interface LessonGridProps {
  selectedSemester: number | 'all';
  selectedChapterId: string | 'all';
  searchQuery: string;
  statusFilter: 'all' | 'completed' | 'in_progress' | 'locked';
  onResetFilters: () => void;
}

export const LessonGrid: React.FC<LessonGridProps> = ({
  selectedSemester,
  selectedChapterId,
  searchQuery,
  statusFilter,
  onResetFilters,
}) => {
  const {
    lessons,
    chapters,
    studentProgress,
    setSelectedLessonId,
    setActiveTab,
    setActiveAttempt,
    setActiveQuestions,
    currentUser,
    showToast,
  } = useApp();

  // Filter lessons
  const filteredLessons = lessons.filter((lesson) => {
    // 1. Chapter / Semester filter
    if (selectedChapterId !== 'all' && lesson.chapterId !== selectedChapterId) {
      return false;
    }
    if (selectedSemester !== 'all') {
      const parentChap = chapters.find((c) => c.id === lesson.chapterId);
      const expectedSem = selectedSemester === 1 ? 'HK1' : 'HK2';
      if (parentChap && parentChap.semester !== expectedSem) {
        return false;
      }
    }

    // 2. Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = lesson.title.toLowerCase().includes(q);
      const matchDesc = lesson.description.toLowerCase().includes(q);
      const matchNumber = `bài ${lesson.number}`.includes(q);
      if (!matchTitle && !matchDesc && !matchNumber) return false;
    }

    // 3. Status filter
    const prog = studentProgress[lesson.id];
    const mastery = prog?.masteryPercent || 0;
    const isCompleted = mastery >= 80;
    const isLocked = !['admin', 'teacher'].includes(currentUser.role) && prog?.status === 'locked';

    if (statusFilter === 'completed' && !isCompleted) return false;
    if (statusFilter === 'in_progress' && (isCompleted || isLocked || mastery === 0)) return false;
    if (statusFilter === 'locked' && !isLocked) return false;

    return true;
  });

  const handleStartExam = async (lessonId: string) => {
    try {
      setSelectedLessonId(lessonId);
      showToast('Đang chuẩn bị đề thi...', 'Đang nạp bộ câu hỏi và khởi tạo phòng thi...', 'info');
      const { attempt, questions, isResumed } = await api.startAttempt(lessonId, currentUser.id);

      setActiveAttempt(attempt);
      setActiveQuestions(questions);
      setActiveTab('exam');

      if (isResumed) {
        showToast('Tiếp tục bài làm', 'Đã khôi phục các câu trả lời bạn đã lưu trước đó.', 'info');
      }
    } catch (err) {
      console.error('Error starting attempt:', err);
      showToast('Lỗi phòng thi', 'Không thể khởi tạo bài luyện tập. Vui lòng thử lại.', 'error');
    }
  };

  const handleViewTheory = (lessonId: string) => {
    setSelectedLessonId(lessonId);
    setActiveTab('theory');
  };

  if (filteredLessons.length === 0) {
    return (
      <div id="no-lessons-found" className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-lg mx-auto my-8 shadow-sm">
        <div className="w-14 h-14 bg-teal-50 text-teal-700 rounded-full flex items-center justify-center mx-auto mb-4">
          <SearchX className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-bold text-slate-800">Không tìm thấy bài học phù hợp</h3>
        <p className="text-sm text-slate-500 mt-1 mb-6">
          Vui lòng thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc để hiển thị toàn bộ 19 bài học.
        </p>
        <button
          onClick={onResetFilters}
          className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold transition shadow"
        >
          Xóa toàn bộ bộ lọc
        </button>
      </div>
    );
  }

  return (
    <div id="lesson-grid-container" className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <BookOpen className="w-5 h-5 text-teal-700" />
          <h2 className="text-xl font-bold text-slate-900">
            Danh sách bài học ({filteredLessons.length} bài)
          </h2>
        </div>
        <span className="text-xs text-slate-500 font-medium">
          Chuẩn cấu trúc đề ĐGNL & Tốt nghiệp THPT 2025
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredLessons.map((lesson) => {
          const chapter = chapters.find((c) => c.id === lesson.chapterId);
          const prog = studentProgress[lesson.id];
          return (
            <LessonCard
              key={lesson.id}
              lesson={lesson}
              chapter={chapter}
              progress={prog}
              onStartExam={handleStartExam}
              onViewTheory={handleViewTheory}
            />
          );
        })}
      </div>
    </div>
  );
};
