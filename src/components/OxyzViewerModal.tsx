import React, { useState, useRef, useEffect } from "react";
import { X, Box, RotateCcw, Sparkles, Sliders, Calculator } from "lucide-react";

interface OxyzViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OxyzViewerModal: React.FC<OxyzViewerModalProps> = ({ isOpen, onClose }) => {
  // Point A coordinates
  const [ptX, setPtX] = useState<number>(2);
  const [ptY, setPtY] = useState<number>(3);
  const [ptZ, setPtZ] = useState<number>(4);

  // Vector u coordinates
  const [vecX, setVecX] = useState<number>(1);
  const [vecY, setVecY] = useState<number>(-2);
  const [vecZ, setVecZ] = useState<number>(2);

  // Plane equation: Ax + By + Cz + D = 0
  const [planeA, setPlaneA] = useState<number>(1);
  const [planeB, setPlaneB] = useState<number>(2);
  const [planeC, setPlaneC] = useState<number>(-2);
  const [planeD, setPlaneD] = useState<number>(-6);

  // Rotation angles (radians)
  const [rotX, setRotX] = useState<number>(0.5);
  const [rotY, setRotY] = useState<number>(0.8);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Calculate distance from Point A to Plane (alpha)
  const planeDenom = Math.sqrt(planeA * planeA + planeB * planeB + planeC * planeC);
  const distAToPlane =
    planeDenom > 0
      ? (Math.abs(planeA * ptX + planeB * ptY + planeC * ptZ + planeD) / planeDenom).toFixed(2)
      : "0";

  // Vector u length
  const vecLength = Math.sqrt(vecX * vecX + vecY * vecY + vecZ * vecZ).toFixed(2);

  // 3D Projection math
  const project3D = (x: number, y: number, z: number, originX: number, originY: number, scale: number) => {
    // Rotation around Y
    const x1 = x * Math.cos(rotY) + z * Math.sin(rotY);
    const y1 = y;
    const z1 = -x * Math.sin(rotY) + z * Math.cos(rotY);

    // Rotation around X
    const x2 = x1;
    const y2 = y1 * Math.cos(rotX) - z1 * Math.sin(rotX);
    const z2 = y1 * Math.sin(rotX) + z1 * Math.cos(rotX);

    // Canvas 2D projection (Y is inverted on canvas)
    return {
      px: originX + x2 * scale,
      py: originY - y2 * scale,
      depth: z2,
    };
  };

  useEffect(() => {
    if (!isOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const originX = width / 2;
    const originY = height / 2 + 30;
    const scale = 32;

    ctx.clearRect(0, 0, width, height);

    // Background grid / floor
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(0, 0, width, height);

    // 1. Draw 3D Axes: Ox, Oy, Oz
    const axisLen = 6;
    const o = project3D(0, 0, 0, originX, originY, scale);
    const ox = project3D(axisLen, 0, 0, originX, originY, scale);
    const oy = project3D(0, axisLen, 0, originX, originY, scale);
    const oz = project3D(0, 0, axisLen, originX, originY, scale);

    // Ox (Red)
    ctx.strokeStyle = "#dc2626";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(o.px, o.py);
    ctx.lineTo(ox.px, ox.py);
    ctx.stroke();

    // Oy (Green)
    ctx.strokeStyle = "#16a34a";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(o.px, o.py);
    ctx.lineTo(oy.px, oy.py);
    ctx.stroke();

    // Oz (Blue)
    ctx.strokeStyle = "#2563eb";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(o.px, o.py);
    ctx.lineTo(oz.px, oz.py);
    ctx.stroke();

    // Axis labels
    ctx.font = "bold 13px sans-serif";
    ctx.fillStyle = "#dc2626";
    ctx.fillText("x (Ox)", ox.px + 5, ox.py);
    ctx.fillStyle = "#16a34a";
    ctx.fillText("y (Oy)", oy.px + 5, oy.py);
    ctx.fillStyle = "#2563eb";
    ctx.fillText("z (Oz)", oz.px + 5, oz.py);

    // 2. Draw Point A and projection lines
    const ptProj = project3D(ptX, ptY, ptZ, originX, originY, scale);
    const ptFloor = project3D(ptX, 0, ptZ, originX, originY, scale);

    // Projection dashed line to Oxy
    ctx.strokeStyle = "#94a3b8";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(ptProj.px, ptProj.py);
    ctx.lineTo(ptFloor.px, ptFloor.py);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(ptFloor.px, ptFloor.py);
    ctx.lineTo(o.px, o.py);
    ctx.stroke();
    ctx.setLineDash([]);

    // Point A Circle
    ctx.fillStyle = "#f59e0b";
    ctx.beginPath();
    ctx.arc(ptProj.px, ptProj.py, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#b45309";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = "#92400e";
    ctx.font = "bold 12px sans-serif";
    ctx.fillText(`A(${ptX}; ${ptY}; ${ptZ})`, ptProj.px + 8, ptProj.py - 4);

    // 3. Draw Vector u
    const vecProj = project3D(vecX, vecY, vecZ, originX, originY, scale);
    ctx.strokeStyle = "#8b5cf6";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(o.px, o.py);
    ctx.lineTo(vecProj.px, vecProj.py);
    ctx.stroke();

    // Vector u arrow head
    ctx.fillStyle = "#8b5cf6";
    ctx.beginPath();
    ctx.arc(vecProj.px, vecProj.py, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillText(`u⃗(${vecX}; ${vecY}; ${vecZ})`, vecProj.px + 8, vecProj.py - 4);

    // 4. Draw Plane alpha polygon approximation
    if (planeC !== 0) {
      const pRange = 4;
      const c1 = project3D(-pRange, -(planeA * -pRange + planeD) / planeB || 0, -pRange, originX, originY, scale);
      const c2 = project3D(pRange, -(planeA * pRange + planeD) / planeB || 0, -pRange, originX, originY, scale);
      const c3 = project3D(pRange, 0, -(planeA * pRange + planeD) / planeC, originX, originY, scale);
      const c4 = project3D(-pRange, 0, -(planeA * -pRange + planeD) / planeC, originX, originY, scale);

      ctx.fillStyle = "rgba(59, 130, 246, 0.15)";
      ctx.strokeStyle = "rgba(37, 99, 235, 0.5)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(c1.px, c1.py);
      ctx.lineTo(c2.px, c2.py);
      ctx.lineTo(c3.px, c3.py);
      ctx.lineTo(c4.px, c4.py);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  }, [isOpen, ptX, ptY, ptZ, vecX, vecY, vecZ, planeA, planeB, planeC, planeD, rotX, rotY]);

  if (!isOpen) return null;

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    setRotY((prev) => prev + deltaX * 0.01);
    setRotX((prev) => Math.max(-1.4, Math.min(1.4, prev + deltaY * 0.01)));
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/75 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-indigo-800 via-purple-800 to-indigo-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-amber-300 border border-white/20">
              <Box className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg">
                  Mô Phỏng Không Gian 3D Tọa Độ Oxyz
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 uppercase">
                  Toán 12 GDPT 2018
                </span>
              </div>
              <p className="text-xs text-indigo-200">
                Xoay 360° bằng chuột • Trực quan hóa Điểm, Vectơ, Mặt phẳng & Khoảng cách
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {/* Controls */}
            <div className="space-y-4 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
              {/* Point A */}
              <div>
                <label className="font-bold text-amber-800 flex items-center gap-1.5 mb-1">
                  <span>● Điểm A(x, y, z):</span>
                </label>
                <div className="grid grid-cols-3 gap-1">
                  <input
                    type="number"
                    value={ptX}
                    onChange={(e) => setPtX(parseFloat(e.target.value) || 0)}
                    className="p-1 border rounded bg-white"
                  />
                  <input
                    type="number"
                    value={ptY}
                    onChange={(e) => setPtY(parseFloat(e.target.value) || 0)}
                    className="p-1 border rounded bg-white"
                  />
                  <input
                    type="number"
                    value={ptZ}
                    onChange={(e) => setPtZ(parseFloat(e.target.value) || 0)}
                    className="p-1 border rounded bg-white"
                  />
                </div>
              </div>

              {/* Vector u */}
              <div>
                <label className="font-bold text-purple-800 flex items-center gap-1.5 mb-1">
                  <span>➔ Vectơ u⃗(x, y, z):</span>
                </label>
                <div className="grid grid-cols-3 gap-1">
                  <input
                    type="number"
                    value={vecX}
                    onChange={(e) => setVecX(parseFloat(e.target.value) || 0)}
                    className="p-1 border rounded bg-white"
                  />
                  <input
                    type="number"
                    value={vecY}
                    onChange={(e) => setVecY(parseFloat(e.target.value) || 0)}
                    className="p-1 border rounded bg-white"
                  />
                  <input
                    type="number"
                    value={vecZ}
                    onChange={(e) => setVecZ(parseFloat(e.target.value) || 0)}
                    className="p-1 border rounded bg-white"
                  />
                </div>
                <p className="text-[11px] text-purple-700 font-semibold mt-1">
                  Độ dài |u⃗| = {vecLength}
                </p>
              </div>

              {/* Plane alpha */}
              <div>
                <label className="font-bold text-blue-800 flex items-center gap-1.5 mb-1">
                  <span>▱ Mặt phẳng (α): Ax + By + Cz + D = 0</span>
                </label>
                <div className="grid grid-cols-4 gap-1">
                  <input
                    type="number"
                    value={planeA}
                    onChange={(e) => setPlaneA(parseFloat(e.target.value) || 0)}
                    className="p-1 border rounded bg-white"
                    placeholder="A"
                  />
                  <input
                    type="number"
                    value={planeB}
                    onChange={(e) => setPlaneB(parseFloat(e.target.value) || 0)}
                    className="p-1 border rounded bg-white"
                    placeholder="B"
                  />
                  <input
                    type="number"
                    value={planeC}
                    onChange={(e) => setPlaneC(parseFloat(e.target.value) || 0)}
                    className="p-1 border rounded bg-white"
                    placeholder="C"
                  />
                  <input
                    type="number"
                    value={planeD}
                    onChange={(e) => setPlaneD(parseFloat(e.target.value) || 0)}
                    className="p-1 border rounded bg-white"
                    placeholder="D"
                  />
                </div>
              </div>

              {/* Live Formula Calculations */}
              <div className="p-3 bg-white rounded-xl border border-indigo-100 space-y-1">
                <p className="font-bold text-slate-800">Tính toán công thức SGK:</p>
                <p className="text-slate-600">
                  Khoảng cách d(A, (α)) = <strong className="text-emerald-600">{distAToPlane}</strong>
                </p>
              </div>

              <button
                onClick={() => {
                  setRotX(0.5);
                  setRotY(0.8);
                }}
                className="w-full py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold flex items-center justify-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Đặt lại góc nhìn 3D</span>
              </button>
            </div>

            {/* Canvas 3D Space */}
            <div
              className="md:col-span-2 relative bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden shadow-inner flex flex-col items-center select-none"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
            >
              <canvas ref={canvasRef} width={560} height={420} className="cursor-grab active:cursor-grabbing max-w-full" />

              <div className="w-full bg-slate-100 px-4 py-2 text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-200">
                <span>Nhấn giữ chuột và kéo để xoay không gian 3D</span>
                <span className="font-bold text-indigo-700">Hệ tọa độ Đề-các vuông góc Oxyz</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
