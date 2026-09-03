import React, { useRef, useState, useEffect } from "react";
import { Edit3, Eraser, Trash2, X, Minimize2, Maximize2, Palette, Check } from "lucide-react";

interface DigitalScratchpadProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DigitalScratchpad: React.FC<DigitalScratchpadProps> = ({ isOpen, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [tool, setTool] = useState<"PEN" | "ERASER">("PEN");
  const [color, setColor] = useState<string>("#1e40af"); // Blue
  const [lineWidth, setLineWidth] = useState<number>(2.5);

  const colors = ["#1e40af", "#dc2626", "#16a34a", "#0f172a", "#f59e0b"];

  useEffect(() => {
    if (!isOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Fill white background on first mount
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, [isOpen]);

  if (!isOpen) return null;

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (tool === "PEN") {
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
    } else {
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = lineWidth * 5;
    }

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 w-full max-w-lg bg-white rounded-3xl shadow-2xl border-2 border-slate-300 overflow-hidden flex flex-col animate-slideUp">
      {/* Header */}
      <div className="px-4 py-2.5 bg-slate-900 text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Edit3 className="w-4 h-4 text-amber-400" />
          <span className="font-extrabold text-xs">Bảng Nháp Kỹ Thuật Số (Digital Scratchpad)</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Toolbar */}
      <div className="px-4 py-2 bg-slate-100 border-b border-slate-200 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          {/* Tools */}
          <button
            onClick={() => setTool("PEN")}
            className={`p-1.5 rounded-lg font-bold flex items-center gap-1 ${
              tool === "PEN" ? "bg-blue-600 text-white shadow-xs" : "text-slate-700 hover:bg-slate-200"
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Bút</span>
          </button>

          <button
            onClick={() => setTool("ERASER")}
            className={`p-1.5 rounded-lg font-bold flex items-center gap-1 ${
              tool === "ERASER" ? "bg-slate-800 text-white shadow-xs" : "text-slate-700 hover:bg-slate-200"
            }`}
          >
            <Eraser className="w-3.5 h-3.5" />
            <span>Tẩy</span>
          </button>

          {/* Colors */}
          <div className="flex items-center gap-1 pl-2 border-l border-slate-300">
            {colors.map((c) => (
              <button
                key={c}
                onClick={() => {
                  setColor(c);
                  setTool("PEN");
                }}
                className={`w-5 h-5 rounded-full border border-white transition-transform ${
                  color === c && tool === "PEN" ? "scale-125 ring-2 ring-slate-800" : "hover:scale-110"
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        {/* Clear Button */}
        <button
          onClick={clearCanvas}
          className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 flex items-center gap-1 font-semibold"
          title="Xóa toàn bộ bảng nháp"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Xóa nháp</span>
        </button>
      </div>

      {/* Drawing Canvas */}
      <div className="relative bg-white cursor-crosshair">
        <canvas
          ref={canvasRef}
          width={512}
          height={320}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full h-auto block touch-none"
        />
      </div>

      <div className="px-3 py-1.5 bg-slate-50 border-t border-slate-200 text-[10px] text-slate-500 flex justify-between">
        <span>Nháp trực tiếp bằng chuột hoặc cảm ứng</span>
        <span>Thầy Phan Quốc Cường</span>
      </div>
    </div>
  );
};
