import OpenAI from "openai";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function POST(req: Request) {
  try {
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

    if (!Array.isArray(messages)) {
      return Response.json(
        {
          error: "Invalid messages format.",
        },
        {
          status: 400,
        },
      );
    }

    // ============================================================
    // 4. FORMAT MESSAGES
    // ============================================================

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

      ...messages.map((message) => ({
        role: message.role,
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
