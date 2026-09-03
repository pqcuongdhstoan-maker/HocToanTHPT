import React, { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import { MathRenderer } from "../utils/mathJaxHelper";
import {
  X,
  Zap,
  Clock,
  Award,
  Flame,
  CheckCircle2,
  XCircle,
  Play,
  RotateCcw,
  Sparkles,
  Trophy,
} from "lucide-react";

interface SpeedrunMathChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRewardPoints?: (points: number) => void;
}

interface SpeedQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

const SPEED_QUESTIONS: SpeedQuestion[] = [
  {
    question: "Đạo hàm của hàm số $y = x^4 - 2x^2 + 1$ là:",
    options: ["$y' = 4x^3 - 4x$", "$y' = 4x^3 - 2x$", "$y' = 3x^3 - 4x$", "$y' = 4x^2 - 4$"],
    correctAnswer: "$y' = 4x^3 - 4x$",
    explanation: "$(x^4)' = 4x^3, (2x^2)' = 4x$.",
  },
  {
    question: "Đường tiệm cận đứng của đồ thị $y = \\frac{2x - 3}{x + 1}$ là:",
    options: ["$x = -1$", "$x = 1$", "$y = 2$", "$x = 2$"],
    correctAnswer: "$x = -1$",
    explanation: "Nghiệm của mẫu số $x + 1 = 0 \\iff x = -1$.",
  },
  {
    question: "Họ nguyên hàm của hàm số $f(x) = e^{2x}$ là:",
    options: ["$\\frac{1}{2}e^{2x} + C$", "$2e^{2x} + C$", "$e^{2x} + C$", "$\\frac{1}{2}e^x + C$"],
    correctAnswer: "$\\frac{1}{2}e^{2x} + C$",
    explanation: "$\\int e^{ax+b}dx = \\frac{1}{a}e^{ax+b} + C$.",
  },
  {
    question: "Tọa độ vectơ $\\vec{u} = 2\\vec{i} - 3\\vec{j} + 5\\vec{k}$ trong không gian $Oxyz$ là:",
    options: ["$(2; -3; 5)$", "$(2; 3; 5)$", "$(-3; 2; 5)$", "$(5; -3; 2)$"],
    correctAnswer: "$(2; -3; 5)$",
    explanation: "Tọa độ theo thứ tự $\\vec{i}, \\vec{j}, \\vec{k}$.",
  },
  {
    question: "Đạo hàm của hàm số $y = \\ln(2x + 1)$ là:",
    options: ["$\\frac{2}{2x+1}$", "$\\frac{1}{2x+1}$", "$\\frac{2}{(2x+1)^2}$", "$\\frac{1}{x}$"],
    correctAnswer: "$\\frac{2}{2x+1}$",
    explanation: "$(\\ln u)' = \\frac{u'}{u} = \\frac{2}{2x+1}$.",
  },
  {
    question: "Tích vô hướng $\\vec{a} \\cdot \\vec{b}$ với $\\vec{a}=(1; 2; -1)$ và $\\vec{b}=(2; -1; 3)$ là:",
    options: ["$-3$", "$3$", "$1$", "$-1$"],
    correctAnswer: "$-3$",
    explanation: "$1\\times2 + 2\\times(-1) + (-1)\\times3 = 2 - 2 - 3 = -3$.",
  },
  {
    question: "Hàm số $y = x^3 - 3x$ đạt cực tiểu tại điểm nào?",
    options: ["$x = 1$", "$x = -1$", "$x = 0$", "$x = 2$"],
    correctAnswer: "$x = 1$",
    explanation: "$y' = 3x^2 - 3 = 0 \\iff x = \\pm 1$. Tại $x=1$, $y'' = 6 > 0$ nên là điểm cực tiểu.",
  },
  {
    question: "Thể tích khối lăng trụ có diện tích đáy $B = 6$ và chiều cao $h = 4$ là:",
    options: ["$24$", "$8$", "$12$", "$72$"],
    correctAnswer: "$24$",
    explanation: "$V = B \\cdot h = 6 \\times 4 = 24$.",
  },
];

export const SpeedrunMathChallengeModal: React.FC<SpeedrunMathChallengeModalProps> = ({
  isOpen,
  onClose,
  onRewardPoints,
}) => {
  const [gameState, setGameState] = useState<"READY" | "PLAYING" | "FINISHED">("READY");
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [score, setScore] = useState<number>(0);
  const [combo, setCombo] = useState<number>(0);
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [lastAnswerStatus, setLastAnswerStatus] = useState<"CORRECT" | "WRONG" | null>(null);

  // Countdown timer
  useEffect(() => {
    if (gameState !== "PLAYING") return;
    if (timeLeft <= 0) {
      handleFinishGame();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState, timeLeft]);

  if (!isOpen) return null;

  const handleStartGame = () => {
    setGameState("PLAYING");
    setTimeLeft(60);
    setScore(0);
    setCombo(0);
    setCurrentIdx(0);
    setLastAnswerStatus(null);
  };

  const handleSelectAnswer = (chosenOpt: string) => {
    if (gameState !== "PLAYING") return;
    const currentQ = SPEED_QUESTIONS[currentIdx % SPEED_QUESTIONS.length];

    if (chosenOpt === currentQ.correctAnswer) {
      // Score calculation with multiplier
      const multiplier = combo >= 6 ? 3 : combo >= 3 ? 2 : 1;
      const pointsEarned = 10 * multiplier;
      setScore((prev) => prev + pointsEarned);
      setCombo((prev) => prev + 1);
      setLastAnswerStatus("CORRECT");
    } else {
      setCombo(0);
      setLastAnswerStatus("WRONG");
    }

    // Advance question
    setTimeout(() => {
      setCurrentIdx((prev) => prev + 1);
      setLastAnswerStatus(null);
    }, 200);
  };

  const handleFinishGame = () => {
    setGameState("FINISHED");
    try {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore
    }

    if (onRewardPoints && score > 0) {
      onRewardPoints(Math.round(score / 2));
    }
  };

  const currentQ = SPEED_QUESTIONS[currentIdx % SPEED_QUESTIONS.length];
  const multiplier = combo >= 6 ? 3 : combo >= 3 ? 2 : 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/80 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-amber-200">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg">
                Đấu Trường Toán Học 60 Giây
              </h3>
              <p className="text-xs text-amber-100">
                Thử thách phản xạ nhanh Toán GDPT 2018 • Gamification
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {gameState === "READY" && (
            <div className="text-center py-8 space-y-5">
              <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-100 text-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                <Trophy className="w-10 h-10" />
              </div>
              <div>
                <h4 className="text-xl font-black text-slate-900">
                  Sẵn Sàng Thử Thách Phản Xạ?
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 max-w-sm mx-auto mt-2 leading-relaxed">
                  Bạn có <strong>60 giây</strong> để giải càng nhiều câu hỏi tính nhẩm đạo hàm, tiệm cận, nguyên hàm, vectơ càng tốt. Đúng liên tiếp để nhân điểm Combo!
                </p>
              </div>

              <button
                onClick={handleStartGame}
                className="px-8 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-extrabold text-sm sm:text-base shadow-lg shadow-orange-500/30 transition-all active:scale-95 flex items-center gap-2 mx-auto"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>Bắt Đầu Ngay (60s)</span>
              </button>
            </div>
          )}

          {gameState === "PLAYING" && (
            <div className="space-y-6">
              {/* Stats Bar */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2">
                  <Clock className={`w-5 h-5 ${timeLeft <= 10 ? "text-rose-600 animate-bounce" : "text-blue-600"}`} />
                  <span className={`text-xl font-black ${timeLeft <= 10 ? "text-rose-600" : "text-slate-800"}`}>
                    {timeLeft}s
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-amber-500 fill-amber-500 animate-pulse" />
                  <span className="text-sm font-black text-amber-600">
                    Combo: x{multiplier} ({combo} liên tiếp)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-emerald-600" />
                  <span className="text-xl font-black text-emerald-700">{score} đ</span>
                </div>
              </div>

              {/* Question Card */}
              <div className="p-6 rounded-3xl bg-blue-50/50 border border-blue-100 text-center space-y-3 min-h-[120px] flex flex-col justify-center">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600">
                  Câu hỏi {currentIdx + 1}
                </span>
                <div className="text-base sm:text-lg font-bold text-slate-900">
                  <MathRenderer content={currentQ.question} />
                </div>
              </div>

              {/* Options Grid */}
              <div className="grid grid-cols-2 gap-3">
                {currentQ.options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSelectAnswer(opt)}
                    className="p-4 rounded-2xl border-2 border-slate-200 hover:border-amber-500 hover:bg-amber-50/50 text-slate-800 text-sm font-bold transition-all active:scale-95 text-center flex items-center justify-center min-h-[64px]"
                  >
                    <MathRenderer content={opt} inline />
                  </button>
                ))}
              </div>
            </div>
          )}

          {gameState === "FINISHED" && (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <Trophy className="w-8 h-8" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase text-slate-400">Kết quả Đấu trường</span>
                <h4 className="text-2xl font-black text-slate-900 mt-1">
                  Tuyệt vời! Đạt {score} Điểm 🎉
                </h4>
                <p className="text-xs text-slate-600 mt-1">
                  Đã cộng <strong>+{Math.round(score / 2)} điểm</strong> tích lũy vào hồ sơ học tập của bạn!
                </p>
              </div>

              <div className="pt-2 flex justify-center gap-3">
                <button
                  onClick={handleStartGame}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-1.5 transition-all"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Chơi lại</span>
                </button>
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs"
                >
                  Đóng
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
