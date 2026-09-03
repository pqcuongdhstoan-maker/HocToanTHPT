import React, { useState, useRef, useEffect } from "react";
import { StudentProfile } from "../types";
import { MathRenderer } from "../utils/mathJaxHelper";
import { chatWithThayCuongAi } from "../utils/geminiClient";
import {
  Bot,
  X,
  Send,
  Sparkles,
  HelpCircle,
  Lightbulb,
  GraduationCap,
  MessageSquare,
} from "lucide-react";

interface AiMathAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentProfile;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export const AiMathAssistantModal: React.FC<AiMathAssistantModalProps> = ({
  isOpen,
  onClose,
  student,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "msg_init",
      role: "assistant",
      content: `Thầy chào em **${student.name}**! 🎓\n\nThầy là **Thầy Cường AI** - Chuyên gia sư phạm Toán học THPT (GDPT 2018). Em đang gặp khó khăn ở chương nào (Khảo sát hàm số, Vectơ không gian $Oxyz$, Tích phân hay Xác suất điều kiện)? Cứ nhắn cho thầy để cùng nhau gỡ rối từng bước nhé!`,
    },
  ]);
  const [input, setInput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSend = async (customPrompt?: string) => {
    const textToSend = customPrompt || input;
    if (!textToSend.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}_user`,
      role: "user",
      content: textToSend,
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const reply = await chatWithThayCuongAi({
        messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
        studentName: student.name,
        grade: student.grade,
      });

      const aiMsg: ChatMessage = {
        id: `msg_${Date.now()}_ai`,
        role: "assistant",
        content: reply || "Thầy đã nhận được câu hỏi. Hãy cùng giải bài toán này nhé!",
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      console.error("Chat error:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: `msg_${Date.now()}_err`,
          role: "assistant",
          content: `[Lỗi kết nối AI] ${err.message || "Đường truyền đang bận, em hãy kiểm tra lại API Key trong Settings nhé!"}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    "Thầy giải thích giúp em cách tìm tiệm cận xiên $y = ax+b$",
    "Cách phân biệt xác suất có điều kiện $P(A|B)$ và công thức Bayes",
    "Bí quyết nhớ bảng nguyên hàm từng phần $\\int u dv = uv - \\int v du$",
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-2xl h-[90vh] max-h-[700px] border border-slate-200 shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <Bot className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base">
                Trợ lý Thầy Cường AI
              </h3>
              <p className="text-[11px] text-blue-100">
                Sư phạm Toán THPT • Giải toán chuẩn LaTeX MathJax
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-slate-50/50">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex items-start gap-2.5 ${
                m.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {m.role === "assistant" && (
                <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 shadow-xs">
                  C
                </div>
              )}

              <div
                className={`p-4 rounded-2xl max-w-[85%] text-xs sm:text-sm leading-relaxed shadow-xs ${
                  m.role === "user"
                    ? "bg-blue-600 text-white rounded-tr-xs"
                    : "bg-white text-slate-800 border border-slate-200/90 rounded-tl-xs"
                }`}
              >
                <MathRenderer content={m.content} />
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 p-3 rounded-2xl bg-indigo-50 border border-indigo-100 text-xs font-bold text-indigo-700 w-fit">
              <Bot className="w-4 h-4 animate-spin" />
              <span>Thầy Cường đang suy nghĩ và chuẩn bị lời giải...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-4 py-2 bg-slate-100 border-t border-slate-200 flex items-center gap-2 overflow-x-auto">
          <span className="text-[10px] font-bold uppercase text-slate-500 shrink-0">
            Gợi ý hỏi:
          </span>
          {quickPrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(p)}
              className="text-[11px] font-medium bg-white hover:bg-slate-200/70 border border-slate-200 px-2.5 py-1 rounded-lg text-slate-700 whitespace-nowrap transition-colors"
            >
              {p.slice(0, 32)}...
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 bg-white border-t border-slate-200 flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Nhập câu hỏi toán (ví dụ: 'Tại sao câu 3 đạo hàm bằng 0?')..."
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white shadow-xs transition-all active:scale-95"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
