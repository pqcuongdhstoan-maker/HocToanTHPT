import React, { useState } from "react";
import { normalizeMathLatex, parseDocxFile } from "../utils/docxParser";
import { MathRenderer } from "../utils/mathJaxHelper";
import { callGeminiWithFallback } from "../utils/geminiClient";
import {
  X,
  Code,
  Upload,
  Copy,
  Check,
  Download,
  Sparkles,
  FileText,
  RefreshCw,
  Eye,
  AlertCircle,
  Wand2,
  CheckCircle2,
} from "lucide-react";

interface MathTypeOleConverterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertLatex?: (latex: string) => void;
}

const SAMPLE_MATHTYPE_TEXT = `Câu 1: Cho hàm số y = f(x) = x^3 - 3x^2 + 2. «MathType@3@1@...»
Tìm khoảng đồng biến của hàm số. Biết rằng f'(x) = 3x^2 - 6x và f'(x) >= 0 <=> x in (-oo; 0] cup [2; +oo).

Câu 2: Trong không gian Oxyz, cho vecto u = (1; 2; -3) và vecto v = (-2; 1; 0).
Tính tích có hướng [vecto u, vecto v] và góc giữa hai vecto biết cos alpha = (vecto u . vecto v)/(|vecto u|.|vecto v|).

Câu 3: Tính tích phân I = int_0^1 (2x + 1) * e^x dx và căn bậc hai sqrt(x^2 + 4x + 4) = |x + 2| với mọi x in R.`;

export const MathTypeOleConverterModal: React.FC<MathTypeOleConverterModalProps> = ({
  isOpen,
  onClose,
  onInsertLatex,
}) => {
  const [inputText, setInputText] = useState<string>(SAMPLE_MATHTYPE_TEXT);
  const [outputText, setOutputText] = useState<string>(() => normalizeMathLatex(SAMPLE_MATHTYPE_TEXT));
  const [isAiConverting, setIsAiConverting] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"SPLIT" | "PREVIEW" | "RAW_LATEX">("SPLIT");
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  if (!isOpen) return null;

  // Local fast regex normalization
  const handleFastConvert = (textToConvert?: string) => {
    const raw = textToConvert !== undefined ? textToConvert : inputText;
    if (!raw.trim()) {
      setOutputText("");
      return;
    }

    let cleaned = normalizeMathLatex(raw);

    // Advanced OLE / MathType specific replacements
    cleaned = cleaned
      // Clean Equation OLE tags
      .replace(/«MathType[^»]*»/gi, "")
      .replace(/«\/MathType»/gi, "")
      .replace(/<m:oMath[^>]*>([\s\S]*?)<\/m:oMath>/gi, "$$$1$$")
      .replace(/<[^>]+>/g, "")
      // Fractions like a/b -> \frac{a}{b} if simple
      .replace(/(\b[a-zA-Z0-9]+)\/(\b[a-zA-Z0-9]+)/g, "\\frac{$1}{$2}")
      // Degrees
      .replace(/(\d+)°/g, "$1^\\circ")
      // Double dollar or duplicate dollar reduction
      .replace(/\${3,}/g, "$$");

    // Wrap plain math equations in $ if not wrapped
    setOutputText(cleaned);
    setStatusMsg({ type: "success", text: "Đã làm sạch và chuẩn hóa sang mã LaTeX thành công!" });
    setTimeout(() => setStatusMsg(null), 3000);
  };

  // AI-powered conversion using Gemini API with fallback
  const handleAiConvert = async () => {
    if (!inputText.trim()) {
      alert("Vui lòng nhập nội dung chứa công thức MathType để chuyển đổi!");
      return;
    }

    setIsAiConverting(true);
    setStatusMsg({ type: "info", text: "AI Gemini đang phân tích và chuẩn hóa toàn bộ công thức MathType OLE sang LaTeX chuẩn mực..." });

    try {
      const prompt = `Bạn là chuyên gia số hóa đề thi Toán THPT (Thầy Phan Quốc Cường).
Dưới đây là đoạn văn bản được trích xuất từ đề thi Word chứa các công thức MathType OLE, Equation 3.0, hoặc ký hiệu toán học thô:

=== VĂN BẢN GỐC ===
${inputText}
===================

Nhiệm vụ:
1. Nhận diện chính xác tất cả các công thức toán học, ký hiệu MathType, vectơ, tích phân, căn thức, ma trận, v.v.
2. Chuyển đổi toàn bộ chúng sang chuẩn LaTeX và bọc trong $...$ (inline) hoặc $$...$$ (nếu là biểu thức đứng riêng dòng).
3. Sửa lỗi chính tả toán học, định dạng phân số \\frac{a}{b}, vectơ \\vec{a}, khoảng đoạn, số mũ, chỉ số dưới.
4. Giữ nguyên toàn bộ câu chữ ngữ cảnh tiếng Việt của đề bài.
5. Chỉ trả về văn bản đã chuyển đổi hoàn thiện (không thêm lời bình luận mở đầu hay kết thúc).`;

      const res = await callGeminiWithFallback({
        systemPrompt: "Bạn là chuyên gia chuyển đổi MathType OLE sang chuẩn LaTeX. Luôn đảm bảo công thức toán học được bọc chuẩn xác trong $...$ hoặc $$...$$.",
        prompt,
        temperature: 0.1,
      });

      if (res.text) {
        setOutputText(res.text.trim());
        setStatusMsg({ type: "success", text: `AI (${res.modelUsed}) đã chuyển đổi và chuẩn hóa hoàn hảo sang LaTeX!` });
      }
    } catch (err: any) {
      console.error("AI MathType convert error:", err);
      setStatusMsg({ type: "error", text: `Lỗi AI: ${err.message || "Không thể kết nối Gemini API. Hãy kiểm tra API Key!"}` });
    } finally {
      setIsAiConverting(false);
    }
  };

  // Handle file upload (.docx or .txt)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      let extracted = "";
      if (file.name.toLowerCase().endsWith(".docx")) {
        extracted = await parseDocxFile(file);
      } else {
        extracted = await file.text();
      }
      setInputText(extracted);
      handleFastConvert(extracted);
    } catch (err: any) {
      console.error("File read error:", err);
      alert("Không thể đọc tệp này. Hãy kiểm tra định dạng .docx hoặc .txt!");
    }
  };

  // Copy output
  const handleCopy = async () => {
    if (!outputText) return;
    await navigator.clipboard.writeText(outputText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Download .tex file
  const handleDownloadTex = () => {
    if (!outputText) return;
    const blob = new Blob([outputText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "chuyen_doi_mathtype_ole.tex";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header with Dark Teal theme */}
        <div className="bg-gradient-to-r from-[#004d40] via-[#00695c] to-[#004d40] px-6 py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20 shadow-inner">
              <span className="font-mono text-base font-black text-teal-200">&#123; &#125;</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-tight">&#123; &#125; MathType OLE Converter sang LaTeX</h2>
                <span className="px-2 py-0.5 rounded-full bg-teal-500/30 text-teal-100 text-[10px] font-bold border border-teal-300/30">
                  Chuẩn hóa Đề thi Word
                </span>
              </div>
              <p className="text-xs text-teal-100/80">
                Làm sạch mã OLE MathType, DSMT4, Equation Word và chuyển đổi sang công thức LaTeX chuẩn MathJax
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

        {/* Toolbar & Sample inputs */}
        <div className="px-6 py-3 bg-teal-50/70 border-b border-teal-100 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-teal-600 hover:text-white border border-teal-200 text-teal-900 text-xs font-semibold cursor-pointer shadow-2xs transition-all active:scale-95">
              <Upload className="w-3.5 h-3.5" />
              <span>Tải file Word (.docx)</span>
              <input
                type="file"
                accept=".docx,.txt"
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>
            <button
              onClick={() => {
                setInputText(SAMPLE_MATHTYPE_TEXT);
                handleFastConvert(SAMPLE_MATHTYPE_TEXT);
              }}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold shadow-2xs transition-all"
            >
              Mẫu đề thi thử nghiệm
            </button>
            <button
              onClick={() => {
                setInputText("");
                setOutputText("");
              }}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-rose-50 border border-slate-200 text-rose-600 text-xs font-semibold shadow-2xs transition-all"
            >
              Xóa trắng
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleFastConvert()}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold shadow-2xs active:scale-95 transition-all"
              title="Chuyển đổi tức thì bằng bộ quy tắc chuẩn hóa toán học"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Chuyển đổi Nhanh</span>
            </button>

            <button
              onClick={handleAiConvert}
              disabled={isAiConverting}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-purple-600/20 active:scale-95 transition-all disabled:opacity-50"
              title="Dùng trí tuệ nhân tạo Gemini sửa lỗi công thức phức tạp và bọc chuẩn LaTeX"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isAiConverting ? "animate-spin" : ""}`} />
              <span>{isAiConverting ? "AI Đang xử lý..." : "Chuyển đổi Nâng cao bằng AI"}</span>
            </button>
          </div>
        </div>

        {/* Status notification */}
        {statusMsg && (
          <div
            className={`px-6 py-2.5 text-xs font-bold flex items-center justify-between border-b ${
              statusMsg.type === "success"
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : statusMsg.type === "error"
                ? "bg-rose-50 text-rose-800 border-rose-200"
                : "bg-blue-50 text-blue-800 border-blue-200"
            }`}
          >
            <div className="flex items-center gap-2">
              {statusMsg.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : statusMsg.type === "error" ? (
                <AlertCircle className="w-4 h-4 text-rose-600" />
              ) : (
                <Sparkles className="w-4 h-4 text-blue-600 animate-spin" />
              )}
              <span>{statusMsg.text}</span>
            </div>
            <button onClick={() => setStatusMsg(null)} className="text-slate-400 hover:text-slate-600">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* View mode toggle */}
        <div className="px-6 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setActiveTab("SPLIT")}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                activeTab === "SPLIT"
                  ? "bg-teal-700 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>Song song (So sánh)</span>
            </button>
            <button
              onClick={() => setActiveTab("PREVIEW")}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                activeTab === "PREVIEW"
                  ? "bg-teal-700 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Kết quả hiển thị MathJax</span>
            </button>
            <button
              onClick={() => setActiveTab("RAW_LATEX")}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                activeTab === "RAW_LATEX"
                  ? "bg-teal-700 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>Mã nguồn LaTeX thô</span>
            </button>
          </div>

          <div className="text-[11px] font-bold text-slate-500">
            {outputText.length} ký tự • Tự động nhận diện $inline$ và $$block$$
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "SPLIT" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full min-h-[400px]">
              {/* Left: Input Text */}
              <div className="flex flex-col space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-slate-500" />
                    Văn bản gốc chứa MathType OLE / Word:
                  </span>
                  <span className="text-[10px] text-slate-400">Dán hoặc nhập vào đây</span>
                </div>
                <textarea
                  value={inputText}
                  onChange={(e) => {
                    setInputText(e.target.value);
                    handleFastConvert(e.target.value);
                  }}
                  placeholder="Dán nội dung từ file Word có chứa công thức MathType tại đây..."
                  className="w-full flex-1 p-4 rounded-2xl bg-slate-50 border border-slate-300 font-mono text-xs focus:bg-white focus:border-teal-500 focus:outline-hidden resize-none min-h-[350px]"
                />
              </div>

              {/* Right: Rendered LaTeX Preview */}
              <div className="flex flex-col space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-teal-900 flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-teal-600" />
                    Kết quả hiển thị sau khi chuẩn hóa sang LaTeX:
                  </span>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-teal-100 text-teal-800 text-[11px] font-bold hover:bg-teal-200 transition-colors"
                  >
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? "Đã chép" : "Sao chép"}</span>
                  </button>
                </div>
                <div className="w-full flex-1 p-5 rounded-2xl bg-white border border-teal-200 shadow-2xs overflow-y-auto min-h-[350px]">
                  {outputText ? (
                    <div className="prose prose-sm max-w-none space-y-3 leading-relaxed text-slate-800">
                      <MathRenderer content={outputText} />
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 text-xs italic">
                      Chưa có nội dung để hiển thị...
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : activeTab === "PREVIEW" ? (
            <div className="p-6 rounded-2xl bg-white border border-teal-200 shadow-2xs min-h-[400px]">
              <MathRenderer content={outputText} />
            </div>
          ) : (
            <div className="space-y-2">
              <textarea
                readOnly
                value={outputText}
                rows={16}
                className="w-full p-4 rounded-2xl bg-slate-900 text-teal-200 font-mono text-xs border border-slate-700 focus:outline-hidden"
              />
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadTex}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-bold transition-all"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Tải file LaTeX (.tex)</span>
            </button>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-teal-700 to-emerald-700 hover:from-teal-800 hover:to-emerald-800 text-white text-xs font-bold shadow-md shadow-teal-700/20 active:scale-95 transition-all"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? "Đã sao chép toàn bộ LaTeX!" : "Sao chép toàn bộ LaTeX"}</span>
            </button>

            {onInsertLatex && (
              <button
                onClick={() => {
                  onInsertLatex(outputText);
                  onClose();
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 active:scale-95 transition-all"
              >
                <Check className="w-4 h-4" />
                <span>Chèn vào bài học</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
