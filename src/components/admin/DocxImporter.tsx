import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { parseDocxFile } from '../../services/docxParser';
import { MathContent } from '../common/MathContent';
import { api } from '../../services/api';
import { Question, DocxParseReport } from '../../types';
import { downloadExamDocx } from '../../services/docxExporter';
import { downloadMoodleXml, downloadGiftFile } from '../../services/lmsExporter';
import {
  FileUp,
  FileCheck,
  AlertTriangle,
  Sparkles,
  Save,
  CheckCircle2,
  HelpCircle,
  Eye,
  Trash2,
  Download,
  Loader2,
  RefreshCw,
  FileText,
  Layers,
  Bot,
  FileSpreadsheet,
} from 'lucide-react';

export const DocxImporter: React.FC = () => {
  const { lessons, chapters, showToast, reloadCurriculum } = useApp();

  const [activeTab, setActiveTab] = useState<'import' | 'export' | 'ai_matrix'>('import');
  const [selectedLessonId, setSelectedLessonId] = useState<string>(lessons[0]?.id || 'lesson-1');

  // Import State
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [parseReport, setParseReport] = useState<DocxParseReport | null>(null);
  const [parsedQuestions, setParsedQuestions] = useState<Question[]>([]);
  const [activePreviewIndex, setActivePreviewIndex] = useState<number>(0);

  // Export State
  const [exportIncludeAnswers, setExportIncludeAnswers] = useState<boolean>(true);
  const [exportIncludeSolutions, setExportIncludeSolutions] = useState<boolean>(true);
  const [exportDuration, setExportDuration] = useState<number>(45);
  const [isExportingDocx, setIsExportingDocx] = useState<boolean>(false);

  // AI Matrix Generator State
  const [nbCount, setNbCount] = useState<number>(6);
  const [thCount, setThCount] = useState<number>(4);
  const [vdCount, setVdCount] = useState<number>(2);
  const [vdcCount, setVdcCount] = useState<number>(1);
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);

  const currentLesson = lessons.find((l) => l.id === selectedLessonId) || lessons[0];
  const currentChapter = chapters.find((c) => c.id === currentLesson?.chapterId) || chapters[0];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent) => {
    let file: File | null = null;
    if ('files' in e.target && e.target.files) {
      file = e.target.files[0];
    } else if ('dataTransfer' in e && e.dataTransfer.files) {
      file = e.dataTransfer.files[0];
    }

    if (!file) return;

    if (!file.name.endsWith('.docx')) {
      showToast('Định dạng không hợp lệ', 'Vui lòng chọn file định dạng .docx (Microsoft Word).', 'error');
      return;
    }

    setIsParsing(true);
    try {
      showToast('Đang phân tích file DOCX...', 'Đang bóc tách XML, OMML và công thức MathML sang LaTeX...', 'info');
      const targetLesson = lessons.find((l) => l.id === selectedLessonId);
      const targetChapId = targetLesson?.chapterId || 'chap-1';

      const result = await parseDocxFile(file, selectedLessonId, targetChapId);
      setParseReport(result.report);
      setParsedQuestions(result.questions);
      setActivePreviewIndex(0);

      showToast('Phân tích thành công!', `Đã nhận diện ${result.questions.length} câu hỏi và ${result.report.formulaCount} công thức toán.`, 'success');
    } catch (err: any) {
      console.error('Docx parse error:', err);
      showToast('Lỗi đọc file Word', err.message || 'Không thể xử lý cấu trúc file DOCX.', 'error');
    } finally {
      setIsParsing(false);
    }
  };

  const handleSaveToBank = async () => {
    if (parsedQuestions.length === 0) return;

    setIsSaving(true);
    try {
      showToast('Đang lưu vào ngân hàng đề...', 'Đang đồng bộ hóa câu hỏi vào bài học...', 'info');
      const count = await api.saveQuestionsBatch(selectedLessonId, parsedQuestions);
      await reloadCurriculum();
      showToast('Xuất bản thành công!', `Đã lưu ${count} câu hỏi vào ngân hàng đề bài học.`, 'success');
    } catch (err) {
      console.error('Save error:', err);
      showToast('Lỗi lưu câu hỏi', 'Vui lòng thử lại sau.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportDocx = async () => {
    setIsExportingDocx(true);
    try {
      showToast('Đang tạo file Word...', 'Đang định dạng 4 phần trắc nghiệm chuẩn Bộ GD&ĐT...', 'info');
      const res = await fetch(`/api/questions/lesson/${selectedLessonId}`);
      const data = await res.json();
      const qs = (data.questions && data.questions.length > 0) ? data.questions : parsedQuestions;

      if (!qs || qs.length === 0) {
        showToast('Không có câu hỏi', 'Bài học chưa có câu hỏi nào để xuất đề.', 'warning');
        return;
      }

      await downloadExamDocx({
        lessonTitle: `Bài ${currentLesson.number}: ${currentLesson.title}`,
        chapterTitle: currentChapter.title,
        schoolName: 'TRƯỜNG THPT CHUYÊN – TỰ LUYỆN TOÁN 12',
        teacherName: 'Thầy Phan Quốc Cường',
        durationMinutes: exportDuration,
        includeAnswers: exportIncludeAnswers,
        includeSolutions: exportIncludeSolutions,
        questions: qs,
      });

      showToast('Xuất Word thành công!', 'File .docx đã được tải về máy của bạn.', 'success');
    } catch (err: any) {
      console.error('Export error:', err);
      showToast('Lỗi xuất Word', err?.message || 'Không thể tạo file Word.', 'error');
    } finally {
      setIsExportingDocx(false);
    }
  };

  const handleExportMoodle = async () => {
    try {
      const res = await fetch(`/api/questions/lesson/${selectedLessonId}`);
      const data = await res.json();
      const qs = data.questions || [];
      if (qs.length === 0) {
        showToast('Không có câu hỏi', 'Vui lòng chọn bài học có câu hỏi.', 'warning');
        return;
      }
      downloadMoodleXml(qs, `Ngan_Hang_De_Bai_${currentLesson.number}_Moodle.xml`);
      showToast('Xuất Moodle XML thành công!', 'File XML sẵn sàng nạp vào hệ thống LMS trường học.', 'success');
    } catch (err) {
      showToast('Lỗi xuất Moodle', 'Vui lòng thử lại sau.', 'error');
    }
  };

  const handleExportGift = async () => {
    try {
      const res = await fetch(`/api/questions/lesson/${selectedLessonId}`);
      const data = await res.json();
      const qs = data.questions || [];
      if (qs.length === 0) {
        showToast('Không có câu hỏi', 'Vui lòng chọn bài học có câu hỏi.', 'warning');
        return;
      }
      downloadGiftFile(qs, `De_Toan_12_Bai_${currentLesson.number}_GIFT.txt`);
      showToast('Xuất GIFT thành công!', 'File GIFT text đã được tải về.', 'success');
    } catch (err) {
      showToast('Lỗi xuất GIFT', 'Vui lòng thử lại sau.', 'error');
    }
  };

  return (
    <div id="docx-importer-container" className="max-w-6xl mx-auto space-y-8 pb-20 animate-fadeIn">
      {/* Header Bar */}
      <div className="bg-white rounded-3xl border border-teal-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-teal-800 text-xs font-bold uppercase tracking-wider mb-1">
            <FileUp className="w-4 h-4 text-teal-600" />
            <span>Studio Ngân Hàng Đề Thi &amp; Xuất Bản Đa Nền Tảng</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Quản Lý &amp; Xuất Bản Đề Thi Toán 12
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Nhập đề Word (OMML/LaTeX) • Xuất đề Word in ấn chuẩn Bộ • Xuất Moodle XML &amp; GIFT
          </p>
        </div>

        {/* Target Lesson Selector */}
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-slate-600 whitespace-nowrap">Chọn bài học:</span>
          <select
            value={selectedLessonId}
            onChange={(e) => setSelectedLessonId(e.target.value)}
            className="bg-teal-50 border border-teal-300 text-teal-950 font-bold text-xs sm:text-sm rounded-xl px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:outline-none"
          >
            {lessons.map((l) => (
              <option key={l.id} value={l.id}>
                Bài {l.number}: {l.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 3 Sub-Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-3 text-xs font-bold">
        <button
          onClick={() => setActiveTab('import')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
            activeTab === 'import'
              ? 'bg-teal-700 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <FileUp className="w-4 h-4" />
          <span>1. Nhập Đề Từ File Word (.DOCX)</span>
        </button>

        <button
          onClick={() => setActiveTab('export')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
            activeTab === 'export'
              ? 'bg-teal-700 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Download className="w-4 h-4 text-amber-500" />
          <span>2. Xuất Đề Word (.DOCX) &amp; Moodle LMS</span>
        </button>
      </div>

      {/* TAB 1: IMPORT DOCX */}
      {activeTab === 'import' && (
        <div className="space-y-6">
          {/* Drag & Drop Upload Zone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              handleFileUpload(e);
            }}
            className="bg-white border-2 border-dashed border-teal-300 hover:border-teal-500 rounded-3xl p-8 sm:p-12 text-center transition-all bg-gradient-to-b from-teal-50/30 to-white shadow-xs"
          >
            <div className="max-w-md mx-auto space-y-4">
              <div className="w-16 h-16 bg-teal-100 text-teal-700 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                {isParsing ? <Loader2 className="w-8 h-8 animate-spin" /> : <FileUp className="w-8 h-8" />}
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {isParsing ? 'Đang phân tích cấu trúc XML & công thức OMML...' : 'Kéo thả file .docx vào đây hoặc bấm để chọn'}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Hỗ trợ định dạng Microsoft Word 2007 - 2024 (.docx), MathType và Word Equation.
                </p>
              </div>

              <label className="inline-flex items-center space-x-2 px-6 py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl cursor-pointer transition shadow active:scale-95">
                <FileCheck className="w-4 h-4" />
                <span>Chọn file Word từ máy tính</span>
                <input
                  type="file"
                  accept=".docx"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={isParsing}
                />
              </label>
            </div>
          </div>

          {/* Parsed Preview Section */}
          {parsedQuestions.length > 0 && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>Đã nhận diện thành công {parsedQuestions.length} câu hỏi</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Bao gồm {parseReport?.formulaCount || 0} công thức toán học đã chuyển đổi sang LaTeX.
                  </p>
                </div>

                <button
                  onClick={handleSaveToBank}
                  disabled={isSaving}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition flex items-center space-x-1.5 shadow"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>Lưu vào ngân hàng bài học</span>
                </button>
              </div>

              {/* Preview Cards */}
              <div className="space-y-4">
                {parsedQuestions.slice(0, 5).map((q, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-teal-900 uppercase">Câu {idx + 1} ({q.type})</span>
                      <span className="text-[10px] bg-slate-200 px-2 py-0.5 rounded-full font-bold">{q.difficulty}</span>
                    </div>
                    <div className="text-slate-800">
                      <MathContent content={q.stem} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: EXPORT DOCX & LMS */}
      {activeTab === 'export' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Word Export Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Xuất Đề Thi Word (.DOCX)</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Tạo file Microsoft Word hoàn chỉnh, định dạng chuẩn quy cách đề thi THPT Quốc gia của Bộ Giáo dục &amp; Đào tạo.
                </p>
              </div>

              <div className="space-y-3 pt-2 text-xs">
                <label className="flex items-center space-x-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={exportIncludeAnswers}
                    onChange={(e) => setExportIncludeAnswers(e.target.checked)}
                    className="w-4 h-4 accent-teal-600 rounded"
                  />
                  <span className="font-semibold text-slate-800">Kèm Bảng Đáp Án Nhanh ở cuối trang</span>
                </label>

                <label className="flex items-center space-x-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={exportIncludeSolutions}
                    onChange={(e) => setExportIncludeSolutions(e.target.checked)}
                    className="w-4 h-4 accent-teal-600 rounded"
                  />
                  <span className="font-semibold text-slate-800">Kèm Lời Giải Chi Tiết Từng Bước (Bản Giáo Viên)</span>
                </label>

                <div className="flex items-center space-x-2 pt-1">
                  <span className="text-slate-600 font-semibold">Thời gian làm bài:</span>
                  <select
                    value={exportDuration}
                    onChange={(e) => setExportDuration(parseInt(e.target.value))}
                    className="p-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold"
                  >
                    <option value={15}>15 phút (Đề kiểm tra nhanh)</option>
                    <option value={45}>45 phút (Kiểm tra 1 tiết)</option>
                    <option value={90}>90 phút (Đề thi thử THPT)</option>
                  </select>
                </div>
              </div>
            </div>

            <button
              onClick={handleExportDocx}
              disabled={isExportingDocx}
              className="w-full py-3 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-2xl transition flex items-center justify-center gap-2 shadow"
            >
              {isExportingDocx ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              <span>Tải Đề Thi Word (.docx) Ngay</span>
            </button>
          </div>

          {/* Moodle LMS & GIFT Export Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center">
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Xuất Sang Moodle XML &amp; GIFT</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Tương thích 100% với Moodle LMS, Quizizz, Google Forms và các phần mềm trộn đề trắc nghiệm trường học.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-1.5">
                <div className="font-bold text-slate-900">Chuẩn hỗ trợ:</div>
                <div>• <strong>Moodle XML</strong>: Giữ nguyên công thức toán, đáp án và lời giải.</div>
                <div>• <strong>GIFT Format</strong>: Định dạng text nhẹ, dễ chỉnh sửa hàng loạt.</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleExportMoodle}
                className="py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-2xl transition flex items-center justify-center gap-1.5 shadow"
              >
                <Download className="w-4 h-4" />
                <span>Moodle XML</span>
              </button>

              <button
                onClick={handleExportGift}
                className="py-3 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-2xl transition flex items-center justify-center gap-1.5 shadow"
              >
                <Download className="w-4 h-4" />
                <span>GIFT Text</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
