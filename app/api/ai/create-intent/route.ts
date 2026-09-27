import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { generateAIResponse } from "@/lib/ai/orchestrator";

type ResourceOperation =
  | "WORKSHEET"
  | "WORKBOOK"
  | "QUIZ"
  | "LESSON_PLAN"
  | "PRESENTATION"
  | "DOCUMENT"
  | "IMAGE"
  | "VIDEO"
  | "AUDIO";

const OPERATIONS = new Set<ResourceOperation>([
  "WORKSHEET",
  "WORKBOOK",
  "QUIZ",
  "LESSON_PLAN",
  "PRESENTATION",
  "DOCUMENT",
  "IMAGE",
  "VIDEO",
  "AUDIO",
]);

const LABELS: Record<ResourceOperation | "CHAT", string> = {
  WORKSHEET: "Worksheet",
  WORKBOOK: "Workbook",
  QUIZ: "Quiz",
  LESSON_PLAN: "Lesson plan",
  PRESENTATION: "Presentation",
  DOCUMENT: "Document",
  IMAGE: "Image",
  VIDEO: "Video",
  AUDIO: "Audio",
  CHAT: "Creation",
};

function stripCodeFence(value: string) {
  return value
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

type IntentClassification = {
  intent: ResourceOperation | "CHAT";
  confidence: number;
  normalizedPrompt: string;
  needsClarification: boolean;
  clarification: string | null;
  suggestedAlternatives: ResourceOperation[];
};

function parseClassifierResponse(text: string): IntentClassification | null {
  try {
    const parsed = JSON.parse(stripCodeFence(text)) as Record<string, unknown>;

    const intent =
      typeof parsed.intent === "string" && OPERATIONS.has(parsed.intent as ResourceOperation)
        ? (parsed.intent as ResourceOperation)
        : "CHAT";

    const confidence =
      typeof parsed.confidence === "number"
        ? Math.max(0, Math.min(1, parsed.confidence))
        : 0;

    const normalizedPrompt =
      typeof parsed.normalizedPrompt === "string" && parsed.normalizedPrompt.trim()
        ? parsed.normalizedPrompt.trim()
        : "";

    const clarification =
      typeof parsed.clarification === "string" && parsed.clarification.trim()
        ? parsed.clarification.trim()
        : null;

    const suggestedAlternatives = Array.isArray(parsed.suggestedAlternatives)
      ? parsed.suggestedAlternatives.filter(
          (value): value is ResourceOperation =>
            typeof value === "string" && OPERATIONS.has(value as ResourceOperation),
        )
      : [];

    const needsClarification =
      parsed.needsClarification === true ||
      intent === "CHAT" ||
      confidence < 0.72;

    return {
      intent,
      confidence,
      normalizedPrompt,
      needsClarification,
      clarification,
      suggestedAlternatives,
    };
  } catch {
    return null;
  }
}

function hasMeaningfulMediaSubject(prompt: string, intent: ResourceOperation) {
  if (!(["IMAGE", "VIDEO", "AUDIO"] as ResourceOperation[]).includes(intent)) {
    return false;
  }

  const withoutGenericWords = prompt
    .toLowerCase()
    .replace(/\b(create|make|generate|produce|build|design|a|an|the|image|picture|graphic|illustration|video|clip|movie|animation|audio|sound|voiceover|narration|podcast)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return withoutGenericWords.length >= 4;
}

function normalizeIntentResult(result: IntentClassification, prompt: string) {
 if (
  result.intent !== "CHAT" &&
  hasMeaningfulMediaSubject(prompt, result.intent)
) {
    return {
      ...result,
      needsClarification: false,
      clarification: null,
    };
  }

  return result;
}

function fallbackIntent(prompt: string): IntentClassification {
  const value = prompt.toLowerCase();

  const patterns: Array<[ResourceOperation, RegExp[]]> = [
    ["WORKSHEET", [/\bworksheet\b/, /\bprintable worksheet\b/, /\bpractice sheet\b/]],
    ["QUIZ", [/\bquiz\b/, /\bmultiple[- ]choice questions?\b/, /\btest me\b/]],
    ["LESSON_PLAN", [/\blesson plan\b/, /\blesson\b.*\bteach\b/, /\b45[- ]minute lesson\b/]],
    ["PRESENTATION", [/\bpresentation\b/, /\bslides?\b/, /\bslide deck\b/]],
    ["DOCUMENT", [/\bdocument\b/, /\breport\b/, /\bguide\b/]],
    ["IMAGE", [/\bimage\b/, /\billustration\b/, /\bposter\b/, /\bgraphic\b/, /\bcoloring page\b/]],
    ["VIDEO", [/\bvideo\b/, /\bvideo lesson\b/]],
    ["AUDIO", [/\baudio\b/, /\bvoiceover\b/, /\bnarration\b/, /\bpodcast\b/]],
    ["WORKBOOK", [/\bworkbook\b/, /\bactivity book\b/]],
  ];

  for (const [operation, regexes] of patterns) {
    if (regexes.some((regex) => regex.test(value))) {
      return {
        intent: operation,
        confidence: 0.86,
        normalizedPrompt: prompt.trim(),
        needsClarification: false,
        clarification: null,
        suggestedAlternatives: [],
      };
    }
  }

  return {
    intent: "CHAT" as const,
    confidence: 0,
    normalizedPrompt: prompt.trim(),
    needsClarification: true,
    clarification:
      "What would you like Justdy to make — for example, a worksheet, quiz, lesson plan, presentation, document, image, video, or audio?",
    suggestedAlternatives: [
      "WORKSHEET",
      "QUIZ",
      "LESSON_PLAN",
      "PRESENTATION",
    ],
  };
}

export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 },
      );
    }

    let body: { prompt?: string; projectId?: string | null };

    try {
      body = (await request.json()) as { prompt?: string; projectId?: string | null };
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON request body." },
        { status: 400 },
      );
    }

    const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";

    if (!prompt) {
      return NextResponse.json(
        { error: "A creation description is required." },
        { status: 400 },
      );
    }

    if (prompt.length > 12000) {
      return NextResponse.json(
        { error: "Your description is too long. Please shorten it and try again." },
        { status: 400 },
      );
    }

    /*
     * First use the existing deterministic intent layer. This keeps obvious
     * requests cheap and predictable. The AI classifier is used for natural
     * language requests that are not obvious from explicit resource wording.
     */
    let result: IntentClassification = fallbackIntent(prompt);

    if (result.intent === "CHAT" || result.confidence < 0.9) {
      try {
        const response = await generateAIResponse({
          userId: user.id,
          requestId: crypto.randomUUID(),
          operation: "CHAT",
          messages: [
            {
              role: "user",
              content: `You are Justdy's creation-intent router.

Determine what educational resource the user is trying to CREATE.

Allowed intents:
WORKSHEET, WORKBOOK, QUIZ, LESSON_PLAN, PRESENTATION, DOCUMENT, IMAGE, VIDEO, AUDIO.

Do not return CHAT when the user is clearly asking to create something.

Return ONLY valid JSON with this exact shape:
{
  "intent": "WORKSHEET",
  "confidence": 0.0,
  "normalizedPrompt": "a clean version of the user's creation request",
  "needsClarification": false,
  "clarification": null,
  "suggestedAlternatives": []
}

Rules:
- confidence is between 0 and 1.
- Prefer the most appropriate educational format.
- A worksheet means printable/student practice material.
- A workbook means a larger multi-section collection of activities.
- A quiz means questions intended to test knowledge.
- A lesson plan means teacher-facing instructional planning.
- A presentation means slides/deck.
- A document means a general structured written resource.
- IMAGE includes posters, illustrations, graphics, and coloring pages.
- VIDEO means an actual video.
- AUDIO means narration, voiceover, or audio lesson.
- For IMAGE, VIDEO, and AUDIO requests, do NOT ask about optional style, aspect ratio, resolution, file format, music, voice, duration, or other preferences when the user has already provided a meaningful subject or concept. Just classify the request and set needsClarification to false; the specialized creator will apply sensible defaults.
- Only ask a clarification for media when the request is missing the actual thing to create (for example, "make a video" with no subject).
- If the user only asks for learning help rather than creating a resource, use intent CHAT and ask a concise clarification.
- Do not invent requirements the user did not provide.

USER REQUEST:
${prompt}`,
            },
          ],
        });

        const aiResult = parseClassifierResponse(response.text);

        if (aiResult) {
          result = normalizeIntentResult(aiResult, prompt);
        }
      } catch (error) {
        console.warn("Universal creator AI intent classification failed; using fallback.", error);
      }
    }

    return NextResponse.json({
      success: true,
      intent: result.intent,
      confidence: result.confidence,
      label: LABELS[result.intent],
      normalizedPrompt: result.normalizedPrompt || prompt,
      needsClarification: result.needsClarification,
      clarification: result.clarification,
      suggestedAlternatives: result.suggestedAlternatives,
      projectId: typeof body.projectId === "string" ? body.projectId : null,
    });
  } catch (error) {
    console.error("POST /api/ai/create-intent failed:", error);

    const message =
      error instanceof Error ? error.message : "Unable to determine creation intent.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
