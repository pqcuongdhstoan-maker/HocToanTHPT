import React, { useState } from 'react';
import { VisualRichMathEditor } from './VisualRichMathEditor';
import { VisualMathEditorModal } from './VisualMathEditorModal';
import {
  Sparkles,
  HelpCircle,
  Eye,
  Edit3,
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

  const handleInsertQuickSnippet = (snippet: string) => {
    const updated = value ? `${value} ${snippet}` : snippet;
    onChange(updated);
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      {/* Label & Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        {label && (
          <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
            <span>{label}</span>
            {required && <span className="text-rose-500">*</span>}
          </label>
        )}

        {/* Quick Toolbar with "∑ Chèn công thức" */}
        <div className="flex items-center space-x-1.5 text-xs">
          <button
            type="button"
            onClick={() => setIsEditorOpen(true)}
            className="px-3 py-1 bg-teal-700 hover:bg-teal-800 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center space-x-1.5"
            title="Mở bảng soạn thảo công thức toán trực quan (MathLive)"
          >
            <span className="text-sm font-black">∑</span>
            <span>Chèn công thức</span>
          </button>

          {/* Quick templates */}
          <button
            type="button"
            onClick={() => handleInsertQuickSnippet('$\\frac{a}{b}$')}
            className="px-2 py-1 bg-slate-100 hover:bg-teal-50 hover:text-teal-900 border border-slate-200 rounded-lg text-xs font-mono font-semibold transition"
            title="Chèn phân số"
          >
            a/b
          </button>
          <button
            type="button"
            onClick={() => handleInsertQuickSnippet('$\\sqrt{x}$')}
            className="px-2 py-1 bg-slate-100 hover:bg-teal-50 hover:text-teal-900 border border-slate-200 rounded-lg text-xs font-mono font-semibold transition"
            title="Chèn căn thức"
          >
            √x
          </button>
          <button
            type="button"
            onClick={() => handleInsertQuickSnippet('$x^2$')}
            className="px-2 py-1 bg-slate-100 hover:bg-teal-50 hover:text-teal-900 border border-slate-200 rounded-lg text-xs font-mono font-semibold transition"
            title="Chèn số mũ"
          >
            x²
          </button>
        </div>
      </div>

      {/* Visual Rich Math Editor (WYSIWYG: Zero raw LaTeX exposed!) */}
      <VisualRichMathEditor
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        isSingleLine={isSingleLine}
        minHeight={isSingleLine ? '44px' : rows > 2 ? '90px' : '56px'}
      />

      {helperText && <p className="text-[11px] text-slate-500">{helperText}</p>}

      {/* Modal for top-level toolbar "∑ Chèn công thức" */}
      <VisualMathEditorModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        onInsert={(formula) => {
          const updated = value ? `${value} ${formula}` : formula;
          onChange(updated);
        }}
      />
    </div>
  );
};
