import React, { useState, useRef, useEffect } from "react";
import { X, LineChart, Sliders, RefreshCw, Eye, Sparkles, Check, Info } from "lucide-react";

interface MathFunctionGrapherModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type FunctionPreset = "CUBIC" | "RATIONAL_1_1" | "RATIONAL_2_1" | "QUARTIC";

export const MathFunctionGrapherModal: React.FC<MathFunctionGrapherModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [preset, setPreset] = useState<FunctionPreset>("CUBIC");
  // Parameters for y = a*x^3 + b*x^2 + c*x + d
  const [a, setA] = useState<number>(1);
  const [b, setB] = useState<number>(-3);
  const [c, setC] = useState<number>(0);
  const [d, setD] = useState<number>(2);

  // Parameters for rational 1/1: y = (p1*x + q1) / (p2*x + q2)
  const [p1, setP1] = useState<number>(2);
  const [q1, setQ1] = useState<number>(-1);
  const [p2, setP2] = useState<number>(1);
  const [q2, setQ2] = useState<number>(1);

  // Parameters for rational 2/1: y = (m1*x^2 + m2*x + m3) / (n1*x + n2)
  const [m1, setM1] = useState<number>(1);
  const [m2, setM2] = useState<number>(-1);
  const [m3, setM3] = useState<number>(1);
  const [n1, setN1] = useState<number>(1);
  const [n2, setN2] = useState<number>(-1);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoverCoord, setHoverCoord] = useState<{ x: number; y: number } | null>(null);

  // Function evaluator
  const evalY = (x: number): number => {
    if (preset === "CUBIC") {
      return a * Math.pow(x, 3) + b * Math.pow(x, 2) + c * x + d;
    }
    if (preset === "RATIONAL_1_1") {
      const denom = p2 * x + q2;
      if (Math.abs(denom) < 0.001) return NaN;
      return (p1 * x + q1) / denom;
    }
    if (preset === "RATIONAL_2_1") {
      const denom = n1 * x + n2;
      if (Math.abs(denom) < 0.001) return NaN;
      return (m1 * Math.pow(x, 2) + m2 * x + m3) / denom;
    }
    if (preset === "QUARTIC") {
      return a * Math.pow(x, 4) + b * Math.pow(x, 2) + d;
    }
    return 0;
  };

  // Draw coordinate system & curve
  useEffect(() => {
    if (!isOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const originX = width / 2;
    const originY = height / 2;
    const scale = 35; // 35 pixels = 1 unit

    ctx.clearRect(0, 0, width, height);

    // 1. Draw Grid
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 1;

    for (let x = originX % scale; x < width; x += scale) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = originY % scale; y < height; y += scale) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // 2. Draw Axes (Ox, Oy)
    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 2;

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

    // Axis Labels
    ctx.fillStyle = "#334155";
    ctx.font = "bold 12px sans-serif";
    ctx.fillText("x", width - 15, originY - 8);
    ctx.fillText("y", originX + 8, 15);
    ctx.fillText("O", originX - 12, originY + 14);

    // Number ticks
    ctx.fillStyle = "#94a3b8";
    ctx.font = "10px sans-serif";
    for (let i = -8; i <= 8; i++) {
      if (i === 0) continue;
      const xPos = originX + i * scale;
      const yPos = originY - i * scale;
      if (xPos > 0 && xPos < width) ctx.fillText(String(i), xPos - 4, originY + 12);
      if (yPos > 0 && yPos < height) ctx.fillText(String(i), originX + 4, yPos + 3);
    }

    // 3. Draw Asymptotes if Rational
    if (preset === "RATIONAL_1_1" && p2 !== 0) {
      const vertAsym = -q2 / p2;
      const horizAsym = p1 / p2;

      ctx.strokeStyle = "#ef4444";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 4]);

      // Vertical asymptote
      const vx = originX + vertAsym * scale;
      ctx.beginPath();
      ctx.moveTo(vx, 0);
      ctx.lineTo(vx, height);
      ctx.stroke();

      // Horizontal asymptote
      const hy = originY - horizAsym * scale;
      ctx.beginPath();
      ctx.moveTo(0, hy);
      ctx.lineTo(width, hy);
      ctx.stroke();

      ctx.setLineDash([]);
    }

    if (preset === "RATIONAL_2_1" && n1 !== 0) {
      const vertAsym = -n2 / n1;
      // Slant asymptote: (m1*x^2 + m2*x + m3) / (n1*x + n2) = (m1/n1)*x + (m2 - m1*n2/n1)/n1
      const slope = m1 / n1;
      const intercept = (m2 - (m1 * n2) / n1) / n1;

      ctx.strokeStyle = "#ef4444";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 4]);

      // Vertical asymptote
      const vx = originX + vertAsym * scale;
      ctx.beginPath();
      ctx.moveTo(vx, 0);
      ctx.lineTo(vx, height);
      ctx.stroke();

      // Slant asymptote
      ctx.beginPath();
      const xStart = -10;
      const xEnd = 10;
      ctx.moveTo(originX + xStart * scale, originY - (slope * xStart + intercept) * scale);
      ctx.lineTo(originX + xEnd * scale, originY - (slope * xEnd + intercept) * scale);
      ctx.stroke();

      ctx.setLineDash([]);
    }

    // 4. Draw the Function Curve
    ctx.strokeStyle = "#2563eb";
    ctx.lineWidth = 2.5;
    ctx.beginPath();

    let started = false;
    for (let px = 0; px < width; px += 1.5) {
      const mathX = (px - originX) / scale;
      const mathY = evalY(mathX);

      if (isNaN(mathY) || Math.abs(mathY) > 20) {
        started = false;
        continue;
      }

      const py = originY - mathY * scale;

      if (!started) {
        ctx.moveTo(px, py);
        started = true;
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.stroke();
  }, [isOpen, preset, a, b, c, d, p1, q1, p2, q2, m1, m2, m3, n1, n2]);

  if (!isOpen) return null;

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const originX = canvas.width / 2;
    const originY = canvas.height / 2;
    const scale = 35;

    const mathX = Math.round(((px - originX) / scale) * 10) / 10;
    const mathY = Math.round(evalY(mathX) * 100) / 100;

    if (!isNaN(mathY) && Math.abs(mathY) < 50) {
      setHoverCoord({ x: mathX, y: mathY });
    } else {
      setHoverCoord(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/75 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-amber-300 border border-white/20">
              <LineChart className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg">
                  Khảo Sát Đồ Thị Hàm Số 2D Tương Tác
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-400/20 text-blue-200 border border-blue-400/30 uppercase">
                  Toán 12 GDPT 2018
                </span>
              </div>
              <p className="text-xs text-blue-100">
                Trực quan hóa cực trị, tiệm cận đứng, tiệm cận ngang và tiệm cận xiên
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Preset Buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                setPreset("CUBIC");
                setA(1);
                setB(-3);
                setC(0);
                setD(2);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                preset === "CUBIC"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700"
              }`}
            >
              Hàm bậc ba (y = ax³ + bx² + cx + d)
            </button>

            <button
              onClick={() => {
                setPreset("RATIONAL_1_1");
                setP1(2);
                setQ1(-1);
                setP2(1);
                setQ2(1);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                preset === "RATIONAL_1_1"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700"
              }`}
            >
              Hàm phân thức (y = ax+b / cx+d)
            </button>

            <button
              onClick={() => {
                setPreset("RATIONAL_2_1");
                setM1(1);
                setM2(-1);
                setM3(1);
                setN1(1);
                setN2(-1);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                preset === "RATIONAL_2_1"
                  ? "bg-purple-600 text-white shadow-xs"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700"
              }`}
            >
              Hàm phân thức bậc hai / bậc nhất (Tiệm cận xiên)
            </button>

            <button
              onClick={() => {
                setPreset("QUARTIC");
                setA(1);
                setB(-2);
                setD(-3);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                preset === "QUARTIC"
                  ? "bg-slate-800 text-white shadow-xs"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700"
              }`}
            >
              Hàm trùng phương (y = ax⁴ + bx² + c)
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {/* Controls Panel */}
            <div className="space-y-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <h4 className="text-xs font-extrabold uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-blue-600" />
                <span>Tham số hàm số</span>
              </h4>

              {preset === "CUBIC" && (
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="font-semibold text-slate-600 flex justify-between">
                      <span>Hệ số a:</span> <strong>{a}</strong>
                    </label>
                    <input
                      type="range"
                      min="-3"
                      max="3"
                      step="0.5"
                      value={a}
                      onChange={(e) => setA(parseFloat(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-600 flex justify-between">
                      <span>Hệ số b:</span> <strong>{b}</strong>
                    </label>
                    <input
                      type="range"
                      min="-5"
                      max="5"
                      step="0.5"
                      value={b}
                      onChange={(e) => setB(parseFloat(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-600 flex justify-between">
                      <span>Hệ số c:</span> <strong>{c}</strong>
                    </label>
                    <input
                      type="range"
                      min="-5"
                      max="5"
                      step="0.5"
                      value={c}
                      onChange={(e) => setC(parseFloat(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-600 flex justify-between">
                      <span>Hệ số d:</span> <strong>{d}</strong>
                    </label>
                    <input
                      type="range"
                      min="-5"
                      max="5"
                      step="0.5"
                      value={d}
                      onChange={(e) => setD(parseFloat(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </div>
              )}

              {preset === "RATIONAL_1_1" && (
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="font-semibold text-slate-600 flex justify-between">
                      <span>Tử số (ax + b): a = {p1}, b = {q1}</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <input
                        type="number"
                        value={p1}
                        onChange={(e) => setP1(parseFloat(e.target.value) || 0)}
                        className="px-2 py-1 border rounded"
                      />
                      <input
                        type="number"
                        value={q1}
                        onChange={(e) => setQ1(parseFloat(e.target.value) || 0)}
                        className="px-2 py-1 border rounded"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="font-semibold text-slate-600 flex justify-between">
                      <span>Mẫu số (cx + d): c = {p2}, d = {q2}</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <input
                        type="number"
                        value={p2}
                        onChange={(e) => setP2(parseFloat(e.target.value) || 1)}
                        className="px-2 py-1 border rounded"
                      />
                      <input
                        type="number"
                        value={q2}
                        onChange={(e) => setQ2(parseFloat(e.target.value) || 0)}
                        className="px-2 py-1 border rounded"
                      />
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px] leading-relaxed">
                    <p className="font-bold">Đường tiệm cận (Đường đứt nét đỏ):</p>
                    <p>• Tiệm cận đứng: x = {-q2 / p2}</p>
                    <p>• Tiệm cận ngang: y = {p1 / p2}</p>
                  </div>
                </div>
              )}

              {preset === "RATIONAL_2_1" && (
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="font-semibold text-slate-600">Tử: m₁x² + m₂x + m₃</label>
                    <div className="grid grid-cols-3 gap-1 mt-1">
                      <input
                        type="number"
                        value={m1}
                        onChange={(e) => setM1(parseFloat(e.target.value) || 0)}
                        className="px-2 py-1 border rounded"
                      />
                      <input
                        type="number"
                        value={m2}
                        onChange={(e) => setM2(parseFloat(e.target.value) || 0)}
                        className="px-2 py-1 border rounded"
                      />
                      <input
                        type="number"
                        value={m3}
                        onChange={(e) => setM3(parseFloat(e.target.value) || 0)}
                        className="px-2 py-1 border rounded"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="font-semibold text-slate-600">Mẫu: n₁x + n₂</label>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <input
                        type="number"
                        value={n1}
                        onChange={(e) => setN1(parseFloat(e.target.value) || 1)}
                        className="px-2 py-1 border rounded"
                      />
                      <input
                        type="number"
                        value={n2}
                        onChange={(e) => setN2(parseFloat(e.target.value) || 0)}
                        className="px-2 py-1 border rounded"
                      />
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-800 text-[11px] leading-relaxed">
                    <p className="font-bold">Đặc trưng GDPT 2018:</p>
                    <p>• Tiệm cận đứng: x = {-n2 / n1}</p>
                    <p>• Tiệm cận xiên: y = {(m1 / n1).toFixed(1)}x + {(((m2 - (m1 * n2) / n1) / n1)).toFixed(1)}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Canvas Graph Viewport */}
            <div className="md:col-span-2 relative bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-inner flex flex-col items-center">
              <canvas
                ref={canvasRef}
                width={560}
                height={420}
                onMouseMove={handleCanvasMouseMove}
                onMouseLeave={() => setHoverCoord(null)}
                className="cursor-crosshair max-w-full"
              />

              {hoverCoord && (
                <div className="absolute top-3 right-3 px-3 py-1.5 rounded-xl bg-slate-900/90 text-white font-mono text-xs shadow-md">
                  x = {hoverCoord.x}, y = {hoverCoord.y}
                </div>
              )}

              <div className="w-full bg-slate-100 px-4 py-2 text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-200">
                <span>Rê chuột trên đồ thị để xem toạ độ (x; y)</span>
                <span className="font-bold text-blue-700">Đồ thị Toán 12</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
