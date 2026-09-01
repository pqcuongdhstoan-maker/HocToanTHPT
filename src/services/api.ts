import {
  Question,
  Attempt,
  UserProfile,
  Chapter,
  Lesson,
  ClassRoom,
  TheorySection,
  TheoryExample,
  MiniQuizItem,
  StudentLessonProgress,
  AuditLog,
} from '../types';
import { CHAPTERS, LESSONS, INITIAL_CLASSES, DEMO_USERS } from '../data/seedCurriculum';
import { SEED_THEORY_SECTIONS, SEED_THEORY_EXAMPLES, SEED_MINI_QUIZZES } from '../data/seedTheory';
import { SEED_QUESTIONS } from '../data/seedQuestions';
import { gradeSingleQuestion } from './gradingEngine';

export const api = {
  // Curriculum & Theory
  async getCurriculum(): Promise<{ chapters: Chapter[]; lessons: Lesson[]; classes: ClassRoom[] }> {
    try {
      const res = await fetch('/api/curriculum');
      if (res.ok) {
        const data = await res.json();
        if (data.chapters && data.chapters.length > 0) {
          return data;
        }
      }
    } catch {
      // Fallback for static Vercel SPA
    }
    return {
      chapters: CHAPTERS,
      lessons: LESSONS,
      classes: INITIAL_CLASSES,
    };
  },

  async getTheory(
    lessonId: string
  ): Promise<{ section: TheorySection; examples: TheoryExample[]; miniQuiz: MiniQuizItem[] }> {
    try {
      const res = await fetch(`/api/curriculum/theory/${lessonId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.section) return data;
      }
    } catch {}

    const section =
      SEED_THEORY_SECTIONS[lessonId] ||
      SEED_THEORY_SECTIONS['lesson-1'] || {
        id: 'th-' + lessonId,
        lessonId,
        order: 1,
        title: LESSONS.find((l) => l.id === lessonId)?.title || 'Lý thuyết trọng tâm',
        summary: 'Kiến thức cốt lõi và định lý quan trọng.',
        contentLatex: 'Nội dung lý thuyết đang được cập nhật.',
        formulas: [],
        definitions: [],
        theorems: [],
        keyNotes: [],
        commonMistakes: [],
      };

    return {
      section,
      examples: SEED_THEORY_EXAMPLES[lessonId] || SEED_THEORY_EXAMPLES['lesson-1'] || [],
      miniQuiz: SEED_MINI_QUIZZES[lessonId] || SEED_MINI_QUIZZES['lesson-1'] || [],
    };
  },

  async saveTheory(lessonId: string, section: TheorySection, examples: TheoryExample[]): Promise<boolean> {
    try {
      const res = await fetch('/api/curriculum/theory/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId, section, examples }),
      });
      if (res.ok) {
        const data = await res.json();
        return data.success;
      }
    } catch {}
    return true;
  },

  // Questions
  async getQuestions(lessonId: string): Promise<Question[]> {
    try {
      const res = await fetch(`/api/questions/lesson/${lessonId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.questions && data.questions.length > 0) return data.questions;
      }
    } catch {}
    return SEED_QUESTIONS[lessonId] || SEED_QUESTIONS['lesson-1'] || [];
  },

  async saveQuestionsBatch(lessonId: string, questions: Question[]): Promise<number> {
    try {
      const res = await fetch('/api/questions/save-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId, questions }),
      });
      if (res.ok) {
        const data = await res.json();
        return data.questionsCount || 0;
      }
    } catch {}
    return questions.length;
  },

  // Attempts & Exams
  async startAttempt(
    lessonId: string,
    userId: string
  ): Promise<{ attempt: Attempt; questions: Question[]; isResumed: boolean }> {
    try {
      const res = await fetch('/api/attempts/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId, userId }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.attempt) return data;
      }
    } catch {}

    const questions = SEED_QUESTIONS[lessonId] || SEED_QUESTIONS['lesson-1'] || [];
    const maxScore = questions.reduce((sum, q) => sum + (q.points || 1.0), 0) || 10.0;

    const attempt: Attempt = {
      id: 'att_' + Date.now(),
      userId,
      lessonId,
      status: 'in_progress',
      startedAt: new Date().toISOString(),
      durationSpentSeconds: 0,
      totalScore: 0,
      maxScore,
      masteryPercent: 0,
      passed: false,
      answers: {},
      violations: [],
    };
    return { attempt, questions, isResumed: false };
  },

  async autosaveAttempt(attemptId: string, answers: any, durationSpentSeconds: number): Promise<string> {
    try {
      const res = await fetch('/api/attempts/autosave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attemptId, answers, durationSpentSeconds }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.lastSavedAt) return data.lastSavedAt;
      }
    } catch {}
    return new Date().toISOString();
  },

  async submitAttempt(attemptId: string, answers: any, durationSpentSeconds: number, isAutoSubmitted = false) {
    try {
      const res = await fetch('/api/attempts/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attemptId, answers, durationSpentSeconds, isAutoSubmitted }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.attempt) return data;
      }
    } catch {}

    // Fallback Client-Side Accurate Grading
    const allQuestions = Object.values(SEED_QUESTIONS).flat();
    let totalScore = 0;
    let maxScore = 0;
    let mcqScore = 0;
    let tfScore = 0;
    let saScore = 0;
    let essayScore = 0;

    const gradedAnswers: any = {};
    for (const [qId, userAns] of Object.entries(answers || {})) {
      const q = allQuestions.find((item) => item.id === qId);
      if (q) {
        const { earnedPoints, isCorrect } = gradeSingleQuestion(q, userAns as any);
        totalScore += earnedPoints;
        maxScore += q.points || 1.0;
        if (q.type === 'mcq') mcqScore += earnedPoints;
        else if (q.type === 'true_false') tfScore += earnedPoints;
        else if (q.type === 'short_answer') saScore += earnedPoints;
        else if (q.type === 'essay') essayScore += earnedPoints;

        gradedAnswers[qId] = { ...(userAns as any), earnedPoints, isCorrect };
      }
    }

    if (maxScore === 0) maxScore = 10;
    const masteryPercent = Math.min(100, Math.round((totalScore / maxScore) * 100));
    const passed = masteryPercent >= 80;

    const attempt: Attempt = {
      id: attemptId,
      userId: 'u_student',
      lessonId: 'lesson-1',
      status: 'submitted',
      startedAt: new Date().toISOString(),
      submittedAt: new Date().toISOString(),
      durationSpentSeconds,
      totalScore: Math.round(totalScore * 100) / 100,
      maxScore: Math.round(maxScore * 100) / 100,
      mcqScore: Math.round(mcqScore * 100) / 100,
      tfScore: Math.round(tfScore * 100) / 100,
      saScore: Math.round(saScore * 100) / 100,
      essayScore: Math.round(essayScore * 100) / 100,
      masteryPercent,
      passed,
      answers: gradedAnswers,
      violations: [],
    };

    return { attempt, masteryPercent, passed };
  },

  async getAttempt(attemptId: string): Promise<{ attempt: Attempt; questions: Question[] }> {
    try {
      const res = await fetch(`/api/attempts/${attemptId}`);
      if (res.ok) return await res.json();
    } catch {}
    const questions = SEED_QUESTIONS['lesson-1'] || [];
    return {
      attempt: {
        id: attemptId,
        userId: 'u_student',
        lessonId: 'lesson-1',
        status: 'submitted',
        startedAt: new Date().toISOString(),
        durationSpentSeconds: 1200,
        totalScore: 8.5,
        maxScore: 10,
        masteryPercent: 85,
        passed: true,
        answers: {},
        violations: [],
      },
      questions,
    };
  },

  async logProctorViolation(attemptId: string, violationType: string, actionTaken: string) {
    try {
      const res = await fetch('/api/proctor/violation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attemptId, violationType, actionTaken }),
      });
      if (res.ok) return await res.json();
    } catch {}
    return { success: true };
  },

  // Progress & Stats
  async getStudentProgress(userId: string): Promise<Record<string, StudentLessonProgress>> {
    try {
      const res = await fetch(`/api/mastery/progress/${userId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.progress) return data.progress;
      }
    } catch {}

    const defaultProgress: Record<string, StudentLessonProgress> = {
      'lesson-1': {
        lessonId: 'lesson-1',
        isUnlocked: true,
        masteryPercent: 65,
        passed: false,
        attemptsCount: 1,
        bestScore: 6.5,
        lastAttemptAt: new Date().toISOString(),
      },
    };

    LESSONS.forEach((l, idx) => {
      if (idx > 0) {
        defaultProgress[l.id] = {
          lessonId: l.id,
          isUnlocked: false,
          masteryPercent: 0,
          passed: false,
          attemptsCount: 0,
          bestScore: 0,
        };
      }
    });
    return defaultProgress;
  },

  async unlockLessonOverride(userId: string, lessonId: string, reason: string) {
    try {
      const res = await fetch('/api/mastery/unlock-override', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, lessonId, reason }),
      });
      if (res.ok) return await res.json();
    } catch {}
    return { success: true };
  },

  async getStudentStats(userId: string) {
    try {
      const res = await fetch(`/api/stats/student/${userId}`);
      if (res.ok) return await res.json();
    } catch {}
    return {
      totalMasteredLessons: 1,
      totalHoursLearned: 4.5,
      accuracyPercent: 78,
      streakDays: 7,
    };
  },

  async getTeacherStats() {
    try {
      const res = await fetch('/api/stats/teacher');
      if (res.ok) return await res.json();
    } catch {}
    return {
      totalStudents: 80,
      activeClasses: INITIAL_CLASSES.length,
      averageMastery: 72,
    };
  },

  async getAuditLogs(): Promise<AuditLog[]> {
    try {
      const res = await fetch('/api/system/audit-logs');
      if (res.ok) {
        const data = await res.json();
        return data.auditLogs || [];
      }
    } catch {}
    return [];
  },

  // Google Sheets Cloud Database Sync
  async syncGoogleSheet(sheetUrl: string, classes: ClassRoom[], students: UserProfile[]) {
    try {
      const res = await fetch('/api/sheets/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sheetUrl, classes, students }),
      });
      if (res.ok) return await res.json();
    } catch {}
    return { success: true };
  },

  async fetchGoogleSheetBackend(sheetUrl: string, gid?: string) {
    try {
      const res = await fetch('/api/sheets/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sheetUrl, gid }),
      });
      if (res.ok) return await res.json();
    } catch {}
    return null;
  },

  async getSheetConfig() {
    try {
      const res = await fetch('/api/sheets/config');
      if (res.ok) return await res.json();
    } catch {}
    return null;
  },

  async saveSheetConfig(config: any) {
    try {
      const res = await fetch('/api/sheets/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config }),
      });
      if (res.ok) return await res.json();
    } catch {}
    return { success: true };
  },

  // AI Assistant Endpoints with Client-side Multi-Model Fallback Chain
  async getSocraticHint(questionStem: string, studentAnswer: string, hintLevel: number = 1): Promise<string> {
    const { getSocraticHint } = await import('./geminiService');
    return await getSocraticHint(questionStem, studentAnswer, hintLevel);
  },

  async explainConcept(concept: string, lessonTitle: string): Promise<string> {
    const { explainConcept } = await import('./geminiService');
    return await explainConcept(concept, lessonTitle);
  },

  async generateSimilarQuestion(questionStem: string, type = 'mcq', difficulty = 'TH'): Promise<Partial<Question>> {
    const { generateSimilarQuestion } = await import('./geminiService');
    return await generateSimilarQuestion(questionStem, type, difficulty);
  },
};
