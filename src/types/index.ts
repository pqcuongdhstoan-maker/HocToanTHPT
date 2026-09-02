export type UserRole = 'admin' | 'teacher' | 'student';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  avatarUrl?: string;
  classId?: string;
  className?: string;
  schoolYear?: string;
  createdAt: string;
  updatedAt: string;
  status: 'active' | 'locked';
  xp: number;
  level: number;
  streakDays: number;
  lastActiveAt: string;
  badges: string[];
}

export interface ClassRoom {
  id: string;
  name: string;
  grade: number; // 12
  teacherId: string;
  teacherName: string;
  schoolYear: string;
  studentCount: number;
}

export type ClassGroup = ClassRoom;


export interface Chapter {
  id: string;
  number: number;
  title: string;
  description: string;
  semester: 'HK1' | 'HK2';
  lessonCount: number;
  totalQuestions: number;
}

export interface Lesson {
  id: string;
  chapterId: string;
  order: number;
  number: number;
  title: string;
  description: string;
  semester: 'HK1' | 'HK2';
  durationMinutes: number;
  isMandatory: boolean;
  mcqCount: number;
  tfCount: number;
  saCount: number;
  essayCount: number;
  totalQuestions: number;
  minMasteryToUnlockNext: number; // 80%
  prerequisiteLessonId?: string;
  tags: string[];
}

// Theory & Examples
export interface TheorySection {
  id: string;
  lessonId: string;
  order: number;
  title: string;
  summary: string;
  contentLatex: string; // Rich LaTeX/markdown
  definitions: string[];
  theorems: string[];
  formulas: { title: string; latex: string; note?: string }[];
  keyNotes: string[];
  commonMistakes: string[];
  tips: string[];
}

export interface TheoryExample {
  id: string;
  lessonId: string;
  order: number;
  title: string;
  difficulty: 'NB' | 'TH' | 'VD' | 'VDC'; // Nhận biết, Thông hiểu, Vận dụng, Vận dụng cao
  stemLatex: string;
  solutionSteps: { step: number; title: string; latex: string; explanation: string }[];
  tips?: string;
}

export interface MiniQuizItem {
  id: string;
  lessonId: string;
  sectionId?: string;
  question: string;
  questionLatex?: string;
  type: 'single_choice' | 'matching' | 'fill_blank';
  options?: { id: string; text: string; latex?: string }[];
  correctAnswer: string | string[];
  explanation: string;
  relatedTheoryTip?: string;
}

// Question Model
export type QuestionType = 'mcq' | 'true_false' | 'short_answer' | 'essay';
export type DifficultyLevel = 'NB' | 'TH' | 'VD' | 'VDC';

export interface Option {
  id: string; // 'A' | 'B' | 'C' | 'D' ...
  text: string;
  latex?: string;
  imageUrl?: string;
}

export interface TrueFalseStatement {
  id: string; // 'a', 'b', 'c', 'd'
  statement: string;
  statementLatex?: string;
  isCorrect: boolean; // True or False
  explanation?: string;
}

export interface RubricItem {
  id: string;
  criterion: string;
  maxPoints: number;
  description: string;
}

export interface Question {
  id: string;
  lessonId: string;
  chapterId: string;
  type: QuestionType;
  difficulty: DifficultyLevel;
  order: number;
  points: number;
  stem: string;
  stemLatex?: string;
  media?: { type: 'image'; url: string; caption?: string }[];
  options?: Option[]; // For MCQ
  allowMultiple?: boolean;
  statements?: TrueFalseStatement[]; // For True/False
  shortAnswerKey?: {
    acceptedValues: string[]; // e.g. ["3/4", "0.75", "0,75"]
    isNumeric: boolean;
    tolerance?: number; // e.g. 0.01
    unit?: string;
  };
  correctAnswer?: string | string[]; // 'A' or ['A', 'C'] for MCQ
  rubric?: RubricItem[]; // For Essay
  solution: string;
  solutionLatex?: string;
  tags: string[];
  sourceImportId?: string;
  confidenceScore?: number; // From docx parser
}

// Exam & Attempt Engine
export interface ExamConfig {
  id: string;
  lessonId: string;
  title: string;
  durationMinutes: number;
  maxAttempts: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  strictProctoring: boolean; // Anti-tab switch mode
  proctoringAction: 'warn' | 'warn_then_penalty' | 'auto_submit_first' | 'auto_submit_second';
  penaltySeconds?: number;
  passingMasteryPercent: number; // default 80
  allowAiHints: boolean;
  maxAiHintsPerAttempt: number;
  showSolutionAfterSubmit: boolean;
  version: number;
}

export interface AttemptAnswer {
  questionId: string;
  type: QuestionType;
  selectedOption?: string | string[]; // MCQ
  tfAnswers?: Record<string, boolean>; // {'a': true, 'b': false, 'c': true, 'd': true}
  shortAnswerText?: string;
  essayContent?: string;
  essayAttachments?: { name: string; url: string; size: number; mimeType: string }[];
  isMarkedForReview: boolean;
  earnedPoints?: number;
  isCorrect?: boolean;
  teacherScore?: number;
  teacherFeedback?: string;
  aiSuggestedFeedback?: string;
  updatedAt: string;
}

export interface ProctorViolationLog {
  timestamp: string;
  type: 'tab_switch' | 'window_blur' | 'fullscreen_exit' | 'network_reconnect';
  violationCount: number;
  actionTaken: 'warning' | 'penalty_applied' | 'auto_submitted';
}

export interface Attempt {
  id: string;
  examId: string;
  lessonId: string;
  userId: string;
  userName: string;
  userClass: string;
  startedAt: string;
  submittedAt?: string;
  serverExpiryTime: string;
  durationSpentSeconds: number;
  status: 'in_progress' | 'submitted' | 'graded';
  questionOrder: string[]; // shuffled IDs
  answers: Record<string, AttemptAnswer>;
  totalScore: number;
  maxScore: number;
  mcqScore: number;
  tfScore: number;
  saScore: number;
  essayScore: number;
  isPendingManualGrading: boolean;
  masteryPercent: number;
  violations: ProctorViolationLog[];
  aiHintsUsed: number;
  lastSavedAt: string;
}

export interface StudentLessonProgress {
  lessonId: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'locked';
  masteryPercent: number;
  highestScore: number;
  attemptsCount: number;
  lastAttemptId?: string;
  lastAttemptAt?: string;
  unlockedAt?: string;
  isManuallyUnlocked?: boolean;
  manualUnlockReason?: string;
  requiredMasteryToUnlock: number;
  prerequisiteMet: boolean;
}

// Content Block Model for rich question representation
export type ContentBlock =
  | { type: 'text'; text: string }
  | { type: 'inlineMath'; latex: string; originalSource?: string; mathml?: string }
  | { type: 'blockMath'; latex: string; originalSource?: string; mathml?: string }
  | { type: 'image'; url: string; width?: number; height?: number; alt?: string; rId?: string }
  | { type: 'table'; rows: string[][]; latexArray?: string; rawXml?: string }
  | { type: 'lineBreak' }
  | { type: 'unsupported'; originalXml?: string; message: string };

export interface MathFormulaDetail {
  type: 'math';
  latex: string;
  mathml?: string;
  originalOmml?: string;
  displayMode: 'inline' | 'block';
  conversionStatus: 'success' | 'warning' | 'failed' | 'fallback-image';
  previewImageUrl?: string;
}

// DOCX Parser models
export interface DocxParseWarning {
  lineOrIndex: number;
  code: string;
  message: string;
  rawText?: string;
  severity: 'low' | 'medium' | 'high';
}

export interface DocxParseReport {
  fileName: string;
  fileSize: number;
  totalDetectedQuestions: number;
  ommlCount: number;
  mathTypeCount: number;
  convertedLatexCount: number;
  fallbackImageCount: number;
  formulaCount: number;
  imageCount: number;
  tableCount: number;
  mcqCount: number;
  tfCount: number;
  saCount: number;
  essayCount: number;
  warnings: DocxParseWarning[];
  unparsedParagraphs: string[];
  parsedAt: string;
  version: number;
}

export interface DocxImportJob {
  id: string;
  lessonId: string;
  fileName: string;
  uploadedBy: string;
  status: 'uploaded' | 'parsing' | 'needs_review' | 'published' | 'failed';
  report: DocxParseReport;
  parsedQuestions: Question[];
  createdAt: string;
  publishedAt?: string;
}

// AI Service models
export interface AiChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  latex?: string;
  timestamp: string;
  suggestedAction?: 'next_hint' | 'view_formula' | 'practice_similar';
}

export interface AiUsageQuota {
  role: UserRole;
  dailyLimit: number;
  usedToday: number;
  remaining: number;
}

// Stats & Analytics
export interface StudentStats {
  completedLessons: number;
  totalLessons: number;
  overallMasteryPercent: number;
  totalAttempts: number;
  averageScore: number;
  highestScore: number;
  totalStudyMinutes: number;
  xp: number;
  levelTier: 'Khởi động' | 'Nền tảng' | 'Thành thạo' | 'Chinh phục';
  streakDays: number;
  scoreHistory: { date: string; score: number; lessonTitle: string }[];
  chapterMastery: { chapterId: string; title: string; masteryPercent: number }[];
  weakSkills: { tag: string; accuracyPercent: number; questionCount: number; lessonId: string }[];
  badges: { id: string; name: string; icon: string; description: string; unlockedAt: string }[];
}

export interface TeacherClassStats {
  classId: string;
  className: string;
  totalStudents: number;
  activeStudents: number;
  completionRate: number;
  averageMastery: number;
  averageAttempts: number;
  topMisconceptions: { questionStem: string; wrongAnswerRate: number; commonWrongOption: string }[];
  proctorViolationsCount: number;
  studentsNeedingSupport: { id: string; name: string; mastery: number; lastActive: string }[];
}

export interface AdminSystemStats {
  totalUsers: number;
  totalStudents: number;
  totalTeachers: number;
  activeToday: number;
  totalAttempts: number;
  totalImportJobs: number;
  parserSuccessRate: number;
  aiQueriesToday: number;
  storageUsedMb: number;
  auditLogsCount: number;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  target: string;
  details?: string;
  timestamp: string;
  ip?: string;
}
