import React from "react";
import { GradeLevel, UserRole, StudentProfile } from "../types";
import {
  GraduationCap,
  Sparkles,
  Table,
  Shield,
  User,
  LogOut,
  Award,
  Flame,
  BookOpen,
  Bot,
  Key,
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
  activeView: "dashboard" | "practice" | "teacher" | "admin";
  onNavigateHome: () => void;
  onOpenApiKeySettings: () => void;
  hasApiKey: boolean;

  // New Tabs as in the screenshot:
  onOpenGeminiHub: () => void;
  onOpenMarkdownTable: () => void;
  onOpenEquation: () => void;
  onOpenMathTypeOle: () => void;
  onOpenProfile: () => void;
  onOpenUserManagement: () => void;
  onLogout: () => void;

  // Interactive Math Tools
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
  activeView,
  onNavigateHome,
  onOpenApiKeySettings,
  hasApiKey,
  onOpenGeminiHub,
  onOpenMarkdownTable,
  onOpenEquation,
  onOpenMathTypeOle,
  onOpenProfile,
  onOpenUserManagement,
  onLogout,
  onOpenGrapher,
  onOpenOxyz,
  onOpenSpeedrun,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-gradient-to-r from-[#004d40] via-[#00695c] to-[#004d40] text-white border-b border-teal-900/60 shadow-md backdrop-blur-md transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2 sm:gap-3">
          {/* Logo & Teacher Branding */}
          <div
            id="nav_brand_logo"
            onClick={onNavigateHome}
            className="flex items-center gap-2.5 cursor-pointer group select-none shrink-0"
          >
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-teal-200 border border-white/20 shadow-md group-hover:scale-105 transition-transform">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base sm:text-lg tracking-tight text-white">
                  Tự luyện Toán THPT
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-teal-500/30 text-teal-100 font-bold border border-teal-300/30">
                  GDPT 2018
                </span>
              </div>
              <p className="text-[11px] font-medium text-teal-100/80">
                Thầy Phan Quốc Cường • Kết nối tri thức
              </p>
            </div>
          </div>

          {/* Center: Grade Selector & Interactive Math Tools */}
          <div className="hidden xl:flex items-center gap-2 shrink-0">
            {/* Grade Selector Pills */}
            <div className="flex items-center bg-black/20 p-1 rounded-xl border border-white/15">
              {([12, 11, 10] as GradeLevel[]).map((grade) => (
                <button
                  key={grade}
                  id={`grade_btn_${grade}`}
                  onClick={() => onSelectGrade(grade)}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                    currentGrade === grade
                      ? "bg-white text-teal-900 shadow-xs font-extrabold"
                      : "text-teal-100 hover:text-white hover:bg-white/10"
                  }`}
                >
                  Toán {grade}
                </button>
              ))}
            </div>

            {/* Interactive Math Tools */}
            <div className="flex items-center gap-1 bg-black/20 p-1 rounded-xl border border-white/15">
              {onOpenGrapher && (
                <button
                  onClick={onOpenGrapher}
                  title="Khảo sát đồ thị hàm số 2D tương tác"
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold text-teal-100 hover:text-white hover:bg-white/10 transition-all"
                >
                  <LineChart className="w-3.5 h-3.5 text-teal-300" />
                  <span>Đồ thị 2D</span>
                </button>
              )}
              {onOpenOxyz && (
                <button
                  onClick={onOpenOxyz}
                  title="Mô phỏng 3D Không gian Oxyz"
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold text-teal-100 hover:text-white hover:bg-white/10 transition-all"
                >
                  <Box className="w-3.5 h-3.5 text-cyan-300" />
                  <span>3D Oxyz</span>
                </button>
              )}
              {onOpenSpeedrun && (
                <button
                  onClick={onOpenSpeedrun}
                  title="Minigame Đấu trường Toán học 60s"
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-extrabold text-amber-300 hover:text-amber-200 hover:bg-white/10 transition-all"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span>Đấu trường</span>
                </button>
              )}
            </div>
          </div>

          {/* Right Section: The 7 Tabs in the Exact Order as Shown in the Image + Required Settings (API Key) */}
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto py-1">
            {/* 1. ✨ Gemini */}
            <button
              id="nav_tab_gemini"
              onClick={onOpenGeminiHub}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/25 text-white text-xs font-bold transition-all backdrop-blur-xs active:scale-95 group shrink-0 shadow-2xs"
              title="Trợ lý Toán học & Cấu hình Gemini AI"
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-200 group-hover:rotate-12 transition-transform" />
              <span>Gemini</span>
            </button>

            {/* 2. 田 Bảng Markdown */}
            <button
              id="nav_tab_markdown_table"
              onClick={onOpenMarkdownTable}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/25 text-white text-xs font-bold transition-all backdrop-blur-xs active:scale-95 group shrink-0 shadow-2xs"
              title="Trình tạo & Soạn thảo Bảng Markdown (Bảng biến thiên, xác suất, ghép nhóm)"
            >
              <Table className="w-3.5 h-3.5 text-teal-200" />
              <span className="hidden sm:inline">Bảng Markdown</span>
              <span className="sm:hidden">Bảng MD</span>
            </button>

            {/* 3. ∑ Equation */}
            <button
              id="nav_tab_equation"
              onClick={onOpenEquation}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/25 text-white text-xs font-bold transition-all backdrop-blur-xs active:scale-95 group shrink-0 shadow-2xs"
              title="Soạn thảo công thức Toán học trực quan Equation (MathLive & MathJax 3)"
            >
              <span className="font-serif font-black text-sm leading-none text-teal-200">∑</span>
              <span>Equation</span>
            </button>

            {/* 4. { } MathType OLE */}
            <button
              id="nav_tab_mathtype_ole"
              onClick={onOpenMathTypeOle}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/25 text-white text-xs font-bold transition-all backdrop-blur-xs active:scale-95 group shrink-0 shadow-2xs"
              title="Chuyển đổi công thức MathType OLE / Word equations sang LaTeX chuẩn"
            >
              <span className="font-mono font-black text-xs leading-none text-teal-200">&#123; &#125;</span>
              <span className="hidden md:inline">MathType OLE</span>
              <span className="md:hidden">MathType</span>
            </button>

            {/* 5. 👤 zalo2299k@gmail.com */}
            <button
              id="nav_tab_user_profile"
              onClick={onOpenProfile}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/25 text-white text-xs font-bold transition-all backdrop-blur-xs active:scale-95 group shrink-0 shadow-2xs"
              title="Xem thông tin tài khoản & Tiến độ học tập"
            >
              <User className="w-3.5 h-3.5 text-teal-200" />
              <span className="font-mono max-w-[130px] sm:max-w-[170px] truncate">
                {student.email || "zalo2299k@gmail.com"}
              </span>
            </button>

            {/* 6. 🛡️ Quản lý user */}
            <button
              id="nav_tab_user_management"
              onClick={onOpenUserManagement}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/25 text-white text-xs font-bold transition-all backdrop-blur-xs active:scale-95 group shrink-0 shadow-2xs"
              title="Quản lý người dùng, học sinh & phân quyền hệ thống"
            >
              <Shield className="w-3.5 h-3.5 text-teal-200" />
              <span className="hidden sm:inline">Quản lý user</span>
              <span className="sm:hidden">User</span>
            </button>

            {/* 7. [-> Đăng xuất */}
            <button
              id="nav_tab_logout"
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-rose-500/30 border border-white/25 hover:border-rose-300/40 text-white text-xs font-bold transition-all backdrop-blur-xs active:scale-95 group shrink-0 shadow-2xs"
              title="Đăng xuất khỏi tài khoản"
            >
              <LogOut className="w-3.5 h-3.5 text-teal-200 group-hover:text-rose-200" />
              <span>Đăng xuất</span>
            </button>

            {/* Mandatory Settings (API Key) Button per AI_INSTRUCTIONS.md */}
            <button
              id="btn_api_key_settings"
              onClick={onOpenApiKeySettings}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl border border-rose-300/50 bg-rose-500/20 hover:bg-rose-500/30 text-white shadow-xs transition-all active:scale-95 group shrink-0"
              title="Cài đặt Model & API Key Gemini"
            >
              <div className="relative">
                <Key className="w-3.5 h-3.5 text-rose-300 group-hover:rotate-12 transition-transform" />
                <span
                  className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ring-2 ring-[#00594c] ${
                    hasApiKey ? "bg-emerald-400" : "bg-rose-500 animate-ping"
                  }`}
                />
              </div>
              <div className="flex flex-col items-start text-left">
                <span className="text-[10px] font-black uppercase tracking-wider text-rose-200 leading-tight">
                  Settings (API Key)
                </span>
                <span className="text-[9px] font-extrabold text-red-300 leading-none">
                  Lấy API key để sử dụng app
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Tools & Grade bar */}
        <div className="flex xl:hidden items-center justify-between py-2 border-t border-white/15 gap-2 overflow-x-auto">
          <div className="flex items-center gap-1 shrink-0">
            {([12, 11, 10] as GradeLevel[]).map((grade) => (
              <button
                key={grade}
                onClick={() => onSelectGrade(grade)}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                  currentGrade === grade
                    ? "bg-white text-teal-900 shadow-xs"
                    : "bg-white/10 text-teal-100 hover:bg-white/20"
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
                className="px-2 py-1 rounded-lg text-xs font-bold bg-white/10 text-teal-100 hover:bg-white/20"
              >
                Đồ thị 2D
              </button>
            )}
            {onOpenOxyz && (
              <button
                onClick={onOpenOxyz}
                className="px-2 py-1 rounded-lg text-xs font-bold bg-white/10 text-cyan-200 hover:bg-white/20"
              >
                3D Oxyz
              </button>
            )}
            {onOpenSpeedrun && (
              <button
                onClick={onOpenSpeedrun}
                className="px-2 py-1 rounded-lg text-xs font-bold bg-amber-500/20 text-amber-200 hover:bg-amber-500/30"
              >
                Đấu trường
              </button>
            )}
            <div className="flex items-center bg-black/20 p-0.5 rounded-lg border border-white/15">
              <button
                onClick={() => onSelectRole("student")}
                className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                  currentRole === "student" ? "bg-white text-teal-900" : "text-teal-200"
                }`}
              >
                Học sinh
              </button>
              <button
                onClick={() => onSelectRole("teacher")}
                className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                  currentRole === "teacher" ? "bg-white text-teal-900" : "text-teal-200"
                }`}
              >
                Thầy Cường
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
