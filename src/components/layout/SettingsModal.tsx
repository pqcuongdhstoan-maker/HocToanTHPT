import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  FileSpreadsheet,
  Sparkles,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Key,
  Shield,
  Layers,
  X,
  Database,
  Radio,
  Sliders,
} from 'lucide-react';
import { DEFAULT_SAMPLE_SHEET_URL, generateSampleSheetCsv } from '../../services/googleSheetService';

export const SettingsModal: React.FC = () => {
  const {
    isSettingsOpen,
    setIsSettingsOpen,
    settingsTab,
    setSettingsTab,
    sheetSyncState,
    syncClassesFromSheet,
    updateSheetConfig,
    showToast,
    classes,
    students,
  } = useApp();

  // Sheet State
  const [sheetUrlInput, setSheetUrlInput] = useState<string>(sheetSyncState.sheetUrl || DEFAULT_SAMPLE_SHEET_URL);
  const [sheetGidInput, setSheetGidInput] = useState<string>(sheetSyncState.sheetGid || '0');
  const [autoSyncInput, setAutoSyncInput] = useState<boolean>(sheetSyncState.autoSync ?? true);
  const [isCopiedTemplate, setIsCopiedTemplate] = useState<boolean>(false);

  // Gemini API Key State
  const [apiKeyInput, setApiKeyInput] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('gemini-3-flash-preview');
  const [isKeySaved, setIsKeySaved] = useState<boolean>(false);

  useEffect(() => {
    setSheetUrlInput(sheetSyncState.sheetUrl || DEFAULT_SAMPLE_SHEET_URL);
    setSheetGidInput(sheetSyncState.sheetGid || '0');
    setAutoSyncInput(sheetSyncState.autoSync ?? true);

    const savedApiKey = localStorage.getItem('gemini_api_key') || '';
    const savedModel = localStorage.getItem('gemini_selected_model') || 'gemini-3-flash-preview';
    setApiKeyInput(savedApiKey);
    setSelectedModel(savedModel);
  }, [isSettingsOpen, sheetSyncState]);

  if (!isSettingsOpen) return null;

  const handleSaveSheetSettings = async (andSync = false) => {
    updateSheetConfig({
      sheetUrl: sheetUrlInput.trim(),
      sheetGid: sheetGidInput.trim(),
      autoSync: autoSyncInput,
    });

    if (andSync) {
      await syncClassesFromSheet(sheetUrlInput.trim(), sheetGidInput.trim());
    } else {
      showToast('Đã lưu cấu hình', 'Thông tin liên kết Google Sheet đã được lưu vào hệ thống.', 'success');
    }
  };

  const handleSaveApiKey = () => {
    if (!apiKeyInput.trim()) {
      localStorage.removeItem('gemini_api_key');
      showToast('Đã xóa API Key', 'Ứng dụng sẽ dùng cấu hình mặc định từ máy chủ.', 'info');
      setIsKeySaved(false);
      return;
    }

    localStorage.setItem('gemini_api_key', apiKeyInput.trim());
    localStorage.setItem('gemini_selected_model', selectedModel);
    setIsKeySaved(true);
    showToast('Lưu thành công!', `Đã lưu API Key và chọn model ${selectedModel}.`, 'success');
    setTimeout(() => setIsKeySaved(false), 3000);
  };

  const handleCopySampleCsv = () => {
    const csv = generateSampleSheetCsv();
    navigator.clipboard.writeText(csv);
    setIsCopiedTemplate(true);
    showToast('Đã sao chép cấu trúc mẫu!', 'Bạn có thể mở Google Sheet mới và dán (Ctrl+V) dữ liệu mẫu.', 'success');
    setTimeout(() => setIsCopiedTemplate(false), 3000);
  };

  const models = [
    {
      id: 'gemini-3-flash-preview',
      name: 'Gemini 3 Flash Preview',
      tag: 'Khuyên dùng (Default)',
      desc: 'Tốc độ phản hồi cực nhanh, độ chính xác cao cho giải toán & gợi ý Socratic.',
      color: 'border-teal-500 bg-teal-50/70 text-teal-950',
    },
    {
      id: 'gemini-3-pro-preview',
      name: 'Gemini 3 Pro Preview',
      tag: 'Tư duy sâu',
      desc: 'Mô hình lý luận mạnh mẽ nhất, giải quyết các bài toán Vận dụng cao (VDC) phức tạp.',
      color: 'border-indigo-400 bg-indigo-50/50 text-indigo-950',
    },
    {
      id: 'gemini-2.5-flash',
      name: 'Gemini 2.5 Flash',
      tag: 'Ổn định',
      desc: 'Model dự phòng tốc độ cao và ổn định khi gặp hạn mức API.',
      color: 'border-slate-300 bg-slate-50 text-slate-800',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-teal-900 via-teal-800 to-teal-950 text-white flex items-center justify-between border-b border-teal-700/80">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-600/60 flex items-center justify-center border border-teal-400/40">
              <Sliders className="w-4 h-4 text-teal-200" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white leading-tight">
                Cài đặt Hệ thống & Kết nối Cơ sở Dữ liệu
              </h2>
              <p className="text-[11px] text-teal-300">
                Toán 12 CT GDPT 2018 • GV Phan Quốc Cường
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsSettingsOpen(false)}
            className="w-8 h-8 rounded-full bg-teal-800/80 hover:bg-teal-700 flex items-center justify-center text-teal-200 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 gap-2">
          <button
            onClick={() => setSettingsTab('sheet')}
            className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
              settingsTab === 'sheet'
                ? 'border-teal-600 text-teal-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Database Google Sheets</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </button>
          <button
            onClick={() => setSettingsTab('ai')}
            className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
              settingsTab === 'ai'
                ? 'border-teal-600 text-teal-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Cấu hình Gemini AI & Model</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {settingsTab === 'sheet' ? (
            /* TAB 1: GOOGLE SHEETS CONFIG */
            <div className="space-y-5">
              {/* Status Overview Card */}
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                    <span className="font-bold text-emerald-950 text-sm">
                      Đã kết nối Google Sheets trực tuyến
                    </span>
                  </div>
                  <p className="text-emerald-800 text-[11px]">
                    Dữ liệu hiện tại: <strong>{classes.length} lớp học</strong> •{' '}
                    <strong>{students.length} học sinh</strong>
                  </p>
                  {sheetSyncState.lastSyncedAt && (
                    <p className="text-slate-500 text-[10px]">
                      Lần đồng bộ gần nhất: {new Date(sheetSyncState.lastSyncedAt).toLocaleString('vi-VN')}
                    </p>
                  )}
                </div>

                <button
                  onClick={() => handleSaveSheetSettings(true)}
                  disabled={sheetSyncState.isSyncing}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition flex items-center justify-center gap-1.5 shadow-sm active:scale-95 flex-shrink-0"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${sheetSyncState.isSyncing ? 'animate-spin' : ''}`} />
                  <span>{sheetSyncState.isSyncing ? 'Đang đồng bộ...' : 'Đồng bộ ngay'}</span>
                </button>
              </div>

              {/* URL Input Form */}
              <div className="space-y-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-800 flex items-center justify-between">
                    <span>Liên kết bảng tính Google Sheets:</span>
                    <span className="text-[11px] font-normal text-slate-500">
                      Chế độ: Bất kỳ ai có liên kết đều xem được
                    </span>
                  </label>
                  <input
                    type="text"
                    value={sheetUrlInput}
                    onChange={(e) => setSheetUrlInput(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono text-xs focus:ring-2 focus:ring-teal-500 focus:bg-white focus:outline-none transition"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Mã Sheet (GID):</label>
                    <input
                      type="text"
                      value={sheetGidInput}
                      onChange={(e) => setSheetGidInput(e.target.value)}
                      placeholder="0"
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-teal-500 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center sm:pt-6">
                    <label className="flex items-center space-x-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={autoSyncInput}
                        onChange={(e) => setAutoSyncInput(e.target.checked)}
                        className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300"
                      />
                      <span className="font-semibold text-slate-700">Tự động đồng bộ khi mở app</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Sample Template & Guidelines */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Database className="w-4 h-4 text-teal-600" />
                    Cấu trúc cột chuẩn được tự động nhận diện:
                  </h4>
                  <button
                    onClick={handleCopySampleCsv}
                    className="text-teal-700 hover:text-teal-900 font-bold inline-flex items-center space-x-1"
                  >
                    {isCopiedTemplate ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Đã chép!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Sao chép mẫu</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  <div className="bg-white p-2 rounded-lg border border-slate-200 text-slate-700">
                    <strong className="text-teal-900">Mã Lớp</strong>: 12TN1, 12A1...
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200 text-slate-700">
                    <strong className="text-teal-900">Tên Lớp</strong>: Lớp 12TN1...
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200 text-slate-700">
                    <strong className="text-teal-900">Họ và tên</strong>: Nguyễn Văn A...
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200 text-slate-700">
                    <strong className="text-teal-900">Email</strong>: hs@toan12.edu.vn
                  </div>
                </div>

                <p className="text-[11px] text-slate-500">
                  💡 <em>Mẹo:</em> Bạn có thể mở trực tiếp bảng tính Google Sheet của bạn, vào menu <strong>Chia sẻ (Share)</strong> → Chọn <strong>"Bất kỳ ai có đường liên kết (Anyone with link)"</strong> với quyền <strong>Người xem (Viewer)</strong> rồi dán link vào ô trên.
                </p>
              </div>
            </div>
          ) : (
            /* TAB 2: GEMINI AI & API KEY CONFIG */
            <div className="space-y-5">
              {/* API Key Input Banner */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-900 flex items-center gap-1.5">
                    <Key className="w-4 h-4 text-amber-600" />
                    Thiết lập Google Gemini API Key:
                  </span>
                  <a
                    href="https://aistudio.google.com/api-keys"
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-bold text-rose-600 hover:text-rose-700 underline flex items-center gap-1"
                  >
                    <span>Lấy API key miễn phí tại đây</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Nhập API key để kích hoạt Trợ lý Socratic giải toán, tạo câu hỏi tương đương và phân tích lỗi sai chi tiết. Key được lưu an toàn trong trình duyệt của bạn (localStorage).
                </p>

                <div className="pt-2">
                  <input
                    type="password"
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full p-2.5 bg-white border border-amber-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Model Cards Selector */}
              <div className="space-y-3">
                <label className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-teal-600" />
                  Chọn Model AI mặc định:
                </label>
                <div className="grid grid-cols-1 gap-2.5">
                  {models.map((m) => {
                    const isSelected = selectedModel === m.id;
                    return (
                      <div
                        key={m.id}
                        onClick={() => setSelectedModel(m.id)}
                        className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                          isSelected
                            ? `${m.color} ring-2 ring-teal-500 shadow-sm`
                            : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-sm">{m.name}</span>
                            <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-300">
                              {m.tag}
                            </span>
                          </div>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-teal-700" />}
                        </div>
                        <p className="text-[11px] text-slate-600 leading-relaxed">{m.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={() => setIsSettingsOpen(false)}
            className="px-4 py-2 border border-slate-300 rounded-xl font-semibold text-slate-700 hover:bg-slate-100 text-xs transition"
          >
            Đóng
          </button>

          <div className="flex items-center space-x-3">
            {settingsTab === 'sheet' ? (
              <button
                onClick={() => handleSaveSheetSettings(true)}
                disabled={sheetSyncState.isSyncing}
                className="px-5 py-2 bg-gradient-to-r from-teal-700 to-teal-800 hover:from-teal-800 hover:to-teal-900 text-white rounded-xl font-bold text-xs shadow-md transition active:scale-95 flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${sheetSyncState.isSyncing ? 'animate-spin' : ''}`} />
                <span>Đồng bộ & Lưu</span>
              </button>
            ) : (
              <button
                onClick={handleSaveApiKey}
                className="px-5 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white rounded-xl font-bold text-xs shadow-md transition active:scale-95 flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Lưu cấu hình AI</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
