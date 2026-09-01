import React, { useState, useRef, useEffect } from 'react';
import { useApp, AppTab } from '../../context/AppContext';
import { calculateLevelFromXp } from '../../services/gradingEngine';
import {
  BookOpen,
  GraduationCap,
  Sparkles,
  BarChart3,
  FileUp,
  Users,
  Flame,
  Shield,
  UserCheck,
  ChevronDown,
  Menu,
  X,
  FileSpreadsheet,
  Settings,
  Calculator,
  Bookmark,
  Swords,
  LogIn,
  LogOut,
  UserPlus,
  Key,
} from 'lucide-react';

interface HeaderProps {
  onOpenAuth: () => void;
  onOpenAccountProvision: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenAuth, onOpenAccountProvision }) => {
  const {
    currentUser,
    activeTab,
    setActiveTab,
    classes,
    setIsSettingsOpen,
    setSettingsTab,
    setIsCalculatorOpen,
    setIsHandbookOpen,
    showToast,
  } = useApp();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { level } = calculateLevelFromXp(currentUser?.xp || 0);
  const hasApiKey = Boolean(localStorage.getItem('gemini_api_key'));

  const navItems: { id: AppTab; label: string; icon: React.ElementType; teacherOnly?: boolean }[] = [
    { id: 'lessons', label: 'Lộ trình', icon: BookOpen },
    { id: 'theory', label: 'Lý thuyết', icon: Sparkles },
    { id: 'arena', label: 'Đấu trường', icon: Swords },
    { id: 'stats', label: 'Thống kê', icon: BarChart3 },
    { id: 'docx-import', label: 'Đề thi & File', icon: FileUp, teacherOnly: true },
    { id: 'classes', label: 'Lớp học', icon: Users, teacherOnly: true },
  ];

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTabClick = (tabId: AppTab) => {
    setActiveTab(tabId);
    setIsMobileMenuOpen(false);
  };

  const isTeacherOrAdmin = currentUser?.role === 'teacher' || currentUser?.role === 'admin';

  return (
    <header
      id="app-header"
      className="sticky top-0 z-40 bg-teal-950/95 backdrop-blur-md text-white shadow-lg border-b border-teal-800/80 transition-all select-none"
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2 sm:gap-4">
          {/* ------------------------------------------------------------------- */}
          {/* 1. LEFT: LOGO & BRAND */}
          {/* ------------------------------------------------------------------- */}
          <div
            className="flex items-center space-x-2.5 cursor-pointer group flex-shrink-0"
            onClick={() => setActiveTab('lessons')}
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-emerald-400 via-teal-500 to-teal-700 flex items-center justify-center shadow-md shadow-teal-900/60 border border-teal-300/30 group-hover:scale-105 transition-transform duration-200">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-extrabold tracking-tight text-white text-base sm:text-lg leading-none">
                  TỰ LUYỆN TOÁN 12
                </span>
                <span className="bg-teal-500/20 text-teal-300 border border-teal-500/40 text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider hidden md:inline-block">
                  GDPT 2018
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-teal-300/90 font-medium mt-0.5 whitespace-nowrap">
                GV phụ trách: <span className="text-white font-semibold">Thầy Phan Quốc Cường</span>
              </p>
            </div>
          </div>

          {/* ------------------------------------------------------------------- */}
          {/* 2. CENTER: DESKTOP NAVIGATION (No text wrapping, clean horizontal layout) */}
          {/* ------------------------------------------------------------------- */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => {
              if (item.teacherOnly && !isTeacherOrAdmin) return null;
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-${item.id}`}
                  onClick={() => handleTabClick(item.id)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 whitespace-nowrap ${
                    isActive
                      ? 'bg-teal-800 text-white shadow-xs ring-1 ring-teal-400/50'
                      : 'text-teal-200/90 hover:text-white hover:bg-teal-900/60'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-teal-300' : 'text-teal-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* ------------------------------------------------------------------- */}
          {/* 3. RIGHT: TOOL ICONS, SHEET SYNC & USER AUTH DROPDOWN */}
          {/* ------------------------------------------------------------------- */}
          <div className="flex items-center space-x-1.5 sm:space-x-2">
            {/* Quick Casio Calculator Button */}
            <button
              onClick={() => setIsCalculatorOpen(true)}
              title="Mở máy tính Casio fx-580VN X"
              className="p-2 rounded-xl bg-teal-900/60 hover:bg-teal-800 text-teal-200 hover:text-white border border-teal-700/60 transition flex items-center justify-center shadow-xs"
            >
              <Calculator className="w-4 h-4 text-teal-300" />
            </button>

            {/* Quick Formula Handbook Button */}
            <button
              onClick={() => setIsHandbookOpen(true)}
              title="Mở Sổ tay công thức bỏ túi"
              className="p-2 rounded-xl bg-teal-900/60 hover:bg-teal-800 text-teal-200 hover:text-white border border-teal-700/60 transition flex items-center justify-center shadow-xs"
            >
              <Bookmark className="w-4 h-4 text-amber-300" />
            </button>

            {/* Google Sheets Database Pill */}
            <button
              onClick={() => {
                setSettingsTab('sheet');
                setIsSettingsOpen(true);
              }}
              title="Đồng bộ cơ sở dữ liệu Google Sheet"
              className="hidden sm:flex items-center space-x-1.5 bg-emerald-950/80 hover:bg-emerald-900/90 border border-emerald-500/40 text-emerald-300 hover:text-white px-2.5 py-1.5 rounded-xl text-xs font-semibold transition shadow-xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[11px]">
                Sheet: <strong className="text-emerald-200">{classes.length} lớp</strong>
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </button>

            {/* API Key Status Pill */}
            <button
              onClick={() => {
                setSettingsTab('ai');
                setIsSettingsOpen(true);
              }}
              title="Cấu hình Gemini AI Key"
              className={`hidden md:flex items-center space-x-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition ${
                hasApiKey
                  ? 'bg-teal-900/70 text-teal-200 border-teal-600/70 hover:bg-teal-800'
                  : 'bg-rose-950/80 text-rose-200 border-rose-600/70 hover:bg-rose-900 animate-pulse'
              }`}
            >
              <Key className="w-3 h-3 text-amber-400" />
              <span>{hasApiKey ? 'AI: OK' : 'Lấy AI Key'}</span>
            </button>

            {/* USER PROFILE & AUTH DROPDOWN */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                className="flex items-center space-x-2 bg-gradient-to-r from-teal-900 to-teal-950 hover:from-teal-800 hover:to-teal-900 border border-teal-700/80 p-1 sm:pr-2.5 rounded-xl text-xs font-semibold transition shadow-sm"
              >
                <div className="w-7 h-7 rounded-lg bg-teal-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  {currentUser?.role === 'teacher' ? '👨‍🏫' : currentUser?.role === 'admin' ? '👨‍💼' : '👨‍🎓'}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-[11px] font-bold text-white truncate max-w-[90px]">
                    {currentUser?.fullName?.split(' ').slice(-2).join(' ') || 'Học sinh'}
                  </div>
                  <div className="text-[9px] text-teal-300 leading-none">
                    {currentUser?.role === 'teacher'
                      ? 'Giáo viên'
                      : currentUser?.role === 'admin'
                      ? 'Admin'
                      : `Lớp ${currentUser?.className || '12'}`}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-teal-400 hidden sm:block" />
              </button>

              {/* Dropdown Menu */}
              {isUserDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 animate-scaleIn origin-top-right text-xs">
                  <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/80">
                    <div className="font-bold text-slate-900 text-sm">{currentUser?.fullName}</div>
                    <div className="text-slate-500 text-[11px] font-mono truncate">{currentUser?.email}</div>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <span className="bg-teal-100 text-teal-800 font-bold px-2 py-0.5 rounded text-[10px]">
                        {currentUser?.role === 'teacher'
                          ? 'Giáo viên bộ môn'
                          : currentUser?.role === 'admin'
                          ? 'Quản trị viên'
                          : `Học sinh lớp ${currentUser?.className || '12'}`}
                      </span>
                      <span className="text-amber-600 font-bold text-[10px] flex items-center gap-0.5">
                        <Flame className="w-3 h-3 fill-amber-500 text-amber-500" />
                        Lv.{level}
                      </span>
                    </div>
                  </div>

                  <div className="p-1 space-y-0.5">
                    {/* Switch / Login Account */}
                    <button
                      onClick={() => {
                        setIsUserDropdownOpen(false);
                        onOpenAuth();
                      }}
                      className="w-full px-3 py-2 text-left text-slate-700 hover:bg-teal-50 hover:text-teal-900 rounded-xl transition flex items-center space-x-2 font-medium"
                    >
                      <LogIn className="w-4 h-4 text-teal-600" />
                      <span>Đăng nhập / Đổi tài khoản</span>
                    </button>

                    {/* Teacher/Admin: Provision Accounts */}
                    {isTeacherOrAdmin && (
                      <button
                        onClick={() => {
                          setIsUserDropdownOpen(false);
                          onOpenAccountProvision();
                        }}
                        className="w-full px-3 py-2 text-left text-slate-700 hover:bg-teal-50 hover:text-teal-900 rounded-xl transition flex items-center space-x-2 font-medium"
                      >
                        <UserPlus className="w-4 h-4 text-emerald-600" />
                        <span>Cấp tài khoản GV &amp; Học sinh</span>
                      </button>
                    )}

                    {/* Settings Modal */}
                    <button
                      onClick={() => {
                        setIsUserDropdownOpen(false);
                        setIsSettingsOpen(true);
                      }}
                      className="w-full px-3 py-2 text-left text-slate-700 hover:bg-teal-50 hover:text-teal-900 rounded-xl transition flex items-center space-x-2 font-medium"
                    >
                      <Settings className="w-4 h-4 text-slate-500" />
                      <span>Cài đặt &amp; Đồng bộ Sheet</span>
                    </button>
                  </div>

                  <div className="p-1 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setIsUserDropdownOpen(false);
                        onOpenAuth();
                        showToast('Đã đăng xuất', 'Vui lòng chọn hoặc đăng nhập tài khoản khác.', 'info');
                      }}
                      className="w-full px-3 py-2 text-left text-rose-600 hover:bg-rose-50 rounded-xl transition flex items-center space-x-2 font-medium"
                    >
                      <LogOut className="w-4 h-4 text-rose-500" />
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-xl bg-teal-900/60 hover:bg-teal-800 text-teal-200 hover:text-white lg:hidden border border-teal-700/60 transition"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* ------------------------------------------------------------------- */}
        {/* 4. MOBILE NAVIGATION ACCORDION */}
        {/* ------------------------------------------------------------------- */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-teal-800/80 py-3 space-y-1.5 animate-slideDown">
            {navItems.map((item) => {
              if (item.teacherOnly && !isTeacherOrAdmin) return null;
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                    isActive
                      ? 'bg-teal-800 text-white ring-1 ring-teal-400/50'
                      : 'text-teal-200 hover:text-white hover:bg-teal-900/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-teal-300' : 'text-teal-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}

            <div className="pt-2 border-t border-teal-800/60 flex items-center justify-between gap-2 text-xs">
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenAuth();
                }}
                className="flex-1 py-2 bg-teal-800 hover:bg-teal-700 text-white rounded-xl font-bold flex items-center justify-center gap-1.5"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Đăng nhập</span>
              </button>

              {isTeacherOrAdmin && (
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenAccountProvision();
                  }}
                  className="flex-1 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center justify-center gap-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Cấp tài khoản</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
