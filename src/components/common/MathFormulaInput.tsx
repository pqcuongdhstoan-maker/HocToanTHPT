import React, { useState, useRef } from 'react';
import { VisualMathEditorModal } from './VisualMathEditorModal';
import { MathText } from '../MathText';
import {
  Eye,
  Edit3,
  Bold,
  Italic,
  HelpCircle,
  Sparkles,
} from 'lucide-react';

export interface MathFormulaInputProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  required?: boolean;
  className?: string;
  helperText?: string;
  isSingleLine?: boolean;
}

export const MathFormulaInput: React.FC<MathFormulaInputProps> = ({
  label,
  value,
  onChange,
  placeholder = 'Nhập nội dung hoặc bấm "∑ Chèn công thức" để soạn...',
  rows = 3,
  required = false,
  className = '',
  helperText,
  isSingleLine = false,
}) => {
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [previewMode, setPreviewMode] = useState<boolean>(false);
  const textareaRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null);

  const handleOpenFormulaEditor = () => {
    setIsEditorOpen(true);
  };

  const handleInsertFormula = (formulaLatex: string) => {
    const el = textareaRef.current;
    if (!el) {
      onChange(value ? `${value} ${formulaLatex}` : formulaLatex);
      return;
    }

    const start = el.selectionStart || 0;
    const end = el.selectionEnd || 0;
    const before = value.substring(0, start);
    const after = value.substring(end);

    const updated = before + formulaLatex + after;
    onChange(updated);

    const newPos = start + formulaLatex.length;
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(newPos, newPos);
    }, 10);
  };

  const handleApplyFormatting = (prefix: string, suffix: string) => {
    const el = textareaRef.current;
    if (!el) return;

    const start = el.selectionStart || 0;
    const end = el.selectionEnd || 0;
    const selected = value.substring(start, end);
    const before = value.substring(0, start);
    const after = value.substring(end);

    const formatted = before + prefix + (selected || 'văn bản') + suffix + after;
    onChange(formatted);

    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 10);
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      {/* Label and Mode Switcher */}
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
            <span>{label}</span>
            {required && <span className="text-rose-500">*</span>}
          </label>

          <div className="flex items-center space-x-1 text-[11px]">
            <button
              type="button"
              onClick={() => setPreviewMode(false)}
              className={`px-2 py-0.5 rounded transition flex items-center gap-1 ${
                !previewMode
                  ? 'bg-teal-100 text-teal-900 font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Edit3 className="w-3 h-3" />
              <span>Soạn thảo</span>
            </button>
            <button
              type="button"
              onClick={() => setPreviewMode(true)}
              className={`px-2 py-0.5 rounded transition flex items-center gap-1 ${
                previewMode
                  ? 'bg-teal-100 text-teal-900 font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Eye className="w-3 h-3" />
              <span>Xem trước</span>
            </button>
          </div>
        </div>
      )}

      {/* Editor Box */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-500/20 transition-all">
        {/* Toolbar */}
        <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
          {/* Main "∑ Chèn công thức" Button */}
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleOpenFormulaEditor}
              className="px-3 py-1.5 bg-teal-700 hover:bg-teal-800 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center space-x-1.5"
              title="Mở bảng soạn thảo công thức toán trực quan"
            >
              <span className="text-sm font-black">∑</span>
              <span>Chèn công thức</span>
            </button>

            {/* Quick Math Shortcuts */}
            <button
              type="button"
              onClick={() => handleInsertFormula('$\\frac{a}{b}$')}
              className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-mono text-slate-700 transition"
              title="Chèn phân số nhanh"
            >
              a/b
            </button>
            <button
              type="button"
              onClick={() => handleInsertFormula('$\\sqrt{x}$')}
              className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-mono text-slate-700 transition"
              title="Chèn căn thức nhanh"
            >
              √x
            </button>
            <button
              type="button"
              onClick={() => handleInsertFormula('$x^2$')}
              className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-mono text-slate-700 transition"
              title="Chèn số mũ nhanh"
            >
              x²
            </button>
            <button
              type="button"
              onClick={() => handleInsertFormula('$(-\\infty; +\\infty)$')}
              className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-mono text-slate-700 transition"
              title="Chèn khoảng vô cực"
            >
              (-∞; +∞)
            </button>
          </div>

          {/* Text Formatting Helpers */}
          <div className="flex items-center space-x-1 text-slate-500">
            <button
              type="button"
              onClick={() => handleApplyFormatting('**', '**')}
              className="p-1 hover:bg-slate-200 rounded text-xs font-bold text-slate-700"
              title="In đậm (Ctrl+B)"
            >
              <Bold className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleApplyFormatting('*', '*')}
              className="p-1 hover:bg-slate-200 rounded text-xs italic text-slate-700"
              title="In nghiêng (Ctrl+I)"
            >
              <Italic className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Input Field / Live Preview */}
        {previewMode ? (
          <div className="p-4 bg-white min-h-[70px] text-xs text-slate-800 leading-relaxed overflow-x-auto">
            {value.trim() ? (
              <MathText>{value}</MathText>
            ) : (
              <span className="text-slate-400 italic">Chưa có nội dung để xem trước...</span>
            )}
          </div>
        ) : isSingleLine ? (
          <input
            ref={textareaRef as React.RefObject<HTMLInputElement>}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full p-3 bg-white text-xs text-slate-800 focus:outline-none"
          />
        ) : (
          <textarea
            ref={textareaRef as React.RefObject<HTMLTextAreaElement>}
            rows={rows}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full p-3 bg-white text-xs text-slate-800 focus:outline-none resize-y leading-relaxed font-sans"
          />
        )}
      </div>

      {helperText && (
        <p className="text-[11px] text-slate-500">{helperText}</p>
      )}

      {/* Visual Formula Modal */}
      <VisualMathEditorModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        onInsert={(formula) => handleInsertFormula(formula)}
      />
    </div>
  );
};
