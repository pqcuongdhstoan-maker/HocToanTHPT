import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Sliders, RefreshCw, Layers, Compass, Box, Info } from 'lucide-react';

export const Oxyz3DExplorer: React.FC = () => {
  const [pointX, setPointX] = useState<number>(3);
  const [pointY, setPointY] = useState<number>(4);
  const [pointZ, setPointZ] = useState<number>(5);

  const [planeA, setPlaneA] = useState<number>(1);
  const [planeB, setPlaneB] = useState<number>(2);
  const [planeC, setPlaneC] = useState<number>(2);
  const [planeD, setPlaneD] = useState<number>(-8);

  const [rotAngleX, setRotAngleX] = useState<number>(30);
  const [rotAngleY, setRotAngleY] = useState<number>(45);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const lastMousePos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // 3D Point Projection to 2D Screen Coordinates
  const project3D = (x: number, y: number, z: number, width: number, height: number) => {
    const radX = (rotAngleX * Math.PI) / 180;
    const radY = (rotAngleY * Math.PI) / 180;

    // Rotate around Y axis
    const x1 = x * Math.cos(radY) + z * Math.sin(radY);
    const y1 = y;
    const z1 = -x * Math.sin(radY) + z * Math.cos(radY);

    // Rotate around X axis
    const x2 = x1;
    const y2 = y1 * Math.cos(radX) - z1 * Math.sin(radX);
    const z2 = y1 * Math.sin(radX) + z1 * Math.cos(radX);

    // Scale
    const scale = 22;
    const screenX = width / 2 + x2 * scale;
    const screenY = height / 2 - y2 * scale;

    return { screenX, screenY, z2 };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear
    ctx.fillStyle = '#0F172A'; // Slate-900 3D dark canvas
    ctx.fillRect(0, 0, width, height);

    // Draw 3D Origin O(0,0,0)
    const O = project3D(0, 0, 0, width, height);

    // Draw Coordinate Axes Ox, Oy, Oz
    const axisLength = 9;
    const XAxis = project3D(axisLength, 0, 0, width, height);
    const YAxis = project3D(0, axisLength, 0, width, height);
    const ZAxis = project3D(0, 0, axisLength, width, height);

    const XNeg = project3D(-axisLength, 0, 0, width, height);
    const YNeg = project3D(0, -axisLength, 0, width, height);
    const ZNeg = project3D(0, 0, -axisLength, width, height);

    // Dashed Negative Axes
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = '#334155';

    [XNeg, YNeg, ZNeg].forEach((axis) => {
      ctx.beginPath();
      ctx.moveTo(O.screenX, O.screenY);
      ctx.lineTo(axis.screenX, axis.screenY);
      ctx.stroke();
    });
    ctx.setLineDash([]);

    // Solid Positive Axes: Ox (Red), Oy (Green), Oz (Blue)
    ctx.lineWidth = 2;

    // Ox
    ctx.strokeStyle = '#EF4444';
    ctx.beginPath();
    ctx.moveTo(O.screenX, O.screenY);
    ctx.lineTo(XAxis.screenX, XAxis.screenY);
    ctx.stroke();

    // Oy
    ctx.strokeStyle = '#10B981';
    ctx.beginPath();
    ctx.moveTo(O.screenX, O.screenY);
    ctx.lineTo(YAxis.screenX, YAxis.screenY);
    ctx.stroke();

    // Oz
    ctx.strokeStyle = '#3B82F6';
    ctx.beginPath();
    ctx.moveTo(O.screenX, O.screenY);
    ctx.lineTo(ZAxis.screenX, ZAxis.screenY);
    ctx.stroke();

    // Axis Labels
    ctx.font = 'bold 12px "JetBrains Mono", monospace';
    ctx.fillStyle = '#EF4444';
    ctx.fillText('Ox', XAxis.screenX + 6, XAxis.screenY);
    ctx.fillStyle = '#10B981';
    ctx.fillText('Oy', YAxis.screenX + 6, YAxis.screenY);
    ctx.fillStyle = '#3B82F6';
    ctx.fillText('Oz', ZAxis.screenX + 6, ZAxis.screenY);
    ctx.fillStyle = '#94A3B8';
    ctx.fillText('O', O.screenX - 12, O.screenY + 12);

    // Draw Point M(x, y, z) and its projections
    const M = project3D(pointX, pointY, pointZ, width, height);
    const M_xy = project3D(pointX, pointY, 0, width, height);
    const M_x = project3D(pointX, 0, 0, width, height);
    const M_y = project3D(0, pointY, 0, width, height);
    const M_z = project3D(0, 0, pointZ, width, height);

    // Projection box lines (dashed amber)
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 1.2;

    ctx.beginPath();
    ctx.moveTo(M.screenX, M.screenY);
    ctx.lineTo(M_xy.screenX, M_xy.screenY);
    ctx.lineTo(M_x.screenX, M_x.screenY);
    ctx.moveTo(M_xy.screenX, M_xy.screenY);
    ctx.lineTo(M_y.screenX, M_y.screenY);
    ctx.moveTo(M.screenX, M.screenY);
    ctx.lineTo(M_z.screenX, M_z.screenY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw Vector OM
    ctx.strokeStyle = '#F59E0B'; // Gold vector
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(O.screenX, O.screenY);
    ctx.lineTo(M.screenX, M.screenY);
    ctx.stroke();

    // Draw Point M node
    ctx.fillStyle = '#F59E0B';
    ctx.beginPath();
    ctx.arc(M.screenX, M.screenY, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#FDE68A';
    ctx.font = 'bold 12px "Be Vietnam Pro", sans-serif';
    ctx.fillText(`M(${pointX}; ${pointY}; ${pointZ})`, M.screenX + 10, M.screenY - 6);

    // Calculate Distance to Origin & Distance to Plane
    const lenOM = Math.sqrt(pointX * pointX + pointY * pointY + pointZ * pointZ);
    const denomPlane = Math.sqrt(planeA * planeA + planeB * planeB + planeC * planeC);
    const distToPlane = denomPlane > 0 ? Math.abs(planeA * pointX + planeB * pointY + planeC * pointZ + planeD) / denomPlane : 0;
  }, [pointX, pointY, pointZ, planeA, planeB, planeC, planeD, rotAngleX, rotAngleY]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - lastMousePos.current.x;
    const deltaY = e.clientY - lastMousePos.current.y;
    setRotAngleY((prev) => (prev + deltaX * 0.6) % 360);
    setRotAngleX((prev) => Math.max(-80, Math.min(80, prev - deltaY * 0.6)));
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const lenOM = Math.sqrt(pointX * pointX + pointY * pointY + pointZ * pointZ);
  const denomPlane = Math.sqrt(planeA * planeA + planeB * planeB + planeC * planeC);
  const distToPlane = denomPlane > 0 ? Math.abs(planeA * pointX + planeB * pointY + planeC * pointZ + planeD) / denomPlane : 0;

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center space-x-2 text-teal-800 text-xs font-bold uppercase tracking-wider mb-1">
            <Compass className="w-4 h-4 text-teal-600" />
            <span>Phòng Khám Phá Không Gian Tọa Độ Oxyz 3D</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">
            Hệ Trục Tọa Độ, Vectơ &amp; Mặt Phẳng Không Gian
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Dùng chuột kéo xoay góc nhìn 3D 360° để quan sát hình chiếu điểm $M$, độ dài vectơ và khoảng cách tới mặt phẳng.
          </p>
        </div>
      </div>

      {/* Grid Canvas & Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 8 Cols: 3D Interactive Canvas */}
        <div className="lg:col-span-8 space-y-3">
          <div
            className="relative bg-slate-900 rounded-3xl overflow-hidden shadow-xl border border-slate-800 flex items-center justify-center cursor-grab active:cursor-grabbing"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <canvas
              ref={canvasRef}
              width={720}
              height={460}
              className="w-full h-auto max-h-[460px]"
            />

            <div className="absolute top-4 left-4 bg-slate-800/80 backdrop-blur-xs border border-slate-700 text-slate-300 px-3 py-1.5 rounded-xl text-[11px] font-mono">
              Xoay: X={rotAngleX.toFixed(0)}° • Y={rotAngleY.toFixed(0)}°
            </div>

            <div className="absolute bottom-4 right-4 bg-slate-800/80 backdrop-blur-xs border border-slate-700 text-slate-300 px-3 py-1.5 rounded-xl text-[11px]">
              🖱️ <em>Giữ chuột trái và kéo để xoay 3D</em>
            </div>
          </div>

          {/* Quick Stats Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-teal-50 border border-teal-200 rounded-2xl">
              <span className="text-slate-500 text-[11px]">Tọa độ điểm M:</span>
              <div className="font-mono font-bold text-teal-950 text-sm mt-0.5">
                M({pointX}; {pointY}; {pointZ})
              </div>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl">
              <span className="text-slate-500 text-[11px]">Độ dài $|\vec{OM}|$:</span>
              <div className="font-mono font-bold text-amber-950 text-sm mt-0.5">
                {lenOM.toFixed(3)} (≈ √{(pointX**2 + pointY**2 + pointZ**2)})
              </div>
            </div>

            <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-2xl">
              <span className="text-slate-500 text-[11px]">Khoảng cách $d(M, (\alpha))$:</span>
              <div className="font-mono font-bold text-indigo-950 text-sm mt-0.5">
                {distToPlane.toFixed(3)}
              </div>
            </div>
          </div>
        </div>

        {/* Right 4 Cols: Coordinate Sliders & Plane Parameters */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-teal-600" /> Tọa độ điểm M(x; y; z):
            </h3>

            {/* Slider X */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold text-rose-700">
                <span>Hoành độ x:</span>
                <span className="font-mono">{pointX}</span>
              </div>
              <input
                type="range"
                min="-6"
                max="6"
                step="0.5"
                value={pointX}
                onChange={(e) => setPointX(parseFloat(e.target.value))}
                className="w-full accent-rose-500 cursor-pointer"
              />
            </div>

            {/* Slider Y */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold text-emerald-700">
                <span>Tung độ y:</span>
                <span className="font-mono">{pointY}</span>
              </div>
              <input
                type="range"
                min="-6"
                max="6"
                step="0.5"
                value={pointY}
                onChange={(e) => setPointY(parseFloat(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>

            {/* Slider Z */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold text-blue-700">
                <span>Cao độ z:</span>
                <span className="font-mono">{pointZ}</span>
              </div>
              <input
                type="range"
                min="-6"
                max="6"
                step="0.5"
                value={pointZ}
                onChange={(e) => setPointZ(parseFloat(e.target.value))}
                className="w-full accent-blue-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Plane Equation Card */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-indigo-600" /> Mặt phẳng $(\alpha): Ax + By + Cz + D = 0$
            </h3>

            <div className="p-2.5 bg-white border border-slate-200 rounded-xl font-mono text-xs text-indigo-950 font-bold text-center">
              {planeA}x + {planeB}y + {planeC}z + ({planeD}) = 0
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-[10px] text-slate-500">Hệ số A:</label>
                <input
                  type="number"
                  value={planeA}
                  onChange={(e) => setPlaneA(parseFloat(e.target.value) || 0)}
                  className="w-full p-1.5 bg-white border border-slate-300 rounded-lg font-mono text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500">Hệ số B:</label>
                <input
                  type="number"
                  value={planeB}
                  onChange={(e) => setPlaneB(parseFloat(e.target.value) || 0)}
                  className="w-full p-1.5 bg-white border border-slate-300 rounded-lg font-mono text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500">Hệ số C:</label>
                <input
                  type="number"
                  value={planeC}
                  onChange={(e) => setPlaneC(parseFloat(e.target.value) || 0)}
                  className="w-full p-1.5 bg-white border border-slate-300 rounded-lg font-mono text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500">Hệ số D:</label>
                <input
                  type="number"
                  value={planeD}
                  onChange={(e) => setPlaneD(parseFloat(e.target.value) || 0)}
                  className="w-full p-1.5 bg-white border border-slate-300 rounded-lg font-mono text-xs"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
