import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { DEMO_USERS } from '../../data/seedCurriculum';
import { UserProfile, UserRole } from '../../types';
import {
  GraduationCap,
  Lock,
  Mail,
  User,
  Shield,
  CheckCircle2,
  X,
  LogIn,
  UserPlus,
  KeyRound,
  School,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, setCurrentUser, showToast, classes, students, setStudents } = useApp();

  const [mode, setMode] = useState<'login' | 'register' | 'quick'>('quick');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedClassId, setSelectedClassId] = useState(classes[0]?.id || 'c1');
  const [selectedRole, setSelectedRole] = useState<UserRole>('student');

  if (!isOpen) return null;

  const handleQuickLogin = (user: UserProfile) => {
    setCurrentUser(user);
    localStorage.setItem('auth_current_user', JSON.stringify(user));
    showToast(
      'Đăng nhập thành công',
      `Chào mừng ${user.fullName} (${user.role === 'teacher' ? 'Giáo viên' : user.role === 'admin' ? 'Quản trị viên' : `Lớp ${user.className || '12'}`})!`,
      'success'
    );
    onClose();
  };

  const handleEmailLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      showToast('Thiếu thông tin', 'Vui lòng nhập đầy đủ Email và Mật khẩu.', 'warning');
      return;
    }

    // Check in demo users or registered students
    const allUsers = [...DEMO_USERS, ...students];
    const found = allUsers.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());

    if (found) {
      setCurrentUser(found);
      localStorage.setItem('auth_current_user', JSON.stringify(found));
      showToast('Đăng nhập thành công', `Chào mừng ${found.fullName}!`, 'success');
      onClose();
    } else {
      // Auto-login fallback if newly created email
      const customUser: UserProfile = {
        id: 'u_' + Date.now(),
        email: email.trim(),
        fullName: email.split('@')[0],
        role: 'student',
        className: '12TN1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'active',
        xp: 100,
        level: 1,
        streakDays: 1,
        lastActiveAt: new Date().toISOString(),
        badges: ['new_member'],
      };
      setCurrentUser(customUser);
      localStorage.setItem('auth_current_user', JSON.stringify(customUser));
      showToast('Đăng nhập thành công', `Chào mừng học sinh mới: ${customUser.fullName}!`, 'success');
      onClose();
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !password.trim()) {
      showToast('Thiếu thông tin', 'Vui lòng điền đầy đủ Họ tên, Email và Mật khẩu.', 'warning');
      return;
    }

    const cls = classes.find((c) => c.id === selectedClassId);
    const newUser: UserProfile = {
      id: 'usr_' + Date.now(),
      email: email.trim(),
      fullName: fullName.trim(),
      role: selectedRole,
      classId: selectedRole === 'student' ? selectedClassId : undefined,
      className: selectedRole === 'student' ? cls?.name || '12TN1' : undefined,
      schoolYear: '2025-2026',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'active',
      xp: 100,
      level: 1,
      streakDays: 1,
      lastActiveAt: new Date().toISOString(),
      badges: ['starter_champ'],
    };

    setStudents((prev) => [newUser, ...prev]);
    setCurrentUser(newUser);
    localStorage.setItem('auth_current_user', JSON.stringify(newUser));

    showToast(
      'Đăng ký tài khoản thành công',
      `Tài khoản đã sẵn sàng! Đang đăng nhập với tên: ${newUser.fullName}`,
      'success'
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-teal-900 via-teal-800 to-teal-950 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-600/60 flex items-center justify-center border border-teal-400/40">
              <GraduationCap className="w-5 h-5 text-teal-200" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">Cổng Đăng Nhập &amp; Tài Khoản</h2>
              <p className="text-xs text-teal-300">Hệ Thống Tự Luyện Toán THPT 12</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-teal-800/80 hover:bg-teal-700 flex items-center justify-center text-teal-200 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="p-3 border-b border-slate-100 bg-slate-50 flex items-center gap-1.5 text-xs font-bold">
          <button
            onClick={() => setMode('quick')}
            className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
              mode === 'quick' ? 'bg-teal-700 text-white shadow-xs' : 'bg-white text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Đăng nhập 1 chạm</span>
          </button>
          <button
            onClick={() => setMode('login')}
            className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
              mode === 'login' ? 'bg-teal-700 text-white shadow-xs' : 'bg-white text-slate-600 hover:bg-slate-200'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Tài khoản &amp; Mật khẩu</span>
          </button>
          <button
            onClick={() => setMode('register')}
            className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
              mode === 'register' ? 'bg-teal-700 text-white shadow-xs' : 'bg-white text-slate-600 hover:bg-slate-200'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Tạo tài khoản mới</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto max-h-[75vh]">
          {/* 1. Quick Role Login Cards */}
          {mode === 'quick' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500 mb-2">
                Chọn vai trò để truy cập nhanh các tính năng tương ứng:
              </p>

              {/* Teacher Account */}
              <div
                onClick={() => handleQuickLogin(DEMO_USERS[1])}
                className="p-4 rounded-2xl border border-teal-200 bg-teal-50/60 hover:bg-teal-100/80 cursor-pointer transition flex items-center justify-between group"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                    👨‍🏫
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                      <span>Thầy Phan Quốc Cường</span>
                      <span className="text-[10px] bg-teal-200/80 text-teal-800 font-bold px-1.5 py-0.5 rounded">
                        Giáo viên
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">cuong.phan@toan12.edu.vn • Đầy đủ quyền quản lý &amp; đề thi</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-teal-600 group-hover:translate-x-1 transition-transform" />
              </div>

              {/* Student Account */}
              <div
                onClick={() => handleQuickLogin(DEMO_USERS[2])}
                className="p-4 rounded-2xl border border-blue-200 bg-blue-50/60 hover:bg-blue-100/80 cursor-pointer transition flex items-center justify-between group"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                    👨‍🎓
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                      <span>Nguyễn Hoài Nam</span>
                      <span className="text-[10px] bg-blue-200/80 text-blue-800 font-bold px-1.5 py-0.5 rounded">
                        Lớp 12TN1
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">nam.nguyen@toan12.edu.vn • Tự luyện &amp; Đấu trường 1v1</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-blue-600 group-hover:translate-x-1 transition-transform" />
              </div>

              {/* Admin Account */}
              <div
                onClick={() => handleQuickLogin(DEMO_USERS[0])}
                className="p-4 rounded-2xl border border-purple-200 bg-purple-50/60 hover:bg-purple-100/80 cursor-pointer transition flex items-center justify-between group"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                    👨‍💼
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                      <span>Quản Trị Viên Hệ Thống</span>
                      <span className="text-[10px] bg-purple-200/80 text-purple-800 font-bold px-1.5 py-0.5 rounded">
                        Admin
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">admin@toan12.edu.vn • Toàn quyền hệ thống</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-purple-600 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          )}

          {/* 2. Standard Email/Password Login */}
          {mode === 'login' && (
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Email tài khoản:</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ví dụ: hocsinh@toan12.edu.vn"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Mật khẩu:</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Nhập mật khẩu của bạn"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl text-xs shadow-md transition flex items-center justify-center gap-1.5"
              >
                <LogIn className="w-4 h-4" />
                <span>Đăng Nhập Vào Hệ Thống</span>
              </button>
            </form>
          )}

          {/* 3. Register New Account */}
          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Họ và tên học sinh / giáo viên:</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Email đăng ký:</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nguyenvana@gmail.com"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Vai trò:</label>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  >
                    <option value="student">Học sinh</option>
                    <option value="teacher">Giáo viên</option>
                  </select>
                </div>

                {selectedRole === 'student' && (
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Lớp học:</label>
                    <select
                      value={selectedClassId}
                      onChange={(e) => setSelectedClassId(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    >
                      {classes.map((cls) => (
                        <option key={cls.id} value={cls.id}>
                          {cls.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Mật khẩu:</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Nhập mật khẩu mới"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold rounded-xl text-xs shadow-md transition flex items-center justify-center gap-1.5"
              >
                <UserPlus className="w-4 h-4" />
                <span>Tạo Tài Khoản &amp; Đăng Nhập</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
