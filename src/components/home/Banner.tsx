import React from 'react';
import { useApp } from '../../context/AppContext';
import { Sparkles, Search, Filter, CheckCircle2, Lock, Flame } from 'lucide-react';

interface BannerProps {
  selectedSemester: number | 'all';
  setSelectedSemester: (sem: number | 'all') => void;
  selectedChapterId: string | 'all';
  setSelectedChapterId: (chapId: string | 'all') => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: 'all' | 'completed' | 'in_progress' | 'locked';
  setStatusFilter: (filter: 'all' | 'completed' | 'in_progress' | 'locked') => void;
}

export const Banner: React.FC<BannerProps> = ({
  selectedSemester,
  setSelectedSemester,
  selectedChapterId,
  setSelectedChapterId,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
}) => {
  const { chapters, lessons, studentProgress, currentUser } = useApp();

  // Calculate overall mastery
  const completedCount = Object.values(studentProgress).filter((p: any) => p?.status === 'completed').length;
  const totalLessonsCount = lessons.length || 19;

  const overallMasteryPercent = Math.round((completedCount / totalLessonsCount) * 100);

  const filteredChapters = selectedSemester === 'all'
    ? chapters
    : chapters.filter((c) => (selectedSemester === 1 ? c.semester === 'HK1' : c.semester === 'HK2'));

  return (
    <div id="home-banner" className="bg-gradient-to-r from-teal-900 via-teal-800 to-teal-950 text-white rounded-3xl p-6 sm:p-8 mb-8 shadow-xl border border-teal-700/50 relative overflow-hidden">
      {/* Decorative backdrop elements */}
      <div className="absolute -right-12 -top-12 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute right-1/3 -bottom-16 w-80 h-80 bg-teal-400/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top Banner Row: Greeting & Teacher Inspiration */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
        <div className="max-w-2xl">
          <div className="inline-flex items-center space-x-2 bg-teal-500/20 border border-teal-400/30 text-teal-200 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5 text-teal-300" />
            <span>Chương trình Giáo dục Phổ thông 2018</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Luyện tập Toán 12 Chuẩn Cấu Trúc Đề Mới
          </h1>
          <p className="mt-2 text-sm sm:text-base text-teal-100/90 leading-relaxed">
            Học sâu hiểu chắc 4 dạng toán: Trắc nghiệm 4 lựa chọn, Đúng/Sai, Trả lời ngắn và Tự luận.
            Đạt <strong className="text-amber-300 font-bold">≥ 80% điểm bài trước</strong> để mở khóa bài học kế tiếp!
          </p>
        </div>

        {/* Overall Progress Gauge Widget */}
        <div className="bg-teal-950/70 border border-teal-700/80 rounded-2xl p-5 backdrop-blur-md min-w-[260px] flex-shrink-0 shadow-lg">
          <div className="flex items-center justify-between text-xs text-teal-300 mb-2">
            <span className="font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Tiến độ toàn khóa
            </span>
            <span className="font-mono font-bold text-white text-sm">{completedCount}/{totalLessonsCount} bài</span>
          </div>

          <div className="w-full bg-teal-900/80 rounded-full h-3 p-0.5 border border-teal-700/50 mb-2">
            <div
              className="bg-gradient-to-r from-emerald-400 to-teal-300 h-full rounded-full transition-all duration-500 shadow-sm"
              style={{ width: `${overallMasteryPercent}%` }}
            />
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-teal-300">Độ thành thạo:</span>
            <span className="text-emerald-300 font-bold text-sm">{overallMasteryPercent}%</span>
          </div>
        </div>
      </div>

      {/* Interactive Controls & Filters */}
      <div className="mt-8 pt-6 border-t border-teal-700/60 space-y-4 relative z-10">
        {/* Row 1: Semester Tabs & Search Input */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          {/* Semester Selector */}
          <div className="flex items-center bg-teal-950/80 p-1 rounded-xl border border-teal-700/80 shadow-inner">
            <button
              onClick={() => {
                setSelectedSemester('all');
                setSelectedChapterId('all');
              }}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition ${
                selectedSemester === 'all'
                  ? 'bg-teal-600 text-white shadow-md'
                  : 'text-teal-300 hover:text-white'
              }`}
            >
              Cả năm (6 Chương)
            </button>
            <button
              onClick={() => {
                setSelectedSemester(1);
                setSelectedChapterId('all');
              }}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition ${
                selectedSemester === 1
                  ? 'bg-teal-600 text-white shadow-md'
                  : 'text-teal-300 hover:text-white'
              }`}
            >
              Học kì I (Chương 1 - 3)
            </button>
            <button
              onClick={() => {
                setSelectedSemester(2);
                setSelectedChapterId('all');
              }}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition ${
                selectedSemester === 2
                  ? 'bg-teal-600 text-white shadow-md'
                  : 'text-teal-300 hover:text-white'
              }`}
            >
              Học kì II (Chương 4 - 6)
            </button>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-teal-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm bài học, chủ đề (ví dụ: Đạo hàm, Tích phân, Oxyz...)"
              className="w-full pl-10 pr-4 py-2 bg-teal-950/80 border border-teal-700/80 rounded-xl text-sm text-white placeholder-teal-400/70 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-teal-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Chapter Selector Buttons */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-thin">
          <button
            onClick={() => setSelectedChapterId('all')}
            className={`whitespace-nowrap px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition ${
              selectedChapterId === 'all'
                ? 'bg-teal-400 text-teal-950 border-teal-300 shadow'
                : 'bg-teal-900/50 text-teal-200 border-teal-700/60 hover:bg-teal-800'
            }`}
          >
            Tất cả các chương
          </button>
          {filteredChapters.map((chap) => {
            const isSelected = selectedChapterId === chap.id;
            return (
              <button
                key={chap.id}
                onClick={() => setSelectedChapterId(chap.id)}
                className={`whitespace-nowrap px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition flex items-center space-x-1.5 ${
                  isSelected
                    ? 'bg-teal-400 text-teal-950 border-teal-300 shadow'
                    : 'bg-teal-900/50 text-teal-200 border-teal-700/60 hover:bg-teal-800'
                }`}
              >
                <span>Chương {chap.number}: {chap.title}</span>
              </button>
            );
          })}
        </div>

        {/* Row 3: Status Filter Chips */}
        <div className="flex items-center justify-between text-xs pt-1">
          <div className="flex items-center space-x-2">
            <span className="text-teal-300 font-medium flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Lọc trạng thái:
            </span>
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded-md transition ${
                statusFilter === 'all'
                  ? 'bg-white text-teal-950 font-bold'
                  : 'text-teal-200 hover:text-white hover:bg-teal-900'
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-2.5 py-1 rounded-md transition ${
                statusFilter === 'completed'
                  ? 'bg-emerald-400 text-teal-950 font-bold'
                  : 'text-teal-200 hover:text-white hover:bg-teal-900'
              }`}
            >
              🎉 Đã đạt chuẩn (≥80%)
            </button>
            <button
              onClick={() => setStatusFilter('in_progress')}
              className={`px-2.5 py-1 rounded-md transition ${
                statusFilter === 'in_progress'
                  ? 'bg-amber-400 text-slate-900 font-bold'
                  : 'text-teal-200 hover:text-white hover:bg-teal-900'
              }`}
            >
              ⚡ Đang luyện tập
            </button>
            <button
              onClick={() => setStatusFilter('locked')}
              className={`px-2.5 py-1 rounded-md transition ${
                statusFilter === 'locked'
                  ? 'bg-slate-300 text-slate-900 font-bold'
                  : 'text-teal-200 hover:text-white hover:bg-teal-900'
              }`}
            >
              🔒 Chưa mở khóa
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
