import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import {
  BarChart3,
  Award,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Users,
  ShieldAlert,
  GraduationCap,
  Sparkles,
} from 'lucide-react';

export const StatsDashboard: React.FC = () => {
  const { currentUser, setSelectedLessonId, setActiveTab } = useApp();
  const [studentStats, setStudentStats] = useState<any>(null);
  const [teacherStats, setTeacherStats] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const isTeacherOrAdmin = currentUser.role === 'teacher' || currentUser.role === 'admin';

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        if (isTeacherOrAdmin) {
          const tData = await api.getTeacherStats();
          setTeacherStats(tData.teacherStats);
        }
        const sData = await api.getStudentStats(currentUser.id);
        setStudentStats(sData.stats);
      } catch (err) {
        console.error('Error fetching stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [currentUser.id, currentUser.role, isTeacherOrAdmin]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center text-slate-500 text-xs">
        Đang tổng hợp báo cáo tiến độ và bảng điểm...
      </div>
    );
  }

  return (
    <div id="stats-dashboard-container" className="max-w-6xl mx-auto space-y-8 pb-20">
      {/* Top Header */}
      <div className="bg-white rounded-2xl border border-teal-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-teal-800 text-xs font-bold uppercase tracking-wider mb-1">
            <BarChart3 className="w-4 h-4 text-teal-600" />
            <span>Thống kê học tập & Đánh giá năng lực</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
            {isTeacherOrAdmin ? 'Bảng tổng hợp kết quả toàn khối 12' : `Báo cáo năng lực: ${currentUser.fullName}`}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {isTeacherOrAdmin
              ? 'Theo dõi tỷ lệ hoàn thành, điểm trung bình các lớp và giám sát gian lận'
              : 'Theo dõi tiến độ 6 chương, lịch sử điểm số và các dạng toán cần củng cố'}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="bg-teal-50 text-teal-800 border border-teal-200 text-xs font-bold px-3 py-1.5 rounded-xl">
            Năm học 2025 - 2026
          </span>
        </div>
      </div>

      {/* TEACHER / ADMIN VIEW */}
      {isTeacherOrAdmin && teacherStats && (
        <div className="space-y-6">
          {/* 4 Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-teal-600" /> Tổng học sinh
              </div>
              <div className="text-2xl font-extrabold font-mono text-slate-900 mt-2">
                {teacherStats.totalStudents} <span className="text-xs font-sans text-slate-400 font-normal">học sinh</span>
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Lượt nộp bài
              </div>
              <div className="text-2xl font-extrabold font-mono text-emerald-700 mt-2">
                {teacherStats.totalSubmissions} <span className="text-xs font-sans text-slate-400 font-normal">lượt</span>
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-blue-600" /> Điểm trung bình
              </div>
              <div className="text-2xl font-extrabold font-mono text-blue-700 mt-2">
                {teacherStats.averageScore} <span className="text-xs font-sans text-slate-400 font-normal">/ 10</span>
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-rose-600" /> Cảnh báo vi phạm
              </div>
              <div className="text-2xl font-extrabold font-mono text-rose-700 mt-2">
                {teacherStats.violationsCount} <span className="text-xs font-sans text-slate-400 font-normal">lần</span>
              </div>
            </div>
          </div>

          {/* Class Comparison Chart */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900">
              Tỷ lệ hoàn thành theo lớp (%)
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={teacherStats.classesSummary}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="completionRate" fill="#0D9488" radius={[8, 8, 0, 0]} name="Tỷ lệ hoàn thành (%)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* STUDENT INDIVIDUAL STATS VIEW */}
      {studentStats && (
        <div className="space-y-6">
          {/* Top 4 Student Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-teal-600" /> Bài đã thành thạo (≥80%)
              </div>
              <div className="text-2xl font-extrabold font-mono text-teal-800 mt-2">
                {studentStats.completedLessons}/{studentStats.totalLessons}
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-600" /> Điểm trung bình
              </div>
              <div className="text-2xl font-extrabold font-mono text-emerald-700 mt-2">
                {studentStats.averageScore} <span className="text-xs font-sans text-slate-400 font-normal">/ 10</span>
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-blue-600" /> Thời gian học tập
              </div>
              <div className="text-2xl font-extrabold font-mono text-blue-700 mt-2">
                {studentStats.totalStudyMinutes} <span className="text-xs font-sans text-slate-400 font-normal">phút</span>
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-amber-500" /> Chuỗi học tập
              </div>
              <div className="text-2xl font-extrabold font-mono text-amber-600 mt-2">
                {studentStats.streakDays} <span className="text-xs font-sans text-slate-400 font-normal">ngày liên tục</span>
              </div>
            </div>
          </div>

          {/* Chapter Mastery Bar Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-teal-600" />
                Mức độ thành thạo theo từng chương
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={studentStats.chapterMastery}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis dataKey="title" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="masteryPercent" fill="#14B8A6" radius={[6, 6, 0, 0]} name="Thành thạo (%)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Score History Line Chart */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                Lịch sử điểm số các lượt luyện tập
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={studentStats.scoreHistory}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="score" stroke="#0D9488" strokeWidth={3} dot={{ r: 4 }} name="Điểm số" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Weak Skills Diagnostic Alerts & Badges */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Weak Skills */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  Dạng toán cần luyện tập thêm
                </h3>
                <span className="text-[11px] text-slate-400">Tỷ lệ chính xác &lt; 70%</span>
              </div>

              <div className="space-y-3">
                {studentStats.weakSkills?.map((skill: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/50 flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="text-xs font-bold text-amber-950">{skill.tag}</div>
                      <div className="text-[11px] text-amber-800">
                        Độ chính xác: <strong>{skill.accuracyPercent}%</strong> ({skill.questionCount} câu đã làm)
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedLessonId(skill.lessonId);
                        setActiveTab('lessons');
                      }}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition shadow-xs whitespace-nowrap"
                    >
                      Luyện ngay
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Badges Showcase */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Award className="w-4 h-4 text-teal-600" />
                Huy hiệu & Thành tích đã mở khóa
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {studentStats.badges?.map((b: any) => (
                  <div
                    key={b.id}
                    className="p-4 rounded-xl border border-teal-200 bg-teal-50/40 text-center space-y-2"
                  >
                    <div className="text-3xl">{b.icon}</div>
                    <div className="text-xs font-bold text-teal-950">{b.name}</div>
                    <p className="text-[10px] text-slate-500">{b.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
