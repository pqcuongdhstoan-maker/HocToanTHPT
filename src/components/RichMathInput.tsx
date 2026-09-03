import React, { useState, useRef } from "react";
import { VisualFormulaEditorModal } from "./VisualFormulaEditorModal";
import { MathRenderer } from "../utils/mathJaxHelper";
import { Eye, EyeOff, Sparkles, Edit3, Image as ImageIcon } from "lucide-react";

interface RichMathInputProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  label?: string;
  isSingleLine?: boolean;
  rows?: number;
  className?: string;
  required?: boolean;
}

export const RichMathInput: React.FC<RichMathInputProps> = ({
  value,
  onChange,
  placeholder = "Nhập nội dung...",
  label,
  isSingleLine = false,
  rows = 3,
  className = "",
  required = false,
}) => {
  const [isFormulaModalOpen, setIsFormulaModalOpen] = useState<boolean>(false);
  const [formulaInitialLatex, setFormulaInitialLatex] = useState<string>("");
  const [formulaInitialIsBlock, setFormulaInitialIsBlock] = useState<boolean>(false);
  const [showLivePreview, setShowLivePreview] = useState<boolean>(false);
  const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement | null>(null);

  // Open formula editor modal with current selection or fresh formula
  const handleOpenFormulaModal = () => {
    const el = inputRef.current;
    let selectedText = "";
    if (el) {
      const start = el.selectionStart || 0;
      const end = el.selectionEnd || 0;
      if (start !== end) {
        selectedText = value.slice(start, end).trim();
      }
    }

    // Check if selected text is already a formula like $...$ or $$...$$
    let isBlock = false;
    let clean = selectedText;
    if (clean.startsWith("$$") && clean.endsWith("$$")) {
      clean = clean.slice(2, -2).trim();
      isBlock = true;
    } else if (clean.startsWith("$") && clean.endsWith("$")) {
      clean = clean.slice(1, -1).trim();
      isBlock = false;
    }

    setFormulaInitialLatex(clean);
    setFormulaInitialIsBlock(isBlock);
    setIsFormulaModalOpen(true);
  };

  // Insert formula at exact cursor position without double wrapping $
  const handleInsertFormula = (formulaWithDelimiters: string, rawLatex: string, isBlock: boolean) => {
    const el = inputRef.current;
    if (!el) {
      onChange(value ? `${value} ${formulaWithDelimiters}` : formulaWithDelimiters);
      return;
    }

    const start = el.selectionStart || 0;
    const end = el.selectionEnd || 0;

    const before = value.substring(0, start);
    const after = value.substring(end);

    // Prevent double wrapping if cursor was already adjacent to $
    let insertText = formulaWithDelimiters;

    const newValue = before + insertText + after;
    onChange(newValue);

    // Restore focus and place cursor right after inserted formula
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        const newCursorPos = start + insertText.length;
        inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 50);
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      {/* Label and Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        {label && (
          <label className="block text-xs font-bold text-slate-700">
            {label} {required && <span className="text-rose-500">*</span>}
          </label>
        )}

        {/* Editor Toolbar (Section 1: Nút ∑ Chèn công thức) */}
        <div className="flex items-center gap-1.5 ml-auto">
          {/* Exact button requested: ∑ Chèn công thức (matching attached media_1788425913303.png) */}
          <button
            type="button"
            onClick={handleOpenFormulaModal}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-300 font-bold text-xs shadow-2xs active:scale-95 transition-all group"
            title="Mở hộp soạn thảo công thức Toán học trực quan với MathLive & MathJax 3"
          >
            <span className="font-serif text-sm leading-none font-black text-teal-700 group-hover:scale-110 transition-transform">
              ∑
            </span>
            <span>Chèn công thức</span>
          </button>

          {/* Quick inline shortcut */}
          <button
            type="button"
            onClick={() => handleInsertFormula("$x$", "x", false)}
            className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-[11px] font-bold transition-colors"
            title="Chèn nhanh ký hiệu $...$"
          >
            $..$
          </button>

          {/* Upload and insert image inline */}
          <label
            className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-700 cursor-pointer text-xs font-medium transition-colors"
            title="Chèn ảnh hình vẽ / sơ đồ vào nội dung"
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () => {
                  const base64 = reader.result as string;
                  const imgTag = `\n\n![hình vẽ](${base64})\n\n`;
                  handleInsertFormula(imgTag, "", false);
                };
                reader.readAsDataURL(file);
              }}
            />
          </label>

          {/* Preview Toggle */}
          <button
            type="button"
            onClick={() => setShowLivePreview(!showLivePreview)}
            className={`p-1.5 rounded-lg border text-xs font-medium transition-colors ${
              showLivePreview
                ? "bg-blue-100 border-blue-300 text-blue-800"
                : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"
            }`}
            title={showLivePreview ? "Ẩn xem trước MathJax" : "Xem trước trực tiếp bằng MathJax 3"}
          >
            {showLivePreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Input / Textarea Field */}
      <div className="relative">
        {isSingleLine ? (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none text-sm bg-white transition-all shadow-2xs font-sans text-slate-800"
          />
        ) : (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            rows={rows}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none text-sm bg-white transition-all shadow-2xs font-sans text-slate-800 resize-y leading-relaxed"
          />
        )}
      </div>

      {/* Real-time MathJax 3 live preview when enabled or if contains formulas */}
      {showLivePreview && value.trim() && (
        <div className="p-3 rounded-xl bg-teal-50/60 border border-teal-200 text-xs text-slate-800 space-y-1 animate-fadeIn">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-teal-700 uppercase tracking-wider">
            <Sparkles className="w-3 h-3 text-teal-600" />
            <span>Hiển thị MathJax thực tế (như học sinh nhìn thấy):</span>
          </div>
          <div className="p-2.5 bg-white rounded-lg border border-teal-100 text-sm">
            <MathRenderer math={value} />
          </div>
        </div>
      )}

      {/* Visual Formula Editor Modal */}
      <VisualFormulaEditorModal
        isOpen={isFormulaModalOpen}
        onClose={() => setIsFormulaModalOpen(false)}
        initialLatex={formulaInitialLatex}
        initialIsBlock={formulaInitialIsBlock}
        onInsertFormula={handleInsertFormula}
      />
    </div>
  );
};
