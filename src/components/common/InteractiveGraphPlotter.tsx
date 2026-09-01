import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Sliders, RefreshCw, ZoomIn, ZoomOut, CheckCircle2, TrendingUp, Info } from 'lucide-react';

export type FunctionType = 'cubic' | 'fractional_1_1' | 'fractional_2_1' | 'sine' | 'exponential';

export const InteractiveGraphPlotter: React.FC = () => {
  const [funcType, setFuncType] = useState<FunctionType>('cubic');
  const [a, setA] = useState<number>(1);
  const [b, setB] = useState<number>(-3);
  const [c, setC] = useState<number>(0);
  const [d, setD] = useState<number>(2);
  const [m, setM] = useState<number>(0); // parameter m for intersection / parameter exercises
  const [zoom, setZoom] = useState<number>(35); // pixels per unit
  const [showTangent, setShowTangent] = useState<boolean>(true);
  const [showAsymptotes, setShowAsymptotes] = useState<boolean>(true);
  const [showTableOfSigns, setShowTableOfSigns] = useState<boolean>(true);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Evaluate f(x)
  const evaluate = (x: number): number | null => {
    try {
      if (funcType === 'cubic') {
        // y = a*x^3 + b*x^2 + c*x + d + m
        return a * Math.pow(x, 3) + b * Math.pow(x, 2) + c * x + d + m;
      }
      if (funcType === 'fractional_1_1') {
        // y = (a*x + b) / (c*x + d)
        const denom = c * x + d;
        if (Math.abs(denom) < 0.001) return null;
        return (a * x + b) / denom + m;
      }
      if (funcType === 'fractional_2_1') {
        // y = (a*x^2 + b*x + c) / (x + d)
        const denom = x + d;
        if (Math.abs(denom) < 0.001) return null;
        return (a * Math.pow(x, 2) + b * x + c) / denom + m;
      }
      if (funcType === 'sine') {
        return a * Math.sin(b * x + c) + d + m;
      }
      if (funcType === 'exponential') {
        return a * Math.exp(b * x) + c + m;
      }
    } catch {
      return null;
    }
    return 0;
  };

  // Render Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const originX = width / 2;
    const originY = height / 2;

    // Clear
    ctx.fillStyle = '#F8FAFC';
    ctx.fillRect(0, 0, width, height);

    // Draw Grid lines
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#E2E8F0';

    const step = zoom;
    for (let x = originX % step; x < width; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = originY % step; y < height; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw Main Axes Ox, Oy
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#64748B';

    // Ox
    ctx.beginPath();
    ctx.moveTo(0, originY);
    ctx.lineTo(width, originY);
    ctx.stroke();

    // Oy
    ctx.beginPath();
    ctx.moveTo(originX, 0);
    ctx.lineTo(originX, height);
    ctx.stroke();

    // Draw Axis Arrows & Labels
    ctx.fillStyle = '#475569';
    ctx.font = '11px "JetBrains Mono", monospace';
    ctx.fillText('x', width - 15, originY - 8);
    ctx.fillText('y', originX + 8, 15);
    ctx.fillText('O', originX - 12, originY + 14);

    // Coordinate Numbers on Axes
    const xMin = Math.floor(-originX / zoom);
    const xMax = Math.ceil((width - originX) / zoom);
    for (let i = xMin; i <= xMax; i++) {
      if (i === 0) continue;
      const px = originX + i * zoom;
      ctx.beginPath();
      ctx.moveTo(px, originY - 3);
      ctx.lineTo(px, originY + 3);
      ctx.stroke();
      if (zoom >= 25 || i % 2 === 0) {
        ctx.fillText(`${i}`, px - 4, originY + 14);
      }
    }

    // Draw Asymptotes if enabled
    if (showAsymptotes) {
      ctx.setLineDash([5, 5]);
      ctx.lineWidth = 1.5;

      if (funcType === 'fractional_1_1' && c !== 0) {
        // Vertical Asymptote x = -d/c
        const vertX = -d / c;
        const pVertX = originX + vertX * zoom;
        ctx.strokeStyle = '#EF4444'; // Red
        ctx.beginPath();
        ctx.moveTo(pVertX, 0);
        ctx.lineTo(pVertX, height);
        ctx.stroke();

        // Horizontal Asymptote y = a/c
        const horizY = a / c;
        const pHorizY = originY - horizY * zoom;
        ctx.strokeStyle = '#3B82F6'; // Blue
        ctx.beginPath();
        ctx.moveTo(0, pHorizY);
        ctx.lineTo(width, pHorizY);
        ctx.stroke();
      }

      if (funcType === 'fractional_2_1') {
        // Vertical Asymptote x = -d
        const vertX = -d;
        const pVertX = originX + vertX * zoom;
        ctx.strokeStyle = '#EF4444';
        ctx.beginPath();
        ctx.moveTo(pVertX, 0);
        ctx.lineTo(pVertX, height);
        ctx.stroke();

        // Slant Asymptote: y = a*x + (b - a*d)
        const slantSlope = a;
        const slantIntercept = b - a * d;
        ctx.strokeStyle = '#8B5CF6'; // Purple
        ctx.beginPath();
        const startX = -originX / zoom;
        const endX = (width - originX) / zoom;
        const startY = slantSlope * startX + slantIntercept;
        const endY = slantSlope * endX + slantIntercept;
        ctx.moveTo(originX + startX * zoom, originY - startY * zoom);
        ctx.lineTo(originX + endX * zoom, originY - endY * zoom);
        ctx.stroke();
      }
      ctx.setLineDash([]);
    }

    // Draw Parameter Line y = m if m != 0
    if (m !== 0) {
      ctx.strokeStyle = '#F59E0B'; // Amber
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      const pmY = originY - m * zoom;
      ctx.beginPath();
      ctx.moveTo(0, pmY);
      ctx.lineTo(width, pmY);
      ctx.stroke();
      ctx.fillStyle = '#D97706';
      ctx.fillText(`đường thẳng y = ${m.toFixed(1)}`, 20, pmY - 6);
      ctx.setLineDash([]);
    }

    // Draw Main Function Curve f(x)
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#0F766E'; // Deep Teal

    ctx.beginPath();
    let isDrawing = false;

    for (let px = 0; px <= width; px += 1) {
      const mathX = (px - originX) / zoom;
      const mathY = evaluate(mathX);

      if (mathY === null || isNaN(mathY) || Math.abs(mathY) > 100) {
        isDrawing = false;
        continue;
      }

      const py = originY - mathY * zoom;

      if (!isDrawing) {
        ctx.moveTo(px, py);
        isDrawing = true;
      } else {
        // Prevent drawing lines across vertical asymptotes
        if (Math.abs(py - (originY - (evaluate((px - 1 - originX) / zoom) || 0) * zoom)) > height * 0.8) {
          ctx.moveTo(px, py);
        } else {
          ctx.lineTo(px, py);
        }
      }
    }
    ctx.stroke();

    // Critical Points (Max, Min) for Cubic Function
    if (funcType === 'cubic' && a !== 0) {
      // y' = 3ax^2 + 2bx + c = 0
      const delta = 4 * b * b - 12 * a * c;
      if (delta > 0) {
        const x1 = (-2 * b + Math.sqrt(delta)) / (6 * a);
        const x2 = (-2 * b - Math.sqrt(delta)) / (6 * a);
        const y1 = evaluate(x1);
        const y2 = evaluate(x2);

        [
          { x: x1, y: y1, label: a > 0 ? 'Cực tiểu' : 'Cực đại' },
          { x: x2, y: y2, label: a > 0 ? 'Cực đại' : 'Cực tiểu' },
        ].forEach((pt) => {
          if (pt.y !== null) {
            const px = originX + pt.x * zoom;
            const py = originY - pt.y * zoom;
            ctx.fillStyle = '#059669';
            ctx.beginPath();
            ctx.arc(px, py, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 1.5;
            ctx.stroke();
            ctx.fillStyle = '#0F766E';
            ctx.fillText(`(${pt.x.toFixed(2)}; ${pt.y.toFixed(2)})`, px + 8, py - 6);
          }
        });
      }
    }
  }, [funcType, a, b, c, d, m, zoom, showAsymptotes]);

  const getEquationLatex = () => {
    if (funcType === 'cubic') return `y = ${a}x^3 + (${b})x^2 + (${c})x + (${d})`;
    if (funcType === 'fractional_1_1') return `y = \\frac{${a}x + (${b})}{${c}x + (${d})}`;
    if (funcType === 'fractional_2_1') return `y = \\frac{${a}x^2 + (${b})x + (${c})}{x + (${d})}`;
    if (funcType === 'sine') return `y = ${a}\\sin(${b}x + ${c}) + ${d}`;
    return `y = ${a}e^{${b}x} + ${c}`;
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center space-x-2 text-teal-800 text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4 text-teal-600" />
            <span>Phòng Thí Nghiệm Giải Tích 2D Tương Tác</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">
            Khảo Sát Hàm Số &amp; Tương Giao Đồ Thị Trực Quan
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Thay đổi tham số $a, b, c, d, m$ để quan sát hình dạng đồ thị, cực trị và tiệm cận theo thời gian thực.
          </p>
        </div>

        {/* Function Type Selector */}
        <div className="flex items-center bg-slate-100 p-1 rounded-2xl flex-shrink-0 text-xs font-bold">
          <button
            onClick={() => {
              setFuncType('cubic');
              setA(1);
              setB(-3);
              setC(0);
              setD(2);
            }}
            className={`px-3 py-1.5 rounded-xl transition ${
              funcType === 'cubic' ? 'bg-white text-teal-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Hàm Bậc 3
          </button>
          <button
            onClick={() => {
              setFuncType('fractional_1_1');
              setA(2);
              setB(-1);
              setC(1);
              setD(1);
            }}
            className={`px-3 py-1.5 rounded-xl transition ${
              funcType === 'fractional_1_1' ? 'bg-white text-teal-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Phân thức 1/1
          </button>
          <button
            onClick={() => {
              setFuncType('fractional_2_1');
              setA(1);
              setB(-1);
              setC(1);
              setD(-1);
            }}
            className={`px-3 py-1.5 rounded-xl transition ${
              funcType === 'fractional_2_1' ? 'bg-white text-teal-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Phân thức 2/1
          </button>
        </div>
      </div>

      {/* Main Plot Area & Controls Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 8 Cols: Canvas Plotter */}
        <div className="lg:col-span-8 space-y-3">
          <div className="relative bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden shadow-inner flex items-center justify-center">
            <canvas
              ref={canvasRef}
              width={720}
              height={460}
              className="w-full h-auto max-h-[460px] cursor-crosshair"
            />

            {/* Zoom Controls */}
            <div className="absolute bottom-3 right-3 flex items-center bg-white/90 backdrop-blur-xs border border-slate-200 rounded-xl shadow-md p-1 space-x-1">
              <button
                onClick={() => setZoom((z) => Math.min(70, z + 5))}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-700"
                title="Phóng to"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => setZoom((z) => Math.max(15, z - 5))}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-700"
                title="Thu nhỏ"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={() => setZoom(35)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-700 text-xs font-mono"
                title="Đặt lại zoom mặc định"
              >
                1:1
              </button>
            </div>
          </div>

          {/* Current Equation & Properties Badge */}
          <div className="p-3.5 bg-teal-50 border border-teal-200 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-teal-900">Hàm số đang vẽ:</span>
              <span className="font-mono font-extrabold text-teal-950 bg-white px-2.5 py-1 rounded-lg border border-teal-300">
                {getEquationLatex()}
              </span>
            </div>

            <div className="flex items-center space-x-3 text-[11px] text-slate-600">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-600" /> Đồ thị $f(x)$
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> TC Đứng
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> TC Ngang
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> TC Xiên
              </span>
            </div>
          </div>
        </div>

        {/* Right 4 Cols: Parameter Sliders & Math Analysis */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-teal-600" /> Tham số đồ thị:
              </h3>
              <button
                onClick={() => {
                  setA(1);
                  setB(-3);
                  setC(0);
                  setD(2);
                  setM(0);
                }}
                className="text-[11px] text-teal-700 hover:text-teal-900 font-semibold"
              >
                Mặc định
              </button>
            </div>

            {/* Slider a */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold text-slate-700">
                <span>Hệ số a:</span>
                <span className="font-mono text-teal-700">{a}</span>
              </div>
              <input
                type="range"
                min="-4"
                max="4"
                step="0.5"
                value={a}
                onChange={(e) => setA(parseFloat(e.target.value))}
                className="w-full accent-teal-600 cursor-pointer"
              />
            </div>

            {/* Slider b */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold text-slate-700">
                <span>Hệ số b:</span>
                <span className="font-mono text-teal-700">{b}</span>
              </div>
              <input
                type="range"
                min="-6"
                max="6"
                step="0.5"
                value={b}
                onChange={(e) => setB(parseFloat(e.target.value))}
                className="w-full accent-teal-600 cursor-pointer"
              />
            </div>

            {/* Slider c */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold text-slate-700">
                <span>Hệ số c:</span>
                <span className="font-mono text-teal-700">{c}</span>
              </div>
              <input
                type="range"
                min="-6"
                max="6"
                step="0.5"
                value={c}
                onChange={(e) => setC(parseFloat(e.target.value))}
                className="w-full accent-teal-600 cursor-pointer"
              />
            </div>

            {/* Slider d */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold text-slate-700">
                <span>Hệ số d:</span>
                <span className="font-mono text-teal-700">{d}</span>
              </div>
              <input
                type="range"
                min="-6"
                max="6"
                step="0.5"
                value={d}
                onChange={(e) => setD(parseFloat(e.target.value))}
                className="w-full accent-teal-600 cursor-pointer"
              />
            </div>

            {/* Slider Tham số m (Bài toán tương giao) */}
            <div className="space-y-1 pt-2 border-t border-slate-200">
              <div className="flex justify-between text-xs font-bold text-amber-900">
                <span>Tham số m (Đường y = m):</span>
                <span className="font-mono text-amber-700">{m}</span>
              </div>
              <input
                type="range"
                min="-8"
                max="8"
                step="0.5"
                value={m}
                onChange={(e) => setM(parseFloat(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Theoretical Summary Note */}
          <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl text-xs space-y-2">
            <h4 className="font-bold text-emerald-950 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              Đặc trưng hình học:
            </h4>
            {funcType === 'cubic' && (
              <p className="text-emerald-900 leading-relaxed text-[11px]">
                Hàm bậc 3 có đồ thị nhận <strong>Điểm uốn $I(-\frac{b}{3a}; f(-\frac{b}{3a}))$</strong> làm tâm đối xứng. Khi $a &gt; 0$, nhánh ngoài cùng bên phải đi lên.
              </p>
            )}
            {funcType === 'fractional_1_1' && (
              <p className="text-emerald-900 leading-relaxed text-[11px]">
                Đồ thị là một đường <strong>Hyperbol</strong> nhận giao điểm của 2 đường tiệm cận $I(-\frac{d}{c}; \frac{a}{c})$ làm tâm đối xứng.
              </p>
            )}
            {funcType === 'fractional_2_1' && (
              <p className="text-emerald-900 leading-relaxed text-[11px]">
                Đồ thị có <strong>tiệm cận xiên $y = ax + (b - ad)$</strong> và tiệm cận đứng $x = -d$.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
