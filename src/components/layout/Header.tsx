import React, { useState } from 'react';
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
  Award,
  FileSpreadsheet,
  Settings,
  RefreshCw,
  Key,
  Database,
  Swords,
  Calculator,
  Bookmark,
} from 'lucide-react';

export const Header: React.FC = () => {
  const {
    currentUser,
    switchRole,
    activeTab,
    setActiveTab,
    sheetSyncState,
    syncClassesFromSheet,
    setIsSettingsOpen,
    setSettingsTab,
    setIsCalculatorOpen,
    setIsHandbookOpen,
    classes,
  } = useApp();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);

  const { level, tier } = calculateLevelFromXp(currentUser?.xp || 0);

  const hasApiKey = Boolean(localStorage.getItem('gemini_api_key'));

  const navItems: { id: AppTab; label: string; icon: React.ElementType; teacherOnly?: boolean }[] = [
    { id: 'lessons', label: 'Bài học & Lộ trình', icon: BookOpen },
    { id: 'theory', label: 'Lý thuyết & Thí nghiệm', icon: Sparkles },
    { id: 'arena', label: 'Đấu Trường 1v1', icon: Swords },
    { id: 'stats', label: 'Bảng điểm & Thống kê', icon: BarChart3 },
    { id: 'docx-import', label: 'Ngân hàng đề & Xuất file', icon: FileUp, teacherOnly: true },
    { id: 'classes', label: 'Quản lý Lớp học', icon: Users, teacherOnly: true },
  ];

  const handleTabClick = (tabId: AppTab) => {
    setActiveTab(tabId);
    setIsMobileMenuOpen(false);
  };

  const handleOpenSettings = (tab: 'sheet' | 'ai') => {
    setSettingsTab(tab);
    setIsSettingsOpen(true);
  };

  return (
    <header
      id="app-header"
      className="sticky top-0 z-50 bg-teal-950/95 backdrop-blur-md text-white shadow-lg border-b border-teal-800/80 transition-all"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18 gap-2 sm:gap-4">
          {/* LEFT: Brand Identity & Logo */}
          <div
            className="flex items-center space-x-3 cursor-pointer group flex-shrink-0"
            onClick={() => setActiveTab('lessons')}
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-teal-400 via-teal-500 to-emerald-600 flex items-center justify-center shadow-md shadow-teal-900/50 border border-teal-300/30 group-hover:scale-105 transition-transform duration-200">
              <GraduationCap className="w-6 h-6 text-white drop-shadow-xs" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold tracking-tight text-white text-base sm:text-lg lg:text-xl leading-none">
                  TỰ LUYỆN TOÁN 12
                </span>
                <span className="bg-teal-500/20 text-teal-300 border border-teal-500/40 text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-bold uppercase tracking-wider hidden md:inline-block">
                  CT GDPT 2018
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-teal-300/90 font-medium mt-0.5">
                Giáo viên phụ trách: <span className="text-white font-semibold">Thầy Phan Quốc Cường</span>
              </p>
            </div>
          </div>

          {/* CENTER: Desktop Navigation Tabs */}
          <nav className="hidden xl:flex items-center space-x-1 lg:space-x-1.5">
            {navItems.map((item) => {
              if (item.teacherOnly && currentUser?.role === 'student') return null;
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-${item.id}`}
                  onClick={() => handleTabClick(item.id)}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-gradient-to-r from-teal-700 to-teal-800 text-white shadow-sm ring-1 ring-teal-400/40'
                      : 'text-teal-200/90 hover:text-white hover:bg-teal-900/70'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-teal-300' : 'text-teal-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* RIGHT: Cloud Sync Pill, Gamification, Settings & Role Switcher */}
          <div className="flex items-center space-x-1.5 sm:space-x-2.5">
            {/* Google Sheets Database Live Badge */}
            <button
              onClick={() => handleOpenSettings('sheet')}
              title={`Đã kết nối Google Sheet: ${classes.length} lớp học. Bấm để cấu hình hoặc đồng bộ.`}
              className="flex items-center space-x-1.5 bg-emerald-950/80 hover:bg-emerald-900/90 border border-emerald-500/40 text-emerald-300 hover:text-white px-2.5 py-1.5 rounded-xl text-xs font-semibold transition shadow-xs group"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline">
                Sheet: <strong className="text-emerald-200">{classes.length} lớp</strong>
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </button>

            {/* Streak Counter */}
            <div
              id="streak-badge"
              className="hidden sm:flex items-center space-x-1 bg-amber-500/10 border border-amber-500/30 text-amber-300 px-2.5 py-1.5 rounded-xl text-xs font-bold"
              title={`Chuỗi ${currentUser?.streakDays || 1} ngày học liên tiếp`}
            >
              <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400 animate-bounce" />
              <span>{currentUser?.streakDays || 1} ngày</span>
            </div>

            {/* Level & XP Pill */}
            <div
              id="level-badge"
              className="hidden lg:flex items-center space-x-1.5 bg-teal-900/80 border border-teal-700/60 text-teal-200 px-2.5 py-1.5 rounded-xl text-xs font-medium"
            >
              <Award className="w-3.5 h-3.5 text-teal-400" />
              <span>
                Lv.{level} • <strong className="text-white font-bold">{tier}</strong>
              </span>
              <span className="text-teal-400 font-mono text-[11px]">({currentUser?.xp || 0} XP)</span>
            </div>

            {/* Quick Pocket Tools: Calculator & Handbook */}
            <button
              onClick={() => setIsCalculatorOpen(true)}
              title="Mở máy tính Casio fx-580VN X ảo"
              className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-teal-300 hover:text-white transition shadow-xs"
            >
              <Calculator className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsHandbookOpen(true)}
              title="Mở Sổ tay công thức Toán 12 bỏ túi"
              className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-amber-300 hover:text-white transition shadow-xs"
            >
              <Bookmark className="w-4 h-4" />
            </button>

            {/* Settings & AI Key Button (Strict AI_INSTRUCTIONS.md requirement) */}
            <button
              onClick={() => handleOpenSettings('ai')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition shadow-xs ${
                !hasApiKey
                  ? 'bg-rose-900/90 hover:bg-rose-800 border-rose-500 text-white ring-2 ring-rose-500/40 animate-pulse'
                  : 'bg-teal-900/80 hover:bg-teal-800 border-teal-700 text-teal-200 hover:text-white'
              }`}
              title="Cài đặt hệ thống & Nhập Gemini API Key"
            >
              <Key className={`w-3.5 h-3.5 ${!hasApiKey ? 'text-rose-200' : 'text-teal-400'}`} />
              <span>
                {!hasApiKey ? (
                  <span className="text-rose-100 font-extrabold">Lấy API key để sử dụng app</span>
                ) : (
                  <span>API Key: OK</span>
                )}
              </span>
            </button>

            {/* Role Switcher Dropdown */}
            <div className="relative">
              <button
                id="role-switch-btn"
                onClick={() => setIsRoleMenuOpen(!isRoleMenuOpen)}
                className="flex items-center space-x-2 bg-gradient-to-r from-teal-900 to-teal-800 hover:from-teal-800 hover:to-teal-700 border border-teal-700/80 text-white px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold transition shadow-xs"
              >
                {currentUser?.role === 'admin' && <Shield className="w-3.5 h-3.5 text-rose-400" />}
                {currentUser?.role === 'teacher' && <UserCheck className="w-3.5 h-3.5 text-emerald-400" />}
                {currentUser?.role === 'student' && <GraduationCap className="w-3.5 h-3.5 text-teal-300" />}
                <span className="hidden sm:inline">
                  {currentUser?.role === 'admin'
                    ? 'Quản trị'
                    : currentUser?.role === 'teacher'
                    ? 'Thầy Cường'
                    : 'Học sinh'}
                </span>
                <ChevronDown className="w-3 h-3 text-teal-400" />
              </button>

              {isRoleMenuOpen && (
                <div
                  id="role-dropdown-menu"
                  className="absolute right-0 mt-2 w-64 bg-slate-900 border border-teal-800/90 rounded-2xl shadow-2xl py-2.5 z-50 animate-fadeIn"
                  onMouseLeave={() => setIsRoleMenuOpen(false)}
                >
                  <div className="px-3.5 py-1.5 border-b border-teal-900/80 text-[11px] font-bold text-teal-400 uppercase tracking-wider">
                    Chuyển quyền trải nghiệm nhanh:
                  </div>
                  <button
                    onClick={() => {
                      switchRole('student');
                      setIsRoleMenuOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-xs flex items-center justify-between transition ${
                      currentUser?.role === 'student'
                        ? 'bg-teal-800/60 text-white font-bold'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <span className="flex items-center space-x-2.5">
                      <GraduationCap className="w-4 h-4 text-teal-400" />
                      <span>Học sinh (Nguyễn Hoài Nam)</span>
                    </span>
                    {currentUser?.role === 'student' && <span className="text-teal-400 text-xs font-bold">✓</span>}
                  </button>
                  <button
                    onClick={() => {
                      switchRole('teacher');
                      setIsRoleMenuOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-xs flex items-center justify-between transition ${
                      currentUser?.role === 'teacher'
                        ? 'bg-teal-800/60 text-white font-bold'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <span className="flex items-center space-x-2.5">
                      <UserCheck className="w-4 h-4 text-emerald-400" />
                      <span>Giáo viên (Thầy Phan Quốc Cường)</span>
                    </span>
                    {currentUser?.role === 'teacher' && <span className="text-emerald-400 text-xs font-bold">✓</span>}
                  </button>
                  <button
                    onClick={() => {
                      switchRole('admin');
                      setIsRoleMenuOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-xs flex items-center justify-between transition ${
                      currentUser?.role === 'admin'
                        ? 'bg-teal-800/60 text-white font-bold'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <span className="flex items-center space-x-2.5">
                      <Shield className="w-4 h-4 text-rose-400" />
                      <span>Quản trị viên hệ thống</span>
                    </span>
                    {currentUser?.role === 'admin' && <span className="text-rose-400 text-xs font-bold">✓</span>}
                  </button>
                </div>
              )}
            </div>

            {/* Mobile menu toggle button */}
            <button
              id="mobile-menu-toggle"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="xl:hidden p-2 rounded-xl text-teal-300 hover:text-white hover:bg-teal-900/80 transition"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {isMobileMenuOpen && (
          <div className="xl:hidden py-3 border-t border-teal-900 space-y-1">
            {navItems.map((item) => {
              if (item.teacherOnly && currentUser?.role === 'student') return null;
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  className={`w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold ${
                    isActive
                      ? 'bg-teal-700 text-white shadow-sm'
                      : 'text-teal-200 hover:bg-teal-900/60 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 text-teal-400" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
};
