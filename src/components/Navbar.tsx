import {
  GraduationCap,
  Sparkles,
  Shield,
  User,
  Award,
  Flame,
  BookOpen,
  Bot,
  Key,
  Settings,
  LineChart,
  Box,
  Zap,
} from "lucide-react";

interface NavbarProps {
  currentGrade: GradeLevel;
  onSelectGrade: (grade: GradeLevel) => void;
  currentRole: UserRole;
  onSelectRole: (role: UserRole) => void;
  student: StudentProfile;
  onOpenAiChat: () => void;
  activeView: "dashboard" | "practice" | "teacher" | "admin";
  onNavigateHome: () => void;
  onOpenApiKeySettings: () => void;
  hasApiKey: boolean;
  onOpenGrapher?: () => void;
  onOpenOxyz?: () => void;
  onOpenSpeedrun?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentGrade,
  onSelectGrade,
  currentRole,
  onSelectRole,
  student,
  onOpenAiChat,
  onNavigateHome,
  onOpenApiKeySettings,
  hasApiKey,
  onOpenGrapher,
  onOpenOxyz,
  onOpenSpeedrun,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2 sm:gap-3">
          {/* Logo & Teacher Branding */}
          <div
            id="nav_brand_logo"
            onClick={onNavigateHome}
            className="flex items-center gap-2.5 cursor-pointer group select-none shrink-0"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 via-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base sm:text-lg tracking-tight bg-gradient-to-r from-blue-800 to-indigo-700 bg-clip-text text-transparent">
                  Tự luyện Toán THPT
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold border border-blue-200">
                  GDPT 2018
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-500">
                Thầy Phan Quốc Cường • Kết nối tri thức
              </p>
            </div>
          </div>

          {/* Center: Grade Selector & Interactive Math Tools */}
          <div className="hidden lg:flex items-center gap-2">
            {/* Grade Selector Pills */}
            <div className="flex items-center bg-slate-100/90 p-1 rounded-xl border border-slate-200/70">
              {([12, 11, 10] as GradeLevel[]).map((grade) => (
                <button
                  key={grade}
                  id={`grade_btn_${grade}`}
                  onClick={() => onSelectGrade(grade)}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                    currentGrade === grade
                      ? "bg-white text-blue-700 shadow-xs font-extrabold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                  }`}
                >
                  Toán {grade}
                </button>
              ))}
            </div>

            {/* Interactive Math Tools (SKILL EDUCATION) */}
            <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200/60">
              {onOpenGrapher && (
                <button
                  onClick={onOpenGrapher}
                  title="Khảo sát đồ thị hàm số 2D tương tác"
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-slate-700 hover:text-blue-700 hover:bg-white transition-all"
                >
                  <LineChart className="w-3.5 h-3.5 text-blue-600" />
                  <span>Đồ thị 2D</span>
                </button>
              )}
              {onOpenOxyz && (
                <button
                  onClick={onOpenOxyz}
                  title="Mô phỏng 3D Không gian Oxyz"
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-slate-700 hover:text-indigo-700 hover:bg-white transition-all"
                >
                  <Box className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Hình 3D Oxyz</span>
                </button>
              )}
              {onOpenSpeedrun && (
                <button
                  onClick={onOpenSpeedrun}
                  title="Minigame Đấu trường Toán học 60s"
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-extrabold text-amber-700 hover:text-amber-800 hover:bg-amber-50 transition-all"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span>Đấu trường 60s</span>
                </button>
              )}
            </div>
          </div>

          {/* Actions: Settings (API Key), AI Assistant, Stats & Role Switcher */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Mandatory Settings (API Key) Button per AI_INSTRUCTIONS.md */}
            <button
              id="btn_api_key_settings"
              onClick={onOpenApiKeySettings}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50/80 hover:bg-rose-100/90 text-rose-700 shadow-xs transition-all active:scale-95 group"
              title="Cài đặt Model & API Key Gemini"
            >
              <div className="relative">
                <Key className="w-3.5 h-3.5 text-rose-600 group-hover:rotate-12 transition-transform" />
                <span
                  className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ring-2 ring-white ${
                    hasApiKey ? "bg-emerald-500" : "bg-rose-500 animate-ping"
                  }`}
                />
              </div>
              <div className="flex flex-col items-start text-left">
                <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 leading-tight">
                  Settings (API Key)
                </span>
                <span className="text-[10px] font-extrabold text-red-600 leading-none">
                  Lấy API key để sử dụng app
                </span>
              </div>
            </button>

            {/* Ask AI button */}
            <button
              id="open_ai_assistant_btn"
              onClick={onOpenAiChat}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white text-xs font-bold shadow-xs hover:shadow-md hover:opacity-95 transition-all active:scale-95"
            >
              <Bot className="w-4 h-4 animate-pulse" />
              <span className="hidden sm:inline">Thầy Cường AI</span>
            </button>

            {/* Student Stats (Streak & Points) */}
            {currentRole === "student" && (
              <div className="hidden xl:flex items-center gap-1.5 pl-2 border-l border-slate-200">
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200/70">
                  <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span>{student.streakDays}n</span>
                </div>
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200/70">
                  <Award className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{student.points}đ</span>
                </div>
              </div>
            )}

            {/* Role Switcher Menu */}
            <div className="relative flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                id="role_student_btn"
                title="Giao diện Học sinh"
                onClick={() => onSelectRole("student")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  currentRole === "student"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Học sinh</span>
              </button>
              <button
                id="role_teacher_btn"
                title="Giao diện Giáo viên (Thầy Cường)"
                onClick={() => onSelectRole("teacher")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  currentRole === "teacher"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Thầy Cường</span>
              </button>
              <button
                id="role_admin_btn"
                title="Quản trị hệ thống"
                onClick={() => onSelectRole("admin")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  currentRole === "admin"
                    ? "bg-slate-800 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Admin</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Tools & Grade bar */}
        <div className="flex lg:hidden items-center justify-between py-2 border-t border-slate-100 gap-2 overflow-x-auto">
          <div className="flex items-center gap-1">
            {([12, 11, 10] as GradeLevel[]).map((grade) => (
              <button
                key={grade}
                onClick={() => onSelectGrade(grade)}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                  currentGrade === grade
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-700"
                }`}
              >
                Lớp {grade}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {onOpenGrapher && (
              <button
                onClick={onOpenGrapher}
                className="px-2 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700"
              >
                Đồ thị 2D
              </button>
            )}
            {onOpenOxyz && (
              <button
                onClick={onOpenOxyz}
                className="px-2 py-1 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-700"
              >
                3D Oxyz
              </button>
            )}
            {onOpenSpeedrun && (
              <button
                onClick={onOpenSpeedrun}
                className="px-2 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-800"
              >
                Đấu trường
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
