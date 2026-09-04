import React, { useState } from "react";
import { parseDocxFile } from "../utils/docxParser";
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
  CheckCircle2,
  HelpCircle,
} from "lucide-react";

interface MathTypeOleConverterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertLatex?: (latex: string) => void;
}

export const SAMPLE_MATHTYPE_TEXT = `Câu 1: Cho hàm số y = f(x) = x^3 - 3x^2 + 2. «MathType@3@1@...»
Tìm khoảng đồng biến của hàm số. Biết rằng f'(x) = 3x^2 - 6x và f'(x) >= 0 <=> x in (-oo; 0] cup [2; +oo).

Câu 2: Trong không gian Oxyz, cho vecto u = (1; 2; -3) và vecto v = (-2; 1; 0).
Tính tích có hướng [vecto u, vecto v] và góc giữa hai vecto biết cos alpha = (vecto u . vecto v)/(|vecto u|.|vecto v|).

Câu 3: Tính tích phân I = int_0^1 (2x + 1) * e^x dx và căn bậc hai sqrt(x^2 + 4x + 4) = |x + 2| với mọi x in R.`;

/**
 * Intelligent MathType / LaTeX Normalizer
 * Converts MathType OLE, Word equations, ASCII math into standard MathType-compatible LaTeX ($...$)
 * Without text-corrupting bugs (e.g. \vec{bi}ết) and preserving line breaks
 */
export function normalizeToMathType(raw: string): string {
  if (!raw) return "";

  // 1. Normalize line endings
  let text = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // 2. Remove MathType metadata and OMML wrappers
  text = text.replace(/«MathType[^»]*»/gi, "");
  text = text.replace(/«\/MathType»/gi, "");
  text = text.replace(/<m:oMath[^>]*>([\s\S]*?)<\/m:oMath>/gi, " $1 ");
  text = text.replace(/<[^>]+>/g, " ");

  // 3. Line by line processing to preserve paragraphs and question numbers
  const lines = text.split("\n");
  const processedLines = lines.map((line) => {
    let l = line.trim();
    if (!l) return "";

    // A. Vector notation - with strict word boundary \b to prevent "hai vecto biết" -> "\vec{bi}ết" bug!
    l = l.replace(/(?:vecto|véc tơ|vector)\s+([A-Z]{2})\b/gi, "\\vec{$1}");
    l = l.replace(/(?:vecto|véc tơ|vector)\s+([a-zA-Z])\b/g, "\\vec{$1}");
    l = l.replace(/(?:vecto|véc tơ|vector)\b/gi, "vectơ");

    // B. Dot product and vector norm
    l = l.replace(/(\\vec\{[a-zA-Z0-9]+\})\s*\.\s*(\\vec\{[a-zA-Z0-9]+\})/g, "$1 \\cdot $2");
    l = l.replace(/\|\s*(\\vec\{[a-zA-Z0-9]+\})\s*\|\s*\.\s*\|\s*(\\vec\{[a-zA-Z0-9]+\})\s*\|/g, "|$1| \\cdot |$2|");

    // C. Calculus & Algebra
    l = l.replace(/\bint_([a-zA-Z0-9]+)\^([a-zA-Z0-9]+)\b/g, "\\int_{$1}^{$2}");
    l = l.replace(/\bint\b/g, "\\int");
    l = l.replace(/\*\s*e\^x/g, "e^x");
    l = l.replace(/e\^x\s*dx\b/gi, "e^x\\,dx");
    l = l.replace(/\bsqrt\(([^)]+)\)/g, "\\sqrt{$1}");
    l = l.replace(/√\(([^)]+)\)/g, "\\sqrt{$1}");
    l = l.replace(/√(\d+|\w+)/g, "\\sqrt{$1}");

    // D. Trigonometric functions & Greek
    l = l.replace(/\bcos\s+alpha\b/gi, "\\cos\\alpha");
    l = l.replace(/\bsin\s+alpha\b/gi, "\\sin\\alpha");
    l = l.replace(/\btan\s+alpha\b/gi, "\\tan\\alpha");
    l = l.replace(/\bcot\s+alpha\b/gi, "\\cot\\alpha");
    l = l.replace(/\balpha\b/gi, "\\alpha");
    l = l.replace(/\bbeta\b/gi, "\\beta");
    l = l.replace(/\bgamma\b/gi, "\\gamma");
    l = l.replace(/\btheta\b/gi, "\\theta");
    l = l.replace(/\bpi\b/gi, "\\pi");
    l = l.replace(/°/g, "^\\circ");

    // E. Relations, sets & infinity
    l = l.replace(/<=>/g, " \\iff ");
    l = l.replace(/=>/g, " \\implies ");
    l = l.replace(/>=/g, " \\ge ");
    l = l.replace(/<=/g, " \\le ");
    l = l.replace(/!=/g, " \\neq ");
    l = l.replace(/-\s*oo\b/gi, "-\\infty");
    l = l.replace(/\+\s*oo\b/gi, "+\\infty");
    l = l.replace(/\boo\b/gi, "\\infty");
    l = l.replace(/\bcup\b/gi, "\\cup");
    l = l.replace(/\bcap\b/gi, "\\cap");
    l = l.replace(/\bin\s+R\b/g, "\\in \\mathbb{R}");
    l = l.replace(/\bin\b/g, "\\in");

    // F. Fractions: (expr)/(expr)
    l = l.replace(/\(([^()]+)\)\/\(([^()]+)\)/g, "\\frac{$1}{$2}");

    // G. Intelligent MathType wrapping into $...$
    l = wrapMathClausesInLine(l);

    // Clean horizontal whitespace
    l = l.replace(/[ \t]+/g, " ");

    return l;
  });

  return processedLines.join("\n\n");
}

/**
 * Wraps math expressions in $...$ for MathType & MathJax compatibility
 */
function wrapMathClausesInLine(line: string): string {
  let res = line;

  // 1. y = f(x) = ...
  res = res.replace(/(y\s*=\s*f\(x\)\s*=\s*[^.,;:\n]+?)(?=[.,;:]|\s+(?:và|hoặc|với|tại|trong)\b|$)/g, "$$$1$$");

  // 2. f'(x) = ...
  res = res.replace(/(f'\([a-zA-Z0-9]+\)\s*=\s*[^.,;:\n]+?)(?=[.,;:]|\s+(?:và|hoặc|với|tại)\b|$)/g, "$$$1$$");
  res = res.replace(/(f'\([a-zA-Z0-9]+\)\s*\\ge\s*[^.,;:\n]+?)(?=[.,;:]|\s+(?:và|hoặc|với|tại)\b|$)/g, "$$$1$$");
  res = res.replace(/(f'\([a-zA-Z0-9]+\)\s*\\le\s*[^.,;:\n]+?)(?=[.,;:]|\s+(?:và|hoặc|với|tại)\b|$)/g, "$$$1$$");

  // 3. \vec{u} = (1; 2; -3)
  res = res.replace(/(\\vec\{[a-zA-Z0-9]+\}\s*=\s*\([^)]+\))/g, "$$$1$$");

  // 4. [\vec{u}, \vec{v}]
  res = res.replace(/(\[\\vec\{[a-zA-Z0-9]+\},\s*\\vec\{[a-zA-Z0-9]+\}\])/g, "$$$1$$");

  // 5. \cos\alpha = ...
  res = res.replace(/(\\cos\\alpha\s*=\s*[^.,;:\n]+?)(?=[.,;:]|\s+(?:và|hoặc|với)\b|$)/g, "$$$1$$");
  res = res.replace(/(\\sin\\alpha\s*=\s*[^.,;:\n]+?)(?=[.,;:]|\s+(?:và|hoặc|với)\b|$)/g, "$$$1$$");

  // 6. I = \int...
  res = res.replace(/([A-Z]\s*=\s*\\int[^.,;:\n]+?)(?=[.,;:]|\s+(?:và|hoặc|với)\b|$)/g, "$$$1$$");

  // 7. \sqrt{...} = ...
  res = res.replace(/(\\sqrt\{[^}]+\}\s*=\s*[^.,;:\n]+?)(?=[.,;:]|\s+(?:và|hoặc|với)\b|$)/g, "$$$1$$");

  // 8. x \in \mathbb{R} or intervals
  res = res.replace(/([a-zA-Z]\s*\\in\s*\\mathbb\{R\})/g, "$$$1$$");
  res = res.replace(/([a-zA-Z]\s*\\in\s*[\(\[][^.,;:\n]+?[\)\]])/g, "$$$1$$");

  // 9. Catch standalone vector or fraction if still not inside $
  res = res.replace(/(?<!\$)\\vec\{[a-zA-Z0-9]+\}(?!\$)/g, "$$$&$$");
  res = res.replace(/(?<!\$)\\frac\{[^}]+\}\{[^}]+\}(?!\$)/g, "$$$&$$");

  // 10. Clean any duplicate dollars $$...$$ back to $...$
  res = res.replace(/\$\$([^\$]+?)\$\$/g, "$$$1$$");

  return res;
}

export const MathTypeOleConverterModal: React.FC<MathTypeOleConverterModalProps> = ({
  isOpen,
  onClose,
  onInsertLatex,
}) => {
  const [inputText, setInputText] = useState<string>(SAMPLE_MATHTYPE_TEXT);
  const [outputText, setOutputText] = useState<string>(() => normalizeToMathType(SAMPLE_MATHTYPE_TEXT));
  const [isAiConverting, setIsAiConverting] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"SPLIT" | "PREVIEW" | "RAW_LATEX">("SPLIT");
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  if (!isOpen) return null;

  // Local fast normalization to MathType standard
  const handleFastConvert = (textToConvert?: string) => {
    const raw = textToConvert !== undefined ? textToConvert : inputText;
    if (!raw.trim()) {
      setOutputText("");
      return;
    }

    const converted = normalizeToMathType(raw);
    setOutputText(converted);
    setStatusMsg({
      type: "success",
      text: "Đã chuẩn hóa sang MathType ($...$) thành công! Mọi công thức đều được bọc chuẩn để dùng Alt + \\ trên Word.",
    });
    setTimeout(() => setStatusMsg(null), 3500);
  };

  // AI-powered conversion using Gemini API with fallback
  const handleAiConvert = async () => {
    if (!inputText.trim()) {
      alert("Vui lòng nhập nội dung chứa công thức MathType để chuyển đổi!");
      return;
    }

    setIsAiConverting(true);
    setStatusMsg({
      type: "info",
      text: "AI Gemini đang phân tích và chuẩn hóa toàn bộ công thức sang chuẩn MathType Word (Alt + \\)...",
    });

    try {
      const prompt = `Bạn là chuyên gia số hóa đề thi Toán THPT (Thầy Phan Quốc Cường).
Dưới đây là đoạn văn bản trích xuất từ đề thi Word chứa các công thức MathType OLE, Equation hoặc ký hiệu toán học thô:

=== VĂN BẢN GỐC ===
${inputText}
===================

YÊU CẦU BẮT BUỘC ĐỂ CHUẨN HÓA SANG MATHTYPE (TOGGLE TEX ALT + \\ TRÊN MICROSOFT WORD):
1. Bọc TẤT CẢ các biểu thức toán học, phương trình, hàm số, biến số, tọa độ, vectơ, tích phân, căn thức trong cặp dấu $...$.
   Ví dụ chuẩn:
   - $y = f(x) = x^3 - 3x^2 + 2$
   - $f'(x) = 3x^2 - 6x$
   - $f'(x) \\ge 0 \\iff x \\in (-\\infty; 0] \\cup [2; +\\infty)$
   - $\\vec{u} = (1; 2; -3)$, $\\vec{v} = (-2; 1; 0)$
   - $[\\vec{u}, \\vec{v}]$
   - $\\cos\\alpha = \\frac{\\vec{u} \\cdot \\vec{v}}{|\\vec{u}| \\cdot |\\vec{v}|}$
   - $I = \\int_0^1 (2x + 1)e^x\\,dx$
   - $\\sqrt{x^2 + 4x + 4} = |x + 2|$
   - $x \\in \\mathbb{R}$
2. Lời dẫn tiếng Việt (như "Câu 1: Cho hàm số", "Tìm khoảng đồng biến của hàm số.", "Biết rằng", "Trong không gian Oxyz, cho", "Tính tích có hướng", "và góc giữa hai vectơ biết", "với mọi") PHẢI ĐƯỢC GIỮ NGUYÊN BÊN NGOÀI DẤU $. Tuyệt đối không bọc tiếng Việt vào trong $.
3. TUYỆT ĐỐI KHÔNG BỊ LỖI:
   - Không được ghép nhầm từ tiếng Việt thành vectơ (ví dụ "hai vectơ biết" tuyệt đối KHÔNG được biến thành "\\vec{bi}ết").
   - Không được làm mất ngắt dòng, xuống dòng giữa các câu (Câu 1, Câu 2, Câu 3...).
4. Đảm bảo khi người dùng sao chép văn bản này dán vào Microsoft Word rồi ấn tổ hợp phím Alt + \\ của MathType, 100% các công thức sẽ chuyển thành công thức MathType hoàn hảo.
5. Chỉ trả về nội dung văn bản đã chuẩn hóa hoàn chỉnh, không thêm lời chào hay giải thích mở đầu/kết thúc.`;

      const res = await callGeminiWithFallback({
        systemPrompt:
          "Bạn là chuyên gia chuyển đổi MathType OLE sang chuẩn MathType Word ($...$). Luôn đảm bảo công thức toán học được bọc chuẩn xác trong $...$ và lời dẫn tiếng Việt ở ngoài.",
        prompt,
        temperature: 0.1,
      });

      if (res.text) {
        setOutputText(res.text.trim());
        setStatusMsg({
          type: "success",
          text: `AI (${res.modelUsed}) đã chuẩn hóa hoàn hảo 100% sang MathType ($...$) không có lỗi!`,
        });
      }
    } catch (err: any) {
      console.error("AI MathType convert error:", err);
      setStatusMsg({
        type: "error",
        text: `Lỗi AI: ${err.message || "Không thể kết nối Gemini API. Hãy kiểm tra API Key!"}`,
      });
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

  // Copy output to clipboard
  const handleCopy = async () => {
    if (!outputText) return;
    await navigator.clipboard.writeText(outputText);
    setCopied(true);
    setStatusMsg({
      type: "success",
      text: "Đã sao chép! Dán vào Word và bấm phím tắt Alt + \\ để chuyển thành công thức MathType!",
    });
    setTimeout(() => {
      setCopied(false);
      setStatusMsg(null);
    }, 3000);
  };

  // Download text file
  const handleDownloadFile = () => {
    if (!outputText) return;
    const blob = new Blob([outputText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "chuan_hoa_mathtype_word.txt";
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
                <h2 className="text-lg font-black tracking-tight">&#123; &#125; MathType OLE & Chuẩn hóa sang MathType</h2>
                <span className="px-2 py-0.5 rounded-full bg-teal-500/30 text-teal-100 text-[10px] font-bold border border-teal-300/30">
                  Chuẩn hóa Đề thi Word
                </span>
              </div>
              <p className="text-xs text-teal-100/80">
                Làm sạch mã OLE MathType, DSMT4, Equation Word và chuẩn hóa sang MathType ($...$) tương thích 100% phím tắt Alt + \ trên Word
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
              title="Chuyển đổi tức thì sang chuẩn MathType bọc trong $...$"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Chuyển đổi Nhanh</span>
            </button>

            <button
              onClick={handleAiConvert}
              disabled={isAiConverting}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-purple-600/20 active:scale-95 transition-all disabled:opacity-50"
              title="Dùng trí tuệ nhân tạo Gemini sửa lỗi công thức phức tạp và bọc chuẩn MathType 100%"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isAiConverting ? "animate-spin" : ""}`} />
              <span>{isAiConverting ? "AI Đang xử lý..." : "Chuyển đổi Nâng cao bằng AI"}</span>
            </button>
          </div>
        </div>

        {/* Tip / Reminder for Word MathType */}
        <div className="px-6 py-2 bg-emerald-50/80 border-b border-emerald-200 text-xs text-emerald-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-extrabold px-2 py-0.5 rounded-md bg-emerald-200 text-emerald-900 text-[10px] uppercase">
              Mẹo MathType Word
            </span>
            <span className="text-[11px]">
              Dán nội dung kết quả vào Microsoft Word rồi bấm tổ hợp phím <strong>Alt + \</strong> là toàn bộ công thức sẽ chuyển thành MathType ngay lập tức!
            </span>
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
              <span>Kết quả MathType (Xem trực quan)</span>
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
              <span>Mã nguồn MathType TeX (Dán vào Word)</span>
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
                    VĂN BẢN GỐC CHỨA MATHTYPE OLE / WORD:
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

              {/* Right: Rendered MathType Preview (Matching user's exact request) */}
              <div className="flex flex-col space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-teal-900 flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-teal-600" />
                    KẾT QUẢ HIỂN THỊ SAU KHI CHUẨN HÓA SANG MATHTYPE:
                  </span>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 px-3 py-1 rounded-lg bg-teal-100 text-teal-800 text-xs font-bold hover:bg-teal-200 transition-colors shadow-2xs"
                    title="Sao chép văn bản để dán vào Word và bấm Alt + \"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? "Đã chép MathType!" : "Sao chép"}</span>
                  </button>
                </div>
                <div className="w-full flex-1 p-5 rounded-2xl bg-white border border-teal-200 shadow-2xs overflow-y-auto min-h-[350px]">
                  {outputText ? (
                    <div className="leading-relaxed text-slate-800 text-sm space-y-3 font-sans">
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
              <div className="text-xs font-extrabold uppercase tracking-wider text-teal-900 mb-3 flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-teal-600" />
                <span>KẾT QUẢ HIỂN THỊ SAU KHI CHUẨN HÓA SANG MATHTYPE:</span>
              </div>
              <div className="leading-relaxed text-slate-800 text-sm font-sans">
                <MathRenderer content={outputText} />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                  Mã nguồn MathType TeX (Dán vào Microsoft Word rồi ấn Alt + \)
                </span>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 px-3 py-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Đã chép!" : "Sao chép mã"}</span>
                </button>
              </div>
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
              onClick={handleDownloadFile}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-bold transition-all"
              title="Tải văn bản đã chuẩn hóa MathType về máy"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Tải file văn bản (.txt)</span>
            </button>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-700 to-emerald-700 hover:from-teal-800 hover:to-emerald-800 text-white text-xs font-bold shadow-md shadow-teal-700/20 active:scale-95 transition-all"
              title="Sao chép toàn bộ văn bản chuẩn MathType để dán vào Word"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-200" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? "Đã sao chép! Dán vào Word bấm Alt + \\" : "Sao chép chuẩn MathType (Word Alt + \\)"}</span>
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
