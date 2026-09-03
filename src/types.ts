export type GradeLevel = 10 | 11 | 12;

export type UserRole = "student" | "teacher" | "admin";

export type QuestionPartType =
  | "PART_I"   // Trắc nghiệm 4 lựa chọn (Phần I)
  | "PART_II"  // Câu hỏi Đúng / Sai (Phần II)
  | "PART_III" // Trắc nghiệm trả lời ngắn (Phần III)
  | "PART_IV"; // Tự luận (Phần IV)

export type CognitiveLevel = "Nhận biết" | "Thông hiểu" | "Vận dụng" | "Vận dụng cao";

export interface QuestionOption {
  id: string; // 'A', 'B', 'C', 'D'
  text: string; // Text with LaTeX $...$
}

export interface TrueFalseStatement {
  id: string; // 'a', 'b', 'c', 'd'
  statement: string; // Text with LaTeX
  isCorrect: boolean; // True or False
  explanation?: string;
}

export interface Question {
  id: string;
  partType: QuestionPartType;
  title?: string;
  content: string; // Content with LaTeX ($...$, $$...$$)
  imageUrl?: string;
  options?: QuestionOption[]; // For PART_I
  correctOption?: string; // For PART_I: 'A', 'B', 'C', 'D'
  tfStatements?: TrueFalseStatement[]; // For PART_II: 4 sub-items
  shortAnswerCorrect?: string; // For PART_III: exact numeric or string format (e.g., "-2.5", "1/2", "(1;2;3)")
  shortAnswerTolerance?: number; // Tolerance for numeric checking
  essayRubric?: string; // For PART_IV: Standard step breakdown
  standardSolution: string; // Step-by-step LaTeX solution
  hint?: string;
  points: number;
  cognitiveLevel?: CognitiveLevel;
  topicTag?: string;
}

export interface ExamMatrix {
  id: string;
  name: string;
  description: string;
  timeMinutes: number;
  grade: GradeLevel;
  topic: string;
  part1Count: number; // Số câu Phần I (4 lựa chọn)
  part2Count: number; // Số câu Phần II (Đúng/Sai - 4 ý/câu)
  part3Count: number; // Số câu Phần III (Trả lời ngắn)
  part4Count: number; // Số câu Phần IV (Tự luận)
  cognitiveDistribution: {
    recognition: number; // % hoặc số câu Nhận biết
    comprehension: number; // % hoặc số câu Thông hiểu
    application: number; // % hoặc số câu Vận dụng
    advanced: number; // % hoặc số câu Vận dụng cao
  };
  customRequirements?: string;
}

export interface Lesson {
  id: string;
  chapterId: string;
  order: number;
  title: string;
  subtitle: string;
  description: string;
  durationMinutes: number;
  grade: GradeLevel;
  requiredPassPercentage: number; // Default 80%
  questions: Question[];
  theorySummaryLatex?: string;
}

export interface Chapter {
  id: string;
  grade: GradeLevel;
  order: number;
  title: string;
  description: string;
  iconName: string;
  lessons: Lesson[];
}

export interface StudentProgress {
  lessonId: string;
  bestScore: number; // 0 - 100
  passed: boolean;
  completedAt?: string;
  attemptsCount: number;
  tabSwitchViolations: number;
}

export interface StudentProfile {
  id: string;
  name: string;
  studentCode: string;
  grade: GradeLevel;
  avatar: string;
  school: string;
  points: number;
  streakDays: number;
  progress: Record<string, StudentProgress>; // keyed by lessonId
}

export interface AntiCheatEvent {
  timestamp: string;
  type: "TAB_SWITCH" | "WINDOW_BLUR" | "FULLSCREEN_EXIT" | "DEVTOOLS";
  details: string;
}

export interface ExamSessionState {
  lessonId: string;
  startTime: number;
  answers: Record<string, any>; // questionId -> answer
  tabSwitches: number;
  maxTabSwitchesAllowed: number;
  antiCheatLogs: AntiCheatEvent[];
  isSubmitted: boolean;
  isAutoSubmittedDueToCheat: boolean;
  score?: number;
  maxScore?: number;
  percentage?: number;
  passed?: boolean;
}

export interface CompetencyRadar {
  mathReasoning: number; // Tư duy & lập luận toán học
  modeling: number; // Mô hình hóa toán học
  problemSolving: number; // Giải quyết vấn đề toán học
  mathCommunication: number; // Giao tiếp toán học
  toolUsage: number; // Sử dụng công cụ & phương tiện học toán
}
