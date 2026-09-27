import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { protectAIRequest } from "@/lib/ai/protect-request";

type StoryboardRequest = {
  prompt?: string;
  shotCount?: number;
  defaultDuration?: number;
  aspectRatio?: string;
  provider?: string;
  model?: string;
  visualStyle?: string;
  cameraStyle?: string;
  lens?: string;
  lighting?: string;
  motionStrength?: string;
  negativePrompt?: string;
  audioEnabled?: boolean;
  captionsEnabled?: boolean;
};

type Shot = {
  title: string;
  prompt: string;
  duration: number;
  camera: string;
};

const schema = {
  type: "object",
  additionalProperties: false,
  properties: {
    shots: {
      type: "array",
      minItems: 2,
      maxItems: 12,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          title: { type: "string" },
          prompt: { type: "string" },
          duration: { type: "number" },
          camera: { type: "string" },
        },
        required: ["title", "prompt", "duration", "camera"],
      },
    },
  },
  required: ["shots"],
};

function clampShotCount(value: number | undefined) {
  return Math.min(12, Math.max(2, Math.round(value || 6)));
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
  }
  const rateLimit = await protectAIRequest(session.user.id);
  if (rateLimit.isDenied()) {
    return NextResponse.json({ success: false, error: "AI usage is temporarily rate-limited. Please try again shortly." }, { status: 429 });
  }

  const body = (await request.json()) as StoryboardRequest;
  const prompt = body.prompt?.trim();

  if (!prompt) {
    return NextResponse.json({ success: false, error: "A video brief is required." }, { status: 400 });
  }
  if (prompt.length > 4000) {
    return NextResponse.json({ success: false, error: "Video briefs cannot exceed 4000 characters." }, { status: 400 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { success: false, error: "AI storyboard generation is not configured. Add OPENAI_API_KEY on the server." },
      { status: 503 },
    );
  }

  const shotCount = clampShotCount(body.shotCount);
  const model = process.env.JUSTDY_STORYBOARD_MODEL || "gpt-5.6-luna";
  const duration = Math.max(1, Number(body.defaultDuration) || 4);

  const instructions = [
    "You are Justdy's AI video director.",
    "Turn the client's single creative brief into a coherent sequence of independent video clips.",
    `Create exactly ${shotCount} shots.`,
    "Each shot must move the story forward and connect naturally to the next shot.",
    "Write production-ready video prompts: subject, action, environment, composition, camera movement, lighting, continuity, and important visual details.",
    "Do not write commentary, explanations, markdown, or scene numbers outside the JSON.",
    `Prefer approximately ${duration} seconds per shot unless the story clearly benefits from another duration.`,
    `Aspect ratio: ${body.aspectRatio || "9:16"}.`,
    `Visual style: ${body.visualStyle || "Cinematic"}.`,
    `Camera preference: ${body.cameraStyle || "Cinematic tracking"}.`,
    `Lens: ${body.lens || "35mm"}.`,
    `Lighting: ${body.lighting || "Natural cinematic"}.`,
    `Motion: ${body.motionStrength || "Natural"}.`,
    body.negativePrompt ? `Avoid: ${body.negativePrompt}.` : "",
    body.audioEnabled ? "Include concise audio intent when it materially improves a shot." : "",
    body.captionsEnabled ? "Keep dialogue/narration visually clear for later captioning." : "",
  ].filter(Boolean).join("\n");

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      input: [
        { role: "system", content: instructions },
        { role: "user", content: prompt },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "justdy_video_storyboard",
          strict: true,
          schema,
        },
      },
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    console.error("Justdy storyboard provider error", detail);
    return NextResponse.json({ success: false, error: "The AI director could not structure this brief right now." }, { status: 502 });
  }

  const result = (await response.json()) as { output_text?: string };
  if (!result.output_text) {
    return NextResponse.json({ success: false, error: "The AI director returned an empty storyboard." }, { status: 502 });
  }

  let parsed: { shots?: Shot[] };
  try {
    parsed = JSON.parse(result.output_text) as { shots?: Shot[] };
  } catch {
    return NextResponse.json({ success: false, error: "The AI director returned an invalid storyboard." }, { status: 502 });
  }

  const shots = Array.isArray(parsed.shots)
    ? parsed.shots.slice(0, shotCount).map((shot) => ({
        title: String(shot.title || "Scene").slice(0, 120),
        prompt: String(shot.prompt || prompt).slice(0, 4000),
        duration: Math.min(60, Math.max(1, Number(shot.duration) || duration)),
        camera: String(shot.camera || body.cameraStyle || "Cinematic tracking").slice(0, 160),
      }))
    : [];

  if (shots.length < 2) {
    return NextResponse.json({ success: false, error: "The AI director did not produce enough shots." }, { status: 502 });
  }

  return NextResponse.json({ success: true, shots });
}
