import React, { useState } from 'react';
import { Calculator, X, Sparkles, RefreshCw, Equal, CheckCircle2 } from 'lucide-react';

export const VirtualCasioCalculator: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [calcMode, setCalcMode] = useState<'comp' | 'eq_deg2' | 'eq_deg3' | 'derivative'>('comp');
  const [display, setDisplay] = useState<string>('0');
  const [result, setResult] = useState<string>('');

  // Equation solver coefficients
  const [coeffA, setCoeffA] = useState<string>('1');
  const [coeffB, setCoeffB] = useState<string>('-3');
  const [coeffC, setCoeffC] = useState<string>('2');
  const [coeffD, setCoeffD] = useState<string>('0');
  const [eqRoots, setEqRoots] = useState<string[]>([]);

  // Derivative at point
  const [derivExpr, setDerivExpr] = useState<string>('x^3 - 3*x + 2');
  const [derivX0, setDerivX0] = useState<string>('2');
  const [derivResult, setDerivResult] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleBtnClick = (val: string) => {
    if (display === '0' || display === 'Error') {
      setDisplay(val);
    } else {
      setDisplay((prev) => prev + val);
    }
  };

  const handleClear = () => {
    setDisplay('0');
    setResult('');
  };

  const handleBackspace = () => {
    if (display.length <= 1) {
      setDisplay('0');
    } else {
      setDisplay((prev) => prev.slice(0, -1));
    }
  };

  const handleEvaluate = () => {
    try {
      // Safe math evaluation
      let sanitized = display
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/π/g, 'Math.PI')
        .replace(/e/g, 'Math.E')
        .replace(/sin\(/g, 'Math.sin(')
        .replace(/cos\(/g, 'Math.cos(')
        .replace(/tan\(/g, 'Math.tan(')
        .replace(/sqrt\(/g, 'Math.sqrt(')
        .replace(/ln\(/g, 'Math.log(')
        .replace(/\^/g, '**');

      // eslint-disable-next-line no-eval
      const res = Function(`'use strict'; return (${sanitized})`)();
      setResult(String(Math.round(res * 100000) / 100000));
    } catch {
      setResult('Lỗi cú pháp');
    }
  };

  // Solve Quadratic Equation ax^2 + bx + c = 0
  const solveQuadratic = () => {
    const a = parseFloat(coeffA);
    const b = parseFloat(coeffB);
    const c = parseFloat(coeffC);

    if (isNaN(a) || isNaN(b) || isNaN(c) || a === 0) {
      setEqRoots(['Hệ số a phải khác 0']);
      return;
    }

    const delta = b * b - 4 * a * c;
    if (delta > 0) {
      const x1 = (-b + Math.sqrt(delta)) / (2 * a);
      const x2 = (-b - Math.sqrt(delta)) / (2 * a);
      setEqRoots([`x₁ = ${x1.toFixed(4)}`, `x₂ = ${x2.toFixed(4)}`]);
    } else if (delta === 0) {
      const x = -b / (2 * a);
      setEqRoots([`Nghiệm kép x = ${x.toFixed(4)}`]);
    } else {
      setEqRoots(['Phương trình vô nghiệm thực']);
    }
  };

  // Calculate Numerical Derivative at x0
  const calculateDerivative = () => {
    const x0 = parseFloat(derivX0);
    if (isNaN(x0)) return;
    const h = 0.0001;

    try {
      const evalAt = (xVal: number) => {
        const sanitized = derivExpr
          .replace(/x/g, `(${xVal})`)
          .replace(/\^/g, '**')
          .replace(/sin/g, 'Math.sin')
          .replace(/cos/g, 'Math.cos');
        // eslint-disable-next-line no-eval
        return Function(`'use strict'; return (${sanitized})`)();
      };

      const dVal = (evalAt(x0 + h) - evalAt(x0 - h)) / (2 * h);
      setDerivResult(`f'(${x0}) = ${Math.round(dVal * 1000) / 1000}`);
    } catch {
      setDerivResult('Lỗi biểu thức');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-slate-900 text-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border-2 border-slate-700 space-y-4">
        {/* Casio Brand Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center space-x-2">
            <span className="font-extrabold text-sm tracking-wider text-slate-200 font-mono">CASIO</span>
            <span className="text-[10px] bg-slate-800 text-teal-400 font-bold px-2 py-0.5 rounded-md border border-slate-700">
              fx-580VN X
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Selector */}
        <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl text-[11px] font-bold text-center">
          <button
            onClick={() => setCalcMode('comp')}
            className={`py-1 rounded-lg transition ${calcMode === 'comp' ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            Tính Toán
          </button>
          <button
            onClick={() => setCalcMode('eq_deg2')}
            className={`py-1 rounded-lg transition ${calcMode === 'eq_deg2' ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            Giải PT
          </button>
          <button
            onClick={() => setCalcMode('derivative')}
            className={`py-1 rounded-lg transition ${calcMode === 'derivative' ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            Đạo Hàm d/dx
          </button>
        </div>

        {/* COMP MODE: LCD Screen & Keypad */}
        {calcMode === 'comp' && (
          <div className="space-y-4">
            {/* LCD Screen */}
            <div className="bg-[#A7C5BD] text-slate-900 p-3 rounded-2xl border-2 border-slate-800 font-mono text-right shadow-inner min-h-[75px] flex flex-col justify-between">
              <div className="text-xs text-slate-700 overflow-x-auto truncate">{display}</div>
              <div className="text-xl font-bold text-slate-950 truncate">{result || '= 0'}</div>
            </div>

            {/* Scientific Keypad */}
            <div className="grid grid-cols-4 gap-1.5 text-xs font-mono font-bold">
              <button onClick={() => handleBtnClick('sin(')} className="p-2.5 bg-slate-800 hover:bg-slate-700 text-teal-300 rounded-xl">sin</button>
              <button onClick={() => handleBtnClick('cos(')} className="p-2.5 bg-slate-800 hover:bg-slate-700 text-teal-300 rounded-xl">cos</button>
              <button onClick={() => handleBtnClick('tan(')} className="p-2.5 bg-slate-800 hover:bg-slate-700 text-teal-300 rounded-xl">tan</button>
              <button onClick={() => handleBtnClick('^')} className="p-2.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-xl">xʸ</button>

              <button onClick={() => handleBtnClick('sqrt(')} className="p-2.5 bg-slate-800 hover:bg-slate-700 text-teal-300 rounded-xl">√</button>
              <button onClick={() => handleBtnClick('(')} className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl">(</button>
              <button onClick={() => handleBtnClick(')')} className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl">)</button>
              <button onClick={handleBackspace} className="p-2.5 bg-rose-900/80 hover:bg-rose-800 text-rose-200 rounded-xl">DEL</button>

              <button onClick={() => handleBtnClick('7')} className="p-3 bg-slate-700 hover:bg-slate-600 rounded-xl">7</button>
              <button onClick={() => handleBtnClick('8')} className="p-3 bg-slate-700 hover:bg-slate-600 rounded-xl">8</button>
              <button onClick={() => handleBtnClick('9')} className="p-3 bg-slate-700 hover:bg-slate-600 rounded-xl">9</button>
              <button onClick={handleClear} className="p-3 bg-rose-700 hover:bg-rose-600 text-white rounded-xl">AC</button>

              <button onClick={() => handleBtnClick('4')} className="p-3 bg-slate-700 hover:bg-slate-600 rounded-xl">4</button>
              <button onClick={() => handleBtnClick('5')} className="p-3 bg-slate-700 hover:bg-slate-600 rounded-xl">5</button>
              <button onClick={() => handleBtnClick('6')} className="p-3 bg-slate-700 hover:bg-slate-600 rounded-xl">6</button>
              <button onClick={() => handleBtnClick('×')} className="p-3 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-xl">×</button>

              <button onClick={() => handleBtnClick('1')} className="p-3 bg-slate-700 hover:bg-slate-600 rounded-xl">1</button>
              <button onClick={() => handleBtnClick('2')} className="p-3 bg-slate-700 hover:bg-slate-600 rounded-xl">2</button>
              <button onClick={() => handleBtnClick('3')} className="p-3 bg-slate-700 hover:bg-slate-600 rounded-xl">3</button>
              <button onClick={() => handleBtnClick('-')} className="p-3 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-xl">-</button>

              <button onClick={() => handleBtnClick('0')} className="p-3 bg-slate-700 hover:bg-slate-600 rounded-xl">0</button>
              <button onClick={() => handleBtnClick('.')} className="p-3 bg-slate-700 hover:bg-slate-600 rounded-xl">.</button>
              <button onClick={() => handleBtnClick('+')} className="p-3 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-xl">+</button>
              <button onClick={handleEvaluate} className="p-3 bg-teal-600 hover:bg-teal-500 text-white rounded-xl shadow-md">=</button>
            </div>
          </div>
        )}

        {/* EQUATION SOLVER MODE */}
        {calcMode === 'eq_deg2' && (
          <div className="space-y-4 text-xs">
            <div className="font-bold text-slate-300 text-center">
              Giải Phương Trình Bậc 2: $ax^2 + bx + c = 0$
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] text-slate-400">Hệ số a:</label>
                <input
                  type="number"
                  value={coeffA}
                  onChange={(e) => setCoeffA(e.target.value)}
                  className="w-full p-2 bg-slate-800 border border-slate-700 rounded-xl font-mono text-center"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400">Hệ số b:</label>
                <input
                  type="number"
                  value={coeffB}
                  onChange={(e) => setCoeffB(e.target.value)}
                  className="w-full p-2 bg-slate-800 border border-slate-700 rounded-xl font-mono text-center"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400">Hệ số c:</label>
                <input
                  type="number"
                  value={coeffC}
                  onChange={(e) => setCoeffC(e.target.value)}
                  className="w-full p-2 bg-slate-800 border border-slate-700 rounded-xl font-mono text-center"
                />
              </div>
            </div>

            <button
              onClick={solveQuadratic}
              className="w-full py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl shadow"
            >
              Tìm Nghiệm Phương Trình
            </button>

            {eqRoots.length > 0 && (
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 font-mono text-center space-y-1">
                {eqRoots.map((r, i) => (
                  <div key={i} className="text-teal-300 font-bold">{r}</div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* DERIVATIVE MODE */}
        {calcMode === 'derivative' && (
          <div className="space-y-4 text-xs">
            <div className="font-bold text-slate-300 text-center">
              Tính Đạo Hàm Tại Điểm: f&apos;(x₀)
            </div>
            <div className="space-y-2">
              <div>
                <label className="text-[10px] text-slate-400">Hàm số f(x):</label>
                <input
                  type="text"
                  value={derivExpr}
                  onChange={(e) => setDerivExpr(e.target.value)}
                  className="w-full p-2 bg-slate-800 border border-slate-700 rounded-xl font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400">Tại điểm x₀:</label>
                <input
                  type="number"
                  value={derivX0}
                  onChange={(e) => setDerivX0(e.target.value)}
                  className="w-full p-2 bg-slate-800 border border-slate-700 rounded-xl font-mono text-center"
                />
              </div>
            </div>

            <button
              onClick={calculateDerivative}
              className="w-full py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl shadow"
            >
              Tính Đạo Hàm f'(x₀)
            </button>

            {derivResult && (
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 font-mono text-center text-teal-300 font-bold text-sm">
                {derivResult}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
