import React, { useState, useEffect } from "react";
import { UserRole } from "../types";
import {
  X,
  LogOut,
  GraduationCap,
  Shield,
  ArrowRight,
} from "lucide-react";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLogoutConfirm?: boolean;
  currentUserEmail?: string;
  initialRole?: UserRole;
  onConfirmLogout: () => void;
  onLoginSuccess: (email: string, role: UserRole) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  isLogoutConfirm = false,
  currentUserEmail = "zalo2299k@gmail.com",
  initialRole = "student",
  onConfirmLogout,
  onLoginSuccess,
}) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>(initialRole || "student");
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      const targetRole = initialRole || "student";
      setSelectedRole(targetRole);
      if (targetRole === "teacher") {
        setUsername("cuong.toan@thpt.edu.vn");
        setPassword("123456");
      } else {
        setUsername("hs.cuong");
        setPassword("123456");
      }
    }
  }, [isOpen, initialRole]);

  if (!isOpen) return null;

  const handleRoleTabChange = (role: UserRole) => {
    setSelectedRole(role);
    if (role === "teacher") {
      setUsername("cuong.toan@thpt.edu.vn");
      setPassword("123456");
    } else {
      setUsername("hs.cuong");
      setPassword("123456");
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalEmail = username.trim()
      ? username.includes("@")
        ? username.trim()
        : `${username.trim()}@hocsinh.thpt`
      : selectedRole === "teacher"
      ? "cuong.toan@thpt.edu.vn"
      : "zalo2299k@gmail.com";

    onLoginSuccess(finalEmail, selectedRole);
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
          /* Login View Matching media_1788534395002.png */
          <div className="p-6 sm:p-8 relative">
            {/* Close Button at Top-Right */}
            <button
              onClick={onClose}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-all"
              title="Đóng"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Top Brand Icon */}
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-purple-700 via-indigo-600 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/25 mb-4">
              <GraduationCap className="w-8 h-8 text-amber-300" />
            </div>

            {/* Title & Subtitle */}
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 text-center tracking-tight uppercase">
              {selectedRole === "student" ? "ĐĂNG NHẬP HỌC SINH" : "ĐĂNG NHẬP GIÁO VIÊN / ADMIN"}
            </h2>
            <p className="text-xs text-slate-500 text-center mt-1 mb-6 font-medium">
              Hệ thống Luyện thi Tốt nghiệp THPT Toán • Thầy Phan Quốc Cường
            </p>

            {/* Segmented Control: 🎓 Học sinh vs 👩‍🏫 Giáo viên / Admin */}
            <div className="bg-slate-100 p-1 rounded-2xl flex items-center gap-1 mb-5">
              <button
                type="button"
                onClick={() => handleRoleTabChange("student")}
                className={`py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 flex-1 transition-all text-xs sm:text-sm font-extrabold ${
                  selectedRole === "student"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                <span>Học sinh</span>
              </button>

              <button
                type="button"
                onClick={() => handleRoleTabChange("teacher")}
                className={`py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 flex-1 transition-all text-xs sm:text-sm font-extrabold ${
                  selectedRole === "teacher" || selectedRole === "admin"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Shield className="w-4 h-4" />
                <span>Giáo viên / Admin</span>
              </button>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-800 mb-1.5">
                  {selectedRole === "student"
                    ? "Tên đăng nhập / Mã học sinh"
                    : "Tên đăng nhập / Email Giáo viên"}
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={
                    selectedRole === "student"
                      ? "Nhập tên đăng nhập hoặc mã HS"
                      : "Nhập email hoặc mã giáo viên..."
                  }
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-sm font-medium text-slate-800 outline-none transition-all placeholder:text-slate-400 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-800 mb-1.5">
                  Mật khẩu
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-sm font-medium text-slate-800 outline-none transition-all placeholder:text-slate-400 bg-white"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full mt-2 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-black text-sm tracking-wide shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Đăng nhập</span>
                <ArrowRight className="w-4 h-4 stroke-[3]" />
              </button>

              {/* Quick Login Hint */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>Tài khoản mẫu:</span>
                <div className="flex items-center gap-2 font-bold">
                  <button
                    type="button"
                    onClick={() => {
                      handleRoleTabChange("student");
                      setUsername("hs.cuong");
                      setPassword("123456");
                    }}
                    className="text-blue-600 hover:underline"
                  >
                    Học sinh
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => {
                      handleRoleTabChange("teacher");
                      setUsername("cuong.toan@thpt.edu.vn");
                      setPassword("123456");
                    }}
                    className="text-purple-600 hover:underline"
                  >
                    Thầy Cường
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
