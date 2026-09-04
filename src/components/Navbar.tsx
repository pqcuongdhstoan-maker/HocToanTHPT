import React, { useState, useRef, useEffect } from "react";
import { GradeLevel, UserRole, StudentProfile } from "../types";
import {
  GraduationCap,
  Sparkles,
  Table,
  Shield,
  User,
  LogOut,
  BookOpen,
  Key,
  LineChart,
  Box,
  Zap,
  ChevronDown,
  Check,
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

  // New login modal trigger
  onOpenLogin?: (role: "student" | "teacher") => void;

  // Tools
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
  onOpenLogin,
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
  const [isGradeOpen, setIsGradeOpen] = useState<boolean>(false);
  const [isToolsOpen, setIsToolsOpen] = useState<boolean>(false);

  const gradeDropdownRef = useRef<HTMLDivElement>(null);
  const toolsDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        gradeDropdownRef.current &&
        !gradeDropdownRef.current.contains(event.target as Node)
      ) {
        setIsGradeOpen(false);
      }
      if (
        toolsDropdownRef.current &&
        !toolsDropdownRef.current.contains(event.target as Node)
      ) {
        setIsToolsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 shadow-md">
      {/* 1. Top Accent Blue Band (Matching screenshot) */}
      <div className="h-1.5 bg-[#0077b6] w-full" />

      {/* 2. Main Header Bar (White Background matching uploaded image) */}
      <div className="bg-white border-b border-slate-200/90 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20 gap-2 sm:gap-4">
            {/* Left: Branding & Logo */}
            <div
              id="nav_brand_logo"
              onClick={onNavigateHome}
              className="flex items-center gap-3 cursor-pointer group select-none shrink-0"
            >
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-purple-700 via-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform shrink-0">
                <GraduationCap className="w-6 h-6 text-amber-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-base sm:text-lg lg:text-xl tracking-tight text-slate-900 uppercase">
                    HỌC TOÁN CÙNG THẦY CƯỜNG
                  </span>
                  <span className="hidden md:inline-block text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-200">
                    GDPT 2018
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs font-medium text-slate-500">
                  Luyện thi THPT • Hệ thống học tập thông minh
                </p>
              </div>
            </div>

            {/* Center: Dropdowns for TOÁN THPT and BỘ CÔNG CỤ ĐỘT PHÁ */}
            <div className="hidden lg:flex items-center gap-3 shrink-0">
              {/* Dropdown 1: TOÁN THPT (gộp toán 10, toán 11, toán 12 với mũi tên sổ xuống) */}
              <div className="relative" ref={gradeDropdownRef}>
                <button
                  id="dropdown_btn_toan_thpt"
                  type="button"
                  onClick={() => {
                    setIsGradeOpen(!isGradeOpen);
                    setIsToolsOpen(false);
                  }}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-extrabold text-xs tracking-wide uppercase transition-all border ${
                    isGradeOpen
                      ? "bg-blue-50 border-blue-400 text-blue-800 shadow-sm"
                      : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700 hover:text-slate-900"
                  }`}
                  title="Chọn khối lớp: Toán 10, Toán 11, Toán 12"
                >
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  <span>TOÁN THPT</span>
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-blue-600 text-white font-black tracking-normal">
                    Lớp {currentGrade}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${
                      isGradeOpen ? "rotate-180 text-blue-600" : ""
                    }`}
                  />
                </button>

                {/* Dropdown Panel: Toán 12, Toán 11, Toán 10 */}
                {isGradeOpen && (
                  <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200/90 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-3.5 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 border-b border-slate-100 mb-1">
                      CHỌN KHỐI LỚP TOÁN THPT
                    </div>
                    {([12, 11, 10] as GradeLevel[]).map((grade) => (
                      <button
                        key={grade}
                        onClick={() => {
                          onSelectGrade(grade);
                          setIsGradeOpen(false);
                        }}
                        className={`w-full text-left px-3.5 py-2.5 flex items-center justify-between hover:bg-blue-50 transition-colors ${
                          currentGrade === grade ? "bg-blue-50/70 font-extrabold" : ""
                        }`}
                      >
                        <div>
                          <div className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                            <span>Toán {grade}</span>
                            {grade === 12 && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-bold">
                                Trọng tâm thi THPT
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {grade === 12
                              ? "Hàm số, Oxyz, Tích phân, Xác suất"
                              : grade === 11
                              ? "Lượng giác, Cấp số, Đạo hàm, Hình không gian"
                              : "Mệnh đề, Tập hợp, Bất phương trình, Vectơ"}
                          </div>
                        </div>
                        {currentGrade === grade && (
                          <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 ml-2">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Dropdown 2: BỘ CÔNG CỤ ĐỘT PHÁ (gộp lại giống cái kia) */}
              <div className="relative" ref={toolsDropdownRef}>
                <button
                  id="dropdown_btn_bo_cong_cu"
                  type="button"
                  onClick={() => {
                    setIsToolsOpen(!isToolsOpen);
                    setIsGradeOpen(false);
                  }}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-extrabold text-xs tracking-wide uppercase transition-all border ${
                    isToolsOpen
                      ? "bg-amber-50 border-amber-400 text-amber-900 shadow-sm"
                      : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700 hover:text-slate-900"
                  }`}
                  title="Bộ công cụ hình học & tương tác toán học đột phá"
                >
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>BỘ CÔNG CỤ ĐỘT PHÁ</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${
                      isToolsOpen ? "rotate-180 text-amber-600" : ""
                    }`}
                  />
                </button>

                {/* Dropdown Panel for Interactive Tools */}
                {isToolsOpen && (
                  <div className="absolute top-full left-0 mt-2 w-84 bg-white rounded-2xl shadow-2xl border border-slate-200/90 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-3.5 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 border-b border-slate-100 mb-1">
                      CÔNG CỤ TOÁN HỌC TRỰC QUAN GDPT 2018
                    </div>
                    {onOpenGrapher && (
                      <button
                        onClick={() => {
                          onOpenGrapher();
                          setIsToolsOpen(false);
                        }}
                        className="w-full text-left px-3.5 py-2 flex items-start gap-2.5 hover:bg-blue-50 transition-colors group"
                      >
                        <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                          <LineChart className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="text-xs font-black text-slate-800 group-hover:text-blue-600">
                            Khảo Sát Đồ Thị 2D
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Cực trị, tiệm cận đứng, ngang, xiên
                          </div>
                        </div>
                      </button>
                    )}
                    {onOpenOxyz && (
                      <button
                        onClick={() => {
                          onOpenOxyz();
                          setIsToolsOpen(false);
                        }}
                        className="w-full text-left px-3.5 py-2 flex items-start gap-2.5 hover:bg-indigo-50 transition-colors group"
                      >
                        <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                          <Box className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="text-xs font-black text-slate-800 group-hover:text-indigo-600">
                            Không Gian 3D Oxyz
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Mô phỏng xoay 360° điểm, vectơ, mặt phẳng
                          </div>
                        </div>
                      </button>
                    )}
                    {onOpenSpeedrun && (
                      <button
                        onClick={() => {
                          onOpenSpeedrun();
                          setIsToolsOpen(false);
                        }}
                        className="w-full text-left px-3.5 py-2 flex items-start gap-2.5 hover:bg-amber-50 transition-colors group"
                      >
                        <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                          <Zap className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                        </div>
                        <div>
                          <div className="text-xs font-black text-slate-800 group-hover:text-amber-600">
                            Đấu Trường Toán Học 60s
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Minigame phản xạ giải toán thần tốc 60 giây
                          </div>
                        </div>
                      </button>
                    )}

                    <div className="px-3.5 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 border-t border-b border-slate-100 my-1">
                      TIỆN ÍCH SOẠN THẢO & AI
                    </div>

                    <button
                      onClick={() => {
                        onOpenGeminiHub();
                        setIsToolsOpen(false);
                      }}
                      className="w-full text-left px-3.5 py-2 flex items-center gap-2.5 hover:bg-teal-50 transition-colors group"
                    >
                      <Sparkles className="w-4 h-4 text-teal-600 shrink-0" />
                      <span className="text-xs font-bold text-slate-800 group-hover:text-teal-700">
                        ✨ Trợ lý Gemini AI
                      </span>
                    </button>

                    <button
                      onClick={() => {
                        onOpenMarkdownTable();
                        setIsToolsOpen(false);
                      }}
                      className="w-full text-left px-3.5 py-2 flex items-center gap-2.5 hover:bg-teal-50 transition-colors group"
                    >
                      <Table className="w-4 h-4 text-teal-600 shrink-0" />
                      <span className="text-xs font-bold text-slate-800 group-hover:text-teal-700">
                        田 Bảng Biến Thiên & Markdown
                      </span>
                    </button>

                    <button
                      onClick={() => {
                        onOpenEquation();
                        setIsToolsOpen(false);
                      }}
                      className="w-full text-left px-3.5 py-2 flex items-center gap-2.5 hover:bg-teal-50 transition-colors group"
                    >
                      <span className="font-serif font-black text-sm text-teal-700 w-4 text-center">∑</span>
                      <span className="text-xs font-bold text-slate-800 group-hover:text-teal-700">
                        Equation MathLive & MathJax
                      </span>
                    </button>

                    <button
                      onClick={() => {
                        onOpenMathTypeOle();
                        setIsToolsOpen(false);
                      }}
                      className="w-full text-left px-3.5 py-2 flex items-center gap-2.5 hover:bg-teal-50 transition-colors group"
                    >
                      <span className="font-mono font-bold text-xs text-teal-700 w-4 text-center">&#123;&#125;</span>
                      <span className="text-xs font-bold text-slate-800 group-hover:text-teal-700">
                        Chuẩn Hóa MathType (Word Alt + \)
                      </span>
                    </button>

                    <button
                      onClick={() => {
                        onOpenUserManagement();
                        setIsToolsOpen(false);
                      }}
                      className="w-full text-left px-3.5 py-2 flex items-center gap-2.5 hover:bg-teal-50 transition-colors group"
                    >
                      <Shield className="w-4 h-4 text-teal-600 shrink-0" />
                      <span className="text-xs font-bold text-slate-800 group-hover:text-teal-700">
                        🛡️ Quản lý user & Phân quyền
                      </span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Right: The 3 Buttons Refined to be "Nhỏ Vừa Đẹp" (Matching media_1788534479752.png) */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Button 1: 🎓 HỌC SINH ĐĂNG NHẬP */}
              <button
                id="btn_role_student"
                type="button"
                onClick={() => (onOpenLogin ? onOpenLogin("student") : onSelectRole("student"))}
                className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-black text-xs text-white shadow-xs active:scale-95 transition-all cursor-pointer select-none ${
                  currentRole === "student"
                    ? "bg-blue-600 ring-2 ring-blue-400 ring-offset-1 shadow-blue-500/25"
                    : "bg-blue-600 hover:bg-blue-700 shadow-blue-500/15"
                }`}
                title="Mở bảng Đăng nhập Học sinh"
              >
                <GraduationCap className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <span className="uppercase tracking-wide font-extrabold whitespace-nowrap text-[11px] sm:text-xs">
                  HỌC SINH ĐĂNG NHẬP
                </span>
              </button>

              {/* Button 2: 👩‍🏫 GIÁO VIÊN / ADMIN */}
              <button
                id="btn_role_teacher"
                type="button"
                onClick={() => (onOpenLogin ? onOpenLogin("teacher") : onSelectRole("teacher"))}
                className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-black text-xs text-white shadow-xs active:scale-95 transition-all cursor-pointer select-none ${
                  currentRole === "teacher" || currentRole === "admin"
                    ? "bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 ring-2 ring-pink-400 ring-offset-1 shadow-pink-500/25"
                    : "bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 hover:opacity-95 shadow-pink-500/15"
                }`}
                title="Mở bảng Đăng nhập Giáo viên / Admin"
              >
                <Shield className="w-3.5 h-3.5 text-pink-200 shrink-0" />
                <span className="uppercase tracking-wide font-extrabold whitespace-nowrap text-[11px] sm:text-xs">
                  GIÁO VIÊN / ADMIN
                </span>
              </button>

              {/* Button 3: SETTINGS (API KEY) - Compact & Elegant matching media_1788534479752.png */}
              <button
                id="btn_api_key_settings"
                type="button"
                onClick={onOpenApiKeySettings}
                className="flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1 rounded-full border border-rose-200 bg-rose-50/70 hover:bg-rose-100/90 text-rose-900 shadow-2xs transition-all active:scale-95 group shrink-0 cursor-pointer"
                title="Cài đặt Model & API Key Gemini"
              >
                <div className="relative shrink-0">
                  <Key className="w-3 h-3 text-rose-600 group-hover:rotate-12 transition-transform" />
                  <span
                    className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ring-2 ring-white ${
                      hasApiKey ? "bg-emerald-500" : "bg-rose-500 animate-ping"
                    }`}
                  />
                </div>
                <div className="flex flex-col items-start text-left leading-tight">
                  <span className="text-[10px] font-black uppercase tracking-wider text-rose-700">
                    SETTINGS (API KEY)
                  </span>
                  <span className="text-[9px] font-extrabold text-red-600">
                    Lấy API key để sử dụng app
                  </span>
                </div>
              </button>

              {/* User profile & Logout button (Compact) */}
              <button
                type="button"
                onClick={onOpenProfile}
                className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
                title={`Hồ sơ: ${student.email || "zalo2299k@gmail.com"}`}
              >
                <User className="w-3 h-3 text-slate-500" />
                <span className="max-w-[100px] truncate text-[11px]">
                  {student.email || "zalo2299k@gmail.com"}
                </span>
              </button>

              <button
                type="button"
                onClick={onLogout}
                className="hidden xl:flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 hover:bg-rose-100 text-slate-400 hover:text-rose-600 transition-all"
                title="Đăng xuất"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
