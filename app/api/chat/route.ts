import { openai } from "@/lib/openai";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  const { message, chatId } = await req.json();

  let chat;

  if (!chatId) {
    chat = await prisma.chat.create({
      data: {},
    });
  } else {
    chat = await prisma.chat.findUnique({
      where: { id: chatId },
    });
  }

  await prisma.message.create({
    data: {
      role: "user",
      content: message,
      chatId: chat!.id,
    },
  });

  const completion = await openai.chat.completions.create({
    model: "gpt-5.3",
    messages: [{ role: "user", content: message }],
  });

  const reply = completion.choices[0].message.content;

  await prisma.message.create({
    data: {
      role: "assistant",
      content: reply,
      chatId: chat!.id,
    },
  });

  return Response.json({ reply, chatId: chat!.id });
}
