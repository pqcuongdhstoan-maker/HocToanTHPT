import { Question, AttemptAnswer, Attempt, QuestionType } from '../types';

/**
 * Normalizes short answer strings for safe, robust comparison without eval()
 */
export function normalizeShortAnswer(raw: string): { text: string; numVal?: number } {
  if (!raw) return { text: '' };

  const cleaned = raw.trim().toLowerCase().replace(/\s+/g, '');
  // Normalize Vietnamese decimal commas e.g. "3,5" -> "3.5"
  const dotCleaned = cleaned.replace(/,/g, '.');

  // Check if it's a fraction e.g. "3/4", "-7/2"
  const fracMatch = dotCleaned.match(/^([+-]?\d+(?:\.\d+)?)\/([+-]?\d+(?:\.\d+)?)$/);
  if (fracMatch) {
    const num = parseFloat(fracMatch[1]);
    const den = parseFloat(fracMatch[2]);
    if (den !== 0) {
      return { text: dotCleaned, numVal: num / den };
    }
  }

  // Check if it's a direct float / int
  const numVal = parseFloat(dotCleaned);
  if (!isNaN(numVal) && isFinite(numVal) && /^([+-]?\d+(?:\.\d+)?)$/.test(dotCleaned)) {
    return { text: dotCleaned, numVal };
  }

  return { text: cleaned };
}

/**
 * Evaluates a single question answer
 */
export function gradeSingleQuestion(
  question: Question,
  userAnswer?: AttemptAnswer
): { earnedPoints: number; isCorrect: boolean; partialDetail?: string } {
  if (!userAnswer) {
    return { earnedPoints: 0, isCorrect: false };
  }

  const maxPoints = question.points || 1.0;

  switch (question.type) {
    case 'mcq': {
      if (!userAnswer.selectedOption) {
        return { earnedPoints: 0, isCorrect: false };
      }
      if (Array.isArray(question.correctAnswer)) {
        const userOpts = Array.isArray(userAnswer.selectedOption)
          ? userAnswer.selectedOption
          : [userAnswer.selectedOption];
        const correctSet = new Set(question.correctAnswer);
        const userSet = new Set(userOpts);
        const isMatch = correctSet.size === userSet.size && [...correctSet].every((x) => userSet.has(x));
        return { earnedPoints: isMatch ? maxPoints : 0, isCorrect: isMatch };
      } else {
        const isMatch = String(userAnswer.selectedOption).trim().toUpperCase() === String(question.correctAnswer).trim().toUpperCase();
        return { earnedPoints: isMatch ? maxPoints : 0, isCorrect: isMatch };
      }
    }

    case 'true_false': {
      if (!question.statements || !userAnswer.tfAnswers) {
        return { earnedPoints: 0, isCorrect: false };
      }

      let correctCount = 0;
      const totalStatements = question.statements.length || 4;

      for (const st of question.statements) {
        const userVal = userAnswer.tfAnswers[st.id];
        if (userVal !== undefined && userVal === st.isCorrect) {
          correctCount++;
        }
      }

      // CT GDPT 2018 True/False Standard Scoring Matrix for 4 sub-statements:
      // 1 correct -> 10% (0.1 pt / 1.0 max)
      // 2 correct -> 25% (0.25 pt / 1.0 max)
      // 3 correct -> 50% (0.5 pt / 1.0 max)
      // 4 correct -> 100% (1.0 pt / 1.0 max)
      let multiplier = 0;
      if (correctCount === 1) multiplier = 0.1;
      else if (correctCount === 2) multiplier = 0.25;
      else if (correctCount === 3) multiplier = 0.5;
      else if (correctCount === 4) multiplier = 1.0;

      const earned = Math.round(maxPoints * multiplier * 100) / 100;
      return {
        earnedPoints: earned,
        isCorrect: correctCount === totalStatements,
        partialDetail: `Đúng ${correctCount}/${totalStatements} ý (${Math.round(multiplier * 100)}% điểm)`,
      };
    }

    case 'short_answer': {
      const rawInput = userAnswer.shortAnswerText || '';
      if (!rawInput.trim()) {
        return { earnedPoints: 0, isCorrect: false };
      }

      const userNorm = normalizeShortAnswer(rawInput);
      const acceptedList = question.shortAnswerKey?.acceptedValues || [];
      const tolerance = question.shortAnswerKey?.tolerance ?? 0.001;

      let isMatch = false;

      // 1. Direct text match with accepted values (e.g. "3/4", "0.75", "0,75")
      for (const val of acceptedList) {
        const normVal = normalizeShortAnswer(val);
        if (normVal.text === userNorm.text) {
          isMatch = true;
          break;
        }
        // 2. Numeric match within tolerance
        if (userNorm.numVal !== undefined && normVal.numVal !== undefined) {
          if (Math.abs(userNorm.numVal - normVal.numVal) <= tolerance) {
            isMatch = true;
            break;
          }
        }
      }

      return {
        earnedPoints: isMatch ? maxPoints : 0,
        isCorrect: isMatch,
      };
    }

    case 'essay': {
      // If teacher has already scored it
      if (userAnswer.teacherScore !== undefined) {
        return {
          earnedPoints: userAnswer.teacherScore,
          isCorrect: userAnswer.teacherScore >= maxPoints * 0.5,
          partialDetail: 'Đã giáo viên chấm',
        };
      }
      // If pending manual review
      return {
        earnedPoints: 0,
        isCorrect: false,
        partialDetail: 'Chờ giáo viên chấm',
      };
    }

    default:
      return { earnedPoints: 0, isCorrect: false };
  }
}

/**
 * Calculates full attempt score breakdown & mastery percentage
 */
export function calculateAttemptScore(
  questions: Question[],
  answers: Record<string, AttemptAnswer>
): {
  totalScore: number;
  maxScore: number;
  mcqScore: number;
  tfScore: number;
  saScore: number;
  essayScore: number;
  isPendingManualGrading: boolean;
  masteryPercent: number;
  correctAnswersCount: number;
  totalAnsweredCount: number;
  totalSubItemsCount: number;
} {
  let totalScore = 0;
  let maxScore = 0;
  let mcqScore = 0;
  let tfScore = 0;
  let saScore = 0;
  let essayScore = 0;
  let isPendingManualGrading = false;
  let correctAnswersCount = 0;
  let answeredSubItems = 0;
  let totalSubItems = 0;

  for (const q of questions) {
    maxScore += q.points || 1.0;
    const ans = answers[q.id];
    const { earnedPoints, isCorrect } = gradeSingleQuestion(q, ans);

    totalScore += earnedPoints;
    if (isCorrect) correctAnswersCount++;

    if (q.type === 'mcq') {
      mcqScore += earnedPoints;
      totalSubItems += 1;
      if (ans?.selectedOption) answeredSubItems += 1;
    } else if (q.type === 'true_false') {
      tfScore += earnedPoints;
      const statementCount = q.statements?.length || 4;
      totalSubItems += statementCount;
      if (ans?.tfAnswers) {
        answeredSubItems += Object.keys(ans.tfAnswers).length;
      }
    } else if (q.type === 'short_answer') {
      saScore += earnedPoints;
      totalSubItems += 1;
      if (ans?.shortAnswerText?.trim()) answeredSubItems += 1;
    } else if (q.type === 'essay') {
      essayScore += earnedPoints;
      totalSubItems += 1;
      if (ans?.essayContent?.trim() || (ans?.essayAttachments && ans.essayAttachments.length > 0)) {
        answeredSubItems += 1;
      }
      if (ans?.teacherScore === undefined) {
        isPendingManualGrading = true;
      }
    }
  }

  const masteryPercent = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

  return {
    totalScore: Math.round(totalScore * 100) / 100,
    maxScore: Math.round(maxScore * 100) / 100,
    mcqScore: Math.round(mcqScore * 100) / 100,
    tfScore: Math.round(tfScore * 100) / 100,
    saScore: Math.round(saScore * 100) / 100,
    essayScore: Math.round(essayScore * 100) / 100,
    isPendingManualGrading,
    masteryPercent,
    correctAnswersCount,
    totalAnsweredCount: answeredSubItems,
    totalSubItemsCount: totalSubItems,
  };
}

/**
 * Calculates level tier and XP progression
 */
export function calculateLevelFromXp(xp: number): {
  level: number;
  tier: 'Khởi động' | 'Nền tảng' | 'Thành thạo' | 'Chinh phục';
  nextLevelXp: number;
  progressToNextLevel: number;
} {
  let tier: 'Khởi động' | 'Nền tảng' | 'Thành thạo' | 'Chinh phục' = 'Khởi động';
  let level = 1;

  if (xp < 1500) {
    tier = 'Khởi động';
    level = Math.max(1, Math.floor(xp / 300) + 1);
  } else if (xp < 4000) {
    tier = 'Nền tảng';
    level = Math.floor((xp - 1500) / 500) + 6;
  } else if (xp < 8000) {
    tier = 'Thành thạo';
    level = Math.floor((xp - 4000) / 800) + 11;
  } else {
    tier = 'Chinh phục';
    level = Math.min(25, Math.floor((xp - 8000) / 1200) + 16);
  }

  const xpCurrentBracket = (level - 1) * 400;
  const xpNextBracket = level * 400;
  const progressToNextLevel = Math.min(100, Math.max(0, Math.round(((xp - xpCurrentBracket) / (xpNextBracket - xpCurrentBracket || 1)) * 100)));

  return {
    level,
    tier,
    nextLevelXp: xpNextBracket,
    progressToNextLevel,
  };
}
