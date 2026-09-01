import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { UserProfile, AuditLog, ClassRoom } from '../../types';
import {
  Users,
  Unlock,
  Shield,
  FileText,
  Search,
  CheckCircle2,
  Lock,
  Award,
  AlertCircle,
  Plus,
  Loader2,
  FileSpreadsheet,
  RefreshCw,
  ExternalLink,
  Copy,
  Check,
  Filter,
  Download,
  GraduationCap,
  Sparkles,
  ArrowRight,
  Database,
  Calendar,
  Layers,
} from 'lucide-react';
import {
  DEFAULT_SAMPLE_SHEET_URL,
  generateSampleSheetCsv,
  fetchGoogleSheetLive,
  SheetParseResult,
} from '../../services/googleSheetService';

export const ClassManager: React.FC = () => {
  const {
    classes,
    setClasses,
    lessons,
    showToast,
    sheetSyncState,
    syncClassesFromSheet,
    updateSheetConfig,
    students,
    setStudents,
  } = useApp();

  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || 'c1');
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [activeTab, setActiveTab] = useState<'roster' | 'sheets' | 'audit'>('roster');
  const [searchStudentQuery, setSearchStudentQuery] = useState<string>('');

  // Sheet Studio State
  const [customSheetUrl, setCustomSheetUrl] = useState<string>(sheetSyncState.sheetUrl || DEFAULT_SAMPLE_SHEET_URL);
  const [customGid, setCustomGid] = useState<string>(sheetSyncState.sheetGid || '0');
  const [isPreviewing, setIsPreviewing] = useState<boolean>(false);
  const [previewResult, setPreviewResult] = useState<SheetParseResult | null>(null);
  const [isCopiedTemplate, setIsCopiedTemplate] = useState<boolean>(false);

  // Manual Unlock Modal state
  const [showUnlockModal, setShowUnlockModal] = useState<boolean>(false);
  const [targetStudent, setTargetStudent] = useState<UserProfile | null>(null);
  const [targetLessonId, setTargetLessonId] = useState<string>(lessons[1]?.id || 'lesson-2');
  const [unlockReason, setUnlockReason] = useState<string>('Học sinh cần ôn thi chuyên đề nâng cao');
  const [isUnlocking, setIsUnlocking] = useState<boolean>(false);

  useEffect(() => {
    const fetchAudit = async () => {
      try {
        const logs = await api.getAuditLogs();
        setAuditLogs(logs);
      } catch (err) {
        console.error('Error fetching audit logs:', err);
      }
    };
    fetchAudit();
  }, []);

  // Filter students by selected class and search query
  const filteredStudents = students.filter((s) => {
    const matchClass = s.classId === selectedClassId;
    if (!matchClass) return false;
    if (searchStudentQuery.trim()) {
      const q = searchStudentQuery.toLowerCase().trim();
      const matchName = s.fullName.toLowerCase().includes(q);
      const matchEmail = s.email.toLowerCase().includes(q);
      const matchId = s.id.toLowerCase().includes(q);
      return matchName || matchEmail || matchId;
    }
    return true;
  });

  const selectedClass = classes.find((c) => c.id === selectedClassId) || classes[0];

  const handleManualUnlock = async () => {
    if (!targetStudent) return;
    setIsUnlocking(true);
    try {
      await api.unlockLessonOverride(targetStudent.id, targetLessonId, unlockReason);
      showToast('Mở khóa thành công!', `Đã mở khóa bài học cho học sinh ${targetStudent.fullName}.`, 'success');
      setShowUnlockModal(false);
      const logs = await api.getAuditLogs();
      setAuditLogs(logs);
    } catch (err) {
      console.error('Unlock error:', err);
      showToast('Lỗi', 'Không thể mở khóa bài học', 'error');
    } finally {
      setIsUnlocking(false);
    }
  };

  const handlePreviewSheet = async () => {
    if (!customSheetUrl.trim()) {
      showToast('Chưa nhập URL', 'Vui lòng nhập đường link Google Sheet cần xem trước.', 'warning');
      return;
    }

    setIsPreviewing(true);
    setPreviewResult(null);
    try {
      const res = await fetchGoogleSheetLive(customSheetUrl.trim(), customGid.trim());
      setPreviewResult(res);
      if (res.success) {
        showToast('Tải dữ liệu thành công', `Tìm thấy ${res.classes.length} lớp học và ${res.students.length} học sinh.`, 'success');
      } else {
        showToast('Cảnh báo dữ liệu', res.message, 'warning');
      }
    } catch (err: any) {
      console.error('Preview error:', err);
      showToast('Lỗi đọc Google Sheet', err?.message || 'Không thể kết nối với file Google Sheet.', 'error');
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleApplySync = async () => {
    updateSheetConfig({
      sheetUrl: customSheetUrl.trim(),
      sheetGid: customGid.trim(),
    });
    const ok = await syncClassesFromSheet(customSheetUrl.trim(), customGid.trim());
    if (ok) {
      setActiveTab('roster');
      const logs = await api.getAuditLogs();
      setAuditLogs(logs);
    }
  };

  const handleExportCsv = () => {
    const csvContent =
      'STT,Mã Học Sinh,Họ và tên,Email,Lớp,XP,Cấp độ,Ngày tham gia\n' +
      filteredStudents
        .map(
          (s, idx) =>
            `${idx + 1},${s.id},"${s.fullName}",${s.email},${selectedClass?.name || s.className},${s.xp || 200},${
              s.level || 1
            },${s.createdAt || ''}`
        )
        .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `danh_sach_lop_${selectedClass?.name || '12'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Đã xuất file!', `Đã tải danh sách học sinh lớp ${selectedClass?.name}.`, 'success');
  };

  const handleCopyTemplate = () => {
    const csv = generateSampleSheetCsv();
    navigator.clipboard.writeText(csv);
    setIsCopiedTemplate(true);
    showToast('Đã sao chép cấu trúc mẫu!', 'Dán vào Google Sheet để tạo bảng danh sách lớp học chuẩn.', 'success');
    setTimeout(() => setIsCopiedTemplate(false), 3000);
  };

  return (
    <div id="class-manager-container" className="max-w-7xl mx-auto space-y-6 pb-20 animate-fadeIn">
      {/* Top Banner / Navigation Bar */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center space-x-2 text-teal-800 text-xs font-bold uppercase tracking-wider mb-1.5">
            <Users className="w-4 h-4 text-teal-600" />
            <span>Quản trị Lớp học & Cơ sở dữ liệu Trực tuyến</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Quản Lý Danh Sách Lớp & Học Sinh
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Giáo viên phụ trách: <strong className="text-slate-800 font-semibold">Thầy Phan Quốc Cường</strong> • Khối 12 GDPT 2018 (Năm học 2025 - 2026)
          </p>
        </div>

        {/* Tab Selector Buttons */}
        <div className="flex items-center bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/80 shadow-inner flex-shrink-0 self-start lg:self-auto">
          <button
            onClick={() => setActiveTab('roster')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
              activeTab === 'roster'
                ? 'bg-white text-teal-950 shadow-sm ring-1 ring-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-teal-600" />
            <span>Danh sách Lớp ({classes.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('sheets')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
              activeTab === 'sheets'
                ? 'bg-white text-emerald-950 shadow-sm ring-1 ring-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Kết nối Google Sheets</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
              activeTab === 'audit'
                ? 'bg-white text-teal-950 shadow-sm ring-1 ring-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-indigo-600" />
            <span>Nhật ký hệ thống</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: ROSTER VIEW (Danh sách Lớp & Học Sinh) */}
      {/* ========================================================================= */}
      {activeTab === 'roster' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Top Quick Status & Sync Trigger */}
          <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-teal-950 rounded-2xl p-4 text-white shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-sm text-white">
                    Cơ sở dữ liệu đám mây Google Sheets:
                  </span>
                  <span className="bg-emerald-500/30 text-emerald-300 border border-emerald-400/40 text-[10px] px-2 py-0.5 rounded-full font-bold">
                    Trực tuyến
                  </span>
                </div>
                <p className="text-[11px] text-teal-200 mt-0.5">
                  Đang hiển thị <strong>{classes.length} lớp học</strong> và <strong>{students.length} học sinh</strong>. Dữ liệu tự động đồng bộ thời gian thực.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => syncClassesFromSheet()}
                disabled={sheetSyncState.isSyncing}
                className="px-4 py-2 bg-teal-700 hover:bg-teal-600 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-sm active:scale-95"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${sheetSyncState.isSyncing ? 'animate-spin' : ''}`} />
                <span>{sheetSyncState.isSyncing ? 'Đang đồng bộ...' : 'Đồng bộ lại'}</span>
              </button>
              <button
                onClick={() => setActiveTab('sheets')}
                className="px-4 py-2 bg-white text-teal-950 hover:bg-teal-50 rounded-xl text-xs font-bold transition shadow-sm"
              >
                Cấu hình Sheet
              </button>
            </div>
          </div>

          {/* Class Selector Grid */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500 px-1">
              <span className="font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-teal-600" /> Chọn lớp học để quản lý:
              </span>
              <span>Tổng số: {classes.length} lớp</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
              {classes.map((cls) => {
                const isSelected = selectedClassId === cls.id;
                const studentCountInClass = students.filter((s) => s.classId === cls.id).length || cls.studentCount;
                return (
                  <button
                    key={cls.id}
                    onClick={() => setSelectedClassId(cls.id)}
                    className={`p-3.5 rounded-2xl border text-left transition-all duration-200 ${
                      isSelected
                        ? 'bg-gradient-to-b from-teal-50 to-teal-100/60 border-teal-500 text-teal-950 shadow-md ring-2 ring-teal-500/50 scale-[1.02]'
                        : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold text-teal-700 uppercase bg-teal-100/80 px-2 py-0.5 rounded-md">
                        Khối {cls.grade}
                      </span>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-teal-600" />}
                    </div>
                    <div className="text-lg font-black text-slate-900 mt-2 tracking-tight">
                      {cls.name}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
                      <span>{studentCountInClass} học sinh</span>
                      <span className="font-semibold text-teal-700">Tự nhiên</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Student Roster Table & Toolbar */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            {/* Table Header Toolbar */}
            <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-base font-bold text-slate-900">
                    Danh sách học sinh {selectedClass?.name}
                  </h3>
                  <span className="bg-teal-100 text-teal-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-teal-200">
                    {filteredStudents.length} học sinh
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Giáo viên chủ nhiệm: {selectedClass?.teacherName || 'Thầy Phan Quốc Cường'}
                </p>
              </div>

              {/* Search & Actions */}
              <div className="flex items-center gap-2.5">
                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchStudentQuery}
                    onChange={(e) => setSearchStudentQuery(e.target.value)}
                    placeholder="Tìm theo tên, email, mã HS..."
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                  {searchStudentQuery && (
                    <button
                      onClick={() => setSearchStudentQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <button
                  onClick={handleExportCsv}
                  className="px-3 py-2 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 transition flex items-center space-x-1.5 flex-shrink-0 shadow-2xs"
                  title="Xuất file CSV danh sách lớp"
                >
                  <Download className="w-3.5 h-3.5 text-teal-600" />
                  <span className="hidden sm:inline">Xuất CSV</span>
                </button>
              </div>
            </div>

            {/* Table Content */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-bold text-[11px] tracking-wider">
                  <tr>
                    <th className="py-3.5 px-5">STT</th>
                    <th className="py-3.5 px-4">Họ và tên học sinh</th>
                    <th className="py-3.5 px-4">Email đăng nhập</th>
                    <th className="py-3.5 px-4">Cấp độ & XP</th>
                    <th className="py-3.5 px-4">Trạng thái</th>
                    <th className="py-3.5 px-4">Hoạt động gần nhất</th>
                    <th className="py-3.5 px-5 text-right">Mở khóa bài</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-500">
                        <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="font-semibold text-sm">Không tìm thấy học sinh nào</p>
                        <p className="text-xs text-slate-400 mt-1">
                          Vui lòng kiểm tra lại từ khóa tìm kiếm hoặc đồng bộ lại từ Google Sheets.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((st, idx) => (
                      <tr key={st.id} className="hover:bg-teal-50/40 transition">
                        <td className="py-3.5 px-5 font-mono text-slate-400 font-semibold">
                          {idx + 1}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center space-x-2.5">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-teal-500 to-teal-700 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                              {st.fullName.charAt(0)}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 text-xs">
                                {st.fullName}
                              </div>
                              <span className="text-[10px] text-slate-400 font-mono">
                                ID: {st.id}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">
                          {st.email}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center space-x-1.5 font-bold text-teal-900 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200 shadow-2xs">
                            <Award className="w-3.5 h-3.5 text-teal-600" />
                            <span>Lv.{st.level || 1} ({st.xp || 200} XP)</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center space-x-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            <span>Đang học</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                          {st.lastActiveAt ? new Date(st.lastActiveAt).toLocaleString('vi-VN') : 'Hôm nay'}
                        </td>
                        <td className="py-3.5 px-5 text-right">
                          <button
                            onClick={() => {
                              setTargetStudent(st);
                              setShowUnlockModal(true);
                            }}
                            className="inline-flex items-center space-x-1 px-3 py-1.5 bg-white hover:bg-teal-50 text-teal-800 border border-teal-300 rounded-xl text-xs font-semibold shadow-2xs transition active:scale-95"
                          >
                            <Unlock className="w-3 h-3 text-teal-600" />
                            <span>Đặc cách</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: GOOGLE SHEETS LIVE CLOUD SYNC STUDIO */}
      {/* ========================================================================= */}
      {activeTab === 'sheets' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Cloud Sync Hero Card */}
          <div className="bg-gradient-to-br from-teal-950 via-teal-900 to-slate-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-teal-800 relative overflow-hidden">
            <div className="max-w-2xl space-y-3 relative z-10">
              <div className="inline-flex items-center space-x-2 bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Google Sheets Live Cloud Sync Engine</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Kết Nối & Đồng Bộ Cơ Sở Dữ Liệu Lớp Học
              </h2>
              <p className="text-xs sm:text-sm text-teal-200/90 leading-relaxed">
                Tự động tải danh sách lớp học và học sinh trực tiếp từ bảng tính Google Sheets của bạn. Hệ thống tự nhận diện các cột tiếng Việt và cập nhật ngay vào ứng dụng.
              </p>
            </div>

            <div className="mt-6 pt-6 border-t border-teal-800/80 flex flex-wrap items-center gap-4 text-xs text-teal-200">
              <div className="flex items-center space-x-2 bg-teal-900/60 px-3 py-1.5 rounded-xl border border-teal-700/60">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Trạng thái: <strong>Đã kết nối trực tuyến</strong></span>
              </div>
              <div className="flex items-center space-x-2 bg-teal-900/60 px-3 py-1.5 rounded-xl border border-teal-700/60">
                <Calendar className="w-4 h-4 text-teal-400" />
                <span>Lần đồng bộ gần nhất: <strong>{sheetSyncState.lastSyncedAt ? new Date(sheetSyncState.lastSyncedAt).toLocaleString('vi-VN') : 'Mặc định'}</strong></span>
              </div>
              <div className="flex items-center space-x-2 bg-teal-900/60 px-3 py-1.5 rounded-xl border border-teal-700/60">
                <Users className="w-4 h-4 text-amber-400" />
                <span>Tổng nạp: <strong>{classes.length} Lớp • {students.length} Học sinh</strong></span>
              </div>
            </div>
          </div>

          {/* Sheet Connection Form */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Database className="w-5 h-5 text-teal-600" />
              <span>Thiết lập liên kết Google Sheets của Giáo viên</span>
            </h3>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span>Đường link Google Sheets (Chia sẻ quyền Người xem):</span>
                  <a
                    href="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit#gid=0"
                    target="_blank"
                    rel="noreferrer"
                    className="text-teal-700 hover:text-teal-900 underline text-xs font-semibold flex items-center gap-1"
                  >
                    <span>Mở bảng tính mẫu mẫu</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customSheetUrl}
                    onChange={(e) => setCustomSheetUrl(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/..."
                    className="flex-1 p-3 bg-slate-50 border border-slate-300 rounded-2xl font-mono text-xs text-slate-900 focus:ring-2 focus:ring-teal-500 focus:bg-white focus:outline-none transition"
                  />
                  <button
                    onClick={handleCopyTemplate}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 flex-shrink-0"
                    title="Sao chép cấu trúc CSV mẫu"
                  >
                    {isCopiedTemplate ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    <span>{isCopiedTemplate ? 'Đã sao chép' : 'Chép mẫu CSV'}</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Mã Sheet (GID - Mặc định là 0):</label>
                  <input
                    type="text"
                    value={customGid}
                    onChange={(e) => setCustomGid(e.target.value)}
                    placeholder="0"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2 flex items-center justify-end gap-3 sm:pt-6">
                  <button
                    onClick={handlePreviewSheet}
                    disabled={isPreviewing}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl text-xs font-bold transition flex items-center gap-1.5"
                  >
                    {isPreviewing ? <Loader2 className="w-4 h-4 animate-spin text-teal-600" /> : <Search className="w-4 h-4" />}
                    <span>Kiểm tra & Xem trước</span>
                  </button>

                  <button
                    onClick={handleApplySync}
                    disabled={sheetSyncState.isSyncing}
                    className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-2xl text-xs font-bold transition flex items-center gap-2 shadow-md active:scale-95"
                  >
                    <RefreshCw className={`w-4 h-4 ${sheetSyncState.isSyncing ? 'animate-spin' : ''}`} />
                    <span>{sheetSyncState.isSyncing ? 'Đang đồng bộ...' : 'Đồng bộ ngay vào App'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* PREVIEW RESULTS SECTION */}
            {previewResult && (
              <div className="mt-6 pt-6 border-t border-slate-200 space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Kết quả xem trước dữ liệu:</span>
                  </h4>
                  <span className="text-xs text-slate-500">
                    Phát hiện: <strong>{previewResult.classes.length} lớp học</strong> • <strong>{previewResult.students.length} học sinh</strong>
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {previewResult.classes.slice(0, 8).map((c) => (
                    <div key={c.id} className="p-3 bg-teal-50/60 border border-teal-200 rounded-xl text-xs">
                      <div className="font-bold text-teal-950">{c.name}</div>
                      <div className="text-[11px] text-slate-500 mt-1">{c.studentCount} học sinh • Khối {c.grade}</div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleApplySync}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow"
                  >
                    <span>Áp dụng danh sách này vào hệ thống</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Step by Step Guide for Teachers */}
          <div className="bg-slate-50 rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-teal-600" />
              Hướng dẫn 3 bước kết nối Google Sheets của riêng bạn:
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2">
                <div className="w-6 h-6 rounded-full bg-teal-700 text-white font-bold flex items-center justify-center text-xs">
                  1
                </div>
                <h4 className="font-bold text-slate-900">Tạo bảng tính Google Sheets</h4>
                <p className="text-slate-600 leading-relaxed">
                  Tạo file mới trên Google Drive, đặt các cột: <strong>Mã Lớp, Tên Lớp, Họ và tên, Email, Khối, Sĩ số...</strong>
                </p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2">
                <div className="w-6 h-6 rounded-full bg-teal-700 text-white font-bold flex items-center justify-center text-xs">
                  2
                </div>
                <h4 className="font-bold text-slate-900">Bật chia sẻ xem công khai</h4>
                <p className="text-slate-600 leading-relaxed">
                  Bấm nút <strong>Chia sẻ (Share)</strong> ở góc trên bên phải → Chọn <strong>"Bất kỳ ai có đường liên kết"</strong> (Anyone with the link can view).
                </p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2">
                <div className="w-6 h-6 rounded-full bg-teal-700 text-white font-bold flex items-center justify-center text-xs">
                  3
                </div>
                <h4 className="font-bold text-slate-900">Dán link & Đồng bộ</h4>
                <p className="text-slate-600 leading-relaxed">
                  Sao chép URL bảng tính và dán vào ô bên trên, bấm <strong>"Đồng bộ ngay vào App"</strong> để hoàn tất.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: AUDIT LOGS (Nhật Ký Kiểm Toán & Hệ Thống) */}
      {/* ========================================================================= */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm animate-fadeIn">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Shield className="w-5 h-5 text-teal-600" />
              Nhật ký kiểm toán & Hoạt động đồng bộ hệ thống
            </h3>
            <span className="text-xs text-slate-500">
              {auditLogs.length} sự kiện được ghi nhận
            </span>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-5 flex items-start justify-between gap-4 hover:bg-slate-50 transition">
                <div className="space-y-1.5">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900 text-xs">{log.userName}</span>
                    <span className="text-slate-400">•</span>
                    <span className="font-semibold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-md border border-teal-200">
                      {log.action}
                    </span>
                  </div>
                  <div className="text-slate-700">
                    Đối tượng: <strong>{log.target}</strong>
                  </div>
                  {log.details && <div className="text-slate-500 italic text-[11px]">{log.details}</div>}
                </div>
                <div className="text-[11px] text-slate-400 font-mono whitespace-nowrap bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                  {new Date(log.timestamp).toLocaleString('vi-VN')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MANUAL UNLOCK OVERRIDE MODAL */}
      {/* ========================================================================= */}
      {showUnlockModal && targetStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-teal-300 animate-fadeIn">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Unlock className="w-5 h-5 text-teal-600" />
              Mở khóa bài học đặc cách
            </h3>
            <p className="text-xs text-slate-600">
              Mở khóa trước cho học sinh: <strong className="text-slate-900">{targetStudent.fullName}</strong> ({selectedClass?.name})
            </p>

            <div className="space-y-3 pt-2">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Chọn bài học cần mở khóa:</label>
                <select
                  value={targetLessonId}
                  onChange={(e) => setTargetLessonId(e.target.value)}
                  className="w-full p-2.5 bg-teal-50 border border-teal-300 rounded-xl text-xs font-bold text-teal-950 focus:outline-none"
                >
                  {lessons.map((l) => (
                    <option key={l.id} value={l.id}>
                      Bài {l.number}: {l.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Lý do mở khóa (Ghi vào nhật ký kiểm toán):</label>
                <input
                  type="text"
                  value={unlockReason}
                  onChange={(e) => setUnlockReason(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-3">
              <button
                onClick={() => setShowUnlockModal(false)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleManualUnlock}
                disabled={isUnlocking}
                className="px-5 py-2 bg-gradient-to-r from-teal-700 to-teal-800 hover:from-teal-800 hover:to-teal-900 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow"
              >
                {isUnlocking ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang mở khóa...</span>
                  </>
                ) : (
                  <span>Xác nhận mở khóa</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
