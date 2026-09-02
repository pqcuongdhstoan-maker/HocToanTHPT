import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MathText } from '../MathText';
import {
  X,
  Check,
  Undo2,
  Redo2,
  Delete,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  HelpCircle,
  Maximize2,
  Minimize2,
  Code,
  Eye,
  RotateCcw,
} from 'lucide-react';

export type VisualMathEditorModalProps = {
  isOpen: boolean;
  initialLatex?: string;
  initialDisplayMode?: 'inline' | 'block';
  onClose: () => void;
  onInsert: (latex: string, displayMode: 'inline' | 'block') => void;
};

type KeyboardTab = '123' | 'f' | 'symbols' | 'abc' | 'greek';

interface KeyDef {
  label: string;
  display?: React.ReactNode;
  latex: string;
  cursorOffset?: number; // Offset from end after inserting
  tooltip?: string;
  isAction?: boolean;
  className?: string;
}

export const VisualMathEditorModal: React.FC<VisualMathEditorModalProps> = ({
  isOpen,
  initialLatex = '',
  initialDisplayMode = 'inline',
  onClose,
  onInsert,
}) => {
  const [latex, setLatex] = useState<string>(initialLatex);
  const [displayMode, setDisplayMode] = useState<'inline' | 'block'>(initialDisplayMode);
  const [activeTab, setActiveTab] = useState<KeyboardTab>('123');
  const [isUppercase, setIsUppercase] = useState<boolean>(false);
  const [history, setHistory] = useState<string[]>([initialLatex]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);
  const [showRawLatex, setShowRawLatex] = useState<boolean>(false);

  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  // Sync initial state when modal opens
  useEffect(() => {
    if (isOpen) {
      // Clean leading/trailing $ if passed
      let cleaned = initialLatex.trim();
      if (cleaned.startsWith('$$') && cleaned.endsWith('$$')) {
        cleaned = cleaned.slice(2, -2).trim();
        setDisplayMode('block');
      } else if (cleaned.startsWith('$') && cleaned.endsWith('$')) {
        cleaned = cleaned.slice(1, -1).trim();
        setDisplayMode('inline');
      }
      setLatex(cleaned);
      setHistory([cleaned]);
      setHistoryIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, initialLatex, initialDisplayMode]);

  const updateLatexWithHistory = useCallback((newLatex: string) => {
    setLatex(newLatex);
    setHistory((prev) => {
      const next = prev.slice(0, historyIndex + 1);
      next.push(newLatex);
      return next;
    });
    setHistoryIndex((prev) => prev + 1);
  }, [historyIndex]);

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const prevIdx = historyIndex - 1;
      setHistoryIndex(prevIdx);
      setLatex(history[prevIdx]);
    }
  }, [historyIndex, history]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextIdx = historyIndex + 1;
      setHistoryIndex(nextIdx);
      setLatex(history[nextIdx]);
    }
  }, [historyIndex, history]);

  const insertSnippet = (snippet: string, cursorOffset: number = 0) => {
    const el = inputRef.current;
    if (!el) {
      updateLatexWithHistory(latex + snippet);
      return;
    }

    const start = el.selectionStart || 0;
    const end = el.selectionEnd || 0;
    const before = latex.substring(0, start);
    const after = latex.substring(end);
    const updated = before + snippet + after;

    updateLatexWithHistory(updated);

    // Set cursor position
    const newPos = start + snippet.length + cursorOffset;
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(newPos, newPos);
    }, 10);
  };

  const handleBackspace = () => {
    const el = inputRef.current;
    if (!el) return;

    const start = el.selectionStart || 0;
    const end = el.selectionEnd || 0;

    if (start === end) {
      if (start === 0) return;
      const before = latex.substring(0, start - 1);
      const after = latex.substring(end);
      updateLatexWithHistory(before + after);
      setTimeout(() => {
        el.focus();
        el.setSelectionRange(start - 1, start - 1);
      }, 10);
    } else {
      const before = latex.substring(0, start);
      const after = latex.substring(end);
      updateLatexWithHistory(before + after);
      setTimeout(() => {
        el.focus();
        el.setSelectionRange(start, start);
      }, 10);
    }
  };

  const handleMoveCursor = (direction: 'left' | 'right') => {
    const el = inputRef.current;
    if (!el) return;
    const start = el.selectionStart || 0;
    const newPos = direction === 'left' ? Math.max(0, start - 1) : Math.min(latex.length, start + 1);
    el.focus();
    el.setSelectionRange(newPos, newPos);
  };

  const handleInsertFinal = () => {
    const trimmed = latex.trim();
    if (!trimmed) {
      onClose();
      return;
    }

    // Format output properly as $...$ or $$...$$
    const formatted = displayMode === 'block' ? `$$\n${trimmed}\n$$` : `$${trimmed}$`;
    onInsert(formatted, displayMode);
    onClose();
  };

  if (!isOpen) return null;

  // KEY DEFINITIONS BY TAB
  // Tab 1: 123 (Basic Math & Numbers)
  const tab1LeftKeys: KeyDef[] = [
    { label: 'x', latex: 'x', tooltip: 'Biến x' },
    { label: 'n', latex: 'n', tooltip: 'Biến n' },
    { label: '<', latex: '< ', tooltip: 'Nhỏ hơn' },
    { label: '>', latex: '> ', tooltip: 'Lớn hơn' },
    { label: '(', latex: '(', tooltip: 'Mở ngoặc tròn' },
    { label: ')', latex: ')', tooltip: 'Đóng ngoặc tròn' },
    { label: 'y', latex: 'y', tooltip: 'Biến y' },
    { label: 'z', latex: 'z', tooltip: 'Biến z' },
  ];

  const tab1NumpadKeys: KeyDef[] = [
    { label: '7', latex: '7' },
    { label: '8', latex: '8' },
    { label: '9', latex: '9' },
    { label: '÷', latex: ' \\div ', tooltip: 'Chia' },
    { label: '4', latex: '4' },
    { label: '5', latex: '5' },
    { label: '6', latex: '6' },
    { label: '×', latex: ' \\times ', tooltip: 'Nhân' },
    { label: '1', latex: '1' },
    { label: '2', latex: '2' },
    { label: '3', latex: '3' },
    { label: '−', latex: ' - ', tooltip: 'Trừ' },
    { label: '0', latex: '0' },
    { label: '.', latex: '.' },
    { label: '=', latex: ' = ', tooltip: 'Bằng' },
    { label: '+', latex: ' + ', tooltip: 'Cộng' },
  ];

  const tab1RightKeys: KeyDef[] = [
    { label: 'e', latex: 'e', tooltip: 'Số e' },
    { label: 'i', latex: 'i', tooltip: 'Đơn vị ảo i' },
    { label: 'π', latex: '\\pi ', tooltip: 'Số Pi' },
    { label: 'a/b', display: <span className="font-mono text-xs">□/□</span>, latex: '\\frac{ }{ }', cursorOffset: -4, tooltip: 'Phân số' },
    { label: '□²', display: <span className="font-mono text-xs">□²</span>, latex: '^2', tooltip: 'Bình phương' },
    { label: 'x^□', display: <span className="font-mono text-xs">x^□</span>, latex: 'x^{ }', cursorOffset: -1, tooltip: 'Số mũ' },
    { label: '√□', display: <span className="font-mono text-xs">√□</span>, latex: '\\sqrt{ }', cursorOffset: -1, tooltip: 'Căn bậc hai' },
    { label: 'ⁿ√□', display: <span className="font-mono text-xs">ⁿ√□</span>, latex: '\\sqrt[n]{ }', cursorOffset: -1, tooltip: 'Căn bậc n' },
    { label: '∫', display: <span className="font-mono text-xs">∫₀^∞</span>, latex: '\\int_{0}^{\\infty} ', tooltip: 'Tích phân có cận' },
    { label: '∀', latex: '\\forall ', tooltip: 'Với mọi' },
    { label: '∃', latex: '\\exists ', tooltip: 'Tồn tại' },
    { label: '|x|', display: <span className="font-mono text-xs">|□|</span>, latex: '| |', cursorOffset: -1, tooltip: 'Trị tuyệt đối' },
  ];

  // Tab 2: f() (Functions & Calculus)
  const tab2Keys: KeyDef[] = [
    { label: 'sin', latex: '\\sin(', tooltip: 'Hàm sin' },
    { label: 'sin⁻¹', latex: '\\arcsin(', tooltip: 'Hàm arcsin' },
    { label: 'ln', latex: '\\ln(', tooltip: 'Logarit tự nhiên' },
    { label: 'e^□', latex: 'e^{ }', cursorOffset: -1, tooltip: 'Lũy thừa e' },
    { label: 'lcm()', latex: '\\operatorname{lcm}(', tooltip: 'Bội chung nhỏ nhất' },
    { label: 'ceil()', latex: '\\lceil \\rceil', cursorOffset: -7, tooltip: 'Hàm làm tròn lên' },
    { label: 'lim', display: <span className="font-mono text-[11px]">limₙ→∞</span>, latex: '\\lim_{n \\to \\infty} ', tooltip: 'Giới hạn vô cực' },
    { label: '∫', latex: '\\int ', tooltip: 'Nguyên hàm/Tích phân' },
    { label: 'abs()', latex: '\\operatorname{abs}(', tooltip: 'Trị tuyệt đối' },

    { label: 'cos', latex: '\\cos(', tooltip: 'Hàm cos' },
    { label: 'cos⁻¹', latex: '\\arccos(', tooltip: 'Hàm arccos' },
    { label: 'log', latex: '\\log(', tooltip: 'Logarit thập phân' },
    { label: '10^□', latex: '10^{ }', cursorOffset: -1, tooltip: 'Lũy thừa 10' },
    { label: 'gcd()', latex: '\\operatorname{gcd}(', tooltip: 'Ước chung lớn nhất' },
    { label: 'floor()', latex: '\\lfloor \\rfloor', cursorOffset: -8, tooltip: 'Hàm làm tròn xuống' },
    { label: '∑', display: <span className="font-mono text-[11px]">∑ₙ₌₀^∞</span>, latex: '\\sum_{n=0}^{\\infty} ', tooltip: 'Tổng Sigma' },
    { label: '∫ₐᵇ', display: <span className="font-mono text-[11px]">∫ₐᵇ</span>, latex: '\\int_{a}^{b} ', tooltip: 'Tích phân xác định' },
    { label: 'sign()', latex: '\\operatorname{sign}(', tooltip: 'Hàm dấu' },

    { label: 'tan', latex: '\\tan(', tooltip: 'Hàm tan' },
    { label: 'tan⁻¹', latex: '\\arctan(', tooltip: 'Hàm arctan' },
    { label: 'logₐ', latex: '\\log_{a}( )', cursorOffset: -2, tooltip: 'Logarit cơ số a' },
    { label: 'ⁿ√□', latex: '\\sqrt[ ]{ }', cursorOffset: -4, tooltip: 'Căn thức bậc n' },
    { label: 'mod', latex: ' \\bmod ', tooltip: 'Phép chia lấy dư' },
    { label: 'round()', latex: '\\operatorname{round}(', tooltip: 'Làm tròn' },
    { label: '∏', display: <span className="font-mono text-[11px]">∏ₙ₌₀^∞</span>, latex: '\\prod_{n=0}^{\\infty} ', tooltip: 'Tích Pi' },
    { label: 'd/dx', display: <span className="font-mono text-[11px]">d□/dx</span>, latex: '\\frac{d}{dx}( )', cursorOffset: -2, tooltip: 'Đạo hàm' },
    { label: "f'(x)", latex: "f'(x)", tooltip: 'Đạo hàm f(x)' },

    { label: '(', latex: '(', tooltip: 'Mở ngoặc' },
    { label: ')', latex: ')', tooltip: 'Đóng ngoặc' },
    { label: 'x^□', latex: 'x^{ }', cursorOffset: -1, tooltip: 'Số mũ' },
    { label: 'x_□', latex: 'x_{ }', cursorOffset: -1, tooltip: 'Chỉ số dưới' },
    { label: 'cot', latex: '\\cot(', tooltip: 'Hàm cotan' },
    { label: 'f(x)', latex: 'f(x)', tooltip: 'Ký hiệu hàm f(x)' },
    { label: 'g(x)', latex: 'g(x)', tooltip: 'Ký hiệu hàm g(x)' },
    { label: 'dy/dx', latex: '\\frac{dy}{dx}', tooltip: 'Vi phân đạo hàm' },
    { label: 'dx', latex: '\\, dx', tooltip: 'Vi phân dx' },
  ];

  // Tab 3: ∞ ≠ ∈ (Relations, Sets, Geometry & Vectors)
  const tab3Keys: KeyDef[] = [
    { label: '←', latex: '\\leftarrow ', tooltip: 'Mũi tên trái' },
    { label: '→', latex: '\\rightarrow ', tooltip: 'Mũi tên phải' },
    { label: '↔', latex: '\\leftrightarrow ', tooltip: 'Mũi tên hai chiều' },
    { label: 'x̄', display: <span className="font-mono text-xs">x̄</span>, latex: '\\overline{ }', cursorOffset: -1, tooltip: 'Gạch trên đầu' },
    { label: 'x̲', display: <span className="font-mono text-xs">x̲</span>, latex: '\\underline{ }', cursorOffset: -1, tooltip: 'Gạch dưới' },
    { label: '⌈x⌉', latex: '\\lceil \\rceil', cursorOffset: -7, tooltip: 'Ceil' },
    { label: '∇', latex: '\\nabla ', tooltip: 'Nabla / Gradient' },
    { label: '∞', latex: '\\infty ', tooltip: 'Vô cực' },
    { label: '+∞', latex: '+\\infty ', tooltip: 'Dương vô cực' },
    { label: '-∞', latex: '-\\infty ', tooltip: 'Âm vô cực' },

    { label: '∈', latex: ' \\in ', tooltip: 'Thuộc' },
    { label: '∉', latex: ' \\notin ', tooltip: 'Không thuộc' },
    { label: '⊂', latex: ' \\subset ', tooltip: 'Tập con' },
    { label: '⊃', latex: ' \\supset ', tooltip: 'Chứa' },
    { label: '⊆', latex: ' \\subseteq ', tooltip: 'Tập con hoặc bằng' },
    { label: '⊇', latex: ' \\supseteq ', tooltip: 'Chứa hoặc bằng' },
    { label: '∪', latex: ' \\cup ', tooltip: 'Hợp' },
    { label: '∩', latex: ' \\cap ', tooltip: 'Giao' },
    { label: '∅', latex: '\\varnothing ', tooltip: 'Tập rỗng' },
    { label: '∂', latex: '\\partial ', tooltip: 'Đạo hàm riêng' },

    { label: 'ℝ', latex: '\\mathbb{R}', tooltip: 'Tập số thực' },
    { label: 'ℤ', latex: '\\mathbb{Z}', tooltip: 'Tập số nguyên' },
    { label: 'ℕ', latex: '\\mathbb{N}', tooltip: 'Tập số tự nhiên' },
    { label: 'ℚ', latex: '\\mathbb{Q}', tooltip: 'Tập số hữu tỉ' },
    { label: 'ℂ', latex: '\\mathbb{C}', tooltip: 'Tập số phức' },
    { label: 'v⃗', display: <span className="font-mono text-xs">v⃗</span>, latex: '\\vec{v}', tooltip: 'Vectơ v' },
    { label: 'AB⃗', display: <span className="font-mono text-xs">AB⃗</span>, latex: '\\overrightarrow{AB}', tooltip: 'Vectơ AB' },
    { label: '⊥', latex: ' \\perp ', tooltip: 'Vuông góc' },
    { label: '∥', latex: ' \\parallel ', tooltip: 'Song song' },
    { label: '∠', latex: '\\angle ', tooltip: 'Góc' },

    { label: '≠', latex: ' \\ne ', tooltip: 'Khác' },
    { label: '≈', latex: ' \\approx ', tooltip: 'Xấp xỉ' },
    { label: '±', latex: ' \\pm ', tooltip: 'Cộng trừ' },
    { label: '≤', latex: ' \\le ', tooltip: 'Nhỏ hơn hoặc bằng' },
    { label: '≥', latex: ' \\ge ', tooltip: 'Lớn hơn hoặc bằng' },
    { label: '!', latex: '!', tooltip: 'Giai thừa' },
    { label: "'", latex: "'", tooltip: 'Phẩy' },
    { label: '∘', latex: '^{\\circ}', tooltip: 'Độ' },
    { label: 'Hệ PT', display: <span className="text-[11px] font-bold">Hệ {'{'}</span>, latex: '\\begin{cases}  \\\\  \\end{cases}', cursorOffset: -14, tooltip: 'Hệ phương trình' },
    { label: 'Ma trận', display: <span className="text-[11px] font-bold">[Matrix]</span>, latex: '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}', tooltip: 'Ma trận 2x2' },
  ];

  // Tab 4: ABC (Latin letters)
  const latinPriorityVars = ['x', 'y', 'z', 'a', 'b', 'c', 'm', 'n', 'p', 'q', 'u', 'v', 't', 'k', 'h', 'R', 'r', 'S', 'V'];
  const latinLetters = 'abcdefghijklmnopqrstuvwxyz'.split('');

  // Tab 5: Greek letters
  const greekKeys: KeyDef[] = [
    { label: 'α', latex: '\\alpha ', tooltip: 'alpha' },
    { label: 'β', latex: '\\beta ', tooltip: 'beta' },
    { label: 'γ', latex: '\\gamma ', tooltip: 'gamma' },
    { label: 'δ', latex: '\\delta ', tooltip: 'delta' },
    { label: 'ε', latex: '\\epsilon ', tooltip: 'epsilon' },
    { label: 'έ', latex: '\\varepsilon ', tooltip: 'varepsilon' },
    { label: 'ζ', latex: '\\zeta ', tooltip: 'zeta' },
    { label: 'η', latex: '\\eta ', tooltip: 'eta' },
    { label: 'θ', latex: '\\theta ', tooltip: 'theta' },
    { label: 'ϑ', latex: '\\vartheta ', tooltip: 'vartheta' },
    { label: 'ι', latex: '\\iota ', tooltip: 'iota' },
    { label: 'κ', latex: '\\kappa ', tooltip: 'kappa' },
    { label: 'λ', latex: '\\lambda ', tooltip: 'lambda' },
    { label: 'μ', latex: '\\mu ', tooltip: 'mu' },
    { label: 'ν', latex: '\\nu ', tooltip: 'nu' },
    { label: 'ξ', latex: '\\xi ', tooltip: 'xi' },
    { label: 'π', latex: '\\pi ', tooltip: 'pi' },
    { label: 'ϖ', latex: '\\varpi ', tooltip: 'varpi' },
    { label: 'ρ', latex: '\\rho ', tooltip: 'rho' },
    { label: 'ϱ', latex: '\\varrho ', tooltip: 'varrho' },
    { label: 'σ', latex: '\\sigma ', tooltip: 'sigma' },
    { label: 'ς', latex: '\\varsigma ', tooltip: 'varsigma' },
    { label: 'τ', latex: '\\tau ', tooltip: 'tau' },
    { label: 'υ', latex: '\\upsilon ', tooltip: 'upsilon' },
    { label: 'φ', latex: '\\phi ', tooltip: 'phi' },
    { label: 'ϕ', latex: '\\varphi ', tooltip: 'varphi' },
    { label: 'χ', latex: '\\chi ', tooltip: 'chi' },
    { label: 'ψ', latex: '\\psi ', tooltip: 'psi' },
    { label: 'ω', latex: '\\omega ', tooltip: 'omega' },
    { label: 'Δ', latex: '\\Delta ', tooltip: 'Delta (hoa)' },
    { label: 'Σ', latex: '\\Sigma ', tooltip: 'Sigma (hoa)' },
    { label: 'Π', latex: '\\Pi ', tooltip: 'Pi (hoa)' },
    { label: 'Ω', latex: '\\Omega ', tooltip: 'Omega (hoa)' },
    { label: 'Θ', latex: '\\Theta ', tooltip: 'Theta (hoa)' },
    { label: 'Λ', latex: '\\Lambda ', tooltip: 'Lambda (hoa)' },
    { label: 'Φ', latex: '\\Phi ', tooltip: 'Phi (hoa)' },
    { label: 'Ψ', latex: '\\Psi ', tooltip: 'Psi (hoa)' },
    { label: 'Γ', latex: '\\Gamma ', tooltip: 'Gamma (hoa)' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div
        className="bg-white rounded-3xl border border-teal-200 shadow-2xl w-full max-w-4xl flex flex-col max-h-[92vh] overflow-hidden transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-teal-50/80 via-white to-teal-50/80 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-700 text-white flex items-center justify-center font-bold text-sm shadow-xs">
              ∑
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>Soạn thảo công thức</span>
                <span className="text-[10px] bg-teal-100 text-teal-800 font-bold px-2 py-0.5 rounded-full border border-teal-300">
                  Visual Math
                </span>
              </h2>
              <p className="text-[11px] text-slate-500">
                Bàn phím toán học trực quan • Tự động chuyển đổi công thức sang chuẩn MathJax
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Inline vs Block Toggle */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
              <button
                onClick={() => setDisplayMode('inline')}
                className={`px-3 py-1 rounded-lg transition ${
                  displayMode === 'inline' ? 'bg-white text-teal-900 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Công thức hiển thị liên tục trong dòng văn bản ($...$)"
              >
                Trong dòng ($)
              </button>
              <button
                onClick={() => setDisplayMode('block')}
                className={`px-3 py-1 rounded-lg transition ${
                  displayMode === 'block' ? 'bg-white text-teal-900 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Công thức nằm riêng một khối ở giữa trang ($$...$$)"
              >
                Khối riêng ($$)
              </button>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* FORMULA INPUT & LIVE PREVIEW AREA */}
        <div className="p-4 sm:p-6 bg-slate-50/60 border-b border-slate-200 space-y-3">
          {/* Top Preview Card */}
          <div className="bg-white rounded-2xl border-2 border-teal-300/80 p-4 min-h-[90px] flex flex-col justify-between shadow-xs relative focus-within:ring-2 focus-within:ring-teal-500">
            <div className="text-[10px] font-bold uppercase tracking-wider text-teal-700 flex items-center justify-between mb-1">
              <div className="flex items-center space-x-1.5">
                <Eye className="w-3.5 h-3.5" />
                <span>Bản xem trước trực quan (Live Render):</span>
              </div>
              <div className="flex items-center space-x-1">
                <button
                  onClick={handleUndo}
                  disabled={historyIndex <= 0}
                  className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded"
                  title="Hoàn tác (Undo)"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleRedo}
                  disabled={historyIndex >= history.length - 1}
                  className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded"
                  title="Làm lại (Redo)"
                >
                  <Redo2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setShowRawLatex(!showRawLatex)}
                  className={`p-1 rounded text-[10px] font-mono px-1.5 border transition ${
                    showRawLatex ? 'bg-teal-100 text-teal-800 border-teal-300' : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                  title="Chuyển chế độ xem mã LaTeX"
                >
                  <Code className="w-3 h-3 inline mr-0.5" /> LaTeX
                </button>
              </div>
            </div>

            {/* Visual Formula Display */}
            <div className="py-2 text-center overflow-x-auto min-h-[44px] flex items-center justify-center">
              {latex.trim() ? (
                <div className="text-base sm:text-lg text-slate-900 font-medium">
                  <MathText>{displayMode === 'block' ? `$$\n${latex}\n$$` : `$${latex}$`}</MathText>
                </div>
              ) : (
                <span className="text-slate-400 italic text-xs">
                  Bấm các phím toán học bên dưới hoặc gõ trực tiếp để tạo công thức...
                </span>
              )}
            </div>

            {/* Hidden / Visible Direct Input for typing */}
            {showRawLatex ? (
              <div className="mt-2 pt-2 border-t border-slate-100">
                <input
                  ref={inputRef as React.RefObject<HTMLInputElement>}
                  type="text"
                  value={latex}
                  onChange={(e) => updateLatexWithHistory(e.target.value)}
                  placeholder="Mã LaTeX (ví dụ: \frac{x^2 - 1}{x - 1})"
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-teal-950 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
            ) : (
              <input
                ref={inputRef as React.RefObject<HTMLInputElement>}
                type="text"
                value={latex}
                onChange={(e) => updateLatexWithHistory(e.target.value)}
                className="opacity-0 absolute -z-10 w-0 h-0"
              />
            )}
          </div>
        </div>

        {/* 5-TAB VIRTUAL KEYBOARD SECTION */}
        <div className="flex-1 flex flex-col bg-slate-100 overflow-y-auto">
          {/* Tab Navigation */}
          <div className="flex items-center justify-center space-x-6 sm:space-x-10 bg-slate-200/80 px-4 py-2 text-xs font-black border-b border-slate-300">
            <button
              onClick={() => setActiveTab('123')}
              className={`pb-1 px-2 border-b-2 transition ${
                activeTab === '123'
                  ? 'border-teal-700 text-teal-800 font-bold'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              123
            </button>
            <button
              onClick={() => setActiveTab('f')}
              className={`pb-1 px-2 border-b-2 font-mono transition ${
                activeTab === 'f'
                  ? 'border-teal-700 text-teal-800 font-bold'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              f()
            </button>
            <button
              onClick={() => setActiveTab('symbols')}
              className={`pb-1 px-2 border-b-2 font-mono transition ${
                activeTab === 'symbols'
                  ? 'border-teal-700 text-teal-800 font-bold'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              ∞ ≠ ∈
            </button>
            <button
              onClick={() => setActiveTab('abc')}
              className={`pb-1 px-2 border-b-2 transition ${
                activeTab === 'abc'
                  ? 'border-teal-700 text-teal-800 font-bold'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              ABC
            </button>
            <button
              onClick={() => setActiveTab('greek')}
              className={`pb-1 px-2 border-b-2 font-mono transition ${
                activeTab === 'greek'
                  ? 'border-teal-700 text-teal-800 font-bold'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              αβγ
            </button>
          </div>

          {/* KEYBOARD CONTENT BY TAB */}
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 flex flex-col justify-center">
            {/* TAB 1: 123 (Exact 3-column layout matching User's Image) */}
            {activeTab === '123' && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 max-w-3xl mx-auto w-full">
                {/* Left Column (Variables & Parentheses) */}
                <div className="md:col-span-3 grid grid-cols-2 gap-2">
                  {tab1LeftKeys.map((k, idx) => (
                    <button
                      key={idx}
                      onClick={() => insertSnippet(k.latex, k.cursorOffset)}
                      className="h-10 sm:h-11 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl font-mono text-sm font-bold text-slate-800 shadow-xs hover:border-teal-400 active:scale-95 transition flex items-center justify-center"
                      title={k.tooltip || k.label}
                    >
                      {k.display || k.label}
                    </button>
                  ))}
                </div>

                {/* Center Column (Standard Numpad & Basic Arithmetic) */}
                <div className="md:col-span-5 grid grid-cols-4 gap-2">
                  {tab1NumpadKeys.map((k, idx) => (
                    <button
                      key={idx}
                      onClick={() => insertSnippet(k.latex, k.cursorOffset)}
                      className={`h-10 sm:h-11 border rounded-xl font-mono text-sm font-bold shadow-xs active:scale-95 transition flex items-center justify-center ${
                        ['÷', '×', '−', '+', '='].includes(k.label)
                          ? 'bg-slate-50 border-slate-300 text-teal-900 hover:bg-teal-50 hover:border-teal-400'
                          : 'bg-white border-slate-300 text-slate-900 hover:bg-slate-50'
                      }`}
                      title={k.tooltip || k.label}
                    >
                      {k.display || k.label}
                    </button>
                  ))}
                </div>

                {/* Right Column (Roots, Fractions, Powers, Constants & Navigation) */}
                <div className="md:col-span-4 grid grid-cols-3 gap-2">
                  {tab1RightKeys.map((k, idx) => (
                    <button
                      key={idx}
                      onClick={() => insertSnippet(k.latex, k.cursorOffset)}
                      className="h-10 sm:h-11 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs font-bold text-slate-800 shadow-xs hover:border-teal-400 active:scale-95 transition flex items-center justify-center"
                      title={k.tooltip || k.label}
                    >
                      {k.display || k.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 2: f() (Functions & Calculus Grid matching User's Image) */}
            {activeTab === 'f' && (
              <div className="grid grid-cols-3 sm:grid-cols-6 md:grid-cols-9 gap-2 max-w-4xl mx-auto w-full">
                {tab2Keys.map((k, idx) => (
                  <button
                    key={idx}
                    onClick={() => insertSnippet(k.latex, k.cursorOffset)}
                    className="h-10 sm:h-11 bg-white hover:bg-teal-50/60 border border-slate-300 hover:border-teal-400 rounded-xl font-mono text-xs font-semibold text-slate-800 shadow-xs active:scale-95 transition flex items-center justify-center"
                    title={k.tooltip || k.label}
                  >
                    {k.display || k.label}
                  </button>
                ))}
              </div>
            )}

            {/* TAB 3: ∞ ≠ ∈ (Relations, Sets, Vectors & Geometry) */}
            {activeTab === 'symbols' && (
              <div className="grid grid-cols-4 sm:grid-cols-8 md:grid-cols-10 gap-2 max-w-4xl mx-auto w-full">
                {tab3Keys.map((k, idx) => (
                  <button
                    key={idx}
                    onClick={() => insertSnippet(k.latex, k.cursorOffset)}
                    className="h-10 sm:h-11 bg-white hover:bg-teal-50/60 border border-slate-300 hover:border-teal-400 rounded-xl font-mono text-xs font-bold text-slate-800 shadow-xs active:scale-95 transition flex items-center justify-center"
                    title={k.tooltip || k.label}
                  >
                    {k.display || k.label}
                  </button>
                ))}
              </div>
            )}

            {/* TAB 4: ABC (Latin letters with Priority Quick-Variables) */}
            {activeTab === 'abc' && (
              <div className="space-y-4 max-w-3xl mx-auto w-full">
                {/* Priority Quick Variables */}
                <div className="bg-white p-3 rounded-2xl border border-slate-300 shadow-xs space-y-1.5">
                  <div className="text-[10px] font-bold text-teal-800 uppercase tracking-wider">
                    Biến số thường dùng trong đề thi:
                  </div>
                  <div className="grid grid-cols-6 sm:grid-cols-10 gap-2">
                    {latinPriorityVars.map((v) => {
                      const char = isUppercase ? v.toUpperCase() : v.toLowerCase();
                      return (
                        <button
                          key={v}
                          onClick={() => insertSnippet(char)}
                          className="h-9 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg font-mono text-sm font-bold text-teal-950 active:scale-95 transition"
                        >
                          {char}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Full A-Z Letter Keyboard */}
                <div className="grid grid-cols-7 sm:grid-cols-9 md:grid-cols-13 gap-1.5">
                  {latinLetters.map((l) => {
                    const char = isUppercase ? l.toUpperCase() : l;
                    return (
                      <button
                        key={l}
                        onClick={() => insertSnippet(char)}
                        className="h-10 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl font-mono text-sm font-bold text-slate-800 shadow-xs active:scale-95 transition"
                      >
                        {char}
                      </button>
                    );
                  })}
                </div>

                {/* Shift Toggle & Punctuation */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200">
                  <button
                    onClick={() => setIsUppercase(!isUppercase)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold border transition ${
                      isUppercase
                        ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    ⇧ {isUppercase ? 'Chữ IN HOA' : 'Chữ thường'}
                  </button>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => insertSnippet('; ')}
                      className="px-4 py-2 bg-white border border-slate-300 rounded-xl font-mono text-xs font-bold hover:bg-slate-50"
                    >
                      ; (chấm phẩy)
                    </button>
                    <button
                      onClick={() => insertSnippet(', ')}
                      className="px-4 py-2 bg-white border border-slate-300 rounded-xl font-mono text-xs font-bold hover:bg-slate-50"
                    >
                      , (phẩy)
                    </button>
                    <button
                      onClick={() => insertSnippet('\\text{ }')}
                      className="px-6 py-2 bg-white border border-slate-300 rounded-xl font-mono text-xs font-bold hover:bg-slate-50"
                    >
                      Dấu cách (Space)
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: αβγ (Greek letters) */}
            {activeTab === 'greek' && (
              <div className="grid grid-cols-4 sm:grid-cols-7 md:grid-cols-10 gap-2 max-w-4xl mx-auto w-full">
                {greekKeys.map((k, idx) => (
                  <button
                    key={idx}
                    onClick={() => insertSnippet(k.latex, k.cursorOffset)}
                    className="h-10 sm:h-11 bg-white hover:bg-teal-50/60 border border-slate-300 hover:border-teal-400 rounded-xl font-mono text-sm font-bold text-slate-800 shadow-xs active:scale-95 transition flex items-center justify-center"
                    title={k.tooltip || k.label}
                  >
                    {k.display || k.label}
                  </button>
                ))}
              </div>
            )}

            {/* GLOBAL NAVIGATION & EDIT ACTIONS ROW */}
            <div className="mt-4 pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 max-w-3xl mx-auto w-full">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleMoveCursor('left')}
                  className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 shadow-xs flex items-center gap-1"
                  title="Di chuyển con trỏ sang trái"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Trái</span>
                </button>
                <button
                  onClick={() => handleMoveCursor('right')}
                  className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 shadow-xs flex items-center gap-1"
                  title="Di chuyển con trỏ sang phải"
                >
                  <span>Phải</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleBackspace}
                  className="px-3 py-1.5 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-800 rounded-xl text-xs font-bold shadow-xs flex items-center gap-1"
                  title="Xóa ký tự trước con trỏ (Backspace)"
                >
                  <Delete className="w-3.5 h-3.5" />
                  <span>Xóa</span>
                </button>
                <button
                  onClick={() => updateLatexWithHistory('')}
                  className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1"
                  title="Xóa toàn bộ"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Làm mới</span>
                </button>
              </div>

              <div className="text-[11px] text-slate-500 italic">
                * Hỗ trợ gõ trực tiếp từ bàn phím vật lý
              </div>
            </div>
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="px-6 py-4 bg-white border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs transition"
          >
            Hủy bỏ
          </button>

          <button
            onClick={handleInsertFinal}
            className="px-7 py-2.5 bg-teal-700 hover:bg-teal-800 active:scale-95 text-white font-black text-xs rounded-xl shadow-md transition flex items-center space-x-2"
          >
            <Check className="w-4 h-4" />
            <span>Chèn công thức</span>
          </button>
        </div>
      </div>
    </div>
  );
};
