import React, { useState, useEffect } from "react";
import { GradeLevel, UserRole, StudentProfile, Lesson, Chapter, Question, PracticeTest } from "./types";
import { CURRICULUM_DATA } from "./data/curriculumData";
import { Navbar } from "./components/Navbar";
import { StudentDashboard } from "./components/StudentDashboard";
import { PracticeSession } from "./components/PracticeSession";
import { TeacherDashboard } from "./components/TeacherDashboard";
import { AdminPanel } from "./components/AdminPanel";
import { AiMathAssistantModal } from "./components/AiMathAssistantModal";
import { LessonDocxImportModal } from "./components/LessonDocxImportModal";
import { LessonPracticeTestsModal } from "./components/LessonPracticeTestsModal";
import { AiMatrixExamGeneratorModal } from "./components/AiMatrixExamGeneratorModal";
import { FloatingAiAssistant } from "./components/FloatingAiAssistant";
import { ApiKeySettingsModal } from "./components/ApiKeySettingsModal";
import { MathFunctionGrapherModal } from "./components/MathFunctionGrapherModal";
import { OxyzViewerModal } from "./components/OxyzViewerModal";
import { SpeedrunMathChallengeModal } from "./components/SpeedrunMathChallengeModal";
import { MarkdownTableModal } from "./components/MarkdownTableModal";
import { MathTypeOleConverterModal } from "./components/MathTypeOleConverterModal";
import { UserProfileModal } from "./components/UserProfileModal";
import { UserManagementModal } from "./components/UserManagementModal";
import { LoginModal } from "./components/LoginModal";
import { VisualFormulaEditorModal } from "./components/VisualFormulaEditorModal";
import { getStoredApiKey } from "./utils/geminiClient";

const DEFAULT_STUDENT: StudentProfile = {
  id: "stu_1",
  name: "Phan Quốc Cường",
  studentCode: "THPT-2025-01",
  email: "zalo2299k@gmail.com",
  role: "student",
  grade: 12,
  avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop",
  school: "THPT Chuyên Toán",
  points: 250,
  streakDays: 7,

  progress: {
    g12_c1_l1: {
      lessonId: "g12_c1_l1",
      bestScore: 85,
      passed: true,
      completedAt: new Date().toLocaleDateString(),
      attemptsCount: 2,
      tabSwitchViolations: 0,
    },
  },
};

export default function App() {
  const [chapters, setChapters] = useState<Chapter[]>(CURRICULUM_DATA);
  const [currentGrade, setCurrentGrade] = useState<GradeLevel>(12);
  const [currentRole, setCurrentRole] = useState<UserRole>("student");
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);

  // Multi-Practice Tests state per lesson
  const [isTestsModalOpen, setIsTestsModalOpen] = useState<boolean>(false);
  const [targetLessonForTests, setTargetLessonForTests] = useState<Lesson | null>(null);
  const [activePracticeTest, setActivePracticeTest] = useState<PracticeTest | null>(null);
  const [docxTargetTest, setDocxTargetTest] = useState<PracticeTest | null>(null);

  // AI & Tool Modals
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState<boolean>(false);
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);
  const [isGrapherModalOpen, setIsGrapherModalOpen] = useState<boolean>(false);
  const [isOxyzModalOpen, setIsOxyzModalOpen] = useState<boolean>(false);
  const [isSpeedrunModalOpen, setIsSpeedrunModalOpen] = useState<boolean>(false);

  // New Navigation Bar Tab Modals (Per screenshot request)
  const [isMarkdownTableModalOpen, setIsMarkdownTableModalOpen] = useState<boolean>(false);
  const [isEquationModalOpen, setIsEquationModalOpen] = useState<boolean>(false);
  const [isMathTypeOleModalOpen, setIsMathTypeOleModalOpen] = useState<boolean>(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [isUserManagementModalOpen, setIsUserManagementModalOpen] = useState<boolean>(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [isLogoutConfirm, setIsLogoutConfirm] = useState<boolean>(false);
  const [loginInitialRole, setLoginInitialRole] = useState<UserRole>("student");


  // Lesson-level Word/MathType import state
  const [isDocxModalOpen, setIsDocxModalOpen] = useState<boolean>(false);
  const [docxTargetLesson, setDocxTargetLesson] = useState<Lesson | null>(null);

  // AI Matrix Exam generator state
  const [isMatrixModalOpen, setIsMatrixModalOpen] = useState<boolean>(false);
  const [matrixTargetLesson, setMatrixTargetLesson] = useState<Lesson | null>(null);

  // Student Profile with persistent localStorage
  const [student, setStudent] = useState<StudentProfile>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("STUDENT_PROFILE");
        if (saved) {
          return JSON.parse(saved);
        }
      } catch (e) {
        console.warn("Could not load saved student profile:", e);
      }
    }
    return DEFAULT_STUDENT;
  });

  // Check API Key on mount (Strictly compliant with AI_INSTRUCTIONS.md)
  useEffect(() => {
    const key = getStoredApiKey();
    setHasApiKey(!!key);
    if (!key) {
      setIsApiKeyModalOpen(true);
    }
  }, []);

  // Sync student profile to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("STUDENT_PROFILE", JSON.stringify(student));
    } catch (e) {
      console.warn("Could not save student profile:", e);
    }
  }, [student]);

  // Handle lesson click -> opens multi-practice tests modal
  const handleSelectLesson = (lesson: Lesson) => {
    setTargetLessonForTests(lesson);
    setIsTestsModalOpen(true);
  };

  // Start practicing a specific test
  const handleStartPracticeTest = (lesson: Lesson, test: PracticeTest) => {
    setActiveLesson(lesson);
    setActivePracticeTest(test);
    setIsTestsModalOpen(false);
  };

  // Handle opening Word MathType modal for a specific lesson or test
  const handleOpenDocxImport = (lesson: Lesson, test?: PracticeTest) => {
    setDocxTargetLesson(lesson);
    setDocxTargetTest(test || null);
    setIsDocxModalOpen(true);
  };

  // Manage tests per lesson
  const handleAddTestToLesson = (lessonId: string, newTest: PracticeTest) => {
    setChapters((prev) =>
      prev.map((c) => ({
        ...c,
        lessons: c.lessons.map((l) => {
          if (l.id === lessonId) {
            const currentTests =
              l.practiceTests && l.practiceTests.length > 0
                ? l.practiceTests
                : [
                    {
                      id: "test_1",
                      title: "Đề luyện tập 1 (Tiêu chuẩn)",
                      durationMinutes: l.durationMinutes,
                      questions: l.questions,
                    },
                    {
                      id: "test_2",
                      title: "Đề luyện tập 2 (Phát triển năng lực)",
                      durationMinutes: l.durationMinutes,
                      questions: [],
                    },
                  ];
            return { ...l, practiceTests: [...currentTests, newTest] };
          }
          return l;
        }),
      }))
    );
  };

  const handleDeleteTestFromLesson = (lessonId: string, testId: string) => {
    setChapters((prev) =>
      prev.map((c) => ({
        ...c,
        lessons: c.lessons.map((l) => {
          if (l.id === lessonId) {
            const tests = l.practiceTests || [];
            return { ...l, practiceTests: tests.filter((t) => t.id !== testId) };
          }
          return l;
        }),
      }))
    );
  };

  const handleUpdateTestInLesson = (lessonId: string, updatedTest: PracticeTest) => {
    setChapters((prev) =>
      prev.map((c) => ({
        ...c,
        lessons: c.lessons.map((l) => {
          if (l.id === lessonId) {
            const tests = l.practiceTests || [];
            return {
              ...l,
              practiceTests: tests.map((t) => (t.id === updatedTest.id ? updatedTest : t)),
            };
          }
          return l;
        }),
      }))
    );
  };

  // Handle opening AI Matrix generator for a lesson
  const handleOpenMatrixGenerator = (lesson?: Lesson) => {
    setMatrixTargetLesson(lesson || null);
    setIsMatrixModalOpen(true);
  };

  // Handle lesson completion
  const handleCompleteLesson = (scorePercentage: number, tabViolations: number) => {
    if (!activeLesson) return;

    const isPassed = scorePercentage >= activeLesson.requiredPassPercentage;
    const prevProg = student.progress[activeLesson.id];
    const prevBest = prevProg?.bestScore || 0;

    setStudent((prev) => ({
      ...prev,
      points: prev.points + (isPassed ? 50 : 10),
      progress: {
        ...prev.progress,
        [activeLesson.id]: {
          lessonId: activeLesson.id,
          bestScore: Math.max(prevBest, scorePercentage),
          passed: isPassed || !!prevProg?.passed,
          completedAt: new Date().toLocaleDateString(),
          attemptsCount: (prevProg?.attemptsCount || 0) + 1,
          tabSwitchViolations: tabViolations,
        },
      },
    }));
  };

  // Teacher / Admin: add new questions to a lesson or specific test
  const handleAddQuestionsToLesson = (
    lessonId: string,
    newQuestions: Question[],
    testId?: string
  ) => {
    setChapters((prev) =>
      prev.map((chap) => ({
        ...chap,
        lessons: chap.lessons.map((l) => {
          if (l.id === lessonId) {
            if (testId) {
              const currentTests =
                l.practiceTests && l.practiceTests.length > 0
                  ? l.practiceTests
                  : [
                      {
                        id: "test_1",
                        title: "Đề luyện tập 1 (Tiêu chuẩn)",
                        durationMinutes: l.durationMinutes,
                        questions: l.questions,
                      },
                      {
                        id: "test_2",
                        title: "Đề luyện tập 2 (Phát triển năng lực)",
                        durationMinutes: l.durationMinutes,
                        questions: [],
                      },
                    ];
              const updatedTests = currentTests.map((t) =>
                t.id === testId ? { ...t, questions: newQuestions } : t
              );
              return {
                ...l,
                practiceTests: updatedTests,
                questions: testId === "test_1" ? newQuestions : l.questions,
              };
            }
            return {
              ...l,
              questions: [...l.questions, ...newQuestions],
            };
          }
          return l;
        }),
      }))
    );
  };

  // Start exam directly with dynamically generated questions
  const handleStartDynamicExam = (lesson: Lesson, generatedQuestions: Question[]) => {
    const dynamicLesson: Lesson = {
      ...lesson,
      id: `dynamic_${lesson.id}_${Date.now()}`,
      title: `${lesson.title} (Đề Ma trận AI)`,
      questions: generatedQuestions,
      durationMinutes: Math.max(15, Math.round(generatedQuestions.length * 3)),
    };
    setActiveLesson(dynamicLesson);
  };

  // Teacher / Admin: create new lesson
  const handleCreateLesson = (chapterId: string, newLesson: Lesson) => {
    setChapters((prev) =>
      prev.map((chap) => {
        if (chap.id === chapterId) {
          return {
            ...chap,
            lessons: [...chap.lessons, newLesson],
          };
        }
        return chap;
      })
    );
  };

  // Admin controls
  const handleResetProgress = () => {
    setStudent(DEFAULT_STUDENT);
    localStorage.removeItem("STUDENT_PROFILE");
    alert("Đã thiết lập lại toàn bộ tiến độ học tập!");
  };

  const handleUnlockAllLevels = () => {
    const allProgress: Record<string, any> = {};
    chapters.forEach((c) =>
      c.lessons.forEach((l) => {
        allProgress[l.id] = {
          lessonId: l.id,
          bestScore: 100,
          passed: true,
          completedAt: new Date().toLocaleDateString(),
          attemptsCount: 1,
          tabSwitchViolations: 0,
        };
      })
    );
    setStudent((prev) => ({
      ...prev,
      progress: allProgress,
    }));
    alert("Đã mở khóa tất cả các bài học ở mọi cấp độ (Chế độ Demo)!");
  };

  // Flatten all grade lessons for matrix generator lookup
  const currentGradeLessons = chapters
    .filter((c) => c.grade === currentGrade)
    .flatMap((c) => c.lessons);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      {/* Navigation Header */}
      <Navbar
        currentGrade={currentGrade}
        onSelectGrade={(g) => {
          setCurrentGrade(g);
          setActiveLesson(null);
        }}
        currentRole={currentRole}
        onSelectRole={(r) => {
          setCurrentRole(r);
          setActiveLesson(null);
        }}
        student={student}
        activeView={
          activeLesson
            ? "practice"
            : currentRole === "teacher"
            ? "teacher"
            : currentRole === "admin"
            ? "admin"
            : "dashboard"
        }
        onNavigateHome={() => setActiveLesson(null)}
        onOpenApiKeySettings={() => setIsApiKeyModalOpen(true)}
        hasApiKey={hasApiKey}
        onOpenLogin={(role) => {
          setLoginInitialRole(role);
          setIsLogoutConfirm(false);
          setIsLoginModalOpen(true);
        }}
        /* 7 Tabs from the requested screenshot */
        onOpenGeminiHub={() => setIsAiModalOpen(true)}
        onOpenMarkdownTable={() => setIsMarkdownTableModalOpen(true)}
        onOpenEquation={() => setIsEquationModalOpen(true)}
        onOpenMathTypeOle={() => setIsMathTypeOleModalOpen(true)}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onOpenUserManagement={() => setIsUserManagementModalOpen(true)}
        onLogout={() => {
          setIsLogoutConfirm(true);
          setIsLoginModalOpen(true);
        }}
        /* Interactive Math Tools */
        onOpenGrapher={() => setIsGrapherModalOpen(true)}
        onOpenOxyz={() => setIsOxyzModalOpen(true)}
        onOpenSpeedrun={() => setIsSpeedrunModalOpen(true)}
      />


      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* If user is inside an active practice session */}
        {activeLesson ? (
          <PracticeSession
            lesson={activeLesson}
            practiceTest={activePracticeTest || undefined}
            onBack={() => {
              setActiveLesson(null);
              setActivePracticeTest(null);
            }}
            onComplete={handleCompleteLesson}
          />
        ) : currentRole === "teacher" ? (
          <TeacherDashboard
            chapters={chapters}
            onAddQuestionsToLesson={handleAddQuestionsToLesson}
            onCreateLesson={handleCreateLesson}
            currentGrade={currentGrade}
          />
        ) : currentRole === "admin" ? (
          <AdminPanel
            chapters={chapters}
            student={student}
            onResetProgress={handleResetProgress}
            onUnlockAllLevels={handleUnlockAllLevels}
          />
        ) : (
          <StudentDashboard
            chapters={chapters}
            currentGrade={currentGrade}
            student={student}
            onSelectLesson={handleSelectLesson}
            onOpenAiAssistant={() => setIsAiModalOpen(true)}
            onOpenDocxImport={handleOpenDocxImport}
            onOpenMatrixGenerator={handleOpenMatrixGenerator}
            onOpenGrapher={() => setIsGrapherModalOpen(true)}
            onOpenOxyz={() => setIsOxyzModalOpen(true)}
            onOpenSpeedrun={() => setIsSpeedrunModalOpen(true)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 space-y-1">
          <p className="font-bold text-slate-700">
            Hệ sinh thái Tự luyện Toán THPT (10, 11, 12) • Chương trình GDPT 2018
          </p>
          <p>
            Giáo viên phụ trách chuyên môn: <strong>Phan Quốc Cường</strong> • Hỗ trợ MathJax, AI Gemini Fallback, Nạp đề Word MathType, Xuất Word .doc & AI Soạn đề Ma trận.
          </p>
        </div>
      </footer>

      {/* Mandatory / Settings Modal for Gemini API Key & Model selection (AI_INSTRUCTIONS.md) */}
      <ApiKeySettingsModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        isMandatory={!hasApiKey}
        onKeySaved={() => setHasApiKey(!!getStoredApiKey())}
      />

      {/* 2D Interactive Function Grapher Modal */}
      <MathFunctionGrapherModal
        isOpen={isGrapherModalOpen}
        onClose={() => setIsGrapherModalOpen(false)}
      />

      {/* 3D Oxyz Space Coordinate Viewer Modal */}
      <OxyzViewerModal
        isOpen={isOxyzModalOpen}
        onClose={() => setIsOxyzModalOpen(false)}
      />

      {/* 60s Speedrun Challenge Game Modal */}
      <SpeedrunMathChallengeModal
        isOpen={isSpeedrunModalOpen}
        onClose={() => setIsSpeedrunModalOpen(false)}
        onRewardPoints={(pts) =>
          setStudent((prev) => ({
            ...prev,
            points: prev.points + pts,
            streakDays: prev.streakDays + 1,
          }))
        }
      />

      {/* AI Assistant Chat Modal */}
      <AiMathAssistantModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        student={student}
      />

      {/* Lesson-level Word / MathType & PDF Import Modal */}
      <LessonDocxImportModal
        isOpen={isDocxModalOpen}
        onClose={() => {
          setIsDocxModalOpen(false);
          setDocxTargetLesson(null);
          setDocxTargetTest(null);
        }}
        lesson={docxTargetLesson}
        targetTest={docxTargetTest}
        onImportQuestions={handleAddQuestionsToLesson}
      />

      {/* Lesson-level Multi-Practice Tests Modal */}
      <LessonPracticeTestsModal
        isOpen={isTestsModalOpen}
        onClose={() => {
          setIsTestsModalOpen(false);
          setTargetLessonForTests(null);
        }}
        lesson={
          targetLessonForTests
            ? chapters.flatMap((c) => c.lessons).find((l) => l.id === targetLessonForTests.id) ||
              targetLessonForTests
            : null
        }
        onStartPractice={handleStartPracticeTest}
        onOpenImport={handleOpenDocxImport}
        onAddTest={handleAddTestToLesson}
        onDeleteTest={handleDeleteTestFromLesson}
        onUpdateTest={handleUpdateTestInLesson}
      />

      {/* AI Matrix Exam Generator Modal */}
      <AiMatrixExamGeneratorModal
        isOpen={isMatrixModalOpen}
        onClose={() => {
          setIsMatrixModalOpen(false);
          setMatrixTargetLesson(null);
        }}
        lessons={currentGradeLessons}
        currentGrade={currentGrade}
        preSelectedLesson={matrixTargetLesson}
        onSaveQuestionsToLesson={handleAddQuestionsToLesson}
        onStartExamWithQuestions={handleStartDynamicExam}
      />

      {/* New Navigation Modals per requested screenshot */}
      {/* 2. Bảng Markdown Modal */}
      <MarkdownTableModal
        isOpen={isMarkdownTableModalOpen}
        onClose={() => setIsMarkdownTableModalOpen(false)}
      />

      {/* 3. Equation Formula Editor Standalone Modal */}
      <VisualFormulaEditorModal
        isOpen={isEquationModalOpen}
        onClose={() => setIsEquationModalOpen(false)}
      />

      {/* 4. MathType OLE to LaTeX Converter Modal */}
      <MathTypeOleConverterModal
        isOpen={isMathTypeOleModalOpen}
        onClose={() => setIsMathTypeOleModalOpen(false)}
      />

      {/* 5. User Profile Modal for zalo2299k@gmail.com */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        student={student}
        currentRole={currentRole}
        onUpdateProfile={(updated) => setStudent((prev) => ({ ...prev, ...updated }))}
      />

      {/* 6. User Management & Admin Modal */}
      <UserManagementModal
        isOpen={isUserManagementModalOpen}
        onClose={() => setIsUserManagementModalOpen(false)}
        onUnlockAllLevels={handleUnlockAllLevels}
        onResetProgress={handleResetProgress}
        onSelectRole={(r) => {
          setCurrentRole(r);
          setActiveLesson(null);
        }}
      />

      {/* 7. Login & Logout Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        isLogoutConfirm={isLogoutConfirm}
        initialRole={loginInitialRole}
        currentUserEmail={student.email || "zalo2299k@gmail.com"}
        onConfirmLogout={() => {
          setIsLogoutConfirm(false);
        }}
        onLoginSuccess={(email, role) => {
          setStudent((prev) => ({ ...prev, email }));
          setCurrentRole(role);
          setIsLoginModalOpen(false);
        }}
      />

      {/* Floating AI Chat Assistant Icon at Bottom Right ("Trợ lý AI") */}
      <FloatingAiAssistant student={student} currentGrade={currentGrade} />
    </div>

  );
}
