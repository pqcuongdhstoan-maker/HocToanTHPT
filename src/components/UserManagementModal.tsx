import React, { useState } from "react";
import { AppUser, UserRole } from "../types";
import {
  X,
  Shield,
  Users,
  Search,
  Plus,
  Lock,
  Unlock,
  RefreshCw,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Mail,
  UserCheck,
  Award,
} from "lucide-react";

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUnlockAllLevels?: () => void;
  onResetProgress?: () => void;
  onSelectRole?: (role: UserRole) => void;
}

const INITIAL_USERS: AppUser[] = [
  {
    id: "user_admin",
    name: "Phan Quốc Cường",
    email: "zalo2299k@gmail.com",
    role: "admin",
    grade: 12,
    school: "THPT Chuyên Toán",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop",
    createdAt: "2025-01-15",
    status: "active",
    points: 250,
    streakDays: 7,
    cheatAlerts: 0,
  },
  {
    id: "user_teacher",
    name: "Thầy Phan Quốc Cường (Chuyên môn)",
    email: "cuong.toan@thpt.edu.vn",
    role: "teacher",
    grade: 12,
    school: "THPT Chuyên Toán",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop",
    createdAt: "2025-01-10",
    status: "active",
    points: 1500,
    streakDays: 45,
    cheatAlerts: 0,
  },
  {
    id: "user_stu_1",
    name: "Nguyễn Văn An",
    email: "an.nguyen@thpt.edu.vn",
    role: "student",
    grade: 12,
    school: "THPT Chu Văn An",
    avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop",
    createdAt: "2025-02-01",
    status: "active",
    points: 320,
    streakDays: 14,
    cheatAlerts: 0,
  },
  {
    id: "user_stu_2",
    name: "Trần Thị Mai",
    email: "mai.tran@thpt.edu.vn",
    role: "student",
    grade: 12,
    school: "THPT Chuyên Hà Nội - Amsterdam",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop",
    createdAt: "2025-02-05",
    status: "active",
    points: 410,
    streakDays: 21,
    cheatAlerts: 0,
  },
  {
    id: "user_stu_3",
    name: "Lê Hoàng Long",
    email: "long.le@thpt.edu.vn",
    role: "student",
    grade: 11,
    school: "THPT Lê Hồng Phong",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop",
    createdAt: "2025-02-12",
    status: "active",
    points: 120,
    streakDays: 3,
    cheatAlerts: 3, // Vi phạm chuyển tab
  },
  {
    id: "user_stu_4",
    name: "Phạm Minh Đức",
    email: "duc.pham@thpt.edu.vn",
    role: "student",
    grade: 10,
    school: "THPT Chuyên Khoa học Tự nhiên",
    avatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop",
    createdAt: "2025-02-18",
    status: "active",
    points: 180,
    streakDays: 5,
    cheatAlerts: 1,
  },
];

export const UserManagementModal: React.FC<UserManagementModalProps> = ({
  isOpen,
  onClose,
  onUnlockAllLevels,
  onResetProgress,
  onSelectRole,
}) => {
  const [users, setUsers] = useState<AppUser[]>(INITIAL_USERS);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [isAddingUser, setIsAddingUser] = useState<boolean>(false);
  const [newUserName, setNewUserName] = useState<string>("");
  const [newUserEmail, setNewUserEmail] = useState<string>("");
  const [newUserRole, setNewUserRole] = useState<UserRole>("student");

  if (!isOpen) return null;

  // Toggle user status (active / locked)
  const handleToggleStatus = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId ? { ...u, status: u.status === "active" ? "locked" : "active" } : u
      )
    );
  };

  // Change role
  const handleChangeRole = (userId: string, newRole: UserRole) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
    );
  };

  // Add user
  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim()) return;

    const newUser: AppUser = {
      id: `user_${Date.now()}`,
      name: newUserName.trim(),
      email: newUserEmail.trim(),
      role: newUserRole,
      grade: 12,
      school: "THPT Chuyên Toán",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop",
      createdAt: new Date().toISOString().split("T")[0],
      status: "active",
      points: 100,
      streakDays: 1,
      cheatAlerts: 0,
    };

    setUsers((prev) => [newUser, ...prev]);
    setNewUserName("");
    setNewUserEmail("");
    setIsAddingUser(false);
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.school && u.school.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesRole =
      roleFilter === "ALL" ||
      (roleFilter === "STUDENT" && u.role === "student") ||
      (roleFilter === "TEACHER" && u.role === "teacher") ||
      (roleFilter === "ADMIN" && u.role === "admin");

    return matchesSearch && matchesRole;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header with Dark Teal theme */}
        <div className="bg-gradient-to-r from-[#004d40] via-[#00695c] to-[#004d40] px-6 py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20 shadow-inner">
              <Shield className="w-5 h-5 text-teal-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-tight">🛡️ Quản lý Người dùng & Phân quyền Hệ thống</h2>
                <span className="px-2 py-0.5 rounded-full bg-teal-500/30 text-teal-100 text-[10px] font-bold border border-teal-300/30">
                  {users.length} tài khoản
                </span>
              </div>
              <p className="text-xs text-teal-100/80">
                Phân quyền tài khoản học sinh, giáo viên, giám sát thi trực tuyến và kiểm tra gian lận
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

        {/* Top metrics summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-6 py-3 bg-teal-50/70 border-b border-teal-100 shrink-0">
          <div className="p-2.5 bg-white rounded-xl border border-teal-200/60 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Tổng tài khoản</span>
            <div className="text-base font-black text-teal-900">{users.length} user</div>
          </div>
          <div className="p-2.5 bg-white rounded-xl border border-teal-200/60 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Học sinh tự luyện</span>
            <div className="text-base font-black text-blue-700">
              {users.filter((u) => u.role === "student").length} học sinh
            </div>
          </div>
          <div className="p-2.5 bg-white rounded-xl border border-teal-200/60 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Giáo viên & Admin</span>
            <div className="text-base font-black text-indigo-700">
              {users.filter((u) => u.role !== "student").length} tài khoản
            </div>
          </div>
          <div className="p-2.5 bg-white rounded-xl border border-rose-200 shadow-2xs">
            <span className="text-[10px] font-bold text-rose-600 uppercase">Cảnh báo gian lận</span>
            <div className="text-base font-black text-rose-700 flex items-center gap-1">
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              <span>{users.filter((u) => (u.cheatAlerts || 0) > 0).length} vi phạm</span>
            </div>
          </div>
        </div>

        {/* Filter & Action bar */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm kiếm theo tên, email hoặc trường học..."
                className="w-full pl-9 pr-3 py-1.5 bg-white rounded-xl text-xs font-medium border border-slate-300 focus:border-teal-500 focus:outline-hidden"
              />
            </div>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-1.5 bg-white rounded-xl text-xs font-bold border border-slate-300 focus:outline-hidden text-slate-700"
            >
              <option value="ALL">Tất cả vai trò</option>
              <option value="STUDENT">Học sinh</option>
              <option value="TEACHER">Giáo viên</option>
              <option value="ADMIN">Quản trị viên</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            {onUnlockAllLevels && (
              <button
                onClick={onUnlockAllLevels}
                className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold transition-all"
                title="Mở khóa tất cả bài học phục vụ kiểm thử"
              >
                Mở khóa tất cả bài
              </button>
            )}

            {onResetProgress && (
              <button
                onClick={onResetProgress}
                className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-all"
                title="Đặt lại tiến độ kiểm tra về ban đầu"
              >
                Reset tiến độ
              </button>
            )}

            <button
              onClick={() => setIsAddingUser(!isAddingUser)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold shadow-2xs active:scale-95 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm user mới</span>
            </button>
          </div>
        </div>

        {/* Add User Drawer / Form */}
        {isAddingUser && (
          <form onSubmit={handleAddUser} className="p-4 bg-teal-50/90 border-b border-teal-200 flex flex-wrap items-center gap-3 shrink-0 animate-in slide-in-from-top-2">
            <input
              type="text"
              required
              value={newUserName}
              onChange={(e) => setNewUserName(e.target.value)}
              placeholder="Họ tên người dùng..."
              className="px-3 py-1.5 bg-white rounded-xl text-xs font-bold border border-teal-300 focus:outline-hidden min-w-[180px]"
            />
            <input
              type="email"
              required
              value={newUserEmail}
              onChange={(e) => setNewUserEmail(e.target.value)}
              placeholder="Email đăng nhập..."
              className="px-3 py-1.5 bg-white rounded-xl text-xs font-bold border border-teal-300 focus:outline-hidden min-w-[200px]"
            />
            <select
              value={newUserRole}
              onChange={(e) => setNewUserRole(e.target.value as UserRole)}
              className="px-3 py-1.5 bg-white rounded-xl text-xs font-bold border border-teal-300 text-slate-700 focus:outline-hidden"
            >
              <option value="student">Học sinh</option>
              <option value="teacher">Giáo viên</option>
              <option value="admin">Quản trị viên (Admin)</option>
            </select>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold transition-all"
            >
              Lưu tài khoản
            </button>
            <button
              type="button"
              onClick={() => setIsAddingUser(false)}
              className="px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold transition-all"
            >
              Hủy
            </button>
          </form>
        )}

        {/* Table Body */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-extrabold border-b border-slate-200">
                  <th className="p-3">Họ tên & Tài khoản</th>
                  <th className="p-3">Vai trò</th>
                  <th className="p-3">Khối lớp / Đơn vị</th>
                  <th className="p-3 text-center">Điểm / Chuỗi</th>
                  <th className="p-3 text-center">Giám sát thi</th>
                  <th className="p-3 text-center">Trạng thái</th>
                  <th className="p-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={u.avatar}
                          alt={u.name}
                          className="w-8 h-8 rounded-xl object-cover ring-1 ring-slate-200"
                        />
                        <div>
                          <div className="font-extrabold text-slate-900">{u.name}</div>
                          <div className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
                            <Mail className="w-2.5 h-2.5" />
                            {u.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <select
                        value={u.role}
                        onChange={(e) => handleChangeRole(u.id, e.target.value as UserRole)}
                        className={`text-[11px] font-extrabold px-2 py-1 rounded-lg border focus:outline-hidden ${
                          u.role === "admin"
                            ? "bg-slate-900 text-white border-slate-900"
                            : u.role === "teacher"
                            ? "bg-indigo-100 text-indigo-800 border-indigo-200"
                            : "bg-blue-100 text-blue-800 border-blue-200"
                        }`}
                      >
                        <option value="student">Học sinh</option>
                        <option value="teacher">Giáo viên</option>
                        <option value="admin">Quản trị viên</option>
                      </select>
                    </td>
                    <td className="p-3">
                      <div className="font-semibold text-slate-800">{u.school || "THPT Chuyên Toán"}</div>
                      <div className="text-[11px] text-slate-500">Khối {u.grade || 12}</div>
                    </td>
                    <td className="p-3 text-center">
                      <div className="font-extrabold text-emerald-700">{u.points || 0}đ</div>
                      <div className="text-[10px] text-slate-500">{u.streakDays || 0} ngày</div>
                    </td>
                    <td className="p-3 text-center">
                      {(u.cheatAlerts || 0) > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-bold border border-rose-200">
                          <AlertTriangle className="w-3 h-3" />
                          {u.cheatAlerts} vi phạm
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                          <CheckCircle2 className="w-3 h-3" />
                          Trung thực
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                          u.status === "active"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {u.status === "active" ? "Hoạt động" : "Đã khóa"}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleToggleStatus(u.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                          title={u.status === "active" ? "Khóa tài khoản" : "Mở khóa tài khoản"}
                        >
                          {u.status === "active" ? (
                            <Lock className="w-3.5 h-3.5 text-amber-600" />
                          ) : (
                            <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                          )}
                        </button>
                        {onSelectRole && (
                          <button
                            onClick={() => {
                              onSelectRole(u.role);
                              onClose();
                            }}
                            className="px-2 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 text-[10px] font-bold transition-all"
                            title="Đóng vai trò này"
                          >
                            Chuyển vai
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <p className="text-xs text-slate-500">
            Hệ thống quản lý tài khoản & phân quyền giáo viên Thầy Phan Quốc Cường
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition-all"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
