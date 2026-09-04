import React, { useState, useEffect, useRef } from "react";
import { MathRenderer } from "../utils/mathJaxHelper";
import {
  X,
  Check,
  RotateCcw,
  Trash2,
  CornerDownLeft,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  HelpCircle,
  Eye,
  Sliders,
  Type,
  Maximize2,
} from "lucide-react";

interface VisualFormulaEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialLatex?: string;
  initialIsBlock?: boolean;
  onInsertFormula?: (formulaWithDelimiters: string, rawLatex: string, isBlock: boolean) => void;
}


type TabCategory = "123" | "f()" | "RELATIONS" | "ABC" | "GREEK";

export const VisualFormulaEditorModal: React.FC<VisualFormulaEditorModalProps> = ({
  isOpen,
  onClose,
  initialLatex = "",
  initialIsBlock = false,
  onInsertFormula,
}) => {
  const [activeTab, setActiveTab] = useState<TabCategory>("123");
  const [latex, setLatex] = useState<string>(initialLatex);
  const [isBlock, setIsBlock] = useState<boolean>(initialIsBlock);
  const [isCaps, setIsCaps] = useState<boolean>(false);
  const mathFieldContainerRef = useRef<HTMLDivElement>(null);
  const mathFieldRef = useRef<any>(null);

  // Sync initial Latex when modal opens
  useEffect(() => {
    if (isOpen) {
      // Clean leading/trailing $ if any passed
      let clean = initialLatex.trim();
      if (clean.startsWith("$$") && clean.endsWith("$$")) {
        clean = clean.slice(2, -2).trim();
        setIsBlock(true);
      } else if (clean.startsWith("$") && clean.endsWith("$")) {
        clean = clean.slice(1, -1).trim();
        setIsBlock(false);
      } else {
        setIsBlock(initialIsBlock);
      }
      setLatex(clean);
    }
  }, [isOpen, initialLatex, initialIsBlock]);

  // Mount or update MathLive <math-field>
  useEffect(() => {
    if (!isOpen) return;

    let timer = setTimeout(() => {
      if (mathFieldContainerRef.current) {
        let mf = mathFieldContainerRef.current.querySelector("math-field") as any;
        if (!mf) {
          mf = document.createElement("math-field");
          mf.setAttribute("virtual-keyboard-mode", "manual");
          mf.className = "w-full text-xl font-mono p-3 rounded-xl border border-slate-300 focus:border-teal-500 bg-white";
          mathFieldContainerRef.current.appendChild(mf);

          mf.addEventListener("input", (ev: any) => {
            setLatex(ev.target.value || "");
          });
        }

        mf.value = latex;
        mathFieldRef.current = mf;
        try {
          mf.focus();
        } catch {
          // ignore focus if not ready
        }
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  // Insert a LaTeX snippet or command into the MathLive field
  const handleInsertSnippet = (snippet: string) => {
    const mf = mathFieldRef.current;
    if (mf && typeof mf.executeCommand === "function") {
      mf.executeCommand(["insert", snippet]);
      setLatex(mf.value || "");
      mf.focus();
    } else {
      // Fallback string append if MathLive not yet initialized
      setLatex((prev) => prev + snippet);
    }
  };

  const handleCursorLeft = () => {
    const mf = mathFieldRef.current;
    if (mf && typeof mf.executeCommand === "function") {
      mf.executeCommand("moveToPreviousChar");
      mf.focus();
    }
  };

  const handleCursorRight = () => {
    const mf = mathFieldRef.current;
    if (mf && typeof mf.executeCommand === "function") {
      mf.executeCommand("moveToNextChar");
      mf.focus();
    }
  };

  const handleBackspace = () => {
    const mf = mathFieldRef.current;
    if (mf && typeof mf.executeCommand === "function") {
      mf.executeCommand("deleteBackward");
      setLatex(mf.value || "");
      mf.focus();
    } else {
      setLatex((prev) => prev.slice(0, -1));
    }
  };

  const handleClearAll = () => {
    const mf = mathFieldRef.current;
    if (mf) {
      mf.value = "";
      setLatex("");
      mf.focus();
    } else {
      setLatex("");
    }
  };

  const [isCopied, setIsCopied] = useState<boolean>(false);

  const handleCopyLatex = async () => {
    const cleanLatex = latex.trim();
    if (!cleanLatex) {
      alert("Vui lòng nhập hoặc chọn ít nhất một ký hiệu công thức!");
      return;
    }
    const formatted = isBlock ? `$$${cleanLatex}$$` : `$${cleanLatex}$`;
    await navigator.clipboard.writeText(formatted);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleConfirmInsert = () => {
    const cleanLatex = latex.trim();
    if (!cleanLatex) {
      alert("Vui lòng nhập hoặc chọn ít nhất một ký hiệu công thức!");
      return;
    }

    // Format with standard delimiter (Section 5: Không bọc $ hai lần)
    const formatted = isBlock ? `$$${cleanLatex}$$` : `$${cleanLatex}$`;
    if (onInsertFormula) {
      onInsertFormula(formatted, cleanLatex, isBlock);
    } else {
      navigator.clipboard.writeText(formatted);
      alert(`Đã sao chép công thức vào bộ nhớ tạm: ${formatted}`);
    }
    onClose();
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/70 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-slate-50 w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-300 overflow-hidden flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-teal-800 via-teal-700 to-cyan-900 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-teal-200 border border-white/20 font-serif text-2xl font-bold">
              ∑
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-teal-400/20 text-teal-200 border border-teal-400/30">
                  MathLive & MathJax 3
                </span>
                <span className="text-xs text-teal-100 font-medium">Chuẩn GDPT 2018</span>
              </div>
              <h2 className="text-lg font-black tracking-tight">Soạn thảo công thức Toán học trực quan</h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            title="Đóng hộp thoại"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {/* Top: Interactive Visual Math Field Container */}
          <div className="bg-white rounded-2xl p-4 border-2 border-slate-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-600">
              <span className="flex items-center gap-1.5 text-teal-800 font-extrabold">
                <Sliders className="w-4 h-4 text-teal-600" />
                Ô nhập công thức trực quan (Con trỏ nhấp nháy):
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="px-2.5 py-1 rounded-lg text-rose-600 hover:bg-rose-50 border border-rose-200 flex items-center gap-1 text-[11px] font-semibold transition-colors"
                  title="Xóa hết toàn bộ công thức"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xóa hết</span>
                </button>
              </div>
            </div>

            {/* MathLive Input Mounting Point */}
            <div ref={mathFieldContainerRef} className="min-h-[56px]" />

            {/* Format Option (In-line vs Block display) */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 text-xs">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-1.5 font-bold cursor-pointer text-slate-700">
                  <input
                    type="radio"
                    name="displayMode"
                    checked={!isBlock}
                    onChange={() => setIsBlock(false)}
                    className="text-teal-600 focus:ring-teal-500 w-4 h-4"
                  />
                  <span>Công thức trong dòng ($...$)</span>
                </label>
                <label className="flex items-center gap-1.5 font-bold cursor-pointer text-slate-700">
                  <input
                    type="radio"
                    name="displayMode"
                    checked={isBlock}
                    onChange={() => setIsBlock(true)}
                    className="text-teal-600 focus:ring-teal-500 w-4 h-4"
                  />
                  <span>Công thức riêng một dòng ($$...$$)</span>
                </label>
              </div>

              {/* Cursor and navigation controls */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleCursorLeft}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center gap-1 text-xs"
                  title="Di chuyển con trỏ sang trái"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Trái</span>
                </button>
                <button
                  type="button"
                  onClick={handleCursorRight}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center gap-1 text-xs"
                  title="Di chuyển con trỏ sang phải"
                >
                  <span>Phải</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleBackspace}
                  className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold flex items-center gap-1 text-xs"
                  title="Xóa lùi ký tự trước con trỏ"
                >
                  <CornerDownLeft className="w-3.5 h-3.5" />
                  <span>Xóa lùi</span>
                </button>
              </div>
            </div>
          </div>

          {/* Real-time MathJax 3 Preview Box */}
          <div className="p-4 rounded-2xl bg-teal-50/50 border border-teal-200 text-slate-800 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-teal-800">
              <span className="flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-teal-600" />
                Bản xem trước theo thời gian thực (Render bằng MathJax 3):
              </span>
              <span className="text-[11px] text-teal-600 font-mono">
                {isBlock ? "Chế độ khối: $$...$$" : "Chế độ dòng: $...$"}
              </span>
            </div>
            <div className="p-4 bg-white rounded-xl border border-teal-100 min-h-[52px] flex items-center justify-center overflow-x-auto text-base">
              {latex ? (
                <MathRenderer math={isBlock ? `$$${latex}$$` : `$${latex}$`} className="max-w-full" />
              ) : (
                <span className="text-slate-400 italic text-xs">
                  (Bấm các phím toán học bên dưới để tạo công thức trực quan...)
                </span>
              )}
            </div>
          </div>

          {/* Bottom: 5-Tab Visual Math Keyboard (Exactly matching attached images) */}
          <div className="bg-slate-200/80 rounded-2xl p-3 border border-slate-300 shadow-inner space-y-3">
            {/* Keyboard Tab Switcher */}
            <div className="flex items-center justify-start gap-4 border-b border-slate-300 pb-2 px-1 text-sm overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveTab("123")}
                className={`pb-1 px-3 font-extrabold transition-all relative whitespace-nowrap ${
                  activeTab === "123"
                    ? "text-teal-700 border-b-2 border-teal-600 font-black"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                123
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("f()")}
                className={`pb-1 px-3 font-extrabold transition-all relative italic whitespace-nowrap ${
                  activeTab === "f()"
                    ? "text-teal-700 border-b-2 border-teal-600 font-black"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                f()
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("RELATIONS")}
                className={`pb-1 px-3 font-extrabold transition-all relative whitespace-nowrap ${
                  activeTab === "RELATIONS"
                    ? "text-teal-700 border-b-2 border-teal-600 font-black"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                ∞ ≠ ∈
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("ABC")}
                className={`pb-1 px-3 font-extrabold transition-all relative whitespace-nowrap ${
                  activeTab === "ABC"
                    ? "text-teal-700 border-b-2 border-teal-600 font-black"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                ABC
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("GREEK")}
                className={`pb-1 px-3 font-extrabold transition-all relative whitespace-nowrap ${
                  activeTab === "GREEK"
                    ? "text-teal-700 border-b-2 border-teal-600 font-black"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                αβγ
              </button>
            </div>

            {/* Keyboard Layouts */}
            <div className="min-h-[220px]">
              {/* TAB 1: 123 (Basic Numbers, Operators, Fraction, Powers, Roots, Integrals) */}
              {activeTab === "123" && (
                <div className="grid grid-cols-12 gap-2 sm:gap-2.5">
                  {/* Left Column: Variables & Brackets */}
                  <div className="col-span-3 sm:col-span-2 grid grid-cols-2 gap-1.5">
                    <KeyButton label="x" onClick={() => handleInsertSnippet("x")} italic />
                    <KeyButton label="n" onClick={() => handleInsertSnippet("n")} italic />
                    <KeyButton label="<" onClick={() => handleInsertSnippet("<")} />
                    <KeyButton label=">" onClick={() => handleInsertSnippet(">")} />
                    <KeyButton label="(" onClick={() => handleInsertSnippet("(")} />
                    <KeyButton label=")" onClick={() => handleInsertSnippet(")")} />
                    <KeyButton label="○" onClick={() => handleInsertSnippet("\\circ ")} textClass="text-red-600 text-lg" />
                    <KeyButton label="●" onClick={() => handleInsertSnippet("\\bullet ")} textClass="text-amber-500 text-lg" />
                  </div>

                  {/* Middle Keypad: Numeric & Basic Arithmetic */}
                  <div className="col-span-5 sm:col-span-5 grid grid-cols-4 gap-1.5">
                    <KeyButton label="7" onClick={() => handleInsertSnippet("7")} />
                    <KeyButton label="8" onClick={() => handleInsertSnippet("8")} />
                    <KeyButton label="9" onClick={() => handleInsertSnippet("9")} />
                    <KeyButton label="÷" onClick={() => handleInsertSnippet("\\div ")} keyClass="bg-slate-100" />

                    <KeyButton label="4" onClick={() => handleInsertSnippet("4")} />
                    <KeyButton label="5" onClick={() => handleInsertSnippet("5")} />
                    <KeyButton label="6" onClick={() => handleInsertSnippet("6")} />
                    <KeyButton label="×" onClick={() => handleInsertSnippet("\\times ")} keyClass="bg-slate-100" />

                    <KeyButton label="1" onClick={() => handleInsertSnippet("1")} />
                    <KeyButton label="2" onClick={() => handleInsertSnippet("2")} />
                    <KeyButton label="3" onClick={() => handleInsertSnippet("3")} />
                    <KeyButton label="-" onClick={() => handleInsertSnippet("-")} keyClass="bg-slate-100" />

                    <KeyButton label="0" onClick={() => handleInsertSnippet("0")} />
                    <KeyButton label="." onClick={() => handleInsertSnippet(".")} />
                    <KeyButton label="=" onClick={() => handleInsertSnippet("=")} keyClass="bg-slate-100" />
                    <KeyButton label="+" onClick={() => handleInsertSnippet("+")} keyClass="bg-slate-100" />
                  </div>

                  {/* Right Keypad: Powers, Roots, Fractions, Integrals */}
                  <div className="col-span-4 sm:col-span-5 grid grid-cols-3 gap-1.5">
                    <KeyButton label="e" onClick={() => handleInsertSnippet("e")} italic />
                    <KeyButton label="i" onClick={() => handleInsertSnippet("i")} italic />
                    <KeyButton label="π" onClick={() => handleInsertSnippet("\\pi ")} />

                    <KeyButton label="□²" onClick={() => handleInsertSnippet("^2")} />
                    <KeyButton label="x^□" onClick={() => handleInsertSnippet("x^{#?}")} />
                    <KeyButton label="√□" onClick={() => handleInsertSnippet("\\sqrt{#?}")} />

                    <KeyButton label="∫₀^∞" onClick={() => handleInsertSnippet("\\int_{0}^{\\infty} #? \\, dx")} />
                    <KeyButton label="∀" onClick={() => handleInsertSnippet("\\forall ")} />
                    <KeyButton label="a/b" onClick={() => handleInsertSnippet("\\frac{#?}{#?}")} keyClass="bg-teal-50 border-teal-300 text-teal-800 font-bold" />

                    <KeyButton label="←" onClick={handleCursorLeft} keyClass="bg-slate-300/80" />
                    <KeyButton label="→" onClick={handleCursorRight} keyClass="bg-slate-300/80" />
                    <KeyButton label="⌫" onClick={handleBackspace} keyClass="bg-rose-100 text-rose-700" />
                  </div>
                </div>
              )}

              {/* TAB 2: f() (Functions, Calculus, Advanced Algebra) */}
              {activeTab === "f()" && (
                <div className="grid grid-cols-4 sm:grid-cols-9 gap-1.5">
                  <KeyButton label="sin" onClick={() => handleInsertSnippet("\\sin(#?)")} />
                  <KeyButton label="sin⁻¹" onClick={() => handleInsertSnippet("\\arcsin(#?)")} />
                  <KeyButton label="ln" onClick={() => handleInsertSnippet("\\ln(#?)")} />
                  <KeyButton label="e^□" onClick={() => handleInsertSnippet("e^{#?}")} />
                  <KeyButton label="lcm()" onClick={() => handleInsertSnippet("\\operatorname{lcm}(#?)")} />
                  <KeyButton label="ceil()" onClick={() => handleInsertSnippet("\\lceil #? \\rceil")} />
                  <KeyButton label="lim" onClick={() => handleInsertSnippet("\\lim_{n \\to \\infty} #?")} />
                  <KeyButton label="∫" onClick={() => handleInsertSnippet("\\int #? \\, dx")} />
                  <KeyButton label="abs()" onClick={() => handleInsertSnippet("|#?|")} />

                  <KeyButton label="cos" onClick={() => handleInsertSnippet("\\cos(#?)")} />
                  <KeyButton label="cos⁻¹" onClick={() => handleInsertSnippet("\\arccos(#?)")} />
                  <KeyButton label="log" onClick={() => handleInsertSnippet("\\log(#?)")} />
                  <KeyButton label="10^□" onClick={() => handleInsertSnippet("10^{#?}")} />
                  <KeyButton label="gcd()" onClick={() => handleInsertSnippet("\\gcd(#?)")} />
                  <KeyButton label="floor()" onClick={() => handleInsertSnippet("\\lfloor #? \\rfloor")} />
                  <KeyButton label="∑" onClick={() => handleInsertSnippet("\\sum_{n=0}^{\\infty} #?")} />
                  <KeyButton label="∫₀^∞" onClick={() => handleInsertSnippet("\\int_{0}^{\\infty} #? \\, dx")} />
                  <KeyButton label="sign()" onClick={() => handleInsertSnippet("\\operatorname{sign}(#?)")} />

                  <KeyButton label="tan" onClick={() => handleInsertSnippet("\\tan(#?)")} />
                  <KeyButton label="tan⁻¹" onClick={() => handleInsertSnippet("\\arctan(#?)")} />
                  <KeyButton label="log_a" onClick={() => handleInsertSnippet("\\log_{#?}(#?)")} />
                  <KeyButton label="ⁿ√□" onClick={() => handleInsertSnippet("\\sqrt[#?]{#?}")} />
                  <KeyButton label="mod" onClick={() => handleInsertSnippet("\\pmod{#?}")} />
                  <KeyButton label="round()" onClick={() => handleInsertSnippet("\\operatorname{round}(#?)")} />
                  <KeyButton label="∏" onClick={() => handleInsertSnippet("\\prod_{n=0}^{\\infty} #?")} />
                  <KeyButton label="d/dx" onClick={() => handleInsertSnippet("\\frac{d#?}{dx}")} />
                  <KeyButton label="a/b" onClick={() => handleInsertSnippet("\\frac{#?}{#?}")} keyClass="bg-teal-50 border-teal-300 font-bold" />

                  <KeyButton label="(" onClick={() => handleInsertSnippet("(")} />
                  <KeyButton label=")" onClick={() => handleInsertSnippet(")")} />
                  <KeyButton label="x^□" onClick={() => handleInsertSnippet("x^{#?}")} />
                  <KeyButton label="x_□" onClick={() => handleInsertSnippet("x_{#?}")} />
                  <KeyButton label="∞" onClick={() => handleInsertSnippet("\\infty ")} />
                  <KeyButton label="," onClick={() => handleInsertSnippet(", ")} />
                  <KeyButton label="←" onClick={handleCursorLeft} keyClass="bg-slate-300/80" />
                  <KeyButton label="→" onClick={handleCursorRight} keyClass="bg-slate-300/80" />
                  <KeyButton label="⌫" onClick={handleBackspace} keyClass="bg-rose-100 text-rose-700" />
                </div>
              )}

              {/* TAB 3: ∞ ≠ ∈ (Relations, Sets, Geometry, Matrices, Systems) */}
              {activeTab === "RELATIONS" && (
                <div className="grid grid-cols-4 sm:grid-cols-9 gap-1.5">
                  <KeyButton label="=" onClick={() => handleInsertSnippet("=")} />
                  <KeyButton label="≠" onClick={() => handleInsertSnippet("\\ne ")} />
                  <KeyButton label="≈" onClick={() => handleInsertSnippet("\\approx ")} />
                  <KeyButton label="±" onClick={() => handleInsertSnippet("\\pm ")} />
                  <KeyButton label="<" onClick={() => handleInsertSnippet("<")} />
                  <KeyButton label=">" onClick={() => handleInsertSnippet(">")} />
                  <KeyButton label="≤" onClick={() => handleInsertSnippet("\\le ")} />
                  <KeyButton label="≥" onClick={() => handleInsertSnippet("\\ge ")} />
                  <KeyButton label="∞" onClick={() => handleInsertSnippet("\\infty ")} />

                  <KeyButton label="∈" onClick={() => handleInsertSnippet("\\in ")} />
                  <KeyButton label="∉" onClick={() => handleInsertSnippet("\\notin ")} />
                  <KeyButton label="⊂" onClick={() => handleInsertSnippet("\\subset ")} />
                  <KeyButton label="⊃" onClick={() => handleInsertSnippet("\\supset ")} />
                  <KeyButton label="⊆" onClick={() => handleInsertSnippet("\\subseteq ")} />
                  <KeyButton label="⊇" onClick={() => handleInsertSnippet("\\supseteq ")} />
                  <KeyButton label="∪" onClick={() => handleInsertSnippet("\\cup ")} />
                  <KeyButton label="∩" onClick={() => handleInsertSnippet("\\cap ")} />
                  <KeyButton label="∅" onClick={() => handleInsertSnippet("\\varnothing ")} />

                  <KeyButton label="v⃗" onClick={() => handleInsertSnippet("\\vec{#?}")} />
                  <KeyButton label="AB‾" onClick={() => handleInsertSnippet("\\overline{#?}")} />
                  <KeyButton label="x̲" onClick={() => handleInsertSnippet("\\underline{#?}")} />
                  <KeyButton label="∠ABC" onClick={() => handleInsertSnippet("\\widehat{#?}")} />
                  <KeyButton label="⊥" onClick={() => handleInsertSnippet("\\perp ")} />
                  <KeyButton label="∥" onClick={() => handleInsertSnippet("\\parallel ")} />
                  <KeyButton label="∇" onClick={() => handleInsertSnippet("\\nabla ")} />
                  <KeyButton label="∂" onClick={() => handleInsertSnippet("\\partial ")} />
                  <KeyButton label="!" onClick={() => handleInsertSnippet("!")} />

                  <KeyButton label="ℝ" onClick={() => handleInsertSnippet("\\mathbb{R}")} />
                  <KeyButton label="ℤ" onClick={() => handleInsertSnippet("\\mathbb{Z}")} />
                  <KeyButton label="ℕ" onClick={() => handleInsertSnippet("\\mathbb{N}")} />
                  <KeyButton label="ℚ" onClick={() => handleInsertSnippet("\\mathbb{Q}")} />
                  <KeyButton label="ℂ" onClick={() => handleInsertSnippet("\\mathbb{C}")} />
                  <KeyButton label="[a; b]" onClick={() => handleInsertSnippet("[#?; #?]")} />
                  <KeyButton label="(a; b)" onClick={() => handleInsertSnippet("(#?; #?)")} />
                  <KeyButton label="{ Hệ }" onClick={() => handleInsertSnippet("\\begin{cases} #? \\\\ #? \\end{cases}")} keyClass="bg-teal-50 border-teal-300 font-bold" />
                  <KeyButton label="[ Ma trận ]" onClick={() => handleInsertSnippet("\\begin{pmatrix} #? & #? \\\\ #? & #? \\end{pmatrix}")} keyClass="bg-teal-50 border-teal-300 font-bold" />
                </div>
              )}

              {/* TAB 4: ABC (Latin Alphabet & Common Variables) */}
              {activeTab === "ABC" && (
                <div className="space-y-2.5">
                  {/* Shortcut Variables Bar */}
                  <div className="p-2 bg-white rounded-xl border border-slate-300 flex items-center justify-between gap-1 overflow-x-auto text-xs">
                    <span className="text-[11px] font-bold text-slate-500 uppercase shrink-0">Biến hay dùng:</span>
                    {["x", "y", "z", "t", "a", "b", "c", "m", "n", "p", "q", "u", "v"].map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => handleInsertSnippet(isCaps ? v.toUpperCase() : v)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-teal-50 hover:text-teal-700 font-serif font-bold italic text-sm border border-slate-200 transition-colors"
                      >
                        {isCaps ? v.toUpperCase() : v}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setIsCaps(!isCaps)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors ${
                        isCaps ? "bg-teal-600 text-white border-teal-700" : "bg-slate-200 text-slate-700 border-slate-300"
                      }`}
                    >
                      Caps
                    </button>
                  </div>

                  {/* Standard Alphabet Keys */}
                  <div className="grid grid-cols-7 sm:grid-cols-13 gap-1.5">
                    {"abcdefghijklmnopqrstuvwxyz".split("").map((ch) => {
                      const letter = isCaps ? ch.toUpperCase() : ch;
                      return (
                        <KeyButton
                          key={ch}
                          label={letter}
                          onClick={() => handleInsertSnippet(letter)}
                          italic
                        />
                      );
                    })}
                  </div>

                  {/* Space and punctuation row */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleInsertSnippet("\\, ")}
                      className="flex-1 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 font-bold text-xs text-slate-700 shadow-2xs"
                    >
                      Dấu cách (Space)
                    </button>
                    <KeyButton label=";" onClick={() => handleInsertSnippet("; ")} />
                    <KeyButton label="," onClick={() => handleInsertSnippet(", ")} />
                    <KeyButton label=":" onClick={() => handleInsertSnippet(": ")} />
                    <KeyButton label="." onClick={() => handleInsertSnippet(".")} />
                  </div>
                </div>
              )}

              {/* TAB 5: αβγ (Greek Alphabet) */}
              {activeTab === "GREEK" && (
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
                  <KeyButton label="α (alpha)" onClick={() => handleInsertSnippet("\\alpha ")} />
                  <KeyButton label="β (beta)" onClick={() => handleInsertSnippet("\\beta ")} />
                  <KeyButton label="γ (gamma)" onClick={() => handleInsertSnippet("\\gamma ")} />
                  <KeyButton label="δ (delta)" onClick={() => handleInsertSnippet("\\delta ")} />
                  <KeyButton label="ε (epsilon)" onClick={() => handleInsertSnippet("\\varepsilon ")} />
                  <KeyButton label="θ (theta)" onClick={() => handleInsertSnippet("\\theta ")} />
                  <KeyButton label="λ (lambda)" onClick={() => handleInsertSnippet("\\lambda ")} />
                  <KeyButton label="μ (mu)" onClick={() => handleInsertSnippet("\\mu ")} />

                  <KeyButton label="π (pi)" onClick={() => handleInsertSnippet("\\pi ")} />
                  <KeyButton label="ρ (rho)" onClick={() => handleInsertSnippet("\\rho ")} />
                  <KeyButton label="σ (sigma)" onClick={() => handleInsertSnippet("\\sigma ")} />
                  <KeyButton label="τ (tau)" onClick={() => handleInsertSnippet("\\tau ")} />
                  <KeyButton label="φ (phi)" onClick={() => handleInsertSnippet("\\varphi ")} />
                  <KeyButton label="ω (omega)" onClick={() => handleInsertSnippet("\\omega ")} />
                  <KeyButton label="η (eta)" onClick={() => handleInsertSnippet("\\eta ")} />
                  <KeyButton label="ζ (zeta)" onClick={() => handleInsertSnippet("\\zeta ")} />

                  <KeyButton label="Δ (Delta)" onClick={() => handleInsertSnippet("\\Delta ")} keyClass="bg-teal-50/70 border-teal-200 font-bold" />
                  <KeyButton label="Σ (Sigma)" onClick={() => handleInsertSnippet("\\Sigma ")} keyClass="bg-teal-50/70 border-teal-200 font-bold" />
                  <KeyButton label="Π (Pi)" onClick={() => handleInsertSnippet("\\Pi ")} keyClass="bg-teal-50/70 border-teal-200 font-bold" />
                  <KeyButton label="Ω (Omega)" onClick={() => handleInsertSnippet("\\Omega ")} keyClass="bg-teal-50/70 border-teal-200 font-bold" />
                  <KeyButton label="Φ (Phi)" onClick={() => handleInsertSnippet("\\Phi ")} keyClass="bg-teal-50/70 border-teal-200 font-bold" />
                  <KeyButton label="Ψ (Psi)" onClick={() => handleInsertSnippet("\\Psi ")} keyClass="bg-teal-50/70 border-teal-200 font-bold" />
                  <KeyButton label="Γ (Gamma)" onClick={() => handleInsertSnippet("\\Gamma ")} keyClass="bg-teal-50/70 border-teal-200 font-bold" />
                  <KeyButton label="Θ (Theta)" onClick={() => handleInsertSnippet("\\Theta ")} keyClass="bg-teal-50/70 border-teal-200 font-bold" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="px-6 py-4 bg-white border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500 hidden sm:block">
            Mẹo: Nhấn các phím công thức để chèn tự động, không cần nhớ cú pháp LaTeX!
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold text-xs transition-colors"
            >
              Hủy bỏ
            </button>

            <button
              type="button"
              onClick={handleCopyLatex}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-teal-800 font-bold text-xs transition-colors"
            >
              {isCopied ? "Đã chép LaTeX!" : "Sao chép LaTeX"}
            </button>

            <button
              type="button"
              onClick={handleConfirmInsert}
              className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-black text-sm shadow-md hover:shadow-lg active:scale-98 transition-all flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>Chèn công thức</span>
            </button>

          </div>
        </div>
      </div>
    </div>
  );
};

// Subcomponent: Stylized Visual Key Button
interface KeyButtonProps {
  label: string;
  onClick: () => void;
  italic?: boolean;
  keyClass?: string;
  textClass?: string;
}

const KeyButton: React.FC<KeyButtonProps> = ({
  label,
  onClick,
  italic = false,
  keyClass = "bg-white",
  textClass = "text-slate-800",
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-11 sm:h-12 rounded-xl border border-slate-300 hover:border-teal-500 shadow-2xs hover:shadow-xs active:scale-95 transition-all flex items-center justify-center select-none ${keyClass}`}
    >
      <span
        className={`font-serif text-sm sm:text-base leading-none ${
          italic ? "italic" : ""
        } ${textClass}`}
      >
        {label}
      </span>
    </button>
  );
};
