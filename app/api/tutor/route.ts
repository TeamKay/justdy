import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Ensure this env variable is set in your .env.local file
});

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function POST(req: Request) {
  try {
    const { messages }: { messages: ChatMessage[] } = await req.json();

    // 1. Map your system instructions into a 'developer' (or 'system') message
    const formattedMessages = [
      {
        role: "developer" as const, // Or use "system" depending on your target model/SDK version
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
      ...messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    ];

    // 2. Use the correct client.chat.completions.create method
    const response = await client.chat.completions.create({
      model: "gpt-4o", // Note: Ensure you are using a valid, available model name
      messages: formattedMessages,
    });

    // 3. Extract the text response correctly
    const answer =
      response.choices[0]?.message?.content || "No response generated.";

    return Response.json({ answer });
  } catch (error) {
    console.error("API Route Error:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
