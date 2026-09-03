import React, { useState, useRef, useEffect } from "react";
import { StudentProfile, GradeLevel } from "../types";
import { MathRenderer } from "../utils/mathJaxHelper";
import { chatWithThayCuongAi } from "../utils/geminiClient";
import {
  Bot,
  Send,
  Sparkles,
  RefreshCw,
  Trash2,
  Maximize2,
  Minimize2,
  Copy,
  Check,
  Brain,
  HelpCircle,
  Lightbulb,
  BookOpen,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Zap,
} from "lucide-react";

interface HomeAiChatBoxProps {
  student: StudentProfile;
  currentGrade: GradeLevel;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export const HomeAiChatBox: React.FC<HomeAiChatBoxProps> = ({
  student,
  currentGrade,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "msg_home_init",
      role: "assistant",
      content: `Thầy chào em **${student.name}**! 🎓\n\nThầy là **Thầy Phan Quốc Cường AI** trực tiếp hỗ trợ em tại Trang chủ. Em có bất kỳ thắc mắc nào về phương pháp giải Toán ${currentGrade} (Đơn điệu hàm số, Cực trị, Tọa độ không gian $Oxyz$, Tích phân, Lượng giác, hay Xác suất điều kiện), hãy nhắn cho thầy hoặc chọn các gợi ý bên dưới để cùng giải nhé!`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const [input, setInput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isExpanded) {
      scrollToBottom();
    }
  }, [messages, isExpanded]);

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
      console.error("Chat error:", err);
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

  // Math symbol quick insertion
  const handleInsertSymbol = (latex: string) => {
    setInput((prev) => prev + latex);
    inputRef.current?.focus();
  };

  // Copy message text
  const handleCopyMessage = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Clear chat history
  const handleClearChat = () => {
    if (window.confirm("Em có muốn làm mới cuộc trò chuyện với Thầy Cường AI?")) {
      setMessages([
        {
          id: `msg_clear_${Date.now()}`,
          role: "assistant",
          content: `Chào em **${student.name}**, thầy đã làm mới cuộc trò chuyện. Em muốn thầy hỗ trợ chủ đề toán nào tiếp theo?`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }
  };

  // Dynamic quick prompts based on current grade
  const gradePrompts: Record<GradeLevel, string[]> = {
    12: [
      "Thầy giải thích cách tìm tiệm cận xiên $y = ax+b$ của đồ thị hàm số?",
      "Cách viết phương trình mặt phẳng $(P)$ đi qua 3 điểm trong $Oxyz$?",
      "Công thức xác suất có điều kiện $P(A|B)$ và công thức xác suất toàn phần?",
      "Cách tìm GTLN, GTNN của hàm số trên đoạn $[a; b]$?",
    ],
    11: [
      "Phương pháp giải phương trình lượng giác cơ bản $\\sin x = m, \\cos x = m$?",
      "Công thức số hạng tổng quát của Cấp số nhân $u_n = u_1 \\cdot q^{n-1}$?",
      "Cách tính giới hạn dạng vô định $\\frac{0}{0}$ bằng phương pháp nhân lượng liên hợp?",
      "Tính đạo hàm của hàm hợp $(u^n)' = n \\cdot u^{n-1} \\cdot u'$?",
    ],
    10: [
      "Cách xét dấu tam thức bậc hai $f(x) = ax^2 + bx + c$?",
      "Tích vô hướng của 2 vectơ $\\vec{a} \\cdot \\vec{b} = |\\vec{a}| |\\vec{b}| \\cos(\\vec{a}, \\vec{b})$?",
      "Công thức tính diện tích tam giác theo công thức Hê-rông $S = \\sqrt{p(p-a)(p-b)(p-c)}$?",
      "Cách xác định góc giữa hai đường thẳng trong mặt phẳng tọa độ $Oxy$?",
    ],
  };

  const mathShortcuts = [
    { label: "x²", latex: "$x^2$" },
    { label: "a/b", latex: "$\\frac{a}{b}$" },
    { label: "√x", latex: "$\\sqrt{x}$" },
    { label: "∫", latex: "$\\int f(x)dx$" },
    { label: "lim", latex: "$\\lim_{x \\to x_0}$" },
    { label: "u⃗", latex: "$\\vec{u}$" },
    { label: "Δ", latex: "$\\Delta$" },
    { label: "∈", latex: "$\\in$" },
    { label: "≤", latex: "$\\le$" },
    { label: "≥", latex: "$\\ge$" },
  ];

  return (
    <div
      id="home_ai_chatbox"
      className="bg-white rounded-3xl border border-slate-200/90 shadow-lg shadow-indigo-900/5 overflow-hidden transition-all duration-300"
    >
      {/* Header */}
      <div className="px-5 py-4 bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-900 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center border border-white/20 text-amber-300 shadow-xs">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                AI Trực tuyến
              </span>
              <span className="text-xs text-blue-200 font-medium">Toán {currentGrade} GDPT 2018</span>
            </div>
            <h3 className="text-sm sm:text-base font-black tracking-tight flex items-center gap-1.5">
              Hộp Thoại Hỏi Đáp Thầy Phan Quốc Cường AI
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleClearChat}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="Xóa làm mới hội thoại"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            title={isExpanded ? "Thu gọn hộp chat" : "Mở rộng hộp chat"}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Collapsible Content */}
      {isExpanded && (
        <div className="flex flex-col h-[460px] sm:h-[500px]">
          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-slate-50/60">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex items-start gap-2.5 ${
                  m.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {m.role === "assistant" && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-700 to-blue-600 text-white flex items-center justify-center text-xs font-black shrink-0 mt-0.5 shadow-xs border border-white/20">
                    C
                  </div>
                )}

                <div className="flex flex-col space-y-1 max-w-[85%] sm:max-w-[78%]">
                  <div
                    className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-xs relative group ${
                      m.role === "user"
                        ? "bg-blue-600 text-white rounded-tr-xs"
                        : "bg-white text-slate-800 border border-slate-200/90 rounded-tl-xs"
                    }`}
                  >
                    <MathRenderer content={m.content} />

                    {/* Copy action button */}
                    <button
                      onClick={() => handleCopyMessage(m.id, m.content)}
                      className={`absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 rounded-md text-[10px] transition-all ${
                        m.role === "user"
                          ? "bg-blue-700 text-blue-100 hover:bg-blue-800"
                          : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                      }`}
                      title="Sao chép nội dung"
                    >
                      {copiedId === m.id ? (
                        <Check className="w-3 h-3 text-emerald-500" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>

                  <span
                    className={`text-[10px] text-slate-400 font-medium px-1 ${
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
                <span>Thầy Cường đang phân tích bài toán và tạo lời giải LaTeX...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Carousel */}
          <div className="px-4 py-2 bg-slate-100/90 border-t border-slate-200 flex items-center gap-2 overflow-x-auto no-scrollbar">
            <span className="text-[10px] font-extrabold uppercase text-indigo-800 flex items-center gap-1 shrink-0">
              <Zap className="w-3 h-3 text-amber-500" />
              Gợi ý hỏi nhanh:
            </span>
            {(gradePrompts[currentGrade] || gradePrompts[12]).map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(prompt)}
                className="text-[11px] font-semibold bg-white hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300 border border-slate-200 px-3 py-1 rounded-lg text-slate-700 whitespace-nowrap shadow-2xs transition-all active:scale-95"
              >
                {prompt.length > 38 ? `${prompt.slice(0, 38)}...` : prompt}
              </button>
            ))}
          </div>

          {/* Math Symbols Quick Toolbar */}
          <div className="px-4 py-1.5 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs">
            <span className="text-[10px] text-slate-400 font-bold shrink-0">Chèn ký hiệu:</span>
            {mathShortcuts.map((sym, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleInsertSymbol(sym.latex)}
                className="px-2 py-0.5 rounded bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 text-[11px] font-mono transition-colors"
                title={`Chèn ${sym.latex}`}
              >
                {sym.label}
              </button>
            ))}
          </div>

          {/* Chat Input Bar */}
          <div className="p-3 sm:p-4 bg-white border-t border-slate-200 flex items-center gap-2">
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Nhập câu hỏi toán (ví dụ: 'Cách tìm cực trị của hàm phân thức bậc 2 trên bậc 1?')..."
                className="w-full pl-4 pr-3 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
              />
            </div>

            <button
              id="home_chat_send_btn"
              onClick={() => handleSend()}
              disabled={!input.trim() || loading}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-95 disabled:opacity-50 text-white font-bold text-xs shadow-md transition-all active:scale-95 flex items-center gap-1.5 shrink-0"
            >
              <span>Gửi câu hỏi</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
