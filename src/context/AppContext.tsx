import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { UserProfile, Chapter, Lesson, ClassGroup, StudentLessonProgress, Attempt, Question } from '../types';
import { DEMO_USERS, CHAPTERS, LESSONS, INITIAL_CLASSES } from '../data/seedCurriculum';
import { api } from '../services/api';
import {
  fetchGoogleSheetLive,
  getSavedSheetConfig,
  saveSheetConfig,
  GoogleSheetConfig,
} from '../services/googleSheetService';

export type AppTab = 'lessons' | 'theory' | 'arena' | 'exam' | 'exam-result' | 'stats' | 'docx-import' | 'classes';

interface ToastState {
  show: boolean;
  title: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

export interface SheetSyncStatus {
  sheetUrl: string;
  sheetGid: string;
  autoSync: boolean;
  lastSyncedAt?: string;
  classCount?: number;
  studentCount?: number;
  isSyncing: boolean;
  error: string | null;
}

interface AppContextType {
  currentUser: UserProfile;
  setCurrentUser: (user: UserProfile) => void;
  switchRole: (role: UserProfile['role']) => void;
  chapters: Chapter[];
  lessons: Lesson[];
  classes: ClassGroup[];
  setClasses: (classes: ClassGroup[]) => void;
  students: UserProfile[];
  setStudents: (students: UserProfile[]) => void;
  studentProgress: Record<string, StudentLessonProgress>;
  refreshProgress: () => Promise<void>;
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  selectedLessonId: string;
  setSelectedLessonId: (id: string) => void;
  activeAttempt: Attempt | null;
  setActiveAttempt: (a: Attempt | null) => void;
  activeQuestions: Question[];
  setActiveQuestions: (q: Question[]) => void;
  toast: ToastState;
  showToast: (title: string, message: string, type?: ToastState['type']) => void;
  hideToast: () => void;
  reloadCurriculum: () => Promise<void>;
  isLoading: boolean;

  // Google Sheets Cloud Sync & Settings State
  sheetSyncState: SheetSyncStatus;
  syncClassesFromSheet: (customUrl?: string, gid?: string) => Promise<boolean>;
  updateSheetConfig: (config: Partial<GoogleSheetConfig>) => void;
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;
  settingsTab: 'sheet' | 'ai';
  setSettingsTab: (tab: 'sheet' | 'ai') => void;

  // Virtual Calculator & Formula Handbook
  isCalculatorOpen: boolean;
  setIsCalculatorOpen: (open: boolean) => void;
  isHandbookOpen: boolean;
  setIsHandbookOpen: (open: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Default to student demo user
  const [currentUser, setCurrentUser] = useState<UserProfile>(DEMO_USERS[2]);
  const [chapters, setChapters] = useState<Chapter[]>(CHAPTERS);
  const [lessons, setLessons] = useState<Lesson[]>(LESSONS);
  const [classes, setClasses] = useState<ClassGroup[]>(INITIAL_CLASSES);
  const [students, setStudents] = useState<UserProfile[]>(() => DEMO_USERS.filter((u) => u.role === 'student'));
  const [studentProgress, setStudentProgress] = useState<Record<string, StudentLessonProgress>>(() => {
    const initialProg: Record<string, StudentLessonProgress> = {
      'lesson-1': {
        lessonId: 'lesson-1',
        isUnlocked: true,
        masteryPercent: 65,
        passed: false,
        attemptsCount: 1,
        bestScore: 6.5,
        status: 'in_progress',
        lastAttemptAt: new Date().toISOString(),
      },
    };
    LESSONS.forEach((l, idx) => {
      if (idx > 0) {
        initialProg[l.id] = {
          lessonId: l.id,
          isUnlocked: false,
          masteryPercent: 0,
          passed: false,
          attemptsCount: 0,
          bestScore: 0,
          status: 'locked',
        };
      }
    });
    return initialProg;
  });
  const [activeTab, setActiveTab] = useState<AppTab>('lessons');
  const [selectedLessonId, setSelectedLessonId] = useState<string>('lesson-1');
  const [activeAttempt, setActiveAttempt] = useState<Attempt | null>(null);
  const [activeQuestions, setActiveQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Tools & Modals State
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState<boolean>(false);
  const [isHandbookOpen, setIsHandbookOpen] = useState<boolean>(false);
  const [settingsTab, setSettingsTab] = useState<'sheet' | 'ai'>('sheet');

  // Google Sheet state
  const initialConfig = getSavedSheetConfig();
  const [sheetSyncState, setSheetSyncState] = useState<SheetSyncStatus>({
    sheetUrl: initialConfig.sheetUrl,
    sheetGid: initialConfig.sheetGid || '0',
    autoSync: initialConfig.autoSync ?? true,
    lastSyncedAt: initialConfig.lastSyncedAt,
    classCount: initialConfig.classCount || 20,
    studentCount: initialConfig.studentCount || 80,
    isSyncing: false,
    error: null,
  });

  const [toast, setToast] = useState<ToastState>({
    show: false,
    title: '',
    message: '',
    type: 'info',
  });

  const showToast = (title: string, message: string, type: ToastState['type'] = 'info') => {
    setToast({ show: true, title, message, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 4500);
  };

  const hideToast = () => {
    setToast((prev) => ({ ...prev, show: false }));
  };

  const loadData = async () => {
    try {
      const data = await api.getCurriculum();
      if (data.chapters && data.chapters.length > 0) setChapters(data.chapters);
      if (data.lessons && data.lessons.length > 0) setLessons(data.lessons);
      if (data.classes && data.classes.length > 0) setClasses(data.classes);

      if (currentUser?.id) {
        const prog = await api.getStudentProgress(currentUser.id);
        if (prog && Object.keys(prog).length > 0) {
          setStudentProgress(prog);
        }
      }
    } catch (err) {
      console.warn('Loaded curriculum from fallback:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshProgress = async () => {
    if (!currentUser?.id) return;
    try {
      const prog = await api.getStudentProgress(currentUser.id);
      setStudentProgress(prog);
    } catch (err) {
      console.error('Failed to refresh progress:', err);
    }
  };

  const reloadCurriculum = async () => {
    await loadData();
  };

  const switchRole = (role: 'student' | 'teacher' | 'admin') => {
    const target = DEMO_USERS.find((u) => u.role === role) || DEMO_USERS[0];
    setCurrentUser(target);
    showToast(
      'Chuyển vai trò thành công',
      `Đang đăng nhập với quyền: ${
        target.role === 'admin'
          ? 'Quản trị viên'
          : target.role === 'teacher'
          ? 'Giáo viên (Thầy Phan Quốc Cường)'
          : 'Học sinh (Nguyễn Văn An)'
      }`,
      'success'
    );
  };

  const updateSheetConfig = (newConfig: Partial<GoogleSheetConfig>) => {
    setSheetSyncState((prev) => {
      const updated: SheetSyncStatus = {
        ...prev,
        ...newConfig,
      };
      saveSheetConfig({
        sheetUrl: updated.sheetUrl,
        sheetGid: updated.sheetGid,
        autoSync: updated.autoSync,
        lastSyncedAt: updated.lastSyncedAt,
        classCount: updated.classCount,
        studentCount: updated.studentCount,
      });
      return updated;
    });
  };

  const syncClassesFromSheet = useCallback(
    async (customUrl?: string, gid?: string): Promise<boolean> => {
      const targetUrl = customUrl || sheetSyncState.sheetUrl;
      const targetGid = gid || sheetSyncState.sheetGid || '0';

      if (!targetUrl) {
        showToast('Chưa nhập liên kết', 'Vui lòng cung cấp link Google Sheet để đồng bộ.', 'warning');
        return false;
      }

      setSheetSyncState((prev) => ({ ...prev, isSyncing: true, error: null }));
      showToast('Đang kết nối Google Sheets...', 'Hệ thống đang tải và phân tích dữ liệu trực tuyến...', 'info');

      try {
        const result = await fetchGoogleSheetLive(targetUrl, targetGid);

        if (!result.success || result.classes.length === 0) {
          throw new Error(result.message || 'Không tìm thấy dữ liệu lớp học trong Google Sheet.');
        }

        // Update Context State
        setClasses(result.classes);
        if (result.students.length > 0) {
          setStudents(result.students);
        }

        const now = new Date().toISOString();

        // Sync with backend API
        try {
          await api.syncGoogleSheet(targetUrl, result.classes, result.students);
        } catch (apiErr) {
          console.warn('Backend sync failed, state updated in browser context:', apiErr);
        }

        // Update local sync status
        const updatedConfig: GoogleSheetConfig = {
          sheetUrl: targetUrl,
          sheetGid: targetGid,
          autoSync: sheetSyncState.autoSync,
          lastSyncedAt: now,
          classCount: result.classes.length,
          studentCount: result.students.length,
        };
        saveSheetConfig(updatedConfig);

        setSheetSyncState({
          sheetUrl: targetUrl,
          sheetGid: targetGid,
          autoSync: sheetSyncState.autoSync,
          lastSyncedAt: now,
          classCount: result.classes.length,
          studentCount: result.students.length,
          isSyncing: false,
          error: null,
        });

        showToast(
          'Đồng bộ thành công!',
          `Đã kết nối và nạp ${result.classes.length} lớp học & ${result.students.length} học sinh từ Google Sheets.`,
          'success'
        );
        return true;
      } catch (err: any) {
        console.error('Google Sheet sync error:', err);
        const errMsg = err?.message || 'Không thể đồng bộ Google Sheet. Vui lòng kiểm tra lại liên kết và quyền chia sẻ.';
        setSheetSyncState((prev) => ({ ...prev, isSyncing: false, error: errMsg }));
        showToast('Lỗi đồng bộ Google Sheets', errMsg, 'error');
        return false;
      }
    },
    [sheetSyncState.sheetUrl, sheetSyncState.sheetGid, sheetSyncState.autoSync]
  );

  useEffect(() => {
    loadData();
  }, [currentUser?.id]);

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        switchRole,
        chapters,
        lessons,
        classes,
        setClasses,
        students,
        setStudents,
        studentProgress,
        refreshProgress,
        activeTab,
        setActiveTab,
        selectedLessonId,
        setSelectedLessonId,
        activeAttempt,
        setActiveAttempt,
        activeQuestions,
        setActiveQuestions,
        toast,
        showToast,
        hideToast,
        reloadCurriculum,
        isLoading,

        // Sheet and Settings
        sheetSyncState,
        syncClassesFromSheet,
        updateSheetConfig,
        isSettingsOpen,
        setIsSettingsOpen,
        settingsTab,
        setSettingsTab,

        // Virtual Calculator & Formula Handbook
        isCalculatorOpen,
        setIsCalculatorOpen,
        isHandbookOpen,
        setIsHandbookOpen,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
