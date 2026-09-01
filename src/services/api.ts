import { Question, Attempt, UserProfile, Chapter, Lesson, ClassGroup, TheorySection, TheoryExample, MiniQuizItem, StudentLessonProgress, AuditLog } from '../types';

export const api = {
  // Curriculum & Theory
  async getCurriculum(): Promise<{ chapters: Chapter[]; lessons: Lesson[]; classes: ClassGroup[] }> {
    const res = await fetch('/api/curriculum');
    const data = await res.json();
    return data;
  },

  async getTheory(lessonId: string): Promise<{ section: TheorySection; examples: TheoryExample[]; miniQuiz: MiniQuizItem[] }> {
    const res = await fetch(`/api/curriculum/theory/${lessonId}`);
    const data = await res.json();
    return data;
  },

  async saveTheory(lessonId: string, section: TheorySection, examples: TheoryExample[]): Promise<boolean> {
    const res = await fetch('/api/curriculum/theory/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lessonId, section, examples }),
    });
    const data = await res.json();
    return data.success;
  },

  // Questions
  async getQuestions(lessonId: string): Promise<Question[]> {
    const res = await fetch(`/api/questions/lesson/${lessonId}`);
    const data = await res.json();
    return data.questions || [];
  },

  async saveQuestionsBatch(lessonId: string, questions: Question[]): Promise<number> {
    const res = await fetch('/api/questions/save-batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lessonId, questions }),
    });
    const data = await res.json();
    return data.questionsCount || 0;
  },

  // Attempts & Exams
  async startAttempt(lessonId: string, userId: string): Promise<{ attempt: Attempt; questions: Question[]; isResumed: boolean }> {
    const res = await fetch('/api/attempts/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lessonId, userId }),
    });
    return await res.json();
  },

  async autosaveAttempt(attemptId: string, answers: any, durationSpentSeconds: number): Promise<string> {
    const res = await fetch('/api/attempts/autosave', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ attemptId, answers, durationSpentSeconds }),
    });
    const data = await res.json();
    return data.lastSavedAt;
  },

  async submitAttempt(attemptId: string, answers: any, durationSpentSeconds: number, isAutoSubmitted = false) {
    const res = await fetch('/api/attempts/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ attemptId, answers, durationSpentSeconds, isAutoSubmitted }),
    });
    return await res.json();
  },

  async getAttempt(attemptId: string): Promise<{ attempt: Attempt; questions: Question[] }> {
    const res = await fetch(`/api/attempts/${attemptId}`);
    return await res.json();
  },

  async logProctorViolation(attemptId: string, violationType: string, actionTaken: string) {
    const res = await fetch('/api/proctor/violation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ attemptId, violationType, actionTaken }),
    });
    return await res.json();
  },

  // Progress & Stats
  async getStudentProgress(userId: string): Promise<Record<string, StudentLessonProgress>> {
    const res = await fetch(`/api/mastery/progress/${userId}`);
    const data = await res.json();
    return data.progress || {};
  },

  async unlockLessonOverride(userId: string, lessonId: string, reason: string) {
    const res = await fetch('/api/mastery/unlock-override', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, lessonId, reason }),
    });
    return await res.json();
  },

  async getStudentStats(userId: string) {
    const res = await fetch(`/api/stats/student/${userId}`);
    return await res.json();
  },

  async getTeacherStats() {
    const res = await fetch('/api/stats/teacher');
    return await res.json();
  },

  async getAuditLogs(): Promise<AuditLog[]> {
    const res = await fetch('/api/system/audit-logs');
    const data = await res.json();
    return data.auditLogs || [];
  },

  // Google Sheets Cloud Database Sync
  async syncGoogleSheet(sheetUrl: string, classes: ClassGroup[], students: UserProfile[]) {
    const res = await fetch('/api/sheets/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sheetUrl, classes, students }),
    });
    return await res.json();
  },

  async fetchGoogleSheetBackend(sheetUrl: string, gid?: string) {
    const res = await fetch('/api/sheets/fetch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sheetUrl, gid }),
    });
    return await res.json();
  },

  async getSheetConfig() {
    const res = await fetch('/api/sheets/config');
    return await res.json();
  },

  async saveSheetConfig(config: any) {
    const res = await fetch('/api/sheets/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config }),
    });
    return await res.json();
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
