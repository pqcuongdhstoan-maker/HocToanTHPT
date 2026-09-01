import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { MathContent } from '../common/MathContent';
import { Question } from '../../types';
import confetti from 'canvas-confetti';
import {
  Swords,
  Trophy,
  Flame,
  Clock,
  CheckCircle2,
  XCircle,
  Zap,
  Sparkles,
  Award,
  RotateCcw,
  Bot,
  User,
  Shield,
  ArrowRight,
} from 'lucide-react';

interface ArenaOpponent {
  name: string;
  className: string;
  avatar: string;
  level: number;
  accuracy: number; // 0.6 to 0.95
}

const OPPONENTS: ArenaOpponent[] = [
  { name: 'Nguyễn Hoài Nam', className: '12TN1', avatar: '👨‍🎓', level: 4, accuracy: 0.75 },
  { name: 'Trần Thị Mai Anh', className: '12A1', avatar: '👩‍🎓', level: 5, accuracy: 0.85 },
  { name: 'Phạm Hoàng Bách', className: '12TN2', avatar: '⚡', level: 6, accuracy: 0.9 },
  { name: 'AI Socratic Bot', className: 'Toán 12 AI', avatar: '🤖', level: 10, accuracy: 0.95 },
];

export const MathArena: React.FC = () => {
  const { currentUser, showToast } = useApp();

  const [gameState, setGameState] = useState<'lobby' | 'playing' | 'result'>('lobby');
  const [matchLength, setMatchLength] = useState<number>(5);
  const [opponent, setOpponent] = useState<ArenaOpponent>(OPPONENTS[0]);

  // Question bank for Arena (Fast MCQs)
  const [arenaQuestions, setArenaQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(15);

  // Scores & Answers
  const [playerScore, setPlayerScore] = useState<number>(0);
  const [opponentScore, setOpponentScore] = useState<number>(0);
  const [selectedOpt, setSelectedOpt] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [roundWinner, setRoundWinner] = useState<'player' | 'opponent' | 'both' | 'none' | null>(null);

  // Load questions
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const res = await fetch('/api/questions/lesson/lesson-1');
        const data = await res.json();
        if (data.questions && data.questions.length > 0) {
          const mcqs = data.questions.filter((q: Question) => q.type === 'mcq');
          setArenaQuestions(mcqs);
        }
      } catch (err) {
        console.warn('Could not load arena questions, using seeds:', err);
      }
    };
    fetchQuestions();
  }, []);

  // Timer per question
  useEffect(() => {
    if (gameState !== 'playing' || isAnswered) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleTimeOut();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState, currentIdx, isAnswered]);

  const handleStartMatch = (len: number, opp: ArenaOpponent) => {
    setMatchLength(len);
    setOpponent(opp);
    setPlayerScore(0);
    setOpponentScore(0);
    setCurrentIdx(0);
    setTimeLeft(15);
    setSelectedOpt(null);
    setIsAnswered(false);
    setRoundWinner(null);
    setGameState('playing');
    showToast('Trận đấu bắt đầu!', '15 giây mỗi câu hỏi. Chúc bạn chiến thắng!', 'info');
  };

  const handleSelectOption = (optId: string) => {
    if (isAnswered) return;
    setIsAnswered(true);
    setSelectedOpt(optId);

    const currentQ = arenaQuestions[currentIdx] || arenaQuestions[0];
    const isPlayerCorrect = optId === currentQ.correctAnswer;

    // Simulate Opponent's Answer based on accuracy
    const isOpponentCorrect = Math.random() < opponent.accuracy;

    let pEarn = 0;
    let oEarn = 0;

    if (isPlayerCorrect) {
      pEarn = Math.max(10, timeLeft * 2);
      setPlayerScore((prev) => prev + pEarn);
    }

    if (isOpponentCorrect) {
      oEarn = Math.max(10, Math.floor(Math.random() * 8 + 8) * 2);
      setOpponentScore((prev) => prev + oEarn);
    }

    if (isPlayerCorrect && isOpponentCorrect) setRoundWinner('both');
    else if (isPlayerCorrect) setRoundWinner('player');
    else if (isOpponentCorrect) setRoundWinner('opponent');
    else setRoundWinner('none');

    // Next round after 2 seconds
    setTimeout(() => {
      if (currentIdx + 1 < Math.min(matchLength, arenaQuestions.length)) {
        setCurrentIdx((prev) => prev + 1);
        setTimeLeft(15);
        setSelectedOpt(null);
        setIsAnswered(false);
        setRoundWinner(null);
      } else {
        // End of match
        setGameState('result');
        if (playerScore + pEarn > opponentScore + oEarn) {
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
          showToast('Chiến Thắng Tuyệt Đối!', 'Bạn đã đánh bại đối thủ và nhận +150 XP!', 'success');
        }
      }
    }, 2200);
  };

  const handleTimeOut = () => {
    setIsAnswered(true);
    setSelectedOpt('TIMEOUT');
    const isOpponentCorrect = Math.random() < opponent.accuracy;
    if (isOpponentCorrect) {
      setOpponentScore((prev) => prev + 20);
      setRoundWinner('opponent');
    } else {
      setRoundWinner('none');
    }

    setTimeout(() => {
      if (currentIdx + 1 < Math.min(matchLength, arenaQuestions.length)) {
        setCurrentIdx((prev) => prev + 1);
        setTimeLeft(15);
        setSelectedOpt(null);
        setIsAnswered(false);
        setRoundWinner(null);
      } else {
        setGameState('result');
      }
    }, 2000);
  };

  const currentQ = arenaQuestions[currentIdx] || arenaQuestions[0];

  return (
    <div id="math-arena-container" className="max-w-4xl mx-auto space-y-6 pb-20 animate-fadeIn">
      {/* LOBBY SCREEN */}
      {gameState === 'lobby' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-8">
          {/* Header */}
          <div className="text-center space-y-2 max-w-xl mx-auto">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-600 flex items-center justify-center mx-auto text-white shadow-lg shadow-orange-500/30">
              <Swords className="w-8 h-8" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Đấu Trường Toán Học 1v1
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Thi đấu giải nhanh trắc nghiệm thời gian thực. Trả lời càng nhanh và chính xác, điểm thưởng XP càng cao!
            </p>
          </div>

          {/* Opponent Selection Grid */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
              1. Chọn đối thủ thách đấu:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {OPPONENTS.map((opp) => {
                const isSelected = opponent.name === opp.name;
                return (
                  <div
                    key={opp.name}
                    onClick={() => setOpponent(opp)}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-orange-500 bg-orange-50/50 shadow-md ring-2 ring-orange-400/40 scale-102'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-3xl mb-2 text-center">{opp.avatar}</div>
                    <div className="font-bold text-xs text-slate-900 text-center truncate">{opp.name}</div>
                    <div className="text-[11px] text-slate-500 text-center mt-0.5">{opp.className}</div>
                    <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-semibold text-slate-600">
                      <span>Cấp {opp.level}</span>
                      <span className="text-orange-600">Độ chính xác: {(opp.accuracy * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Match Length Selection */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
              2. Chọn thể thức trận đấu:
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleStartMatch(5, opponent)}
                className="p-5 rounded-2xl border-2 border-teal-500 bg-teal-50/60 hover:bg-teal-100/80 text-teal-950 font-bold transition flex flex-col items-center gap-1 shadow-sm active:scale-98"
              >
                <Zap className="w-6 h-6 text-teal-600" />
                <span className="text-base font-black">Trận Đấu Nhanh (5 Câu)</span>
                <span className="text-xs font-normal text-teal-800">Thời gian ~ 2 phút • Thưởng +100 XP</span>
              </button>

              <button
                onClick={() => handleStartMatch(10, opponent)}
                className="p-5 rounded-2xl border-2 border-orange-500 bg-orange-50/60 hover:bg-orange-100/80 text-orange-950 font-bold transition flex flex-col items-center gap-1 shadow-sm active:scale-98"
              >
                <Trophy className="w-6 h-6 text-orange-600" />
                <span className="text-base font-black">Đại Chiến 10 Câu (Vinh Danh)</span>
                <span className="text-xs font-normal text-orange-800">Thời gian ~ 4 phút • Thưởng +250 XP</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PLAYING SCREEN */}
      {gameState === 'playing' && currentQ && (
        <div className="space-y-6">
          {/* Battle Header & Live Health/Scores */}
          <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white rounded-3xl p-6 shadow-xl border border-teal-800 space-y-4">
            <div className="flex items-center justify-between">
              {/* Player Side */}
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-600 flex items-center justify-center font-bold text-base shadow">
                  👨‍🎓
                </div>
                <div>
                  <div className="font-bold text-xs text-white truncate max-w-[120px] sm:max-w-none">
                    {currentUser.fullName}
                  </div>
                  <div className="text-[11px] text-teal-300 font-mono font-black text-lg">
                    {playerScore} <span className="text-[10px] font-normal text-teal-400">Điểm</span>
                  </div>
                </div>
              </div>

              {/* Center Countdown Timer */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-14 h-14 rounded-full border-4 flex items-center justify-center font-mono font-black text-xl shadow-lg transition-all ${
                    timeLeft <= 5
                      ? 'border-rose-500 bg-rose-950 text-rose-300 animate-ping'
                      : 'border-amber-400 bg-amber-950 text-amber-300'
                  }`}
                >
                  {timeLeft}
                </div>
                <span className="text-[10px] text-slate-400 mt-1 uppercase font-bold">
                  Câu {currentIdx + 1}/{matchLength}
                </span>
              </div>

              {/* Opponent Side */}
              <div className="flex items-center space-x-3 text-right">
                <div>
                  <div className="font-bold text-xs text-white truncate max-w-[120px] sm:max-w-none">
                    {opponent.name}
                  </div>
                  <div className="text-[11px] text-orange-300 font-mono font-black text-lg">
                    {opponentScore} <span className="text-[10px] font-normal text-orange-400">Điểm</span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-orange-600 flex items-center justify-center font-bold text-base shadow">
                  {opponent.avatar}
                </div>
              </div>
            </div>

            {/* Score Comparison Progress Bar */}
            <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden flex border border-slate-700">
              <div
                className="bg-teal-400 h-full transition-all duration-300"
                style={{
                  width: `${(playerScore / (playerScore + opponentScore || 1)) * 100}%`,
                }}
              />
              <div
                className="bg-orange-500 h-full transition-all duration-300"
                style={{
                  width: `${(opponentScore / (playerScore + opponentScore || 1)) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Question Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-sm font-semibold text-slate-900 leading-relaxed">
              <MathContent content={currentQ.stem || ''} />
            </div>

            {/* 4 Options Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {currentQ.options?.map((opt) => {
                const isSelected = selectedOpt === opt.id;
                const isCorrect = isAnswered && opt.id === currentQ.correctAnswer;
                const isWrongSelected = isAnswered && isSelected && !isCorrect;

                return (
                  <button
                    key={opt.id}
                    disabled={isAnswered}
                    onClick={() => handleSelectOption(opt.id)}
                    className={`p-4 rounded-2xl border-2 text-left font-semibold text-xs transition-all flex items-center justify-between ${
                      isCorrect
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-950 font-bold'
                        : isWrongSelected
                        ? 'border-rose-500 bg-rose-50 text-rose-950 font-bold'
                        : isSelected
                        ? 'border-teal-500 bg-teal-50 text-teal-950'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="w-6 h-6 rounded-lg bg-slate-100 border border-slate-300 flex items-center justify-center font-bold text-xs">
                        {opt.id}
                      </span>
                      <span>
                        <MathContent content={opt.text} />
                      </span>
                    </div>
                    {isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />}
                    {isWrongSelected && <XCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* Round Result Feedback Banner */}
            {isAnswered && (
              <div
                className={`p-4 rounded-2xl border text-xs font-bold text-center animate-fadeIn ${
                  roundWinner === 'player'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                    : roundWinner === 'opponent'
                    ? 'bg-orange-50 border-orange-300 text-orange-900'
                    : roundWinner === 'both'
                    ? 'bg-teal-50 border-teal-300 text-teal-900'
                    : 'bg-slate-100 border-slate-300 text-slate-700'
                }`}
              >
                {roundWinner === 'player' && '🎉 Bạn trả lời đúng và nhanh hơn! (+Điểm)'}
                {roundWinner === 'opponent' && `⚡ ${opponent.name} đã trả lời đúng trước bạn!`}
                {roundWinner === 'both' && '🔥 Cả 2 đều trả lời chính xác! (+Điểm)'}
                {roundWinner === 'none' && '❌ Cả 2 đều chưa tìm được đáp án chính xác!'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* RESULT SCREEN */}
      {gameState === 'result' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-md text-center space-y-6 max-w-lg mx-auto animate-fadeIn">
          <div className="text-5xl mb-2">
            {playerScore > opponentScore ? '🏆' : playerScore === opponentScore ? '🤝' : '🥈'}
          </div>

          <h2 className="text-2xl font-black text-slate-900">
            {playerScore > opponentScore ? 'CHIẾN THẮNG TUYỆT ĐỐI!' : playerScore === opponentScore ? 'TRẬN ĐẤU BẤT PHÂN THẮNG BẠI!' : 'BẠN ĐÃ THUA TRẬN NÀY!'}
          </h2>

          <div className="flex items-center justify-center space-x-6 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
            <div>
              <div className="text-slate-500 font-semibold">{currentUser.fullName}</div>
              <div className="text-2xl font-black text-teal-700 mt-1">{playerScore}</div>
            </div>
            <div className="text-xl font-bold text-slate-400">VS</div>
            <div>
              <div className="text-slate-500 font-semibold">{opponent.name}</div>
              <div className="text-2xl font-black text-orange-600 mt-1">{opponentScore}</div>
            </div>
          </div>

          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 font-bold">
            {playerScore > opponentScore ? '🎁 Thưởng: +150 XP vào hồ sơ của bạn!' : 'Đừng nản chí! Hãy ôn tập lại lý thuyết và thử lại nhé!'}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setGameState('lobby')}
              className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl text-xs font-bold transition"
            >
              Về Sảnh Đấu Trường
            </button>
            <button
              onClick={() => handleStartMatch(matchLength, opponent)}
              className="flex-1 py-3 bg-gradient-to-r from-teal-700 to-teal-800 hover:from-teal-800 hover:to-teal-900 text-white rounded-2xl text-xs font-bold transition shadow-md"
            >
              Tái Đấu Ngay
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
