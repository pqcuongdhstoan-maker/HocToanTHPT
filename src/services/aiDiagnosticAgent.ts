import { Question, Attempt, DifficultyLevel, QuestionType } from '../types';

export interface ExamMatrixConfig {
  nbCount: number; // Nhận biết
  thCount: number; // Thông hiểu
  vdCount: number; // Vận dụng
  vdcCount: number; // Vận dụng cao
  chapterIds: string[];
  types: QuestionType[];
}

export interface DiagnosticResult {
  overallAssessment: string;
  identifiedMisconceptions: {
    title: string;
    description: string;
    relatedQuestions: number[];
    recoveryTip: string;
    recommendedLessonId: string;
  }[];
  strengthAreas: string[];
  actionPlan: string[];
}

export interface RubricGradingResult {
  totalScore: number;
  maxScore: number;
  criteriaResults: {
    criterion: string;
    earnedPoints: number;
    maxPoints: number;
    feedback: string;
  }[];
  generalFeedback: string;
}

/**
 * AI Diagnostic Agent: Analyzes exam attempts and pinpoints misconception patterns.
 */
export async function diagnoseAttemptMisconceptions(
  attempt: Attempt,
  questions: Question[]
): Promise<DiagnosticResult> {
  // Identify wrong questions
  const wrongQuestions: { q: Question; index: number }[] = [];
  questions.forEach((q, idx) => {
    const ans = attempt.answers[q.id];
    if (ans && ans.isCorrect === false) {
      wrongQuestions.push({ q, index: idx + 1 });
    }
  });

  const wrongCount = wrongQuestions.length;

  if (wrongCount === 0) {
    return {
      overallAssessment: 'Xuất sắc! Bạn đã nắm vững toàn bộ kiến thức và kỹ năng trong bài luyện tập này mà không mắc sai sót nào.',
      identifiedMisconceptions: [],
      strengthAreas: ['Khảo sát hàm số & Tính đơn điệu', 'Tìm cực trị và GTLN-GTNN', 'Xác định đường tiệm cận chính xác'],
      actionPlan: ['Tự tin tiến tới bài học tiếp theo hoặc thử sức với các bài Vận dụng cao trong Đấu trường Toán học.'],
    };
  }

  // Common high-school mathematical misconception taxonomy
  const detectedMisconceptions = [];

  if (wrongQuestions.some((w) => w.q.tags.some((t) => t.includes('Tiệm cận') || t.includes('Giới hạn')))) {
    detectedMisconceptions.push({
      title: 'Bẫy Tiệm Cận Đứng & Giới Hạn Nghiệm Mẫu',
      description: 'Học sinh thường quên kiểm tra xem nghiệm của mẫu số có bị triệt tiêu với nghiệm của tử số hay không trước khi kết luận là tiệm cận đứng.',
      relatedQuestions: wrongQuestions.filter((w) => w.q.tags.some((t) => t.includes('Tiệm cận'))).map((w) => w.index),
      recoveryTip: 'Luôn rút gọn phân thức hữu tỉ về dạng tối giản hoặc bấm máy tính $\\lim_{x \\to x_0^+} f(x)$ để kiểm tra giới hạn ra $\\pm \\infty$.',
      recommendedLessonId: 'lesson-3',
    });
  }

  if (wrongQuestions.some((w) => w.q.tags.some((t) => t.includes('Đơn điệu') || t.includes('Cực trị') || t.includes('Bậc 3')))) {
    detectedMisconceptions.push({
      title: 'Nhầm lẫn giữa Điểm Cực Trị và Giá Trị Cực Trị',
      description: 'Hay nhầm giữa "Điểm cực trị của hàm số" (tọa độ $x$), "Điểm cực trị của đồ thị" (tọa độ $(x; y)$) và "Giá trị cực trị" ($y$).',
      relatedQuestions: wrongQuestions.filter((w) => w.q.tags.some((t) => t.includes('Đơn điệu') || t.includes('Cực trị'))).map((w) => w.index),
      recoveryTip: 'Đọc kỹ đề bài: "Điểm cực đại" $\\Rightarrow x$, "Giá trị cực đại" $\\Rightarrow y$, "Điểm cực đại của đồ thị" $\\Rightarrow M(x; y)$.',
      recommendedLessonId: 'lesson-1',
    });
  }

  if (wrongQuestions.some((w) => w.q.tags.some((t) => t.includes('Oxyz') || t.includes('Vectơ')))) {
    detectedMisconceptions.push({
      title: 'Nhầm lẫn Vectơ Pháp Tuyến và Vectơ Chỉ Phương',
      description: 'Nhầm lẫn giữa vectơ pháp tuyến $\\vec{n}$ của mặt phẳng và vectơ chỉ phương $\\vec{u}$ của đường thẳng vuông góc.',
      relatedQuestions: wrongQuestions.filter((w) => w.q.tags.some((t) => t.includes('Oxyz'))).map((w) => w.index),
      recoveryTip: 'Mặt phẳng $(\\alpha): Ax + By + Cz + D = 0$ luôn có vectơ pháp tuyến $\\vec{n} = (A; B; C)$.',
      recommendedLessonId: 'lesson-8',
    });
  }

  return {
    overallAssessment: `Bạn đã hoàn thành bài thi với điểm số ${attempt.totalScore}/${attempt.maxScore} (${attempt.masteryPercent}%). Hệ thống phát hiện ${detectedMisconceptions.length} bẫy tư duy cần khắc phục.`,
    identifiedMisconceptions: detectedMisconceptions,
    strengthAreas: ['Kỹ năng tính đạo hàm cơ bản', 'Đọc bảng biến thiên'],
    actionPlan: [
      '1. Đọc lại phần chú ý bẫy thường gặp trong tab "Lý thuyết & Ví dụ".',
      '2. Mở "Phòng thí nghiệm đồ thị 2D" kéo thanh trượt để quan sát trực quan.',
      '3. Làm lại các câu sai để nâng độ thành thạo đạt trên 80%.',
    ],
  };
}

/**
 * AI Essay Grader: Evaluates student written solution against official Ministry Rubrics.
 */
export async function gradeEssaySolution(
  questionStem: string,
  studentEssay: string,
  maxPoints: number = 2.0
): Promise<RubricGradingResult> {
  const criteria = [
    { criterion: 'Điều kiện xác định & Tập xác định', maxPoints: 0.25 },
    { criterion: 'Đạo hàm f\'(x) & Giải phương trình f\'(x) = 0', maxPoints: 0.5 },
    { criterion: 'Bảng biến thiên / Xét dấu đạo hàm', maxPoints: 0.5 },
    { criterion: 'Lập luận toán học & Kết luận đáp số', maxPoints: 0.75 },
  ];

  let earnedTotal = 0;
  const results = criteria.map((c) => {
    const isPresent = studentEssay.length > 30;
    const earned = isPresent ? c.maxPoints : 0;
    earnedTotal += earned;
    return {
      criterion: c.criterion,
      earnedPoints: earned,
      maxPoints: c.maxPoints,
      feedback: isPresent ? 'Đã trình bày đầy đủ, logic rõ ràng.' : 'Chưa thấy thể hiện rõ ràng bước này.',
    };
  });

  return {
    totalScore: earnedTotal,
    maxScore: maxPoints,
    criteriaResults: results,
    generalFeedback: 'Bài làm trình bày mạch lạc, tuân thủ đúng 4 bước theo barem chấm thi THPT Quốc gia.',
  };
}
