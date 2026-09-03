import React, { useState, useRef, useEffect } from "react";
import { StudentProfile, GradeLevel } from "../types";
import { MathRenderer } from "../utils/mathJaxHelper";
import { chatWithThayCuongAi } from "../utils/geminiClient";
import {
  Bot,
  MessageSquare,
  X,
  Send,
  Sparkles,
  Maximize2,
  Minimize2,
  Trash2,
  Copy,
  Check,
  Zap,
  ChevronDown,
} from "lucide-react";

interface FloatingAiAssistantProps {
  student: StudentProfile;
  currentGrade: GradeLevel;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export const FloatingAiAssistant: React.FC<FloatingAiAssistantProps> = ({
  student,
  currentGrade,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "msg_float_init",
      role: "assistant",
      content: `Thầy chào em **${student.name}**! 👋\n\nThầy là **Trợ lý AI (Thầy Phan Quốc Cường)**. Em cần thầy hướng dẫn bài toán nào về **Toán ${currentGrade}** (Hàm số, $Oxyz$, Xác suất, Lượng giác,...), hãy nhắn ngay ở đây nhé!`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [messages, isOpen]);

  const handleSend = async (customPrompt?: string) => {
    const textToSend = customPrompt || input;
    if (!textToSend.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}_user`,
      role: "user",
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const reply = await chatWithThayCuongAi({
        messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
        studentName: student.name,
        grade: currentGrade,
      });

      const aiMsg: ChatMessage = {
        id: `msg_${Date.now()}_ai`,
        role: "assistant",
        content:
          reply ||
          "Thầy đã nhận được câu hỏi. Em hãy đọc kỹ các bước suy luận và thử áp dụng nhé!",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      console.error("Floating chat error:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: `msg_${Date.now()}_err`,
          role: "assistant",
          content: `[Lỗi AI] ${err.message || "Đường truyền đang bận, em hãy kiểm tra lại API Key trong Settings nhé!"}`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyMessage = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: `msg_clear_${Date.now()}`,
        role: "assistant",
        content: `Chào em **${student.name}**, thầy đã làm mới cuộc trò chuyện. Em cần thầy giải đáp bài toán nào tiếp theo?`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  const quickPrompts = [
    "Cách viết phương trình mặt cầu trong $Oxyz$?",
    "Công thức đạo hàm của hàm hợp?",
    "Tìm tiệm cận đứng, tiệm cận ngang đồ thị hàm số?",
    "Cách tính góc giữa 2 vectơ?",
  ];

  const mathShortcuts = [
    { label: "x²", latex: "$x^2$" },
    { label: "a/b", latex: "$\\frac{a}{b}$" },
    { label: "√x", latex: "$\\sqrt{x}$" },
    { label: "∫", latex: "$\\int$" },
    { label: "lim", latex: "$\\lim$" },
    { label: "u⃗", latex: "$\\vec{u}$" },
    { label: "Δ", latex: "$\\Delta$" },
    { label: "≤", latex: "$\\le$" },
    { label: "≥", latex: "$\\ge$" },
  ];

  return (
    <div id="floating_ai_assistant_container" className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Floating Chat Popup Window */}
      {isOpen && (
        <div
          id="floating_ai_chat_window"
          className={`mb-4 bg-white rounded-3xl border border-slate-200/90 shadow-2xl overflow-hidden flex flex-col transition-all duration-300 animate-in fade-in slide-in-from-bottom-5 ${
            isExpanded
              ? "w-[92vw] sm:w-[580px] h-[80vh] max-h-[720px]"
              : "w-[92vw] sm:w-[420px] h-[520px] max-h-[75vh]"
          }`}
        >
          {/* Header */}
          <div className="px-5 py-3.5 bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-900 text-white flex items-center justify-between select-none">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-amber-300">
                  <Bot className="w-4 h-4" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 border-indigo-900 rounded-full" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold tracking-tight flex items-center gap-1.5">
                  <span>Trợ lý AI</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                    Toán {currentGrade}
                  </span>
                </h4>
                <p className="text-[11px] text-blue-100/80">Thầy Phan Quốc Cường</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleClearChat}
                className="p-1.5 rounded-lg hover:bg-white/15 text-blue-100 hover:text-white transition-colors"
                title="Làm mới cuộc trò chuyện"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 rounded-lg hover:bg-white/15 text-blue-100 hover:text-white transition-colors"
                title={isExpanded ? "Thu nhỏ" : "Phóng to"}
              >
                {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>

              <button
                id="floating_ai_close_btn"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/15 text-blue-100 hover:text-white transition-colors"
                title="Đóng cửa sổ"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/60">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex items-start gap-2 ${
                  m.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {m.role === "assistant" && (
                  <div className="w-7 h-7 rounded-lg bg-indigo-700 text-white flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5 shadow-2xs">
                    C
                  </div>
                )}

                <div className="flex flex-col space-y-1 max-w-[85%]">
                  <div
                    className={`p-3.5 rounded-2xl text-xs sm:text-[13px] leading-relaxed relative group shadow-2xs ${
                      m.role === "user"
                        ? "bg-blue-600 text-white rounded-tr-xs"
                        : "bg-white text-slate-800 border border-slate-200/90 rounded-tl-xs"
                    }`}
                  >
                    <MathRenderer content={m.content} />

                    <button
                      onClick={() => handleCopyMessage(m.id, m.content)}
                      className={`absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 p-1 rounded-md text-[10px] transition-all ${
                        m.role === "user"
                          ? "bg-blue-700 text-blue-100 hover:bg-blue-800"
                          : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                      }`}
                      title="Sao chép"
                    >
                      {copiedId === m.id ? (
                        <Check className="w-3 h-3 text-emerald-500" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>

                  <span
                    className={`text-[9px] text-slate-400 px-1 ${
                      m.role === "user" ? "text-right" : "text-left"
                    }`}
                  >
                    {m.timestamp}
                  </span>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 p-3 rounded-2xl bg-indigo-50 border border-indigo-100 text-xs font-bold text-indigo-700 w-fit animate-pulse">
                <Bot className="w-4 h-4 animate-spin text-indigo-600" />
                <span>Thầy Cường đang giải bài toán...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick suggestions */}
          <div className="px-3 py-1.5 bg-slate-100/90 border-t border-slate-200 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <span className="text-[10px] font-bold text-slate-500 shrink-0 flex items-center gap-0.5">
              <Zap className="w-3 h-3 text-amber-500" />
              Gợi ý:
            </span>
            {quickPrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(p)}
                className="text-[10px] font-medium bg-white hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 border border-slate-200 px-2 py-0.5 rounded-md text-slate-700 whitespace-nowrap transition-colors"
              >
                {p}
              </button>
            ))}
          </div>

          {/* Math Shortcuts */}
          <div className="px-3 py-1 bg-white border-t border-slate-100 flex items-center gap-1 overflow-x-auto no-scrollbar text-xs">
            <span className="text-[9px] text-slate-400 shrink-0 font-medium">Chèn:</span>
            {mathShortcuts.map((s, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setInput((prev) => prev + s.latex);
                  inputRef.current?.focus();
                }}
                className="px-1.5 py-0.5 rounded bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-700 border border-slate-200 text-[10px] font-mono"
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <div className="p-2.5 sm:p-3 bg-white border-t border-slate-200 flex items-center gap-1.5">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Nhập bài toán cần Thầy Cường giải đáp..."
              className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
            />
            <button
              id="floating_ai_send_btn"
              onClick={() => handleSend()}
              disabled={!input.trim() || loading}
              className="px-3 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-95 disabled:opacity-50 text-white font-bold text-xs shadow-md transition-all active:scale-95 flex items-center gap-1"
            >
              <span>Gửi</span>
              <Send className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Floating Action Button (Icon at Bottom Right) */}
      <button
        id="floating_ai_trigger_btn"
        onClick={() => setIsOpen(!isOpen)}
        className="group flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-800 text-white font-extrabold text-sm shadow-xl shadow-indigo-900/30 hover:shadow-2xl hover:scale-105 active:scale-95 border border-white/20 transition-all duration-300"
        title="Mở Trợ lý AI (Thầy Phan Quốc Cường)"
      >
        <div className="relative">
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-amber-300">
            {isOpen ? <ChevronDown className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4" />}
          </div>
          {!isOpen && (
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400" />
            </span>
          )}
        </div>

        <span className="tracking-wide">Trợ lý AI</span>

        <Sparkles className="w-4 h-4 text-amber-300 group-hover:rotate-12 transition-transform" />
      </button>
    </div>
  );
};
