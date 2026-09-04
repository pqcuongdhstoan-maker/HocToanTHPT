import React, { useState } from "react";
import { UserRole, StudentProfile } from "../types";
import {
  X,
  LogOut,
  LogIn,
  Mail,
  Lock,
  User,
  Shield,
  GraduationCap,
  BookOpen,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLogoutConfirm?: boolean;
  currentUserEmail?: string;
  onConfirmLogout: () => void;
  onLoginSuccess: (email: string, role: UserRole) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  isLogoutConfirm = false,
  currentUserEmail = "zalo2299k@gmail.com",
  onConfirmLogout,
  onLoginSuccess,
}) => {
  const [email, setEmail] = useState<string>(currentUserEmail || "zalo2299k@gmail.com");
  const [password, setPassword] = useState<string>("••••••••");
  const [selectedRole, setSelectedRole] = useState<UserRole>("student");

  if (!isOpen) return null;

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    onLoginSuccess(email.trim(), selectedRole);
    onClose();
  };

  const handleQuickLogin = (role: UserRole, userEmail: string) => {
    onLoginSuccess(userEmail, role);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
        {isLogoutConfirm ? (
          /* Logout Confirmation View */
          <div className="p-6 text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
              <LogOut className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-900">Xác nhận Đăng xuất</h3>
              <p className="text-xs text-slate-500">
                Bạn có chắc chắn muốn đăng xuất khỏi tài khoản
              </p>
              <p className="text-xs font-mono font-bold text-teal-800 bg-teal-50 px-3 py-1 rounded-xl inline-block border border-teal-200/60">
                {currentUserEmail}
              </p>
            </div>

            <p className="text-[11px] text-slate-400">
              Toàn bộ dữ liệu điểm và tiến độ học tập trên trình duyệt của bạn vẫn được lưu giữ an toàn.
            </p>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-all"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => {
                  onConfirmLogout();
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 active:scale-95 transition-all"
              >
                Đăng xuất
              </button>
            </div>
          </div>
        ) : (
          /* Login View */
          <div>
            {/* Header */}
            <div className="bg-gradient-to-r from-[#004d40] via-[#00695c] to-[#004d40] px-6 py-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
                  <LogIn className="w-5 h-5 text-teal-200" />
                </div>
                <div>
                  <h3 className="text-base font-black">Đăng nhập Hệ thống</h3>
                  <p className="text-[11px] text-teal-100/80">Tự luyện Toán THPT GDPT 2018</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-teal-100 hover:text-white flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleLoginSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Địa chỉ Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@vidu.com"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 focus:bg-white rounded-xl text-xs font-bold border border-slate-300 focus:border-teal-500 focus:outline-hidden font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mật khẩu
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 focus:bg-white rounded-xl text-xs font-bold border border-slate-300 focus:border-teal-500 focus:outline-hidden font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Vai trò đăng nhập
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedRole("student")}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      selectedRole === "student"
                        ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                        : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-300"
                    }`}
                  >
                    Học sinh
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedRole("teacher")}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      selectedRole === "teacher"
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                        : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-300"
                    }`}
                  >
                    Giáo viên
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedRole("admin")}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      selectedRole === "admin"
                        ? "bg-slate-800 text-white border-slate-800 shadow-xs"
                        : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-300"
                    }`}
                  >
                    Admin
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-teal-700 to-emerald-700 hover:from-teal-800 hover:to-emerald-800 text-white text-xs font-bold shadow-md shadow-teal-700/20 active:scale-95 transition-all"
              >
                Đăng nhập vào Hệ thống
              </button>

              {/* Quick Login One-Click Options */}
              <div className="pt-2 border-t border-slate-200 space-y-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block text-center">
                  Hoặc đăng nhập nhanh bằng tài khoản có sẵn:
                </span>
                <div className="space-y-1.5">
                  <button
                    type="button"
                    onClick={() => handleQuickLogin("student", "zalo2299k@gmail.com")}
                    className="w-full p-2 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-slate-700 text-xs font-semibold flex items-center justify-between transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
                      <span>Học sinh: Phan Quốc Cường</span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-500">zalo2299k@gmail.com</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickLogin("teacher", "cuong.toan@thpt.edu.vn")}
                    className="w-full p-2 rounded-xl bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-slate-700 text-xs font-semibold flex items-center justify-between transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Giáo viên: Thầy Phan Quốc Cường</span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-500">cuong.toan@thpt.edu.vn</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickLogin("admin", "zalo2299k@gmail.com")}
                    className="w-full p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-between transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <Shield className="w-3.5 h-3.5 text-slate-800" />
                      <span>Quản trị viên (Admin Portal)</span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-500">zalo2299k@gmail.com</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
