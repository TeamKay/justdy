import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

import { Auth } from "@vonage/auth";
import { Vonage } from "@vonage/server-sdk";
import { MediaMode } from "@vonage/video";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    sessionId: string;
  }>;
};

const vonageApplicationId = process.env.NEXT_PUBLIC_VONAGE_APPLICATION_ID;
const vonagePrivateKey = process.env.VONAGE_PRIVATE_KEY;

function getVonageClient() {
  if (!vonageApplicationId) {
    throw new Error("NEXT_PUBLIC_VONAGE_APPLICATION_ID is not configured.");
  }

  if (!vonagePrivateKey) {
    throw new Error("VONAGE_PRIVATE_KEY is not configured.");
  }

  return new Vonage(
    new Auth({
      applicationId: vonageApplicationId,
      privateKey: vonagePrivateKey,
    }),
    {},
  );
}

async function getCurrentUser() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return session?.user ?? null;
}

function canAccessSession(
  user: {
    id: string;
    role?: string | null;
  },
  liveSession: {
    learnerId: string;
    teacherId: string;
  },
) {
  const role = user.role?.toLowerCase();

  return (
    user.id === liveSession.learnerId ||
    user.id === liveSession.teacherId ||
    role === "admin"
  );
}

function isEnded(status: string) {
  return status.toUpperCase() === "ENDED";
}

export async function POST(_request: NextRequest, context: RouteContext) {
  try {
    /*
     * 1. Authenticate the Justdy user using the same Better Auth
     *    session mechanism used by the classroom page and the
     *    /api/live-homework-help/session route.
     */
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          error: "Unauthorized. Please sign in again.",
          code: "AUTH_REQUIRED",
        },
        {
          status: 401,
        },
      );
    }

    const { sessionId } = await context.params;

    if (!sessionId) {
      return NextResponse.json(
        {
          error: "A live classroom session ID is required.",
          code: "SESSION_ID_REQUIRED",
        },
        {
          status: 400,
        },
      );
    }

    /*
     * 2. Find the Justdy Live Homework session and make sure the
     *    current user is the learner, assigned teacher, or admin.
     */
    const liveSession = await prisma.liveHomeworkSession.findUnique({
      where: {
        id: sessionId,
      },
    });

    if (!liveSession) {
      return NextResponse.json(
        {
          error: "Live classroom session not found.",
          code: "SESSION_NOT_FOUND",
        },
        {
          status: 404,
        },
      );
    }

    if (!canAccessSession(user, liveSession)) {
      return NextResponse.json(
        {
          error: "You do not have access to this classroom.",
          code: "CLASSROOM_ACCESS_DENIED",
        },
        {
          status: 403,
        },
      );
    }

    if (isEnded(liveSession.status)) {
      return NextResponse.json(
        {
          error: "This live classroom session has already ended.",
          code: "SESSION_ENDED",
        },
        {
          status: 409,
        },
      );
    }

    /*
     * 3. Require a valid Vonage application configuration.
     *
     *    The private key is used only on the server and is never
     *    returned to the browser.
     */
    if (!vonageApplicationId || !vonagePrivateKey) {
      console.error("Live Homework Help Vonage configuration is missing.", {
        hasApplicationId: Boolean(vonageApplicationId),
        hasPrivateKey: Boolean(vonagePrivateKey),
      });

      return NextResponse.json(
        {
          error:
            "Live video is not configured on the server. Please check the Vonage application configuration.",
          code: "VONAGE_CONFIGURATION_ERROR",
        },
        {
          status: 500,
        },
      );
    }

    const vonage = getVonageClient();

    /*
     * 4. Reuse the existing Vonage session when this Justdy
     *    classroom already has one.
     *
     *    classroomId stores the Vonage Session ID.
     *    classroomToken is intentionally NOT used here because
     *    Vonage tokens should be generated for each connection
     *    attempt rather than persisted/reused.
     */
    let vonageSessionId = liveSession.classroomId;

    if (!vonageSessionId) {
      const createdSession = await vonage.video.createSession({
        mediaMode: MediaMode.ROUTED,
      });

      vonageSessionId = createdSession.sessionId;

      /*
       * Multiple browser tabs can theoretically request credentials
       * at almost the same time. Only set classroomId if it is still
       * empty. If another request won the race, use its session ID.
       */
      const claimResult = await prisma.liveHomeworkSession.updateMany({
        where: {
          id: liveSession.id,
          classroomId: null,
        },
        data: {
          classroomId: vonageSessionId,
        },
      });

      if (claimResult.count === 0) {
        const currentSession = await prisma.liveHomeworkSession.findUnique({
          where: {
            id: liveSession.id,
          },
          select: {
            classroomId: true,
            status: true,
          },
        });

        if (!currentSession) {
          return NextResponse.json(
            {
              error: "Live classroom session no longer exists.",
              code: "SESSION_NOT_FOUND",
            },
            {
              status: 404,
            },
          );
        }

        if (isEnded(currentSession.status)) {
          return NextResponse.json(
            {
              error: "This live classroom session has already ended.",
              code: "SESSION_ENDED",
            },
            {
              status: 409,
            },
          );
        }

        if (!currentSession.classroomId) {
          throw new Error("Unable to establish the Vonage classroom session.");
        }

        vonageSessionId = currentSession.classroomId;
      }
    }

    /*
     * 5. Generate a fresh publisher token for this specific user.
     *
     *    Both the teacher and learner need publisher permissions because
     *    both sides publish camera/microphone streams and subscribe to
     *    the other participant.
     *
     *    Token lifetime is deliberately limited to two hours.
     */
    const expireTime = Math.floor(Date.now() / 1000) + 2 * 60 * 60;

    const token = vonage.video.generateClientToken(vonageSessionId, {
      role: "publisher",
      expireTime,
    });

    /*
     * 6. Return only the browser-safe credentials.
     *
     *    Never return the Vonage private key.
     *    Never persist or return a reusable classroom token.
     */
    return NextResponse.json({
      success: true,
      applicationId: vonageApplicationId,
      sessionId: vonageSessionId,
      token,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    console.error(
      "POST /api/live-homework-help/session/[sessionId]/vonage failed:",
      error,
    );

    /*
     * Keep the response useful during development without exposing
     * credentials or the private key.
     */
    return NextResponse.json(
      {
        error: "Unable to initialize the live classroom video.",
        code: "VONAGE_INITIALIZATION_ERROR",
        ...(process.env.NODE_ENV === "development" ? { details: message } : {}),
      },
      {
        status: 500,
      },
    );
  }
}
