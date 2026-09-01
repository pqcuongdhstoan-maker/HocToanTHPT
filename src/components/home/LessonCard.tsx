import React from 'react';
import { Lesson, Chapter, StudentLessonProgress } from '../../types';
import { useApp } from '../../context/AppContext';
import { MathContent } from '../common/MathContent';
import {
  Lock,
  CheckCircle2,
  Play,
  Sparkles,
  Clock,
  HelpCircle,
  Unlock,
  AlertCircle,
} from 'lucide-react';

interface LessonCardProps {
  lesson: Lesson;
  chapter?: Chapter;
  progress?: StudentLessonProgress;
  onStartExam: (lessonId: string) => void;
  onViewTheory: (lessonId: string) => void;
}

export const LessonCard: React.FC<LessonCardProps> = ({
  lesson,
  chapter,
  progress,
  onStartExam,
  onViewTheory,
}) => {
  const { currentUser, showToast } = useApp();

  const isTeacherOrAdmin = currentUser.role === 'teacher' || currentUser.role === 'admin';
  const mastery = progress?.masteryPercent || 0;
  const isCompleted = mastery >= 80;
  const isLocked = !isTeacherOrAdmin && (progress?.status === 'locked');
  const attemptsCount = progress?.attemptsCount || 0;

  return (
    <div
      id={`lesson-card-${lesson.id}`}
      className={`bg-white rounded-2xl border transition-all duration-300 flex flex-col justify-between overflow-hidden relative shadow-sm hover:shadow-md ${
        isLocked
          ? 'border-slate-200 bg-slate-50/70 opacity-80'
          : isCompleted
          ? 'border-emerald-200 hover:border-emerald-400 bg-gradient-to-b from-emerald-50/20 to-white'
          : 'border-teal-100 hover:border-teal-300 hover:-translate-y-0.5'
      }`}
    >
      {/* Top Bar / Header */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center space-x-2">
            <span className="bg-teal-50 text-teal-800 border border-teal-200/80 text-xs font-bold px-2.5 py-1 rounded-lg">
              Bài {lesson.number}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Chương {chapter?.number || 1}
            </span>
          </div>

          {/* Status Badge */}
          {isLocked ? (
            <span className="inline-flex items-center space-x-1 text-xs font-semibold text-slate-500 bg-slate-200/80 px-2.5 py-1 rounded-full">
              <Lock className="w-3 h-3" />
              <span>Chưa mở</span>
            </span>
          ) : isCompleted ? (
            <span className="inline-flex items-center space-x-1 text-xs font-semibold text-emerald-700 bg-emerald-100/80 border border-emerald-300/60 px-2.5 py-1 rounded-full">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>Đạt chuẩn ({mastery}%)</span>
            </span>
          ) : mastery > 0 ? (
            <span className="inline-flex items-center space-x-1 text-xs font-semibold text-amber-700 bg-amber-100/80 px-2.5 py-1 rounded-full">
              <span>Đang luyện ({mastery}%)</span>
            </span>
          ) : (
            <span className="inline-flex items-center space-x-1 text-xs font-medium text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full">
              <span>Sẵn sàng</span>
            </span>
          )}
        </div>

        {/* Title & Description */}
        <h3 className="text-base font-bold text-slate-900 leading-snug line-clamp-2 min-h-[44px]">
          <MathContent content={lesson.title} />
        </h3>
        <div className="mt-1.5 text-xs text-slate-600 line-clamp-2 leading-relaxed">
          <MathContent content={lesson.description} />
        </div>

        {/* 4 Question Types Tag Matrix */}
        <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center space-x-1.5 text-slate-600">
            <span className="w-2 h-2 rounded-full bg-teal-500" />
            <span>Trắc nghiệm: <strong>{lesson.mcqCount}</strong> câu</span>
          </div>
          <div className="flex items-center space-x-1.5 text-slate-600">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span>Đúng / Sai: <strong>{lesson.tfCount}</strong> câu</span>
          </div>
          <div className="flex items-center space-x-1.5 text-slate-600">
            <span className="w-2 h-2 rounded-full bg-purple-500" />
            <span>Trả lời ngắn: <strong>{lesson.saCount}</strong> câu</span>
          </div>
          <div className="flex items-center space-x-1.5 text-slate-600">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>Tự luận: <strong>{lesson.essayCount}</strong> câu</span>
          </div>
        </div>

        {/* Mastery Progress Bar */}
        <div className="mt-4">
          <div className="flex justify-between items-center text-xs mb-1">
            <span className="text-slate-500 font-medium">Mức độ thành thạo:</span>
            <span className={`font-bold ${isCompleted ? 'text-emerald-600' : 'text-teal-700'}`}>
              {mastery}% / 80%
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200/50">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isCompleted
                  ? 'bg-emerald-500'
                  : mastery > 50
                  ? 'bg-teal-500'
                  : 'bg-amber-400'
              }`}
              style={{ width: `${Math.min(100, mastery)}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1">
            <span>Đã làm: {attemptsCount} lượt</span>
            {isLocked && <span className="text-amber-600 font-semibold">Cần ≥ 80% bài trước</span>}
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center gap-2">
        <button
          id={`btn-theory-${lesson.id}`}
          onClick={() => onViewTheory(lesson.id)}
          className="flex-1 inline-flex items-center justify-center space-x-1.5 px-3 py-2 bg-white hover:bg-teal-50 text-teal-800 border border-teal-200/80 rounded-xl text-xs font-semibold shadow-sm transition active:scale-95"
        >
          <Sparkles className="w-3.5 h-3.5 text-teal-600" />
          <span>Lý thuyết</span>
        </button>

        {isLocked ? (
          <button
            disabled
            className="flex-1 inline-flex items-center justify-center space-x-1.5 px-3 py-2 bg-slate-200 text-slate-500 rounded-xl text-xs font-semibold cursor-not-allowed"
            title="Đạt ≥ 80% bài trước để mở khóa"
          >
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span>Khóa</span>
          </button>
        ) : (
          <button
            id={`btn-practice-${lesson.id}`}
            onClick={() => onStartExam(lesson.id)}
            className="flex-1 inline-flex items-center justify-center space-x-1.5 px-3 py-2 bg-gradient-to-r from-teal-700 to-teal-800 hover:from-teal-800 hover:to-teal-900 text-white rounded-xl text-xs font-bold shadow transition active:scale-95"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>Luyện tập</span>
          </button>
        )}
      </div>
    </div>
  );
};
