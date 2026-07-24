"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function AITutorPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "👋 Hi! I'm your AI Math Tutor. Ask me any math question and I'll solve it step by step.",
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendMessage() {
    if (!input.trim()) return;

    const userMessage = {
      role: "user" as const,
      content: input,
    };

    const updated = [...messages, userMessage];

    setMessages(updated);
    setInput("");
    setLoading(true);

    // Inside your frontend AITutorPage component:
    try {
      const res = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updated }),
      });

      const data = await res.json();

      // ADD THIS CHECK:
      if (!res.ok || !data.answer) {
        throw new Error(data.error || "Failed to get an answer");
      }

      setMessages([
        ...updated,
        {
          role: "assistant",
          content: data.answer,
        },
      ]);
    } catch {
      // Now it will properly fall back if the backend returns an error object
      setMessages([
        ...updated,
        {
          role: "assistant",
          content: "Something went wrong. Please try again.",
        },
      ]);
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-[#131314] text-[#e3e3e3] flex flex-col items-center font-sans">
      {/* Top Header Bar */}

      {/* Main Chat Stream Container */}
      <main className="flex-1 w-full max-w-6xl px-4 py-6 md:py-10 overflow-y-auto space-y-8 pb-36">
        {messages.map((msg, i) => (
          <div key={i} className="flex gap-4 items-start animate-fadeIn">
            {/* Optional Avatar representation */}
            <div className="shrink-0 mt-1">
              {msg.role === "user" ? (
                <div className="w-8 h-8 rounded-full bg-linear-to-tr from-[#4285f4] to-[#a0c5f4] flex items-center justify-center text-xs text-black font-semibold">
                  U
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-[#1e1e20] flex items-center justify-center text-xs border border-[#37393b]">
                  ✨
                </div>
              )}
            </div>

            {/* Message Layout */}
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-[#c4c7c5] mb-1">
                {msg.role === "user" ? "You" : "Gemini Tutor"}
              </div>

              {msg.role === "user" ? (
                // User text wraps neatly in a slight capsule bubble
                <div className="inline-block max-w-full rounded-2xl bg-[#1e1e20] px-4 py-2.5 text-[#e3e3e3] whitespace-pre-wrap text-[15px] leading-relaxed">
                  {msg.content}
                </div>
              ) : (
                // Assistant text drops the container background for a fluid typography feel
                <div className="prose prose-invert max-w-none text-[15px] leading-relaxed text-[#e3e3e3] whitespace-pre-wrap">
                  <ReactMarkdown
                    remarkPlugins={[remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-4 items-start">
            <div className="w-8 h-8 rounded-full bg-[#1e1e20] flex items-center justify-center text-xs animate-pulse">
              ✨
            </div>
            <div className="flex-1 pt-2">
              <div className="h-2 bg-linear-to-r from-[#4285f4] via-[#9b72cb] to-[#131314] rounded animate-pulse w-1/3 mb-2" />
              <div className="h-2 bg-linear-to-r from-[#4285f4] via-[#9b72cb] to-[#131314] rounded animate-pulse w-1/2" />
            </div>
          </div>
        )}
      </main>

      {/* Sticky Bottom Gemini Input Pill */}
      <div className="fixed bottom-0 left-0 right-0 bg-linear-to-t from-[#131314] via-[#131314] to-transparent pt-6 pb-6 flex justify-center px-4">
        <div className="w-full max-w-3xl relative flex items-center bg-[#1e1e20] border border-transparent focus-within:border-[#37393b] rounded-full transition-all duration-200 pl-6 pr-3 py-2">
          <textarea
            rows={1}
            className="flex-1 bg-transparent text-[#e3e3e3] placeholder-[#80868b] outline-none resize-none text-[15px] pr-12 pt-1 max-h-32"
            placeholder="Ask a math problem..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
          />

          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="p-3 rounded-full bg-transparent text-[#e3e3e3] hover:bg-[#2d2f31] disabled:opacity-30 disabled:hover:bg-transparent transition-colors duration-200"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
