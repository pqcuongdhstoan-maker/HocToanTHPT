import React, { useState } from 'react';
import { MathContent } from './MathContent';
import { BookOpen, X, Search, Copy, Check, Sparkles } from 'lucide-react';

interface FormulaItem {
  name: string;
  latex: string;
  note?: string;
}

interface ChapterFormulaGroup {
  chapterId: string;
  title: string;
  formulas: FormulaItem[];
}

const FORMULA_DATA: ChapterFormulaGroup[] = [
  {
    chapterId: 'chap-1',
    title: 'Chương I. Đạo hàm & Khảo sát hàm số',
    formulas: [
      { name: 'Định lý đơn điệu', latex: 'f\'(x) \\ge 0, \\forall x \\in K \\implies f(x) \\text{ đồng biến trên } K' },
      { name: 'Điều kiện cần cực trị', latex: 'f\'(x_0) = 0 \\text{ hoặc } f\'(x_0) \\text{ không xác định}' },
      { name: 'Quy tắc II tìm cực trị', latex: 'f\'(x_0) = 0, f\'\'(x_0) < 0 \\implies x_0 \\text{ là điểm Cực Đại}' },
      { name: 'Tiệm cận đứng', latex: '\\lim_{x \\to x_0^+} f(x) = \\pm \\infty \\implies x = x_0 \\text{ là TCĐ}' },
      { name: 'Tiệm cận ngang', latex: '\\lim_{x \\to \\pm \\infty} f(x) = y_0 \\implies y = y_0 \\text{ là TCN}' },
      { name: 'Tiệm cận xiên y = ax + b', latex: 'a = \\lim_{x \\to \\infty} \\frac{f(x)}{x}, \\quad b = \\lim_{x \\to \\infty} [f(x) - ax]' },
      { name: 'Đạo hàm phân thức bậc 1/1', latex: '\\left(\\frac{ax+b}{cx+d}\\right)\' = \\frac{ad - bc}{(cx+d)^2}' },
    ],
  },
  {
    chapterId: 'chap-2',
    title: 'Chương II. Vectơ & Tọa độ Oxyz',
    formulas: [
      { name: 'Tọa độ vectơ', latex: '\\vec{u} = x\\vec{i} + y\\vec{j} + z\\vec{k} \\implies \\vec{u} = (x; y; z)' },
      { name: 'Độ dài vectơ', latex: '|\\vec{u}| = \\sqrt{x^2 + y^2 + z^2}' },
      { name: 'Tích vô hướng', latex: '\\vec{u} \\cdot \\vec{v} = x_1 x_2 + y_1 y_2 + z_1 z_2 = |\\vec{u}| |\\vec{v}| \\cos(\\vec{u}, \\vec{v})' },
      { name: 'Khoảng cách giữa hai điểm', latex: 'AB = \\sqrt{(x_B - x_A)^2 + (y_B - y_A)^2 + (z_B - z_A)^2}' },
      { name: 'Tọa độ trung điểm M của AB', latex: 'M\\left(\\frac{x_A + x_B}{2}; \\frac{y_A + y_B}{2}; \\frac{z_A + z_B}{2}\\right)' },
      { name: 'Tọa độ trọng tâm G tam giác', latex: 'G\\left(\\frac{x_A+x_B+x_C}{3}; \\frac{y_A+y_B+y_C}{3}; \\frac{z_A+z_B+z_C}{3}\\right)' },
    ],
  },
  {
    chapterId: 'chap-3',
    title: 'Chương III. Thống kê mẫu số liệu ghép nhóm',
    formulas: [
      { name: 'Số trung bình ghép nhóm', latex: '\\bar{x} = \\frac{m_1 c_1 + m_2 c_2 + \\dots + m_k c_k}{n}' },
      { name: 'Khoảng biến thiên', latex: 'R = a_{k+1} - a_1' },
      { name: 'Khoảng tứ phân vị', latex: '\\Delta_Q = Q_3 - Q_1' },
      { name: 'Phương sai ghép nhóm s²', latex: 's^2 = \\frac{1}{n} \\sum_{i=1}^k m_i (c_i - \\bar{x})^2 = \\frac{1}{n} \\sum_{i=1}^k m_i c_i^2 - (\\bar{x})^2' },
      { name: 'Độ lệch chuẩn s', latex: 's = \\sqrt{s^2}' },
    ],
  },
  {
    chapterId: 'chap-4',
    title: 'Chương IV. Nguyên hàm & Tích phân',
    formulas: [
      { name: 'Nguyên hàm cơ bản xⁿ', latex: '\\int x^n dx = \\frac{x^{n+1}}{n+1} + C \\quad (n \\ne -1)' },
      { name: 'Nguyên hàm 1/x', latex: '\\int \\frac{1}{x} dx = \\ln|x| + C' },
      { name: 'Nguyên hàm eˣ & aˣ', latex: '\\int e^x dx = e^x + C, \\quad \\int a^x dx = \\frac{a^x}{\\ln a} + C' },
      { name: 'Tích phân từng phần', latex: '\\int_a^b u dv = u v\\Big|_a^b - \\int_a^b v du' },
      { name: 'Diện tích hình phẳng', latex: 'S = \\int_a^b |f(x) - g(x)| dx' },
    ],
  },
  {
    chapterId: 'chap-5',
    title: 'Chương V. Phương trình Mặt phẳng & Mặt cầu',
    formulas: [
      { name: 'PT Mặt phẳng', latex: '(\\alpha): A(x - x_0) + B(y - y_0) + C(z - z_0) = 0 \\iff Ax + By + Cz + D = 0' },
      { name: 'Khoảng cách từ điểm đến mp', latex: 'd(M_0, (\\alpha)) = \\frac{|Ax_0 + By_0 + Cz_0 + D|}{\\sqrt{A^2 + B^2 + C^2}}' },
      { name: 'PT Mặt cầu tâm I(a;b;c) bán kính R', latex: '(x - a)^2 + (y - b)^2 + (z - c)^2 = R^2' },
      { name: 'Điều kiện x² + y² + z² - 2ax - 2by - 2cz + d = 0 là mặt cầu', latex: 'a^2 + b^2 + c^2 - d > 0, \\quad R = \\sqrt{a^2 + b^2 + c^2 - d}' },
    ],
  },
  {
    chapterId: 'chap-6',
    title: 'Chương VI. Xác suất có điều kiện',
    formulas: [
      { name: 'Công thức XS có điều kiện', latex: 'P(A|B) = \\frac{P(A \\cap B)}{P(B)} \\quad (P(B) > 0)' },
      { name: 'Công thức nhân xác suất', latex: 'P(A \\cap B) = P(B) \\cdot P(A|B) = P(A) \\cdot P(B|A)' },
      { name: 'Công thức XS toàn phần', latex: 'P(B) = P(A) \\cdot P(B|A) + P(\\bar{A}) \\cdot P(B|\\bar{A})' },
      { name: 'Công thức Bayes', latex: 'P(A|B) = \\frac{P(A) \\cdot P(B|A)}{P(B)}' },
    ],
  },
];

export const FormulaHandbook: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [selectedChapter, setSelectedChapter] = useState<string>('chap-1');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedFormula, setCopiedFormula] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentChapterData = FORMULA_DATA.find((c) => c.chapterId === selectedChapter) || FORMULA_DATA[0];

  const filteredFormulas = currentChapterData.formulas.filter((f) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return f.name.toLowerCase().includes(q) || f.latex.toLowerCase().includes(q);
  });

  const handleCopyLatex = (latex: string) => {
    navigator.clipboard.writeText(`$${latex}$`);
    setCopiedFormula(latex);
    setTimeout(() => setCopiedFormula(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-teal-900 via-teal-800 to-teal-950 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-600/60 flex items-center justify-center border border-teal-400/40">
              <BookOpen className="w-4 h-4 text-teal-200" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white leading-tight">
                Sổ Tay Công Thức Toán 12 Bỏ Túi
              </h2>
              <p className="text-[11px] text-teal-300">
                Toàn bộ 6 chương chuẩn Chương trình GDPT 2018
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-teal-800/80 hover:bg-teal-700 flex items-center justify-center text-teal-200 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Chapter Tabs & Search Toolbar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 space-y-3">
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs font-bold">
            {FORMULA_DATA.map((chap, idx) => (
              <button
                key={chap.chapterId}
                onClick={() => setSelectedChapter(chap.chapterId)}
                className={`px-3 py-1.5 rounded-xl transition whitespace-nowrap ${
                  selectedChapter === chap.chapterId
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                Chương {idx + 1}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm công thức (ví dụ: tiệm cận, tích phân, khoảng cách, Bayes...)"
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Formula Cards List */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-teal-600" />
            <span>{currentChapterData.title}</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredFormulas.map((item, idx) => (
              <div
                key={idx}
                className="p-4 bg-slate-50 rounded-2xl border border-slate-200 hover:border-teal-300 transition space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900">{item.name}</span>
                  <button
                    onClick={() => handleCopyLatex(item.latex)}
                    className="text-slate-400 hover:text-teal-700 text-[11px] flex items-center gap-1 font-semibold"
                    title="Sao chép mã LaTeX"
                  >
                    {copiedFormula === item.latex ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span className="text-emerald-700">Đã chép</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>LaTeX</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="p-2.5 bg-white rounded-xl border border-slate-200 text-center font-mono text-xs overflow-x-auto">
                  <MathContent content={`$$${item.latex}$$`} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Hệ thống biên soạn: Thầy Phan Quốc Cường</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-teal-700 text-white font-bold rounded-xl hover:bg-teal-800 transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
