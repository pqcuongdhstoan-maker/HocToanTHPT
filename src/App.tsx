import React, { useState } from 'react';
import { useApp } from './context/AppContext';
import { Header } from './components/layout/Header';
import { SettingsModal } from './components/layout/SettingsModal';
import { AuthModal } from './components/auth/AuthModal';
import { AccountProvisionModal } from './components/admin/AccountProvisionModal';
import { Banner } from './components/home/Banner';
import { LessonGrid } from './components/home/LessonGrid';
import { TheoryView } from './components/theory/TheoryView';
import { ExamEngine } from './components/exam/ExamEngine';
import { ExamResult } from './components/exam/ExamResult';
import { MathArena } from './components/arena/MathArena';
import { DocxImporter } from './components/admin/DocxImporter';
import { StatsDashboard } from './components/stats/StatsDashboard';
import { ClassManager } from './components/admin/ClassManager';
import { VirtualCasioCalculator } from './components/common/VirtualCasioCalculator';
import { FormulaHandbook } from './components/common/FormulaHandbook';
import { CheckCircle2, AlertCircle, Info, XCircle, GraduationCap } from 'lucide-react';

export const App: React.FC = () => {
  const {
    activeTab,
    toast,
    hideToast,
    isCalculatorOpen,
    setIsCalculatorOpen,
    isHandbookOpen,
    setIsHandbookOpen,
  } = useApp();

  // Banner filter state
  const [selectedSemester, setSelectedSemester] = useState<number | 'all'>('all');
  const [selectedChapterId, setSelectedChapterId] = useState<string | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'in_progress' | 'locked'>('all');

  // Auth & Provisioning Modals State
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isAccountProvisionOpen, setIsAccountProvisionOpen] = useState(false);

  const handleResetFilters = () => {
    setSelectedSemester('all');
    setSelectedChapterId('all');
    setSearchQuery('');
    setStatusFilter('all');
  };

  return (
    <div id="app-root" className="min-h-screen bg-slate-100/80 flex flex-col font-sans text-slate-900 antialiased selection:bg-teal-600 selection:text-white">
      {/* Top Main Navigation Header */}
      <Header
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenAccountProvision={() => setIsAccountProvisionOpen(true)}
      />

      {/* Global Settings & Google Sheets Configuration Modal */}
      <SettingsModal />

      {/* Auth & Login Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />

      {/* Account Provisioning Modal (For Teachers & Admins) */}
      <AccountProvisionModal
        isOpen={isAccountProvisionOpen}
        onClose={() => setIsAccountProvisionOpen(false)}
      />

      {/* Virtual Casio Calculator Modal */}
      <VirtualCasioCalculator
        isOpen={isCalculatorOpen}
        onClose={() => setIsCalculatorOpen(false)}
      />

      {/* Quick Formula Handbook Modal */}
      <FormulaHandbook
        isOpen={isHandbookOpen}
        onClose={() => setIsHandbookOpen(false)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12">
        {/* Tab 1: Curriculum Lessons & Banner */}
        {activeTab === 'lessons' && (
          <div className="space-y-6 animate-fadeIn">
            <Banner
              selectedSemester={selectedSemester}
              setSelectedSemester={setSelectedSemester}
              selectedChapterId={selectedChapterId}
              setSelectedChapterId={setSelectedChapterId}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
            />
            <LessonGrid
              selectedSemester={selectedSemester}
              selectedChapterId={selectedChapterId}
              searchQuery={searchQuery}
              statusFilter={statusFilter}
              onResetFilters={handleResetFilters}
            />
          </div>
        )}

        {/* Tab 2: Theory, Worked Examples, 2D Graph Plotter & 3D Oxyz */}
        {activeTab === 'theory' && (
          <div className="animate-fadeIn">
            <TheoryView />
          </div>
        )}

        {/* Tab 3: Math Arena 1v1 (Gamification) */}
        {activeTab === 'arena' && (
          <div className="animate-fadeIn">
            <MathArena />
          </div>
        )}

        {/* Tab 4: Interactive Exam / Attempt Engine */}
        {activeTab === 'exam' && (
          <div className="animate-fadeIn">
            <ExamEngine />
          </div>
        )}

        {/* Tab 5: Exam Result & Diagnostic Review */}
        {activeTab === 'exam-result' && (
          <div className="animate-fadeIn">
            <ExamResult />
          </div>
        )}

        {/* Tab 6: Analytics & Stats Dashboard */}
        {activeTab === 'stats' && (
          <div className="animate-fadeIn">
            <StatsDashboard />
          </div>
        )}

        {/* Tab 7: DOCX Importer, Word Exporter & Moodle XML */}
        {activeTab === 'docx-import' && (
          <div className="animate-fadeIn">
            <DocxImporter />
          </div>
        )}

        {/* Tab 8: Class & Student Management */}
        {activeTab === 'classes' && (
          <div className="animate-fadeIn">
            <ClassManager />
          </div>
        )}
      </main>

      {/* Symmetrical Educational Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <div className="flex items-center space-x-2 text-slate-700 font-semibold">
              <GraduationCap className="w-4 h-4 text-teal-700" />
              <span>Hệ Thống Tự Luyện Toán THPT 12 • Chương Trình GDPT 2018</span>
            </div>
            <div className="flex items-center space-x-4">
              <span>Biên soạn: <strong className="text-teal-900">Thầy Phan Quốc Cường</strong></span>
              <span>•</span>
              <span>Nền tảng Tự Luyện &amp; Khảo Sát Năng Lực Trực Tuyến</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Toast Notification Container */}
      {toast.show && (
        <div
          id="app-toast"
          className="fixed bottom-6 right-6 z-50 max-w-md w-full bg-white border rounded-2xl shadow-2xl p-4 flex items-start space-x-3 animate-slideUp transition-all"
          style={{
            borderColor:
              toast.type === 'success'
                ? '#10b981'
                : toast.type === 'error'
                ? '#ef4444'
                : toast.type === 'warning'
                ? '#f59e0b'
                : '#0d9488',
          }}
        >
          {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />}
          {toast.type === 'error' && <XCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />}
          {toast.type === 'warning' && <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />}
          {toast.type === 'info' && <Info className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />}

          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold text-slate-900 truncate">{toast.title}</h4>
            <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{toast.message}</p>
          </div>

          <button
            onClick={hideToast}
            className="text-slate-400 hover:text-slate-600 text-xs font-bold p-1 rounded-lg hover:bg-slate-100 transition"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};
