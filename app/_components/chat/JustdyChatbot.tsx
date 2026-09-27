"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bot,
  MessageCircle,
  Send,
  Sparkles,
  X,
} from "lucide-react";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const quickQuestions = [
  "How does Justdy work?",
  "I need a math tutor",
  "What can I learn here?",
];

function getBotResponse(message: string) {
  const text = message.toLowerCase();

  if (
    text.includes("tutor") ||
    text.includes("tutoring") ||
    text.includes("teacher")
  ) {
    return "Justdy offers live, personalized math tutoring. You can find a tutor, choose the support you need, and work through problems together in real time.";
  }

  if (
    text.includes("how") &&
    (text.includes("justdy") || text.includes("work"))
  ) {
    return "Justdy brings learning, AI tools, and live tutoring together in one place. Start by choosing what you want to learn or get help with.";
  }

  if (
    text.includes("learn") ||
    text.includes("math") ||
    text.includes("problem") ||
    text.includes("homework")
  ) {
    return "I can help you get started with math. For personalized help, you can connect with a live tutor and work through difficult problems step by step.";
  }

  if (
    text.includes("ai") ||
    text.includes("workspace") ||
    text.includes("worksheet")
  ) {
    return "Justdy's AI Workspace helps you create and work with educational content. You can also create worksheets and structured lessons.";
  }

  if (
    text.includes("account") ||
    text.includes("sign in") ||
    text.includes("login") ||
    text.includes("log in")
  ) {
    return "You can sign in or create your Justdy account from the authentication page. If you're having trouble accessing your account, tell me what you're seeing.";
  }

  if (
    text.includes("hello") ||
    text.includes("hi") ||
    text.includes("hey")
  ) {
    return "Hi! I'm the Justdy assistant. I can help you find a tutor, understand Justdy, or get started with learning.";
  }

  return "I'm here to help you get the most out of Justdy. You can ask me about math tutoring, finding a tutor, the AI Workspace, or getting started.";
}

export function JustdyChatbot() {
  const [open, setOpen] = useState(false);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hi! I'm your Justdy assistant. How can I help you today?",
    },
  ]);

  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, isTyping]);

  const sendMessage = (text?: string) => {
    const message = (text ?? input).trim();

    if (!message || isTyping) return;

    /*
     * Generate the ID here, inside the event handler.
     * This avoids calling an impure function during render.
     */
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: message,
    };

    setMessages((current) => [
      ...current,
      userMessage,
    ]);

    setInput("");
    setIsTyping(true);

    // Simulate assistant response.
    // Replace this with an API call when you connect
    // the chatbot to your AI backend.
    setTimeout(() => {
      const response = getBotResponse(message);

      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: response,
        },
      ]);

      setIsTyping(false);
    }, 700);
  };

  const handleSubmit = (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    sendMessage();
  };

  return (
    <>
      {/* =====================================================
          CHAT WINDOW
      ====================================================== */}
      {open && (
        <div
          className="
            fixed
            bottom-24
            right-4
            z-[999]
            flex
            w-[calc(100vw-2rem)]
            max-w-[380px]
            flex-col
            overflow-hidden
            rounded-2xl
            border
            border-white/10
            bg-[#101014]
            text-white
            shadow-[0_25px_80px_rgba(0,0,0,0.45)]
            sm:right-6
          "
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#A78BFA]/15 text-[#A78BFA]">
                <Sparkles className="h-5 w-5" />
              </div>

              <div>
                <div className="text-sm font-semibold">
                  Justdy Assistant
                </div>

                <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-white/40">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Online
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-white/40 transition hover:bg-white/5 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="h-[360px] overflow-y-auto px-4 py-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === "user"
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >
                  {message.role === "assistant" && (
                    <div className="mr-2 mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#A78BFA]/10 text-[#A78BFA]">
                      <Bot className="h-3.5 w-3.5" />
                    </div>
                  )}

                  <div
                    className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm leading-6 ${
                      message.role === "user"
                        ? "rounded-br-md bg-[#A78BFA] text-white"
                        : "rounded-bl-md bg-white/[0.06] text-white/75"
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#A78BFA]/10 text-[#A78BFA]">
                    <Bot className="h-3.5 w-3.5" />
                  </div>

                  <div className="rounded-2xl rounded-bl-md bg-white/[0.06] px-4 py-3">
                    <div className="flex gap-1">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/40 [animation-delay:-0.3s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/40 [animation-delay:-0.15s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/40" />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Quick questions */}
          {messages.length === 1 && (
            <div className="border-t border-white/5 px-4 py-3">
              <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.15em] text-white/30">
                Try asking
              </p>

              <div className="flex flex-wrap gap-2">
                {quickQuestions.map((question) => (
                  <button
                    key={question}
                    type="button"
                    onClick={() => sendMessage(question)}
                    className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-white/55 transition hover:border-[#A78BFA]/30 hover:bg-[#A78BFA]/10 hover:text-white"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            className="border-t border-white/10 p-3"
          >
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 focus-within:border-[#A78BFA]/40">
              <input
                value={input}
                onChange={(event) =>
                  setInput(event.target.value)
                }
                placeholder="Ask Justdy..."
                className="min-w-0 flex-1 bg-transparent py-2 text-sm text-white outline-none placeholder:text-white/25"
              />

              <button
                type="submit"
                disabled={!input.trim() || isTyping}
                aria-label="Send message"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#A78BFA] text-white transition hover:bg-[#8B5CF6] disabled:cursor-not-allowed disabled:opacity-30"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </form>

          <div className="pb-2 text-center">
            <span className="text-[9px] text-white/20">
              Justdy Assistant
            </span>
          </div>
        </div>
      )}

      {/* =====================================================
          FLOATING CHAT BUTTON
      ====================================================== */}
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-label={
          open
            ? "Close Justdy Assistant"
            : "Open Justdy Assistant"
        }
        className="
          fixed
          bottom-5
          right-4
          z-1000
          flex
          h-14
          w-14
          items-center
          justify-center
          rounded-full
          bg-emerald-900
          text-white
          shadow-[0_12px_35px_rgba(0,0,0,0.35)]
          transition
          duration-300
          hover:-translate-y-1
          hover:bg-emerald-950
          hover:shadow-[0_18px_45px_rgba(0,0,0,0.45)]
          sm:right-6
        "
      >
        {open ? (
        <X className="h-5 w-5 text-white" />
        ) : (
          <MessageCircle className="h-6 w-6 text-white" />
        )}

        {!open && (
          <span className="absolute right-0 top-0 h-3 w-3 rounded-md border-2 border-[#101014] bg-emerald-400" />
        )}
      </button>
    </>
  );
}