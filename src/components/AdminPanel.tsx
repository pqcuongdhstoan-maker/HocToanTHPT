import React from "react";
import { Chapter, StudentProfile } from "../types";
import { Shield, Settings, Database, RefreshCw, Key, CheckCircle, Unlock } from "lucide-react";

interface AdminPanelProps {
  chapters: Chapter[];
  student: StudentProfile;
  onResetProgress: () => void;
  onUnlockAllLevels: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  chapters,
  student,
  onResetProgress,
  onUnlockAllLevels,
}) => {
  const totalQuestions = chapters.reduce(
    (acc, c) => acc + c.lessons.reduce((lAcc, l) => lAcc + l.questions.length, 0),
    0
  );

  return (
    <div className="space-y-6 pb-20 max-w-4xl mx-auto">
      <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 text-xs font-semibold text-slate-300 mb-2">
            <Shield className="w-3.5 h-3.5 text-blue-400" />
            <span>Quản trị Hệ thống (Admin Portal)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black">
            Bảng điều khiển & Cấu hình
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Quản lý tài khoản, dữ liệu ngân hàng câu hỏi, và thiết lập môi trường Gemini API.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* System Stats */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
            <Database className="w-4 h-4 text-blue-600" />
            Thông số cơ sở dữ liệu
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-600">Tổng số chương (10, 11, 12):</span>
              <span className="font-bold text-slate-900">{chapters.length} chương</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-600">Tổng số bài học tự luyện:</span>
              <span className="font-bold text-slate-900">
                {chapters.reduce((a, c) => a + c.lessons.length, 0)} bài
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-600">Tổng số câu hỏi chuẩn 4 phần:</span>
              <span className="font-bold text-blue-700">{totalQuestions} câu hỏi</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-600">Renderer công thức:</span>
              <span className="font-bold text-emerald-700">MathJax v3 (TeX / LaTeX)</span>
            </div>
          </div>
        </div>

        {/* Quick Demo Controls */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
            <Settings className="w-4 h-4 text-purple-600" />
            Tùy chọn Kiểm thử & Trực quan
          </h3>

          <div className="space-y-3">
            <button
              onClick={onUnlockAllLevels}
              className="w-full py-3 px-4 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 text-xs font-bold flex items-center justify-center gap-2 transition-all"
            >
              <Unlock className="w-4 h-4 text-blue-600" />
              <span>Mở khóa tất cả các Level (Demo Mode)</span>
            </button>

            <button
              onClick={onResetProgress}
              className="w-full py-3 px-4 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-800 text-xs font-bold flex items-center justify-center gap-2 transition-all"
            >
              <RefreshCw className="w-4 h-4 text-rose-600" />
              <span>Đặt lại tiến độ học tập (Reset)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
