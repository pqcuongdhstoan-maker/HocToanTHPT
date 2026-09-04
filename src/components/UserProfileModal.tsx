import React, { useState } from "react";
import { StudentProfile, GradeLevel, UserRole } from "../types";
import {
  X,
  User,
  Mail,
  GraduationCap,
  School,
  Award,
  Flame,
  Check,
  Save,
  Shield,
  BookOpen,
  Target,
  Sparkles,
  BarChart2,
} from "lucide-react";

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentProfile;
  currentRole: UserRole;
  onUpdateProfile: (updated: Partial<StudentProfile>) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  student,
  currentRole,
  onUpdateProfile,
}) => {
  const [name, setName] = useState<string>(student.name || "Phan Quốc Cường");
  const [email, setEmail] = useState<string>(student.email || "zalo2299k@gmail.com");
  const [school, setSchool] = useState<string>(student.school || "THPT Chuyên Toán");
  const [grade, setGrade] = useState<GradeLevel>(student.grade || 12);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      name,
      email,
      school,
      grade,
    });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  const completedLessonsCount = Object.values(student.progress || {}).filter((p) => p.passed).length;
  const totalAttempts = Object.values(student.progress || {}).reduce((acc, p) => acc + (p.attemptsCount || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header with Dark Teal theme */}
        <div className="bg-gradient-to-r from-[#004d40] via-[#00695c] to-[#004d40] px-6 py-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="relative">
              <img
                src={student.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop"}
                alt="Avatar"
                className="w-12 h-12 rounded-2xl object-cover ring-2 ring-teal-300/40 shadow-md"
              />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full ring-2 ring-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-tight">{name}</h2>
                <span className="px-2 py-0.5 rounded-full bg-teal-500/30 text-teal-100 text-[10px] font-bold border border-teal-300/30">
                  {currentRole === "teacher" ? "Giáo viên" : currentRole === "admin" ? "Quản trị viên" : "Học sinh"}
                </span>
              </div>
              <p className="text-xs text-teal-100/80 flex items-center gap-1.5 mt-0.5 font-mono">
                <Mail className="w-3 h-3" />
                {email}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-teal-100 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Stats Banner */}
        <div className="grid grid-cols-3 gap-2 px-6 py-3 bg-teal-50/70 border-b border-teal-100 text-center shrink-0">
          <div className="p-2 bg-white rounded-xl border border-teal-200/60 shadow-2xs">
            <div className="flex items-center justify-center gap-1 text-amber-500 mb-0.5">
              <Flame className="w-3.5 h-3.5 fill-amber-500" />
              <span className="text-xs font-black">{student.streakDays} ngày</span>
            </div>
            <p className="text-[10px] font-medium text-slate-500">Chuỗi học tập</p>
          </div>

          <div className="p-2 bg-white rounded-xl border border-teal-200/60 shadow-2xs">
            <div className="flex items-center justify-center gap-1 text-emerald-600 mb-0.5">
              <Award className="w-3.5 h-3.5" />
              <span className="text-xs font-black">{student.points} điểm</span>
            </div>
            <p className="text-[10px] font-medium text-slate-500">Điểm thưởng tích lũy</p>
          </div>

          <div className="p-2 bg-white rounded-xl border border-teal-200/60 shadow-2xs">
            <div className="flex items-center justify-center gap-1 text-blue-600 mb-0.5">
              <GraduationCap className="w-3.5 h-3.5" />
              <span className="text-xs font-black">{completedLessonsCount} bài</span>
            </div>
            <p className="text-[10px] font-medium text-slate-500">Bài học hoàn thành</p>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Họ và tên người dùng
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 focus:bg-white rounded-xl text-xs font-bold border border-slate-300 focus:border-teal-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Địa chỉ Email tài khoản
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 focus:bg-white rounded-xl text-xs font-bold border border-slate-300 focus:border-teal-500 focus:outline-hidden font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Trường học / Đơn vị
              </label>
              <div className="relative">
                <School className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={school}
                  onChange={(e) => setSchool(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 focus:bg-white rounded-xl text-xs font-bold border border-slate-300 focus:border-teal-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Khối lớp tự luyện
              </label>
              <div className="flex items-center gap-2">
                {([12, 11, 10] as GradeLevel[]).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGrade(g)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                      grade === g
                        ? "bg-teal-700 text-white border-teal-700 shadow-2xs"
                        : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-300"
                    }`}
                  >
                    Lớp {g}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Academic Competency Radar Overview */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <BarChart2 className="w-4 h-4 text-teal-600" />
                Đánh giá năng lực toán học (GDPT 2018)
              </span>
              <span className="text-[10px] font-bold text-teal-700 bg-teal-100 px-2 py-0.5 rounded-full">
                Mục tiêu: Đạt chuẩn 9.0+
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <div className="flex justify-between font-bold text-slate-700 mb-1">
                  <span>Tư duy & Lập luận toán học</span>
                  <span className="text-teal-700">92%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                  <div className="h-full bg-teal-600 rounded-full" style={{ width: "92%" }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-bold text-slate-700 mb-1">
                  <span>Mô hình hóa toán học & Ứng dụng thực tế</span>
                  <span className="text-indigo-700">85%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                  <div className="h-full bg-indigo-600 rounded-full" style={{ width: "85%" }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-bold text-slate-700 mb-1">
                  <span>Giải quyết vấn đề toán học</span>
                  <span className="text-emerald-700">88%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                  <div className="h-full bg-emerald-600 rounded-full" style={{ width: "88%" }} />
                </div>
              </div>
            </div>
          </div>

          {/* Footer Save Button */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-all"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-teal-700 to-emerald-700 hover:from-teal-800 hover:to-emerald-800 text-white text-xs font-bold shadow-md shadow-teal-700/20 active:scale-95 transition-all"
            >
              {savedSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              <span>{savedSuccess ? "Đã lưu thành công!" : "Lưu thông tin hồ sơ"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
