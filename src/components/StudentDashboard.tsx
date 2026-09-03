import React from "react";
import { Chapter, Lesson, StudentProfile, GradeLevel } from "../types";
import { MathRenderer } from "../utils/mathJaxHelper";
import {
  Lock,
  Unlock,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Award,
  AlertCircle,
  FileCheck,
  Brain,
  Layers,
  ChevronRight,
  BookOpen,
  Upload,
  Bot,
  Sliders,
  MessageSquare,
  LineChart,
  Box,
  Zap,
  Compass,
  Download,
} from "lucide-react";

interface StudentDashboardProps {
  chapters: Chapter[];
  currentGrade: GradeLevel;
  student: StudentProfile;
  onSelectLesson: (lesson: Lesson) => void;
  onOpenAiAssistant: () => void;
  onOpenDocxImport?: (lesson: Lesson) => void;
  onOpenMatrixGenerator?: (lesson?: Lesson) => void;
  onOpenGrapher?: () => void;
  onOpenOxyz?: () => void;
  onOpenSpeedrun?: () => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  chapters,
  currentGrade,
  student,
  onSelectLesson,
  onOpenAiAssistant,
  onOpenDocxImport,
  onOpenMatrixGenerator,
  onOpenGrapher,
  onOpenOxyz,
  onOpenSpeedrun,
}) => {
  const filteredChapters = chapters.filter((c) => c.grade === currentGrade);

  // Helper: check if a lesson is unlocked
  // Rule: Lesson 1 of Chapter 1 is unlocked.
  // For lesson (i), it is unlocked if lesson (i-1) in the sequence has bestScore >= 80%.
  const isLessonUnlocked = (lesson: Lesson, allLessonsInOrder: Lesson[]): boolean => {
    const idx = allLessonsInOrder.findIndex((l) => l.id === lesson.id);
    if (idx <= 0) return true; // first lesson is unlocked

    const prevLesson = allLessonsInOrder[idx - 1];
    const prevProgress = student.progress[prevLesson.id];
    return !!(prevProgress && prevProgress.bestScore >= prevLesson.requiredPassPercentage);
  };

  // Flatten all lessons in order for current grade
  const allGradeLessons: Lesson[] = filteredChapters.flatMap((c) => c.lessons);

  // Calculate statistics
  const totalLessons = allGradeLessons.length;
  const completedLessons = allGradeLessons.filter((l) => {
    const p = student.progress[l.id];
    return p && p.bestScore >= l.requiredPassPercentage;
  }).length;
  const completionRate = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  // Average score
  const scores = allGradeLessons
    .map((l) => student.progress[l.id]?.bestScore)
    .filter((s): s is number => typeof s === "number");
  const avgScore = scores.length > 0 ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : 0;

  return (
    <div className="space-y-8 pb-16">
      {/* Personalized Welcome Greeting Card from Thầy Cường */}
      <div
        id="student_welcome_banner"
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-700 via-indigo-700 to-indigo-900 text-white p-6 sm:p-8 shadow-xl shadow-blue-900/10 border border-blue-500/30"
      >
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-12 w-48 h-48 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-blue-100">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Chương trình Toán THPT GDPT 2018 • Toán {currentGrade}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Chào <span className="text-amber-300 underline decoration-amber-400/50">{student.name}</span>! 👋
            </h1>

            <p className="text-blue-100/90 text-sm sm:text-base leading-relaxed">
              Thầy Cường đã tích hợp tính năng <strong className="text-white">Chat Box AI trực tiếp ở Trang chủ</strong>,{" "}
              <strong className="text-white">Nạp đề từ file Word (MathType)</strong> và{" "}
              <strong className="text-amber-300">AI Soạn đề theo ma trận</strong> cho từng bài học. Em hãy luyện tập chăm chỉ nhé!
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-2.5">
              <button
                id="banner_matrix_gen_btn"
                onClick={() => onOpenMatrixGenerator && onOpenMatrixGenerator(allGradeLessons[0])}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 text-xs sm:text-sm font-extrabold hover:brightness-105 shadow-md transition-all active:scale-95"
              >
                <Sparkles className="w-4 h-4 text-slate-950" />
                <span>⚡ AI Soạn đề theo Ma trận</span>
              </button>

              <a
                href="#home_ai_chatbox"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/15 backdrop-blur-md border border-white/20 text-white text-xs sm:text-sm font-bold hover:bg-white/25 shadow-xs transition-all active:scale-95"
              >
                <MessageSquare className="w-4 h-4 text-amber-300" />
                <span>Hỏi đáp Thầy Cường AI</span>
              </a>
            </div>
          </div>

          {/* Quick Stat Pill Widget */}
          <div className="grid grid-cols-3 md:grid-cols-1 gap-3 sm:gap-4 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 min-w-[240px]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-400/20 flex items-center justify-center text-amber-300">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] text-blue-200 font-medium">Tiến độ mở khóa</p>
                <p className="text-lg font-black text-white">{completionRate}%</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-400/20 flex items-center justify-center text-emerald-300">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] text-blue-200 font-medium">Điểm trung bình</p>
                <p className="text-lg font-black text-white">{avgScore} / 100</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-400/20 flex items-center justify-center text-indigo-300">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] text-blue-200 font-medium">Bài đã chinh phục</p>
                <p className="text-lg font-black text-white">
                  {completedLessons}/{totalLessons}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>



      {/* Structure Guide: 4 Parts of GDPT 2018 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-blue-300 transition-colors">
          <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-wider mb-1">
            <span className="w-5 h-5 rounded-md bg-blue-100 flex items-center justify-center text-xs font-black">I</span>
            <span>Phần I</span>
          </div>
          <h4 className="text-sm font-bold text-slate-800">Trắc nghiệm 4 lựa chọn</h4>
          <p className="text-xs text-slate-500 mt-1">Chọn 1 đáp án đúng trong A, B, C, D</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-indigo-300 transition-colors">
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider mb-1">
            <span className="w-5 h-5 rounded-md bg-indigo-100 flex items-center justify-center text-xs font-black">II</span>
            <span>Phần II</span>
          </div>
          <h4 className="text-sm font-bold text-slate-800">Câu hỏi Đúng / Sai</h4>
          <p className="text-xs text-slate-500 mt-1">Xét 4 mệnh đề độc lập a, b, c, d</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-purple-300 transition-colors">
          <div className="flex items-center gap-2 text-purple-600 font-bold text-xs uppercase tracking-wider mb-1">
            <span className="w-5 h-5 rounded-md bg-purple-100 flex items-center justify-center text-xs font-black">III</span>
            <span>Phần III</span>
          </div>
          <h4 className="text-sm font-bold text-slate-800">Trả lời ngắn</h4>
          <p className="text-xs text-slate-500 mt-1">Điền số thực, phân số, tọa độ</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-emerald-300 transition-colors">
          <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs uppercase tracking-wider mb-1">
            <span className="w-5 h-5 rounded-md bg-emerald-100 flex items-center justify-center text-xs font-black">IV</span>
            <span>Phần IV</span>
          </div>
          <h4 className="text-sm font-bold text-slate-800">Tự luận & Vận dụng</h4>
          <p className="text-xs text-slate-500 mt-1">Trình bày lời giải + AI chấm theo bước</p>
        </div>
      </div>

      {/* SKILL EDUCATION: Interactive Math Tools & Radar Competency Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Launch Educational Skills Cards */}
        <div className="lg:col-span-2 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 text-white shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center border border-amber-400/30">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-black">Bộ Công Cụ Toán Học Đột Phá</h3>
                <p className="text-xs text-indigo-200">Trực quan hóa hình học & gamification GDPT 2018</p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-slate-300 border border-white/15">
              SKILL EDUCATION
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            {/* 2D Grapher */}
            <div
              onClick={onOpenGrapher}
              className="cursor-pointer p-4 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 hover:border-blue-400/50 transition-all group"
            >
              <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
                <LineChart className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-black text-white group-hover:text-blue-200">
                Khảo Sát Đồ Thị 2D
              </h4>
              <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                Khảo sát cực trị, tiệm cận đứng, ngang, xiên cho hàm bậc 3 & phân thức.
              </p>
            </div>

            {/* 3D Oxyz */}
            <div
              onClick={onOpenOxyz}
              className="cursor-pointer p-4 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 hover:border-indigo-400/50 transition-all group"
            >
              <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
                <Box className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-black text-white group-hover:text-indigo-200">
                Không Gian 3D Oxyz
              </h4>
              <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                Mô phỏng xoay 360° điểm, vectơ, mặt phẳng & tính khoảng cách $d(A, \\alpha)$.
              </p>
            </div>

            {/* Speedrun Math */}
            <div
              onClick={onOpenSpeedrun}
              className="cursor-pointer p-4 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 hover:border-amber-400/50 transition-all group"
            >
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
                <Zap className="w-5 h-5 fill-amber-300" />
              </div>
              <h4 className="text-xs font-black text-white group-hover:text-amber-200">
                Đấu Trường 60 Giây
              </h4>
              <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                Thử thách phản xạ tính nhẩm đạo hàm, nguyên hàm, giữ combo nhân điểm!
              </p>
            </div>
          </div>
        </div>

        {/* 5-Competency Assessment Card (GDPT 2018) */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                <Brain className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-900">5 Năng Lực Toán GDPT 2018</h4>
                <p className="text-[10px] text-slate-500">Đánh giá chuẩn năng lực cốt lõi</p>
              </div>
            </div>
            <span className="text-xs font-black text-purple-700">
              {completionRate >= 80 ? "Xuất sắc" : "Đang tích lũy"}
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div>
              <div className="flex justify-between font-bold text-slate-700 mb-1 text-[11px]">
                <span>1. Tư duy & Lập luận toán học</span>
                <span className="text-blue-700">85%</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-blue-600 h-full rounded-full" style={{ width: "85%" }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between font-bold text-slate-700 mb-1 text-[11px]">
                <span>2. Mô hình hóa toán học</span>
                <span className="text-indigo-700">75%</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-indigo-600 h-full rounded-full" style={{ width: "75%" }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between font-bold text-slate-700 mb-1 text-[11px]">
                <span>3. Giải quyết vấn đề toán học</span>
                <span className="text-emerald-700">{Math.min(100, completionRate + 15)}%</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-600 h-full rounded-full"
                  style={{ width: `${Math.min(100, completionRate + 15)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between font-bold text-slate-700 mb-1 text-[11px]">
                <span>4. Giao tiếp toán học</span>
                <span className="text-purple-700">80%</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-purple-600 h-full rounded-full" style={{ width: "80%" }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between font-bold text-slate-700 mb-1 text-[11px]">
                <span>5. Sử dụng công cụ học toán</span>
                <span className="text-amber-700">95%</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full" style={{ width: "95%" }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chapters & Lessons Roadmap */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Lộ trình bài học Toán {currentGrade}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              SGK Kết nối tri thức với cuộc sống • Hệ thống mở khóa tuần tự $\ge 80\%$
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {filteredChapters.map((chapter) => (
            <div
              key={chapter.id}
              className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden transition-all hover:shadow-md"
            >
              {/* Chapter Header */}
              <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-black text-sm border border-blue-200">
                    C{chapter.order}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">
                      {chapter.title}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-1">
                      {chapter.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                  <span className="px-2.5 py-1 rounded-full bg-slate-200/80">
                    {chapter.lessons.length} bài tự luyện
                  </span>
                </div>
              </div>

              {/* Lessons Grid in this Chapter */}
              <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {chapter.lessons.map((lesson) => {
                  const unlocked = isLessonUnlocked(lesson, allGradeLessons);
                  const progress = student.progress[lesson.id];
                  const hasPassed = progress && progress.bestScore >= lesson.requiredPassPercentage;
                  const score = progress?.bestScore;

                  return (
                    <div
                      key={lesson.id}
                      id={`lesson_card_${lesson.id}`}
                      className={`relative rounded-2xl p-5 border transition-all flex flex-col justify-between ${
                        unlocked
                          ? hasPassed
                            ? "bg-emerald-50/40 border-emerald-200/90 hover:border-emerald-400 hover:shadow-sm"
                            : "bg-white border-slate-200 hover:border-blue-400 hover:shadow-md"
                          : "bg-slate-100/70 border-slate-200/70 opacity-75 cursor-not-allowed"
                      }`}
                    >
                      <div>
                        {/* Top Tag & Status */}
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-1.5">
                            {unlocked ? (
                              hasPassed ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-300/50">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  Đã vượt qua ({score}%)
                                </span>
                              ) : progress ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold border border-amber-300/50">
                                  <AlertCircle className="w-3 h-3 text-amber-600" />
                                  Chưa đạt ({score}% / 80%)
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[11px] font-bold border border-blue-200/60">
                                  <Unlock className="w-3 h-3" />
                                  Sẵn sàng
                                </span>
                              )
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-600 text-[11px] font-bold">
                                <Lock className="w-3 h-3" />
                                Đang khóa (Cần $\ge 80\%$ bài trước)
                              </span>
                            )}
                          </div>

                          <span className="text-xs text-slate-400 font-semibold">
                            {lesson.durationMinutes} phút
                          </span>
                        </div>

                        {/* Title & Subtitle */}
                        <h4 className="font-extrabold text-slate-900 text-base leading-snug">
                          {lesson.title}
                        </h4>
                        <p className="text-xs font-medium text-slate-500 mt-1 line-clamp-2">
                          {lesson.subtitle}
                        </p>

                        {/* Granular MathType Docx & Matrix Generator Buttons for this lesson */}
                        <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center gap-2">
                          {onOpenDocxImport && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenDocxImport(lesson);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-bold border border-blue-200 transition-colors"
                              title="Nạp đề từ file Word MathType, PDF hoặc soạn thảo công thức trực quan vào bài này"
                            >
                              <Upload className="w-3 h-3 text-blue-600" />
                              <span>Nạp đề (Word / PDF)</span>
                            </button>
                          )}

                          {onOpenMatrixGenerator && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenMatrixGenerator(lesson);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 text-[11px] font-bold border border-purple-200 transition-colors"
                              title="AI soạn đề theo ma trận cho bài học này"
                            >
                              <Sparkles className="w-3 h-3 text-purple-600" />
                              <span>AI Ma trận</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Bottom Action */}
                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-1 text-[11px] text-slate-500">
                          <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                          <span>{lesson.practiceTests?.length || 2} đề tự luyện • {lesson.questions.length} câu</span>
                        </div>

                        {unlocked ? (
                          <button
                            id={`start_lesson_btn_${lesson.id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectLesson(lesson);
                            }}
                            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                              hasPassed
                                ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                                : "bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
                            }`}
                          >
                            <span>Xem các đề luyện</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            disabled
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-200 text-slate-400 cursor-not-allowed"
                          >
                            <Lock className="w-3 h-3" />
                            <span>Bị khóa</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
