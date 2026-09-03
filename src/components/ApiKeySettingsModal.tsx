import React, { useState, useEffect } from "react";
import {
  SUPPORTED_MODELS,
  SupportedModelId,
  getStoredApiKey,
  setStoredApiKey,
  getStoredModel,
  setStoredModel,
  testApiKeyConnection,
} from "../utils/geminiClient";
import {
  Key,
  X,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Cpu,
  ShieldCheck,
  Zap,
  Eye,
  EyeOff,
  Sparkles,
  RefreshCw,
  Sliders,
} from "lucide-react";

interface ApiKeySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isMandatory?: boolean; // When triggered because user has no key
  onKeySaved?: () => void;
}

export const ApiKeySettingsModal: React.FC<ApiKeySettingsModalProps> = ({
  isOpen,
  onClose,
  isMandatory = false,
  onKeySaved,
}) => {
  const [apiKeyInput, setApiKeyInput] = useState<string>("");
  const [selectedModel, setSelectedModelState] = useState<SupportedModelId>("gemini-3-flash-preview");
  const [showKey, setShowKey] = useState<boolean>(false);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [hasStoredKey, setHasStoredKey] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      const storedKey = getStoredApiKey();
      setApiKeyInput(storedKey);
      setHasStoredKey(!!storedKey);
      setSelectedModelState(getStoredModel());
      setTestResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    const cleanedKey = apiKeyInput.trim();
    if (!cleanedKey && isMandatory) {
      alert("Vui lòng nhập API Key để sử dụng các tính năng AI của app!");
      return;
    }

    setStoredApiKey(cleanedKey);
    setStoredModel(selectedModel);
    setHasStoredKey(!!cleanedKey);
    if (onKeySaved) onKeySaved();
    alert("Đã lưu cấu hình API Key & Model AI thành công!");
    onClose();
  };

  const handleTestConnection = async () => {
    if (!apiKeyInput.trim()) {
      setTestResult({
        ok: false,
        message: "Vui lòng nhập API Key trước khi kiểm tra!",
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testApiKeyConnection(apiKeyInput, selectedModel);
      setTestResult({ ok: res.ok, message: res.message });
    } catch (err: any) {
      setTestResult({
        ok: false,
        message: `Lỗi kết nối: ${err.message || err}`,
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handlePasteKey = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setApiKeyInput(text.trim());
    } catch {
      // Clipboard permissions denied
    }
  };

  const handleClearKey = () => {
    if (confirm("Bạn có chắc chắn muốn xóa API Key khỏi trình duyệt này?")) {
      setApiKeyInput("");
      setStoredApiKey("");
      setHasStoredKey(false);
      setTestResult(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/75 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20 text-amber-300">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg">
                  Cấu hình Google Gemini API Key
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 uppercase">
                  AI GDPT 2018
                </span>
              </div>
              <p className="text-xs text-blue-100/90">
                Tự nhập key cá nhân • Chạy trực tiếp trên trình duyệt • Bảo mật trong LocalStorage
              </p>
            </div>
          </div>

          {!isMandatory && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Quick Guide Card */}
          <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-blue-800 font-bold text-xs uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Hướng dẫn lấy API Key Miễn phí (Google AI Studio)</span>
              </div>
              <a
                href="https://aistudio.google.com/api-keys"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors"
              >
                <span>Lấy Key tại đây</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              1. Truy cập <strong className="text-blue-700">Google AI Studio</strong> bằng tài khoản Google của bạn.<br />
              2. Nhấn <strong className="text-slate-800">"Create API key"</strong> để tạo key mới miễn phí.<br />
              3. Sao chép và dán vào ô bên dưới. Key được lưu an toàn trong trình duyệt của bạn và không gửi về máy chủ bên thứ ba.
            </p>
          </div>

          {/* API Key Input Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-blue-600" />
                <span>Nhập Gemini API Key của bạn</span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePasteKey}
                  className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
                >
                  Dán từ clipboard
                </button>
                {hasStoredKey && (
                  <button
                    type="button"
                    onClick={handleClearKey}
                    className="text-xs text-rose-600 hover:text-rose-800 font-semibold"
                  >
                    Xóa key
                  </button>
                )}
              </div>
            </div>

            <div className="relative flex items-center">
              <input
                type={showKey ? "text" : "password"}
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full pl-4 pr-24 py-3 rounded-2xl border border-slate-300 font-mono text-xs sm:text-sm bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
              />
              <div className="absolute right-2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors"
                  title={showKey ? "Ẩn key" : "Hiện key"}
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTesting || !apiKeyInput.trim()}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1 transition-all"
                >
                  {isTesting ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                  )}
                  <span>Test</span>
                </button>
              </div>
            </div>

            {/* Test Result Message */}
            {testResult && (
              <div
                className={`p-3 rounded-xl text-xs flex items-start gap-2 border ${
                  testResult.ok
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : "bg-rose-50 text-rose-800 border-rose-200"
                }`}
              >
                {testResult.ok ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div className="leading-relaxed">
                  <p className="font-bold">{testResult.ok ? "Thành công!" : "Không kết nối được:"}</p>
                  <p className="break-all font-mono text-[11px]">{testResult.message}</p>
                </div>
              </div>
            )}
          </div>

          {/* Model Selection Cards (Strictly per AI_INSTRUCTIONS.md) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-indigo-600" />
                <span>Chọn Model AI & Cơ Chế Dự Phòng (Fallback)</span>
              </label>
              <span className="text-[11px] text-slate-400 font-medium">Tự động retry khi hết quota</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {SUPPORTED_MODELS.map((model) => {
                const isSelected = selectedModel === model.id;
                return (
                  <div
                    key={model.id}
                    onClick={() => setSelectedModelState(model.id)}
                    className={`cursor-pointer p-4 rounded-2xl border-2 transition-all relative flex flex-col justify-between ${
                      isSelected
                        ? "border-blue-600 bg-blue-50/50 shadow-md shadow-blue-500/10"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            isSelected
                              ? "bg-blue-600 text-white"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {model.tag}
                        </span>
                        {isSelected && (
                          <CheckCircle2 className="w-4 h-4 text-blue-600" />
                        )}
                      </div>
                      <h4 className="font-extrabold text-slate-900 text-sm">{model.name}</h4>
                      <p className="text-[11px] font-mono text-slate-400 mt-0.5">{model.id}</p>
                      <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                        {model.description}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100 text-[10px] font-bold text-slate-500">
                      Cơ chế: Thử {model.name} trước ➔ Tự động fallback nếu 429
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Fallback Explanation Callout */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong className="text-slate-800">Cơ chế Fallback thông minh:</strong> Khi một tác vụ AI (Giải thích toán, Soạn đề ma trận, Đọc file Word) gặp lỗi hạn mức <code className="font-mono text-rose-600">429 RESOURCE_EXHAUSTED</code>, hệ thống sẽ tự động thử lại ngay lập tức với model tiếp theo trong chuỗi fallback mà không làm gián đoạn trạng thái của bạn.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Trạng thái:{" "}
            {hasStoredKey ? (
              <span className="text-emerald-600 font-bold">● Đã lưu API Key</span>
            ) : (
              <span className="text-amber-600 font-bold">● Chưa có API Key</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!isMandatory && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-all"
              >
                Đóng
              </button>
            )}
            <button
              type="button"
              onClick={handleSave}
              className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all active:scale-95 flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Lưu cấu hình</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
