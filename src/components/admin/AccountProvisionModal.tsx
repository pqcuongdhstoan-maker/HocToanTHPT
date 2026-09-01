import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserProfile, UserRole } from '../../types';
import {
  Users,
  UserPlus,
  Key,
  Shield,
  Search,
  Download,
  CheckCircle2,
  X,
  FileSpreadsheet,
  RefreshCw,
  Lock,
  Mail,
  School,
  Sparkles,
} from 'lucide-react';

interface AccountProvisionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AccountProvisionModal: React.FC<AccountProvisionModalProps> = ({ isOpen, onClose }) => {
  const { classes, students, setStudents, showToast, currentUser } = useApp();

  const [activeTab, setActiveTab] = useState<'single' | 'batch' | 'list'>('single');

  // Single Account Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('123456');
  const [selectedRole, setSelectedRole] = useState<UserRole>('student');
  const [selectedClassId, setSelectedClassId] = useState(classes[0]?.id || 'c1');

  // Batch Provision State
  const [batchClassId, setBatchClassId] = useState(classes[0]?.id || 'c1');
  const [batchPrefix, setBatchPrefix] = useState('hs');
  const [batchCount, setBatchCount] = useState(40);
  const [batchDefaultPassword, setBatchDefaultPassword] = useState('Toan12@2025');

  // List search & filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClass, setFilterClass] = useState('all');

  if (!isOpen) return null;

  // Handle single provision
  const handleCreateSingleAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) {
      showToast('Thiếu thông tin', 'Vui lòng nhập họ tên và email.', 'warning');
      return;
    }

    const cls = classes.find((c) => c.id === selectedClassId);
    const newAccount: UserProfile = {
      id: 'usr_' + Date.now(),
      fullName: fullName.trim(),
      email: email.trim(),
      role: selectedRole,
      classId: selectedRole === 'student' ? selectedClassId : undefined,
      className: selectedRole === 'student' ? cls?.name || '12TN1' : undefined,
      schoolYear: '2025-2026',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'active',
      xp: 0,
      level: 1,
      streakDays: 0,
      lastActiveAt: new Date().toISOString(),
      badges: ['new_member'],
    };

    setStudents((prev) => [newAccount, ...prev]);

    // Save to local storage
    const saved = JSON.parse(localStorage.getItem('custom_users_list') || '[]');
    localStorage.setItem('custom_users_list', JSON.stringify([newAccount, ...saved]));

    showToast(
      'Cấp tài khoản thành công',
      `Đã tạo tài khoản cho ${newAccount.fullName} (${newAccount.email}) - Mật khẩu: ${password}`,
      'success'
    );

    // Reset Form
    setFullName('');
    setEmail('');
    setPassword('123456');
  };

  // Handle batch provisioning
  const handleCreateBatchAccounts = () => {
    const cls = classes.find((c) => c.id === batchClassId);
    const classNameClean = (cls?.name || '12TN1').toLowerCase().replace(/\s+/g, '');
    const newBatch: UserProfile[] = [];

    for (let i = 1; i <= batchCount; i++) {
      const idxStr = i < 10 ? `0${i}` : `${i}`;
      const accEmail = `${batchPrefix}${idxStr}.${classNameClean}@toan12.edu.vn`;
      const accName = `Học Sinh ${idxStr} - ${cls?.name || '12TN1'}`;

      newBatch.push({
        id: `usr_${classNameClean}_${idxStr}_${Date.now()}`,
        fullName: accName,
        email: accEmail,
        role: 'student',
        classId: batchClassId,
        className: cls?.name || '12TN1',
        schoolYear: '2025-2026',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'active',
        xp: 0,
        level: 1,
        streakDays: 0,
        lastActiveAt: new Date().toISOString(),
        badges: ['new_member'],
      });
    }

    setStudents((prev) => [...newBatch, ...prev]);

    const saved = JSON.parse(localStorage.getItem('custom_users_list') || '[]');
    localStorage.setItem('custom_users_list', JSON.stringify([...newBatch, ...saved]));

    showToast(
      'Cấp hàng loạt thành công!',
      `Đã cấp ${batchCount} tài khoản học sinh cho lớp ${cls?.name} với mật khẩu mặc định: ${batchDefaultPassword}`,
      'success'
    );
    setActiveTab('list');
  };

  // Export accounts list to CSV
  const handleExportAccountsCsv = () => {
    const header = 'STT,Họ và Tên,Email,Lớp,Vai Trò,Trạng Thái,Mật Khẩu Mặc Định\n';
    const rows = students
      .map((st, idx) => {
        return `${idx + 1},"${st.fullName}","${st.email}","${st.className || 'N/A'}","${st.role}","${st.status}","123456"`;
      })
      .join('\n');

    const blob = new Blob(['\uFEFF' + header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Danh_Sach_Tai_Khoan_Toan12_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    showToast('Xuất danh sách thành công', 'Đã tải xuống file CSV danh sách tài khoản.', 'success');
  };

  const filteredStudents = students.filter((st) => {
    if (filterClass !== 'all' && st.classId !== filterClass) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return st.fullName.toLowerCase().includes(q) || st.email.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-teal-900 via-teal-800 to-teal-950 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-600/60 flex items-center justify-center border border-teal-400/40">
              <Shield className="w-5 h-5 text-teal-200" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">Quản Lý &amp; Cấp Tài Khoản</h2>
              <p className="text-xs text-teal-300">Dành cho Giáo viên &amp; Quản trị viên</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-teal-800/80 hover:bg-teal-700 flex items-center justify-center text-teal-200 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="p-3 border-b border-slate-100 bg-slate-50 flex items-center gap-2 text-xs font-bold">
          <button
            onClick={() => setActiveTab('single')}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
              activeTab === 'single' ? 'bg-teal-700 text-white shadow-xs' : 'bg-white text-slate-600 hover:bg-slate-200'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Cấp tài khoản đơn lẻ</span>
          </button>
          <button
            onClick={() => setActiveTab('batch')}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
              activeTab === 'batch' ? 'bg-teal-700 text-white shadow-xs' : 'bg-white text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Cấp tự động theo lớp</span>
          </button>
          <button
            onClick={() => setActiveTab('list')}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
              activeTab === 'list' ? 'bg-teal-700 text-white shadow-xs' : 'bg-white text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Danh sách tài khoản ({students.length})</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* TAB 1: Single Account Provision */}
          {activeTab === 'single' && (
            <form onSubmit={handleCreateSingleAccount} className="space-y-4 max-w-xl mx-auto">
              <div className="bg-teal-50/80 border border-teal-200 p-4 rounded-2xl text-xs text-teal-900 leading-relaxed">
                💡 Cấp tài khoản riêng cho giáo viên bộ môn hoặc học sinh chuyển lớp/học sinh mới.
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Họ và tên người nhận:</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ví dụ: Trần Minh Đức"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Email đăng nhập:</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="duc.tran@toan12.edu.vn"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
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
                    <label className="text-xs font-bold text-slate-700 block mb-1">Lớp học phân bổ:</label>
                    <select
                      value={selectedClassId}
                      onChange={(e) => setSelectedClassId(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    >
                      {classes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} (Sĩ số: {c.studentCount})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Mật khẩu khởi tạo:</label>
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-teal-800 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl text-xs shadow transition flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Hoàn Tất &amp; Kích Hoạt Tài Khoản</span>
              </button>
            </form>
          )}

          {/* TAB 2: Batch Provisioning */}
          {activeTab === 'batch' && (
            <div className="space-y-4 max-w-xl mx-auto">
              <div className="bg-amber-50/80 border border-amber-200 p-4 rounded-2xl text-xs text-amber-900 leading-relaxed">
                ⚡ Tính năng cấp nhanh hàng loạt: Hệ thống sẽ tự động tạo email và mật khẩu đồng bộ cho toàn bộ học sinh trong lớp theo danh sách chuẩn.
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Chọn lớp học:</label>
                  <select
                    value={batchClassId}
                    onChange={(e) => setBatchClassId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Số lượng tài khoản:</label>
                  <input
                    type="number"
                    min={1}
                    max={55}
                    value={batchCount}
                    onChange={(e) => setBatchCount(parseInt(e.target.value) || 40)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Mật khẩu mặc định:</label>
                <input
                  type="text"
                  value={batchDefaultPassword}
                  onChange={(e) => setBatchDefaultPassword(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-teal-800"
                />
              </div>

              <div className="p-3.5 bg-slate-100 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-1 font-mono">
                <div className="font-bold text-slate-800 font-sans">Mẫu tài khoản sẽ tạo:</div>
                <div>• hs01.{classes.find((c) => c.id === batchClassId)?.name.toLowerCase()}@toan12.edu.vn</div>
                <div>• hs02.{classes.find((c) => c.id === batchClassId)?.name.toLowerCase()}@toan12.edu.vn ...</div>
              </div>

              <button
                type="button"
                onClick={handleCreateBatchAccounts}
                className="w-full py-3 bg-gradient-to-r from-teal-700 to-emerald-700 hover:from-teal-800 hover:to-emerald-800 text-white font-bold rounded-xl text-xs shadow-md transition flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-4 h-4" />
                <span>Sinh &amp; Cấp {batchCount} Tài Khoản Cho Lớp</span>
              </button>
            </div>
          )}

          {/* TAB 3: Accounts List */}
          {activeTab === 'list' && (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-2 flex-1">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Tìm theo tên hoặc email..."
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                  </div>
                  <select
                    value={filterClass}
                    onChange={(e) => setFilterClass(e.target.value)}
                    className="p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                  >
                    <option value="all">Tất cả các lớp</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleExportAccountsCsv}
                  className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs shadow-xs transition flex items-center gap-1.5 flex-shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Xuất File CSV</span>
                </button>
              </div>

              {/* Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Học sinh / Giáo viên</th>
                      <th className="p-3">Email</th>
                      <th className="p-3">Lớp</th>
                      <th className="p-3">Vai trò</th>
                      <th className="p-3">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredStudents.slice(0, 50).map((st) => (
                      <tr key={st.id} className="hover:bg-teal-50/50 transition">
                        <td className="p-3 font-semibold text-slate-900 flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-[11px]">
                            {st.fullName.charAt(0)}
                          </div>
                          <span>{st.fullName}</span>
                        </td>
                        <td className="p-3 font-mono text-slate-600">{st.email}</td>
                        <td className="p-3">
                          <span className="bg-slate-100 text-slate-800 font-bold px-2 py-0.5 rounded text-[11px]">
                            {st.className || 'Chung'}
                          </span>
                        </td>
                        <td className="p-3">
                          <span
                            className={`font-semibold px-2 py-0.5 rounded text-[10px] ${
                              st.role === 'teacher'
                                ? 'bg-amber-100 text-amber-800'
                                : st.role === 'admin'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-teal-100 text-teal-800'
                            }`}
                          >
                            {st.role === 'teacher' ? 'Giáo viên' : st.role === 'admin' ? 'Admin' : 'Học sinh'}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-[11px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Hoạt động
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
