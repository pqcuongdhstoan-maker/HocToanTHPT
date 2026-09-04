import React, { useState } from "react";
import { MathRenderer } from "../utils/mathJaxHelper";
import {
  X,
  Table as TableIcon,
  Plus,
  Trash2,
  Copy,
  Check,
  Download,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Infinity,
  Code,
  Eye,
  RefreshCw,
} from "lucide-react";

interface MarkdownTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertMarkdown?: (md: string) => void;
}

interface TablePreset {
  name: string;
  description: string;
  headers: string[];
  alignments: ("left" | "center" | "right")[];
  rows: string[][];
}

const PRESETS: TablePreset[] = [
  {
    name: "Bảng biến thiên (Hàm số bậc 3)",
    description: "Khảo sát hàm số $y = x^3 - 3x^2 + 2$",
    headers: ["$x$", "$-\\infty$", "$0$", "$2$", "$+\\infty$"],
    alignments: ["center", "center", "center", "center", "center"],
    rows: [
      ["$y'$", "", "$+$", "$0$", "$-$", "$0$", "$+$", ""],
      ["$y$", "$-\\infty$", "$\\nearrow$", "$2$", "$\\searrow$", "$-2$", "$\\nearrow$", "$+\\infty$"],
    ],
  },
  {
    name: "Bảng phân bố xác suất của biến X",
    description: "Biến ngẫu nhiên rời rạc $X$ (Toán 12 GDPT 2018)",
    headers: ["$X$", "$0$", "$1$", "$2$", "$3$"],
    alignments: ["center", "center", "center", "center", "center"],
    rows: [
      ["$P(X = x_i)$", "$0.125$", "$0.375$", "$0.375$", "$0.125$"],
    ],
  },
  {
    name: "Bảng tần số ghép nhóm (Toán 12)",
    description: "Thống kê mẫu số liệu ghép nhóm",
    headers: ["Nhóm điểm", "Giá trị đại diện $c_i$", "Tần số $m_i$", "Tần số tích lũy $cf_i$"],
    alignments: ["center", "center", "center", "center"],
    rows: [
      ["$[4; 6)$", "$5$", "$8$", "$8$"],
      ["$[6; 8)$", "$7$", "$18$", "$26$"],
      ["$[8; 10)$", "$9$", "$14$", "$40$"],
      ["**Tổng**", "—", "$N = 40$", "—"],
    ],
  },
  {
    name: "Bảng chân trị Logic mệnh đề",
    description: "Bảng chân lý mệnh đề kéo theo và tương đương",
    headers: ["$P$", "$Q$", "$P \\Rightarrow Q$", "$P \\land Q$", "$P \\lor Q$"],
    alignments: ["center", "center", "center", "center", "center"],
    rows: [
      ["Đúng", "Đúng", "Đúng", "Đúng", "Đúng"],
      ["Đúng", "Sai", "Sai", "Sai", "Đúng"],
      ["Sai", "Đúng", "Đúng", "Sai", "Đúng"],
      ["Sai", "Sai", "Đúng", "Sai", "Sai"],
    ],
  },
  {
    name: "Bảng giá trị điểm $(x; y)$",
    description: "Bảng giá trị hỗ trợ vẽ đồ thị hàm số",
    headers: ["$x$", "$-2$", "$-1$", "$0$", "$1$", "$2$"],
    alignments: ["center", "center", "center", "center", "center", "center"],
    rows: [
      ["$y = f(x)$", "$0$", "$-2$", "$0$", "$4$", "$12$"],
    ],
  },
];

export const MarkdownTableModal: React.FC<MarkdownTableModalProps> = ({
  isOpen,
  onClose,
  onInsertMarkdown,
}) => {
  const [headers, setHeaders] = useState<string[]>(PRESETS[0].headers);
  const [rows, setRows] = useState<string[][]>(PRESETS[0].rows);
  const [alignments, setAlignments] = useState<("left" | "center" | "right")[]>(PRESETS[0].alignments);
  const [copiedType, setCopiedType] = useState<"md" | "latex" | null>(null);
  const [activeView, setActiveView] = useState<"VISUAL" | "RAW_MD" | "LATEX">("VISUAL");

  if (!isOpen) return null;

  // Apply preset
  const handleApplyPreset = (preset: TablePreset) => {
    setHeaders([...preset.headers]);
    setRows(preset.rows.map((r) => [...r]));
    setAlignments([...preset.alignments]);
  };

  // Add Column
  const handleAddColumn = () => {
    setHeaders((prev) => [...prev, `Cột ${prev.length + 1}`]);
    setAlignments((prev) => [...prev, "center"]);
    setRows((prev) => prev.map((r) => [...r, ""]));
  };

  // Remove Column
  const handleRemoveColumn = (colIdx: number) => {
    if (headers.length <= 1) return;
    setHeaders((prev) => prev.filter((_, idx) => idx !== colIdx));
    setAlignments((prev) => prev.filter((_, idx) => idx !== colIdx));
    setRows((prev) => prev.map((r) => r.filter((_, idx) => idx !== colIdx)));
  };

  // Add Row
  const handleAddRow = () => {
    setRows((prev) => [...prev, new Array(headers.length).fill("")]);
  };

  // Remove Row
  const handleRemoveRow = (rowIdx: number) => {
    if (rows.length <= 1) return;
    setRows((prev) => prev.filter((_, idx) => idx !== rowIdx));
  };

  // Update Header cell
  const handleHeaderChange = (colIdx: number, val: string) => {
    setHeaders((prev) => {
      const next = [...prev];
      next[colIdx] = val;
      return next;
    });
  };

  // Update Body cell
  const handleCellChange = (rowIdx: number, colIdx: number, val: string) => {
    setRows((prev) => {
      const next = prev.map((r) => [...r]);
      if (!next[rowIdx]) next[rowIdx] = [];
      next[rowIdx][colIdx] = val;
      return next;
    });
  };

  // Toggle alignment
  const handleToggleAlignment = (colIdx: number) => {
    const cycle: ("center" | "left" | "right")[] = ["center", "left", "right"];
    setAlignments((prev) => {
      const next = [...prev];
      const cur = next[colIdx] || "center";
      const nextIdx = (cycle.indexOf(cur) + 1) % cycle.length;
      next[colIdx] = cycle[nextIdx];
      return next;
    });
  };

  // Generate Markdown table string
  const generateMarkdown = (): string => {
    const headerLine = `| ${headers.map((h) => h || " ").join(" | ")} |`;
    const separatorLine = `| ${alignments
      .map((a) => (a === "center" ? ":---:" : a === "right" ? "---:" : ":---"))
      .join(" | ")} |`;
    const bodyLines = rows.map((row) => {
      const paddedRow = headers.map((_, colIdx) => row[colIdx] || " ");
      return `| ${paddedRow.join(" | ")} |`;
    });
    return [headerLine, separatorLine, ...bodyLines].join("\n");
  };

  // Generate LaTeX array / tabular string
  const generateLatex = (): string => {
    const colSpec = alignments.map((a) => (a === "center" ? "c" : a === "right" ? "r" : "l")).join("|");
    const headerRow = headers.join(" & ") + " \\\\ \\hline";
    const bodyRows = rows.map((r) => {
      const padded = headers.map((_, colIdx) => r[colIdx] || "");
      return padded.join(" & ") + " \\\\ \\hline";
    });

    return `\\begin{array}{|${colSpec}|}\n\\hline\n${headerRow}\n${bodyRows.join("\n")}\n\\end{array}`;
  };

  // Copy helpers
  const handleCopyMarkdown = async () => {
    const md = generateMarkdown();
    await navigator.clipboard.writeText(md);
    setCopiedType("md");
    setTimeout(() => setCopiedType(null), 2000);
  };

  const handleCopyLatex = async () => {
    const tex = generateLatex();
    await navigator.clipboard.writeText(tex);
    setCopiedType("latex");
    setTimeout(() => setCopiedType(null), 2000);
  };

  // Download .md file
  const handleDownloadMd = () => {
    const md = generateMarkdown();
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bang_markdown_toan.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Quick insert math symbol to active cell
  const quickSymbols = [
    { label: "+\\infty", symbol: "$+\\infty$" },
    { label: "-\\infty", symbol: "$-\\infty$" },
    { label: "\\nearrow", symbol: "$\\nearrow$" },
    { label: "\\searrow", symbol: "$\\searrow$" },
    { label: "|| (KĐX)", symbol: "$||$" },
    { label: "0", symbol: "$0$" },
    { label: "+", symbol: "$+$" },
    { label: "-", symbol: "$-$" },
  ];

  const markdownContent = generateMarkdown();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header with Dark Teal theme matching navbar */}
        <div className="bg-gradient-to-r from-[#004d40] via-[#00695c] to-[#004d40] px-6 py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20 shadow-inner">
              <TableIcon className="w-5 h-5 text-teal-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-tight">田 Trình tạo & Soạn thảo Bảng Markdown</h2>
                <span className="px-2 py-0.5 rounded-full bg-teal-500/30 text-teal-100 text-[10px] font-bold border border-teal-300/30">
                  Toán THPT GDPT 2018
                </span>
              </div>
              <p className="text-xs text-teal-100/80">
                Tạo bảng biến thiên, bảng phân bố xác suất, bảng tần số ghép nhóm & chuyển đổi sang LaTeX
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-teal-100 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Preset Selector Carousel / Buttons */}
        <div className="bg-teal-50/70 border-b border-teal-100 px-6 py-3 shrink-0 flex items-center gap-2 overflow-x-auto">
          <span className="text-xs font-bold text-teal-900 shrink-0 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-teal-600" /> Mẫu bảng nhanh:
          </span>
          {PRESETS.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleApplyPreset(p)}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-teal-600 hover:text-white border border-teal-200 text-teal-900 text-xs font-semibold shrink-0 shadow-2xs transition-all active:scale-95"
            >
              {p.name}
            </button>
          ))}
        </div>

        {/* Sub-toolbar: View switch & Quick math inserts */}
        <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setActiveView("VISUAL")}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                activeView === "VISUAL"
                  ? "bg-teal-700 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Chỉnh sửa & Xem trực quan</span>
            </button>
            <button
              onClick={() => setActiveView("RAW_MD")}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                activeView === "RAW_MD"
                  ? "bg-teal-700 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>Mã Markdown</span>
            </button>
            <button
              onClick={() => setActiveView("LATEX")}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                activeView === "LATEX"
                  ? "bg-teal-700 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span className="font-serif italic font-bold">TeX</span>
              <span>Mã LaTeX Array</span>
            </button>
          </div>

          {/* Quick symbols */}
          <div className="flex items-center gap-1 overflow-x-auto py-0.5">
            <span className="text-[11px] font-bold text-slate-500 mr-1">Ký hiệu:</span>
            {quickSymbols.map((item, i) => (
              <button
                key={i}
                onClick={() => {
                  navigator.clipboard.writeText(item.symbol);
                  setCopiedType("md");
                  setTimeout(() => setCopiedType(null), 1200);
                }}
                className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-mono font-bold hover:bg-teal-50 hover:text-teal-800 hover:border-teal-300 transition-colors"
                title={`Sao chép ${item.symbol}`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeView === "VISUAL" ? (
            <>
              {/* Interactive Visual Grid Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                      Lưới soạn thảo ({rows.length} dòng × {headers.length} cột)
                    </span>
                    <span className="text-[11px] text-slate-500">
                      • Nhấp vào tiêu đề để đổi căn lề (Trái/Giữa/Phải)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleAddColumn}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-50 text-teal-800 hover:bg-teal-100 border border-teal-200 text-xs font-bold transition-all"
                    >
                      <Plus className="w-3.5 h-3.5 text-teal-600" />
                      <span>Thêm Cột</span>
                    </button>
                    <button
                      onClick={handleAddRow}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-50 text-teal-800 hover:bg-teal-100 border border-teal-200 text-xs font-bold transition-all"
                    >
                      <Plus className="w-3.5 h-3.5 text-teal-600" />
                      <span>Thêm Dòng</span>
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto border border-slate-300 rounded-2xl bg-white shadow-2xs">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="bg-teal-900 text-white border-b border-teal-800">
                        <th className="p-2 w-10 text-center font-mono text-[10px] text-teal-200">#</th>
                        {headers.map((h, colIdx) => (
                          <th key={colIdx} className="p-2 border-l border-teal-800 min-w-[130px]">
                            <div className="space-y-1">
                              <div className="flex items-center justify-between gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleToggleAlignment(colIdx)}
                                  className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-teal-800 hover:bg-teal-700 text-teal-100 transition-colors"
                                  title="Đổi căn lề"
                                >
                                  {alignments[colIdx] === "center" ? "Giữa" : alignments[colIdx] === "left" ? "Trái" : "Phải"}
                                </button>
                                {headers.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveColumn(colIdx)}
                                    className="text-teal-300 hover:text-rose-300 p-0.5 transition-colors"
                                    title="Xóa cột này"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                              <input
                                type="text"
                                value={h}
                                onChange={(e) => handleHeaderChange(colIdx, e.target.value)}
                                placeholder={`Cột ${colIdx + 1}`}
                                className="w-full px-2 py-1 bg-white text-slate-800 rounded-lg text-xs font-bold border border-teal-300 focus:outline-teal-500"
                              />
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, rowIdx) => (
                        <tr key={rowIdx} className="border-b border-slate-200 hover:bg-slate-50/70">
                          <td className="p-2 text-center text-slate-400 font-mono text-[11px] bg-slate-50">
                            <div className="flex items-center justify-center gap-1">
                              <span>{rowIdx + 1}</span>
                              {rows.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveRow(rowIdx)}
                                  className="text-slate-400 hover:text-rose-600 p-0.5"
                                  title="Xóa dòng này"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </td>
                          {headers.map((_, colIdx) => (
                            <td key={colIdx} className="p-2 border-l border-slate-200">
                              <input
                                type="text"
                                value={row[colIdx] || ""}
                                onChange={(e) => handleCellChange(rowIdx, colIdx, e.target.value)}
                                placeholder="..."
                                className={`w-full px-2 py-1 bg-slate-50/50 hover:bg-white focus:bg-white rounded-lg text-xs border border-transparent focus:border-teal-500 focus:outline-hidden transition-all ${
                                  alignments[colIdx] === "center"
                                    ? "text-center"
                                    : alignments[colIdx] === "right"
                                    ? "text-right"
                                    : "text-left"
                                }`}
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* MathJax Live Render Preview */}
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-teal-900 flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-teal-600" />
                    Xem trước kết quả hiển thị (Rendered Preview):
                  </span>
                  <span className="text-[11px] text-slate-500">
                    MathJax 3 tự động render các công thức trong dấu $...$
                  </span>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-teal-200/80 shadow-xs overflow-x-auto min-h-[100px] flex items-center justify-center">
                  <div className="w-full max-w-full overflow-x-auto flex justify-center">
                    <div className="markdown-table-preview">
                      <MathRenderer content={markdownContent} />
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : activeView === "RAW_MD" ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                  Mã Markdown (GFM Table)
                </span>
                <button
                  onClick={handleCopyMarkdown}
                  className="flex items-center gap-1 px-3 py-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all"
                >
                  {copiedType === "md" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedType === "md" ? "Đã sao chép!" : "Sao chép Markdown"}</span>
                </button>
              </div>
              <textarea
                readOnly
                value={markdownContent}
                rows={10}
                className="w-full p-4 rounded-2xl bg-slate-900 text-teal-200 font-mono text-xs border border-slate-700 focus:outline-hidden"
              />
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                  Mã LaTeX Array (\begin&#123;array&#125;)
                </span>
                <button
                  onClick={handleCopyLatex}
                  className="flex items-center gap-1 px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all"
                >
                  {copiedType === "latex" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedType === "latex" ? "Đã sao chép!" : "Sao chép LaTeX"}</span>
                </button>
              </div>
              <textarea
                readOnly
                value={generateLatex()}
                rows={10}
                className="w-full p-4 rounded-2xl bg-slate-900 text-indigo-200 font-mono text-xs border border-slate-700 focus:outline-hidden"
              />
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadMd}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-bold transition-all"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Tải file .md</span>
            </button>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleCopyLatex}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 border border-indigo-200 text-indigo-700 text-xs font-bold transition-all"
            >
              {copiedType === "latex" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>Sao chép LaTeX</span>
            </button>

            <button
              onClick={handleCopyMarkdown}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-teal-700 to-emerald-700 hover:from-teal-800 hover:to-emerald-800 text-white text-xs font-bold shadow-md shadow-teal-700/20 active:scale-95 transition-all"
            >
              {copiedType === "md" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedType === "md" ? "Đã sao chép Markdown!" : "Sao chép Markdown"}</span>
            </button>

            {onInsertMarkdown && (
              <button
                onClick={() => {
                  onInsertMarkdown(markdownContent);
                  onClose();
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 active:scale-95 transition-all"
              >
                <Check className="w-4 h-4" />
                <span>Chèn vào nội dung</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
