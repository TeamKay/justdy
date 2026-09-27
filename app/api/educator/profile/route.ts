import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  CAPABILITIES,
  ensureCapabilities,
  hasCapability,
} from "@/lib/auth/capabilities";

type ProfileBody = {
  headline?: unknown;
  specialty?: unknown;
  experience?: unknown;
  description?: unknown;
  hourlyRate?: unknown;
  currency?: unknown;
  subjects?: unknown;
  gradeLevels?: unknown;
  imageUrl?: unknown;
};

async function getCurrentUser() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return session?.user ?? null;
}

function isAdmin(user: {
  role?: string | null;
}) {
  const normalizedRole = String(user.role ?? "")
    .trim()
    .toUpperCase();

  return normalizedRole === "ADMIN";
}

async function hasTeachingCapability(userId: string) {
  return hasCapability(userId, CAPABILITIES.TEACH);
}

function cleanString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  return trimmed || null;
}

function cleanImageUrl(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  /*
   * Only accept actual HTTP(S) URLs.
   *
   * This prevents blob URLs such as:
   *
   * blob:http://localhost:3000/...
   *
   * from ever being stored in the database.
   */
  if (!/^https?:\/\//i.test(trimmed)) {
    return null;
  }

  return trimmed;
}

function cleanStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(
      (item): item is string =>
        typeof item === "string",
    )
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseExperience(
  value: unknown,
): number | null {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const parsed = Number(value);

  if (
    !Number.isFinite(parsed) ||
    parsed < 0
  ) {
    return null;
  }

  return Math.floor(parsed);
}

function parseHourlyRateInCents(
  value: unknown,
): number | null {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const parsed = Number(value);

  if (
    !Number.isFinite(parsed) ||
    parsed < 0
  ) {
    return null;
  }

  return Math.round(parsed);
}

function parseCurrency(
  value: unknown,
): "USD" | "GHS" {
  return value === "GHS"
    ? "GHS"
    : "USD";
}

/**
 * GET
 *
 * Loads the current user's teaching profile.
 *
 * ADMIN users always have access.
 * Regular users need CAN_TEACH.
 */
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          error: "Authentication required.",
        },
        {
          status: 401,
        },
      );
    }

    const allowed =
      isAdmin(user) ||
      (await hasTeachingCapability(user.id));

    if (!allowed) {
      return NextResponse.json(
        {
          error:
            "Teaching workspace access is required.",
        },
        {
          status: 403,
        },
      );
    }

    /*
     * Repair capability state if the profile exists
     * but CAN_TEACH is somehow missing.
     */
    if (!isAdmin(user)) {
      const existingProfile =
        await prisma.teachingProfile.findUnique({
          where: {
            userId: user.id,
          },
          select: {
            id: true,
          },
        });

      if (existingProfile) {
        await ensureCapabilities(
          user.id,
          [CAPABILITIES.TEACH],
        );
      }
    }

    const [
      profile,
      currentUser,
    ] = await Promise.all([
      prisma.teachingProfile.findUnique({
        where: {
          userId: user.id,
        },
      }),

      prisma.user.findUnique({
        where: {
          id: user.id,
        },
        select: {
          imageUrl: true,
        },
      }),
    ]);

    return NextResponse.json({
      profile,
      imageUrl:
        currentUser?.imageUrl ?? null,
    });
  } catch (error) {
    console.error(
      "Get educator profile error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Unable to load educator profile.",
      },
      {
        status: 500,
      },
    );
  }
}

/**
 * POST
 *
 * Creates a teaching profile.
 *
 * IMPORTANT:
 * A normal authenticated USER does not need CAN_TEACH
 * before creating their first teaching profile.
 *
 * Creating the profile establishes the teaching workflow,
 * after which CAN_TEACH is assigned.
 *
 * ADMIN users continue to have unrestricted access.
 */
export async function POST(
  req: Request,
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          error: "Authentication required.",
        },
        {
          status: 401,
        },
      );
    }

    /*
     * Check whether a teaching profile already exists
     * before deciding whether this is first-time setup.
     */
    const existingProfile =
      await prisma.teachingProfile.findUnique({
        where: {
          userId: user.id,
        },
        select: {
          id: true,
        },
      });

    /*
     * If a profile already exists, the user must use PATCH.
     *
     * This check is intentionally performed before the
     * CAN_TEACH check so an existing profile can also be
     * repaired if the capability assignment is missing.
     */
    if (existingProfile) {
      /*
       * Keep the capability assignment synchronized.
       */
      if (!isAdmin(user)) {
        await ensureCapabilities(
          user.id,
          [CAPABILITIES.TEACH],
        );
      }

      return NextResponse.json(
        {
          error:
            "An educator profile already exists. Use PATCH to update your profile.",
        },
        {
          status: 409,
        },
      );
    }

    /*
     * This is first-time teaching-profile creation.
     *
     * A regular authenticated USER is allowed to create
     * the profile. CAN_TEACH will be granted after the
     * profile is successfully created.
     *
     * ADMIN users are naturally allowed as well.
     */
    const body =
      (await req.json()) as ProfileBody;

    const experience =
      parseExperience(
        body.experience,
      );

    const hourlyRate =
      parseHourlyRateInCents(
        body.hourlyRate,
      );

    if (
      body.experience !== undefined &&
      body.experience !== null &&
      body.experience !== "" &&
      experience === null
    ) {
      return NextResponse.json(
        {
          error:
            "Years of experience must be a valid non-negative number.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      body.hourlyRate !== undefined &&
      body.hourlyRate !== null &&
      body.hourlyRate !== "" &&
      hourlyRate === null
    ) {
      return NextResponse.json(
        {
          error:
            "Hourly rate must be a valid non-negative amount.",
        },
        {
          status: 400,
        },
      );
    }

    /*
     * imageUrl is optional.
     *
     * If the user has not selected a new image,
     * we leave the existing User.imageUrl alone.
     */
    const imageUrl =
      body.imageUrl === undefined
        ? undefined
        : cleanImageUrl(
            body.imageUrl,
          );

    /*
     * Create the teaching profile first.
     */
    const profile =
      await prisma.teachingProfile.create({
        data: {
          userId: user.id,

          headline:
            cleanString(
              body.headline,
            ),

          specialty:
            cleanString(
              body.specialty,
            ),

          experience,

          description:
            cleanString(
              body.description,
            ),

          hourlyRate,

          currency:
            parseCurrency(
              body.currency,
            ),

          subjects:
            cleanStringArray(
              body.subjects,
            ),

          gradeLevels:
            cleanStringArray(
              body.gradeLevels,
            ),

          verificationStatus:
            "Pending",
        },
      });

    /*
     * Now that the user has successfully created
     * a teaching profile, grant the teaching capability.
     *
     * This is the important fix for the bootstrap problem.
     */
    if (!isAdmin(user)) {
      await ensureCapabilities(
        user.id,
        [CAPABILITIES.TEACH],
      );
    }

    /*
     * Save the permanent UploadThing URL
     * to User.imageUrl.
     */
    if (imageUrl !== undefined) {
      await prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          imageUrl,
        },
      });
    }

    /*
     * Retrieve the final saved image URL
     * so the response always contains the
     * canonical database value.
     */
    const savedUser =
      await prisma.user.findUnique({
        where: {
          id: user.id,
        },
        select: {
          imageUrl: true,
        },
      });

    return NextResponse.json(
      {
        success: true,
        profile,
        imageUrl:
          savedUser?.imageUrl ?? null,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error(
      "Create educator profile error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Unable to create educator profile.",
      },
      {
        status: 500,
      },
    );
  }
}

/**
 * PATCH
 *
 * Updates an existing teaching profile.
 *
 * ADMIN users always have access.
 * Regular users must have CAN_TEACH.
 */
export async function PATCH(
  req: Request,
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          error: "Authentication required.",
        },
        {
          status: 401,
        },
      );
    }

    /*
     * Find the profile first.
     *
     * If it exists, we can safely synchronize the
     * user's teaching capability before continuing.
     */
    const profile =
      await prisma.teachingProfile.findUnique({
        where: {
          userId: user.id,
        },
      });

    if (!profile) {
      return NextResponse.json(
        {
          error:
            "Teaching profile not found. Create your profile first.",
        },
        {
          status: 404,
        },
      );
    }

    /*
     * A user with an existing teaching profile should
     * always have CAN_TEACH.
     *
     * This repairs older records created before the
     * capability system was fully synchronized.
     */
    if (!isAdmin(user)) {
      await ensureCapabilities(
        user.id,
        [CAPABILITIES.TEACH],
      );
    }

    /*
     * ADMIN users and users whose profile has now been
     * synchronized are allowed to update.
     */
    const allowed =
      isAdmin(user) ||
      (await hasTeachingCapability(user.id));

    if (!allowed) {
      return NextResponse.json(
        {
          error:
            "Teaching workspace access is required.",
        },
        {
          status: 403,
        },
      );
    }

    const body =
      (await req.json()) as ProfileBody;

    const data: {
      headline?: string | null;
      specialty?: string | null;
      experience?: number | null;
      description?: string | null;
      hourlyRate?: number | null;
      currency?: "USD" | "GHS";
      subjects?: string[];
      gradeLevels?: string[];
    } = {};

    if (
      body.headline !== undefined
    ) {
      data.headline =
        cleanString(
          body.headline,
        );
    }

    if (
      body.specialty !== undefined
    ) {
      data.specialty =
        cleanString(
          body.specialty,
        );
    }

    if (
      body.description !== undefined
    ) {
      data.description =
        cleanString(
          body.description,
        );
    }

    if (
      body.experience !== undefined
    ) {
      if (
        body.experience === null ||
        body.experience === ""
      ) {
        data.experience = null;
      } else {
        const experience =
          parseExperience(
            body.experience,
          );

        if (experience === null) {
          return NextResponse.json(
            {
              error:
                "Years of experience must be a valid non-negative number.",
            },
            {
              status: 400,
            },
          );
        }

        data.experience =
          experience;
      }
    }

    if (
      body.hourlyRate !== undefined
    ) {
      if (
        body.hourlyRate === null ||
        body.hourlyRate === ""
      ) {
        data.hourlyRate = null;
      } else {
        const hourlyRate =
          parseHourlyRateInCents(
            body.hourlyRate,
          );

        if (hourlyRate === null) {
          return NextResponse.json(
            {
              error:
                "Hourly rate must be a valid non-negative amount.",
            },
            {
              status: 400,
            },
          );
        }

        data.hourlyRate =
          hourlyRate;
      }
    }

    if (
      body.currency !== undefined
    ) {
      data.currency =
        parseCurrency(
          body.currency,
        );
    }

    if (
      body.subjects !== undefined
    ) {
      data.subjects =
        cleanStringArray(
          body.subjects,
        );
    }

    if (
      body.gradeLevels !== undefined
    ) {
      data.gradeLevels =
        cleanStringArray(
          body.gradeLevels,
        );
    }

    /*
     * Only modify User.imageUrl if
     * imageUrl was actually included
     * in the request.
     */
    const imageUrl =
      body.imageUrl === undefined
        ? undefined
        : cleanImageUrl(
            body.imageUrl,
          );

    /*
     * Update teaching profile.
     */
    const updatedProfile =
      await prisma.teachingProfile.update({
        where: {
          id: profile.id,
        },
        data,
      });

    /*
     * Save the permanent UploadThing
     * URL to the User record.
     */
    if (imageUrl !== undefined) {
      await prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          imageUrl,
        },
      });
    }

    /*
     * Read the final value from the database.
     */
    const updatedUser =
      await prisma.user.findUnique({
        where: {
          id: user.id,
        },
        select: {
          imageUrl: true,
        },
      });

    return NextResponse.json({
      success: true,
      profile:
        updatedProfile,
      imageUrl:
        updatedUser?.imageUrl ?? null,
    });
  } catch (error) {
    console.error(
      "Update educator profile error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Unable to update educator profile.",
      },
      {
        status: 500,
      },
    );
  }
}