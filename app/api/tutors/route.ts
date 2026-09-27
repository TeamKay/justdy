import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { protectAIRequest } from "@/lib/ai/protect-request";
import OpenAI from "openai";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return Response.json({ error: "Authentication required." }, { status: 401 });
    }
    const rateLimit = await protectAIRequest(session.user.id);
    if (rateLimit.isDenied()) {
      return Response.json({ error: "AI usage is temporarily rate-limited. Please try again shortly." }, { status: 429 });
    }
    // ============================================================
    // 1. CHECK OPENAI API KEY
    // ============================================================

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      console.error("OPENAI_API_KEY is not configured.");

      return Response.json(
        {
          error:
            "The AI tutor is not configured. Please contact the administrator.",
        },
        {
          status: 500,
        },
      );
    }

    // ============================================================
    // 2. CREATE OPENAI CLIENT
    // ============================================================

    const client = new OpenAI({
      apiKey,
    });

    // ============================================================
    // 3. READ REQUEST
    // ============================================================

    const body = await req.json();

    const messages = body.messages as ChatMessage[];

    if (!Array.isArray(messages) || messages.length === 0 || messages.length > 50) {
      return Response.json(
        {
          error: "Invalid messages format or message count.",
        },
        {
          status: 400,
        },
      );
    }

    // ============================================================
    // 4. FORMAT MESSAGES
    // ============================================================

    const sanitizedMessages = messages.map((message) => ({
      role: message?.role,
      content: typeof message?.content === "string" ? message.content.trim() : "",
    }));

    if (sanitizedMessages.some((message) => !["user", "assistant"].includes(message.role) || !message.content || message.content.length > 4000)) {
      return Response.json({ error: "Each message must be valid and at most 4000 characters." }, { status: 400 });
    }

    const formattedMessages = [
      {
        role: "developer" as const,

        content: `You are an expert math tutor.

Always:
- Solve problems step by step.
- Explain every step.
- Use LaTeX for equations.
- Never skip algebra.
- Encourage the student.
- If the student is wrong, explain why.
- If there are multiple methods, briefly mention them.`,
      },

      ...sanitizedMessages.map((message) => ({
        role: message.role as "user" | "assistant",
        content: message.content,
      })),
    ];

    // ============================================================
    // 5. CALL OPENAI
    // ============================================================

    const response = await client.chat.completions.create({
      model: "gpt-4o",
      messages: formattedMessages,
    });

    // ============================================================
    // 6. GET RESPONSE
    // ============================================================

    const answer =
      response.choices[0]?.message?.content ?? "No response generated.";

    return Response.json({
      answer,
    });
  } catch (error) {
    console.error("Tutor API Route Error:", error);

    return Response.json(
      {
        error: "Internal Server Error",
      },
      {
        status: 500,
      },
    );
  }
}
