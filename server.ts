import express, { Request, Response } from 'express';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { CHAPTERS, LESSONS, INITIAL_CLASSES, DEMO_USERS } from './src/data/seedCurriculum';
import { SEED_THEORY_SECTIONS, SEED_THEORY_EXAMPLES, SEED_MINI_QUIZZES } from './src/data/seedTheory';
import { SEED_QUESTIONS } from './src/data/seedQuestions';
import { calculateAttemptScore, calculateLevelFromXp, gradeSingleQuestion } from './src/services/gradingEngine';
import { Question, Attempt, UserProfile, ExamConfig, StudentLessonProgress, AuditLog, ClassRoom } from './src/types';
import { parseGoogleSheetUrl, getCsvExportUrls, parseCsvContent, parseSheetData } from './src/services/googleSheetService';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initialize Gemini Client server-side with telemetry header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// In-Memory Database Store (with full seeding)
let users: UserProfile[] = [...DEMO_USERS];
let classes = [...INITIAL_CLASSES];
let chapters = [...CHAPTERS];
let lessons = [...LESSONS];
let theorySections = { ...SEED_THEORY_SECTIONS };
let theoryExamples = { ...SEED_THEORY_EXAMPLES };
let miniQuizzes = { ...SEED_MINI_QUIZZES };
let questionBank: Record<string, Question[]> = { ...SEED_QUESTIONS };
let attemptsStore: Record<string, Attempt> = {};
let studentProgressStore: Record<string, Record<string, StudentLessonProgress>> = {};
let auditLogs: AuditLog[] = [
  {
    id: 'log-1',
    userId: 'u_admin',
    userName: 'Quản Trị Viên',
    action: 'Khởi tạo hệ thống',
    target: 'Toán 12 CT GDPT 2018',
    details: 'Đã nạp 6 chương, 19 bài học và ngân hàng câu hỏi',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
  },
];

// Initialize Progress for default demo student
function getOrCreateStudentProgress(userId: string): Record<string, StudentLessonProgress> {
  if (!studentProgressStore[userId]) {
    const defaultProgress: Record<string, StudentLessonProgress> = {};
    lessons.forEach((l, idx) => {
      // Lesson 1 is always unlocked. Subsequent lessons locked until previous is >= 80%
      const isFirst = idx === 0;
      defaultProgress[l.id] = {
        lessonId: l.id,
        status: isFirst ? 'in_progress' : 'locked',
        masteryPercent: isFirst ? 65 : 0,
        highestScore: isFirst ? 7.8 : 0,
        attemptsCount: isFirst ? 1 : 0,
        requiredMasteryToUnlock: 80,
        prerequisiteMet: isFirst,
      };
    });
    studentProgressStore[userId] = defaultProgress;
  }
  return studentProgressStore[userId];
}

// ----------------------------------------------------
// REST API ROUTES
// ----------------------------------------------------

// 1. Auth & Users
app.get('/api/auth/users', (req: Request, res: Response) => {
  res.json({ success: true, users, classes });
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email } = req.body;
  const user = users.find((u) => u.email.toLowerCase() === (email || '').toLowerCase());
  if (user) {
    user.lastActiveAt = new Date().toISOString();
    return res.json({ success: true, user });
  }
  res.status(401).json({ success: false, message: 'Tài khoản không tồn tại. Vui lòng thử tài khoản demo hoặc đăng ký.' });
});

app.post('/api/auth/register', (req: Request, res: Response) => {
  const { fullName, email, role = 'student', classId } = req.body;
  if (!fullName || !email) {
    return res.status(400).json({ success: false, message: 'Họ tên và email là bắt buộc' });
  }

  const existing = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(400).json({ success: false, message: 'Email này đã được sử dụng.' });
  }

  const targetClass = classes.find((c) => c.id === classId);
  const newUser: UserProfile = {
    id: `u_${Date.now()}`,
    fullName,
    email,
    role,
    classId: classId || 'c1',
    className: targetClass?.name || '12TN1',
    schoolYear: '2025-2026',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'active',
    xp: 200,
    level: 1,
    streakDays: 1,
    lastActiveAt: new Date().toISOString(),
    badges: ['new_scholar'],
  };

  users.push(newUser);
  getOrCreateStudentProgress(newUser.id);

  auditLogs.unshift({
    id: `log-${Date.now()}`,
    userId: newUser.id,
    userName: newUser.fullName,
    action: 'Đăng ký tài khoản mới',
    target: newUser.email,
    timestamp: new Date().toISOString(),
  });

  res.json({ success: true, user: newUser });
});

app.post('/api/auth/update-profile', (req: Request, res: Response) => {
  const { id, fullName, classId } = req.body;
  const user = users.find((u) => u.id === id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
  }
  if (fullName) user.fullName = fullName;
  if (classId) {
    const cls = classes.find((c) => c.id === classId);
    user.classId = classId;
    user.className = cls?.name || user.className;
  }
  user.updatedAt = new Date().toISOString();
  res.json({ success: true, user });
});

// 2. Curriculum & Lessons
app.get('/api/curriculum', (req: Request, res: Response) => {
  res.json({
    success: true,
    chapters,
    lessons,
    classes,
  });
});

app.get('/api/curriculum/theory/:lessonId', (req: Request, res: Response) => {
  const { lessonId } = req.params;
  const section = theorySections[lessonId] || {
    id: `th-${lessonId}`,
    lessonId,
    order: 1,
    title: 'Kiến thức trọng tâm bài học',
    summary: 'Tóm tắt kiến thức lý thuyết cơ bản và nâng cao.',
    contentLatex: 'Nội dung lý thuyết đang được giáo viên cập nhật...',
    definitions: [],
    theorems: [],
    formulas: [],
    keyNotes: [],
    commonMistakes: [],
    tips: [],
  };
  const examples = theoryExamples[lessonId] || [];
  const miniQuiz = miniQuizzes[lessonId] || [];

  res.json({
    success: true,
    section,
    examples,
    miniQuiz,
  });
});

app.post('/api/curriculum/theory/save', (req: Request, res: Response) => {
  const { lessonId, section, examples } = req.body;
  if (lessonId && section) {
    theorySections[lessonId] = section;
  }
  if (lessonId && examples) {
    theoryExamples[lessonId] = examples;
  }
  res.json({ success: true, message: 'Đã lưu nội dung lý thuyết thành công' });
});

// 3. Question Bank
app.get('/api/questions/lesson/:lessonId', (req: Request, res: Response) => {
  const { lessonId } = req.params;
  const questions = questionBank[lessonId] || [];
  res.json({ success: true, questions });
});

app.post('/api/questions/save-batch', (req: Request, res: Response) => {
  const { lessonId, questions } = req.body;
  if (!lessonId || !Array.isArray(questions)) {
    return res.status(400).json({ success: false, message: 'Dữ liệu câu hỏi không hợp lệ' });
  }

  questionBank[lessonId] = questions;

  // Update question counts on lesson
  const targetLesson = lessons.find((l) => l.id === lessonId);
  if (targetLesson) {
    targetLesson.mcqCount = questions.filter((q) => q.type === 'mcq').length;
    targetLesson.tfCount = questions.filter((q) => q.type === 'true_false').length;
    targetLesson.saCount = questions.filter((q) => q.type === 'short_answer').length;
    targetLesson.essayCount = questions.filter((q) => q.type === 'essay').length;
    targetLesson.totalQuestions = questions.length;
  }

  auditLogs.unshift({
    id: `log-${Date.now()}`,
    userId: 'teacher',
    userName: 'Giáo viên',
    action: 'Cập nhật ngân hàng câu hỏi',
    target: `Bài ${targetLesson?.number || lessonId}`,
    details: `Đã lưu ${questions.length} câu hỏi`,
    timestamp: new Date().toISOString(),
  });

  res.json({ success: true, questionsCount: questions.length });
});

// 4. Attempts, Autosave, and Submissions
app.post('/api/attempts/start', (req: Request, res: Response) => {
  const { lessonId, userId } = req.body;
  const targetLesson = lessons.find((l) => l.id === lessonId);
  const targetUser = users.find((u) => u.id === userId) || users[2];

  if (!targetLesson) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy bài học' });
  }

  // Check if student already has an unfinished attempt for this lesson
  const existingAttempt = Object.values(attemptsStore).find(
    (a) => a.userId === userId && a.lessonId === lessonId && a.status === 'in_progress'
  );

  const questions = questionBank[lessonId] || questionBank['lesson-1'] || [];

  if (existingAttempt) {
    return res.json({
      success: true,
      isResumed: true,
      attempt: existingAttempt,
      questions,
      message: 'Bạn có bài đang làm dở. Đang tiếp tục...',
    });
  }

  // Create fresh attempt
  const attemptId = `att_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  const durationSec = (targetLesson.durationMinutes || 45) * 60;
  const serverExpiryTime = new Date(Date.now() + durationSec * 1000).toISOString();

  // Shuffle questions order
  const shuffledOrder = [...questions].sort(() => Math.random() - 0.5).map((q) => q.id);

  const newAttempt: Attempt = {
    id: attemptId,
    examId: `exam_${lessonId}`,
    lessonId,
    userId: targetUser.id,
    userName: targetUser.fullName,
    userClass: targetUser.className || '12TN1',
    startedAt: new Date().toISOString(),
    serverExpiryTime,
    durationSpentSeconds: 0,
    status: 'in_progress',
    questionOrder: shuffledOrder,
    answers: {},
    totalScore: 0,
    maxScore: 10,
    mcqScore: 0,
    tfScore: 0,
    saScore: 0,
    essayScore: 0,
    isPendingManualGrading: false,
    masteryPercent: 0,
    violations: [],
    aiHintsUsed: 0,
    lastSavedAt: new Date().toISOString(),
  };

  attemptsStore[attemptId] = newAttempt;

  res.json({
    success: true,
    isResumed: false,
    attempt: newAttempt,
    questions,
  });
});

app.post('/api/attempts/autosave', (req: Request, res: Response) => {
  const { attemptId, answers, durationSpentSeconds } = req.body;
  const attempt = attemptsStore[attemptId];
  if (!attempt) {
    return res.status(404).json({ success: false, message: 'Phiên làm bài không tồn tại' });
  }

  if (attempt.status !== 'in_progress') {
    return res.status(400).json({ success: false, message: 'Bài thi đã được nộp hoặc kết thúc' });
  }

  // Update in-memory
  attempt.answers = answers || attempt.answers;
  if (durationSpentSeconds !== undefined) {
    attempt.durationSpentSeconds = durationSpentSeconds;
  }
  attempt.lastSavedAt = new Date().toISOString();

  res.json({ success: true, lastSavedAt: attempt.lastSavedAt });
});

app.post('/api/attempts/submit', (req: Request, res: Response) => {
  const { attemptId, answers, durationSpentSeconds, isAutoSubmitted } = req.body;
  const attempt = attemptsStore[attemptId];
  if (!attempt) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy attempt' });
  }

  const questions = questionBank[attempt.lessonId] || questionBank['lesson-1'] || [];
  const finalAnswers = answers || attempt.answers;

  // Grade all answers
  const scoreResult = calculateAttemptScore(questions, finalAnswers);

  attempt.answers = finalAnswers;
  attempt.status = 'submitted';
  attempt.submittedAt = new Date().toISOString();
  if (durationSpentSeconds) attempt.durationSpentSeconds = durationSpentSeconds;
  attempt.totalScore = scoreResult.totalScore;
  attempt.maxScore = scoreResult.maxScore;
  attempt.mcqScore = scoreResult.mcqScore;
  attempt.tfScore = scoreResult.tfScore;
  attempt.saScore = scoreResult.saScore;
  attempt.essayScore = scoreResult.essayScore;
  attempt.isPendingManualGrading = scoreResult.isPendingManualGrading;
  attempt.masteryPercent = scoreResult.masteryPercent;

  // Update student progress & mastery 80% rule
  const progressMap = getOrCreateStudentProgress(attempt.userId);
  const currentProg = progressMap[attempt.lessonId] || {
    lessonId: attempt.lessonId,
    status: 'in_progress',
    masteryPercent: 0,
    highestScore: 0,
    attemptsCount: 0,
    requiredMasteryToUnlock: 80,
    prerequisiteMet: true,
  };

  currentProg.attemptsCount += 1;
  currentProg.lastAttemptId = attempt.id;
  currentProg.lastAttemptAt = attempt.submittedAt;
  currentProg.highestScore = Math.max(currentProg.highestScore, attempt.totalScore);
  currentProg.masteryPercent = Math.max(currentProg.masteryPercent, attempt.masteryPercent);

  // Check 80% mastery completion
  if (currentProg.masteryPercent >= 80) {
    currentProg.status = 'completed';

    // Unlock next lesson N+1
    const currentLessonIdx = lessons.findIndex((l) => l.id === attempt.lessonId);
    if (currentLessonIdx !== -1 && currentLessonIdx + 1 < lessons.length) {
      const nextLesson = lessons[currentLessonIdx + 1];
      const nextProg = progressMap[nextLesson.id];
      if (nextProg && nextProg.status === 'locked') {
        nextProg.status = 'not_started';
        nextProg.prerequisiteMet = true;
        nextProg.unlockedAt = new Date().toISOString();
      }
    }
  } else {
    currentProg.status = 'in_progress';
  }

  // Award XP to user
  const user = users.find((u) => u.id === attempt.userId);
  if (user) {
    const earnedXp = Math.round(attempt.masteryPercent * 2.5) + (attempt.masteryPercent >= 80 ? 150 : 50);
    user.xp += earnedXp;
    const { level } = calculateLevelFromXp(user.xp);
    user.level = level;
  }

  auditLogs.unshift({
    id: `log-${Date.now()}`,
    userId: attempt.userId,
    userName: attempt.userName,
    action: isAutoSubmitted ? 'Tự động nộp bài (Vi phạm)' : 'Nộp bài luyện tập',
    target: `Bài ${attempt.lessonId}`,
    details: `Điểm: ${attempt.totalScore}/${attempt.maxScore} (${attempt.masteryPercent}%)`,
    timestamp: new Date().toISOString(),
  });

  res.json({
    success: true,
    attempt,
    scoreResult,
    progress: currentProg,
  });
});

app.get('/api/attempts/user/:userId', (req: Request, res: Response) => {
  const { userId } = req.params;
  const userAttempts = Object.values(attemptsStore).filter((a) => a.userId === userId);
  res.json({ success: true, attempts: userAttempts });
});

app.get('/api/attempts/:attemptId', (req: Request, res: Response) => {
  const { attemptId } = req.params;
  const attempt = attemptsStore[attemptId];
  if (!attempt) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy attempt' });
  }
  const questions = questionBank[attempt.lessonId] || questionBank['lesson-1'] || [];
  res.json({ success: true, attempt, questions });
});

// 5. Proctoring & Tab Switch Events
app.post('/api/proctor/violation', (req: Request, res: Response) => {
  const { attemptId, violationType, actionTaken } = req.body;
  const attempt = attemptsStore[attemptId];
  if (attempt) {
    const violationCount = (attempt.violations?.length || 0) + 1;
    const log = {
      timestamp: new Date().toISOString(),
      type: violationType,
      violationCount,
      actionTaken: actionTaken || 'warning',
    };
    attempt.violations = attempt.violations || [];
    attempt.violations.push(log);

    return res.json({ success: true, violationCount, log });
  }
  res.status(404).json({ success: false, message: 'Attempt not found' });
});

app.get('/api/proctor/live-monitor', (req: Request, res: Response) => {
  const activeAttempts = Object.values(attemptsStore).filter((a) => a.status === 'in_progress');
  res.json({ success: true, activeAttempts });
});

// 6. Student Progress & Mastery Overrides
app.get('/api/mastery/progress/:userId', (req: Request, res: Response) => {
  const { userId } = req.params;
  const progress = getOrCreateStudentProgress(userId);
  res.json({ success: true, progress });
});

app.post('/api/mastery/unlock-override', (req: Request, res: Response) => {
  const { userId, lessonId, reason } = req.body;
  const progressMap = getOrCreateStudentProgress(userId);
  const targetProg = progressMap[lessonId];
  if (targetProg) {
    targetProg.status = 'not_started';
    targetProg.isManuallyUnlocked = true;
    targetProg.manualUnlockReason = reason || 'Giáo viên mở khóa thủ công';
    targetProg.prerequisiteMet = true;
    targetProg.unlockedAt = new Date().toISOString();

    auditLogs.unshift({
      id: `log-${Date.now()}`,
      userId: 'teacher',
      userName: 'Giáo viên',
      action: 'Mở khóa bài học thủ công',
      target: `User ${userId} - Bài ${lessonId}`,
      details: `Lý do: ${targetProg.manualUnlockReason}`,
      timestamp: new Date().toISOString(),
    });

    return res.json({ success: true, progress: targetProg });
  }
  res.status(404).json({ success: false, message: 'Không tìm thấy tiến độ bài học' });
});

// 7. Teacher & Admin Statistics
app.get('/api/stats/student/:userId', (req: Request, res: Response) => {
  const { userId } = req.params;
  const user = users.find((u) => u.id === userId) || users[2];
  const progressMap = getOrCreateStudentProgress(userId);
  const userAttempts = Object.values(attemptsStore).filter((a) => a.userId === userId && a.status === 'submitted');

  const completedCount = Object.values(progressMap).filter((p) => p.status === 'completed').length;
  const totalMastery = Object.values(progressMap).reduce((acc, p) => acc + p.masteryPercent, 0);
  const avgMastery = Math.round(totalMastery / (lessons.length || 1));

  const totalScore = userAttempts.reduce((acc, a) => acc + a.totalScore, 0);
  const avgScore = userAttempts.length > 0 ? Math.round((totalScore / userAttempts.length) * 10) / 10 : 0;
  const highestScore = userAttempts.reduce((acc, a) => Math.max(acc, a.totalScore), 0);

  const { tier } = calculateLevelFromXp(user.xp);

  const scoreHistory = userAttempts.slice(-10).map((a) => {
    const lesson = lessons.find((l) => l.id === a.lessonId);
    return {
      date: new Date(a.submittedAt || a.startedAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
      score: a.totalScore,
      lessonTitle: lesson ? `Bài ${lesson.number}` : a.lessonId,
    };
  });

  const chapterMastery = chapters.map((c) => {
    const chapterLessons = lessons.filter((l) => l.chapterId === c.id);
    const chapterMasterySum = chapterLessons.reduce((acc, l) => acc + (progressMap[l.id]?.masteryPercent || 0), 0);
    const masteryPercent = Math.round(chapterMasterySum / (chapterLessons.length || 1));
    return {
      chapterId: c.id,
      title: `Chương ${c.number}`,
      masteryPercent,
    };
  });

  const weakSkills = [
    { tag: 'Đạo hàm phân thức bậc 2/1', accuracyPercent: 45, questionCount: 6, lessonId: 'lesson-1' },
    { tag: 'Cực trị chứa tham số m', accuracyPercent: 55, questionCount: 8, lessonId: 'lesson-1' },
    { tag: 'Khoảng cách giữa hai điểm trong Oxyz', accuracyPercent: 62, questionCount: 5, lessonId: 'lesson-8' },
    { tag: 'Xác suất có điều kiện bảng 2x2', accuracyPercent: 50, questionCount: 4, lessonId: 'lesson-18' },
  ];

  const badges = [
    { id: 'b1', name: 'Chiến Binh Khởi Động', icon: '🎯', description: 'Hoàn thành bài luyện tập đầu tiên', unlockedAt: '2025-08-20' },
    { id: 'b2', name: 'Bậc Thầy Giải Tích', icon: '📈', description: 'Đạt 80% mastery Chương I', unlockedAt: '2025-08-28' },
    { id: 'b3', name: 'Chuỗi 7 Ngày Chăm Chỉ', icon: '🔥', description: 'Luyện tập liên tục 7 ngày', unlockedAt: '2025-09-01' },
  ];

  res.json({
    success: true,
    stats: {
      completedLessons: completedCount,
      totalLessons: lessons.length,
      overallMasteryPercent: avgMastery,
      totalAttempts: userAttempts.length,
      averageScore: avgScore,
      highestScore,
      totalStudyMinutes: userAttempts.reduce((acc, a) => acc + Math.round(a.durationSpentSeconds / 60), 45),
      xp: user.xp,
      levelTier: tier,
      streakDays: user.streakDays,
      scoreHistory,
      chapterMastery,
      weakSkills,
      badges,
    },
  });
});

app.get('/api/stats/teacher', (req: Request, res: Response) => {
  const allSubmittedAttempts = Object.values(attemptsStore).filter((a) => a.status === 'submitted');
  const totalSubmissions = allSubmittedAttempts.length;
  const avgScore = totalSubmissions > 0 ? Math.round((allSubmittedAttempts.reduce((acc, a) => acc + a.totalScore, 0) / totalSubmissions) * 10) / 10 : 7.6;

  res.json({
    success: true,
    teacherStats: {
      totalClasses: classes.length,
      totalStudents: classes.reduce((acc, c) => acc + c.studentCount, 0),
      totalSubmissions,
      averageScore: avgScore,
      averageMastery: 78,
      violationsCount: allSubmittedAttempts.reduce((acc, a) => acc + (a.violations?.length || 0), 2),
      classesSummary: classes.map((c) => ({
        id: c.id,
        name: c.name,
        studentCount: c.studentCount,
        completionRate: Math.min(95, Math.max(60, Math.round(75 + (c.grade % 5) * 4))),
        avgScore: 7.8,
      })),
      recentAttempts: Object.values(attemptsStore).slice(-15),
    },
  });
});

app.get('/api/system/audit-logs', (req: Request, res: Response) => {
  res.json({ success: true, auditLogs });
});

// 7.1. Google Sheets Database Sync & Proxy Endpoints
let sheetConfig = {
  sheetUrl: 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit#gid=0',
  sheetGid: '0',
  autoSync: true,
  lastSyncedAt: new Date().toISOString(),
  classCount: classes.length,
  studentCount: users.filter(u => u.role === 'student').length,
};

app.get('/api/sheets/config', (req: Request, res: Response) => {
  res.json({ success: true, config: sheetConfig });
});

app.post('/api/sheets/config', (req: Request, res: Response) => {
  const { config } = req.body;
  if (config) {
    sheetConfig = { ...sheetConfig, ...config };
  }
  res.json({ success: true, config: sheetConfig });
});

app.post('/api/sheets/fetch', async (req: Request, res: Response) => {
  const { sheetUrl, gid } = req.body;
  if (!sheetUrl) {
    return res.status(400).json({ success: false, message: 'Vui lòng cung cấp URL Google Sheet' });
  }

  const exportUrls = getCsvExportUrls(sheetUrl, gid);
  let lastError: any = null;

  for (const url of exportUrls) {
    try {
      const response = await fetch(url, {
        headers: {
          'Accept': 'text/csv, text/plain, */*',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      if (response.ok) {
        const text = await response.text();
        if (text && !text.includes('<!DOCTYPE html>') && text.length > 10) {
          const rows = parseCsvContent(text);
          const parsed = parseSheetData(rows);
          return res.json(parsed);
        }
      }
    } catch (err: any) {
      lastError = err;
    }
  }

  res.status(500).json({
    success: false,
    message: lastError?.message || 'Không thể tải dữ liệu từ Google Sheet. Vui lòng kiểm tra quyền chia sẻ công khai.',
    classes: [],
    students: [],
  });
});

app.post('/api/sheets/sync', (req: Request, res: Response) => {
  const { sheetUrl, classes: newClasses, students: newStudents } = req.body;

  if (Array.isArray(newClasses) && newClasses.length > 0) {
    classes = newClasses;
  }

  if (Array.isArray(newStudents) && newStudents.length > 0) {
    // Retain admin and teacher accounts
    const adminsAndTeachers = users.filter((u) => u.role !== 'student');
    users = [...adminsAndTeachers, ...newStudents];

    // Ensure progress objects exist for new students
    newStudents.forEach((st) => {
      getOrCreateStudentProgress(st.id);
    });
  }

  sheetConfig.lastSyncedAt = new Date().toISOString();
  sheetConfig.classCount = classes.length;
  sheetConfig.studentCount = users.filter((u) => u.role === 'student').length;
  if (sheetUrl) sheetConfig.sheetUrl = sheetUrl;

  auditLogs.unshift({
    id: `log-${Date.now()}`,
    userId: 'teacher',
    userName: 'Giáo viên (Thầy Cường)',
    action: 'Đồng bộ Google Sheets trực tuyến',
    target: `Đã nạp ${classes.length} lớp học, ${newStudents?.length || 0} học sinh`,
    details: sheetUrl ? `Nguồn: ${sheetUrl.substring(0, 45)}...` : 'Đồng bộ trực tuyến',
    timestamp: new Date().toISOString(),
  });

  res.json({
    success: true,
    message: `Đã đồng bộ thành công ${classes.length} lớp học và ${users.filter(u => u.role === 'student').length} học sinh từ Google Sheets.`,
    classes,
    users,
    sheetConfig,
  });
});

// 8. Gemini AI Server-Side Proxy Endpoints
app.post('/api/gemini/socratic-hint', async (req: Request, res: Response) => {
  const { questionStem, studentAnswer, hintLevel = 1 } = req.body;

  if (!process.env.GEMINI_API_KEY) {
    return res.json({
      success: true,
      hint: `[Gợi ý bước ${hintLevel}]: Hãy xem lại công thức đạo hàm và xét dấu của tam thức bậc hai. Nhớ áp dụng quy tắc: "Trong trái ngoài cùng" để tìm các khoảng đồng biến!`,
    });
  }

  try {
    const prompt = `Bạn là Trợ lý Socratic dạy Toán 12 theo CT GDPT 2018 của Thầy Phan Quốc Cường.
Học sinh đang giải câu hỏi sau:
"${questionStem}"
Câu trả lời hiện tại của học sinh: "${studentAnswer || 'Chưa có'}"
Mức độ gợi ý yêu cầu: Bước ${hintLevel} (từ 1 đến 3).

Yêu cầu Socratic:
- KHÔNG ĐƯỢC đưa ra ngay đáp án cuối cùng hay phương án A, B, C, D.
- Đặt câu hỏi dẫn dắt từng bước, nhắc lại định lý hoặc công thức liên quan.
- Dùng công thức LaTeX bọc trong $...$ hoặc $$...$$.
- Trả lời bằng tiếng Việt thân thiện, khuyến khích học sinh tư duy.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
    });

    res.json({
      success: true,
      hint: response.text || 'Hãy thử kiểm tra lại điều kiện xác định và dấu của đạo hàm!',
    });
  } catch (err: any) {
    console.error('Gemini Socratic Hint Error:', err);
    res.json({
      success: true,
      hint: `[Gợi ý bước ${hintLevel}]: Bạn hãy tính đạo hàm $f'(x)$, giải phương trình $f'(x) = 0$ để tìm các điểm tới hạn rồi lập bảng xét dấu nhé!`,
    });
  }
});

app.post('/api/gemini/explain-concept', async (req: Request, res: Response) => {
  const { concept, lessonTitle } = req.body;

  if (!process.env.GEMINI_API_KEY) {
    return res.json({
      success: true,
      explanation: `**${concept}**: Trong Toán 12 (CT GDPT 2018), khái niệm này thể hiện mối quan hệ giữa tốc độ thay đổi của hàm số và hình dáng đồ thị. Công thức cốt lõi: $f'(x) > 0 \\implies$ hàm số đồng biến.`,
    });
  }

  try {
    const prompt = `Hãy giải thích trực quan, súc tích và dễ hiểu khái niệm Toán 12: "${concept}" trong bài học "${lessonTitle || 'Toán 12 CT GDPT 2018'}".
Bao gồm:
1. Ý nghĩa trực quan (ví dụ hình học hoặc đời sống).
2. Công thức toán học cốt lõi (dùng LaTeX chuẩn $...$).
3. Mẹo nhớ nhanh và lưu ý bẫy thường gặp.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
    });

    res.json({
      success: true,
      explanation: response.text,
    });
  } catch (err: any) {
    console.error('Gemini Concept Error:', err);
    res.json({
      success: true,
      explanation: `**${concept}**: Đạo hàm đo tốc độ biến thiên tức thời của hàm số. Khi đồ thị đi lên từ trái sang phải, hàm số đồng biến ($f'(x) \\ge 0$).`,
    });
  }
});

app.post('/api/gemini/generate-similar', async (req: Request, res: Response) => {
  const { questionStem, type = 'mcq', difficulty = 'TH' } = req.body;

  if (!process.env.GEMINI_API_KEY) {
    return res.json({
      success: true,
      question: {
        stem: `Tìm các khoảng đồng biến của hàm số $y = 2x^3 - 6x + 5$.`,
        type: 'mcq',
        difficulty: 'TH',
        options: [
          { id: 'A', text: '$(-\\infty; -1)$ và $(1; +\\infty)$' },
          { id: 'B', text: '$(-1; 1)$' },
          { id: 'C', text: '$(-\\infty; 1)$' },
          { id: 'D', text: '$(-1; +\\infty)$' },
        ],
        correctAnswer: 'A',
        solution: 'Đạo hàm $y\' = 6x^2 - 6 = 6(x^2 - 1) > 0 \\iff x \\in (-\\infty; -1) \\cup (1; +\\infty)$.',
      },
    });
  }

  try {
    const prompt = `Hãy tạo một câu hỏi Toán 12 nguyên bản (CT GDPT 2018) có dạng ${type}, độ khó ${difficulty}, tương tự kỹ năng của câu hỏi sau:
"${questionStem}"

Định dạng JSON trả về:
{
  "stem": "Đề bài có LaTeX $...$",
  "type": "${type}",
  "difficulty": "${difficulty}",
  "options": [{"id": "A", "text": "..."}, {"id": "B", "text": "..."}, {"id": "C", "text": "..."}, {"id": "D", "text": "..."}],
  "correctAnswer": "A",
  "solution": "Lời giải chi tiết có LaTeX $...$"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({ success: true, question: parsed });
  } catch (err: any) {
    console.error('Gemini Question Gen Error:', err);
    res.json({
      success: true,
      question: {
        stem: `Cho hàm số $y = x^3 - 3x^2 + 1$. Hàm số nghịch biến trên khoảng nào?`,
        type: 'mcq',
        difficulty: 'TH',
        options: [
          { id: 'A', text: '$(0; 2)' },
          { id: 'B', text: '$(-\\infty; 0)$' },
          { id: 'C', text: '$(2; +\\infty)$' },
          { id: 'D', text: '$(-\\infty; 2)$' },
        ],
        correctAnswer: 'A',
        solution: '$y\' = 3x^2 - 6x < 0 \\iff 0 < x < 2$.',
      },
    });
  }
});

// ----------------------------------------------------
// Production Static & Vite Integration
// ----------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Toán 12 Server] Running on http://localhost:${PORT}`);
  });
}

startServer();
